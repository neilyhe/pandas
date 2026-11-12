const { cloud } = require('../../utils/cloud')
const { ensureSession, resetSession } = require('../../utils/session')
const { avatarOf, dateTextOf } = require('../../utils/pandas')

const STATUS_TEXT = { pending: '待审核', approved: '已通过', rejected: '未通过' }

Page({
  data: {
    authState: 'checking', // checking | signed-out | signed-in
    userLabel: '',
    /* 登录表单 */
    loginMode: 'email', // email | phone
    account: '',
    code: '',
    codeSent: false,
    sending: false,
    submitting: false,
    countdown: 0,
    loginError: '',
    /* 我的守护 / 我的投稿 */
    guardians: [],
    submissions: [],
    loadingMine: false,
  },

  _pending: null, // { account, verificationId, isExistingUser }
  _timer: null,

  onShow() {
    this.restore()
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer)
  },

  async restore() {
    this.setData({ authState: 'checking' })
    let user = null
    try {
      const res = await ensureSession()
      const session = res && res.data && res.data.session
      user = (session && session.user) || null
    } catch (e) {
      user = null
    }
    if (!user) {
      resetSession()
      this.setData({ authState: 'signed-out' })
      return
    }
    this.setData({
      authState: 'signed-in',
      userLabel: this.labelOf(user),
    })
    this.loadMine()
  },

  labelOf(user) {
    if (!user) return '熊猫迷'
    if (user.email) return user.email
    if (user.phone) return String(user.phone).replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
    return '熊猫迷'
  },

  /* ---------- 登录 ---------- */

  switchMode(e) {
    const mode = e.currentTarget.dataset.mode
    if (mode === this.data.loginMode) return
    this._pending = null
    this.setData({
      loginMode: mode,
      account: '',
      code: '',
      codeSent: false,
      loginError: '',
    })
  },

  onAccountInput(e) {
    this.setData({ account: e.detail.value, loginError: '', codeSent: false })
    this._pending = null
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value, loginError: '' })
  },

  async sendCode() {
    if (this.data.sending || this.data.countdown > 0) return
    const account = String(this.data.account || '').trim()
    const mode = this.data.loginMode
    if (mode === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)) {
      this.setData({ loginError: '请输入正确的邮箱地址' })
      return
    }
    if (mode === 'phone' && !/^1\d{10}$/.test(account)) {
      this.setData({ loginError: '请输入正确的 11 位手机号' })
      return
    }
    this.setData({ sending: true, loginError: '' })
    try {
      const arg = mode === 'email' ? { email: account } : { phone: account }
      const sent = await cloud.auth.sendOtp(arg)
      if (sent.error) throw sent.error
      this._pending = {
        account: account,
        verificationId: sent.data.verificationId,
        isExistingUser: sent.data.isExistingUser,
      }
      this.setData({ codeSent: true, countdown: 60 })
      wx.showToast({ title: '验证码已发送', icon: 'none' })
      this._timer = setInterval(() => {
        const n = this.data.countdown - 1
        if (n <= 0) {
          clearInterval(this._timer)
          this._timer = null
        }
        this.setData({ countdown: Math.max(n, 0) })
      }, 1000)
    } catch (e) {
      this.setData({ loginError: (e && e.message) || '发送失败，请稍后再试' })
    } finally {
      this.setData({ sending: false })
    }
  },

  async doLogin() {
    if (this.data.submitting) return
    const pending = this._pending
    const code = String(this.data.code || '').trim()
    if (!pending || pending.account !== String(this.data.account || '').trim()) {
      this.setData({ loginError: '请先获取当前账号的验证码' })
      return
    }
    if (!code) {
      this.setData({ loginError: '请输入验证码' })
      return
    }
    this.setData({ submitting: true, loginError: '' })
    try {
      const arg = {
        verificationId: pending.verificationId,
        isExistingUser: pending.isExistingUser,
        token: code,
      }
      if (pending.account.indexOf('@') !== -1) arg.email = pending.account
      else arg.phone = pending.account
      const res = await cloud.auth.verifyOtp(arg)
      if (res.error) throw res.error
      this._pending = null
      resetSession()
      wx.showToast({ title: '登录成功 🐼', icon: 'none' })
      this.restore()
    } catch (e) {
      this.setData({ loginError: (e && e.message) || '登录失败，请检查验证码' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  /* ---------- 已登录数据 ---------- */

  async loadMine() {
    this.setData({ loadingMine: true })
    try {
      const [g, s] = await Promise.all([
        cloud.database.rpc('f_my_guardians'),
        cloud.database.rpc('f_my_submissions'),
      ])
      if (g.error) throw g.error
      if (s.error) throw s.error
      const guardians = (g.data || []).map(function (x) {
        return {
          id: x.panda_id,
          name: x.name || '',
          base: x.base || '',
          avatar: avatarOf({ id: x.panda_id, name: x.name }),
          guardianCount: x.guardian_count || 0,
        }
      })
      const submissions = (s.data || []).map(function (x) {
        return {
          id: x.id,
          kindText: x.kind === 'new' ? '新增' : '修改',
          pandaName: x.panda_name || (x.payload && x.payload.name) || '',
          status: x.status || 'pending',
          statusText: STATUS_TEXT[x.status] || x.status,
          note: x.note || '',
          dateText: dateTextOf(x.created_at),
        }
      })
      this.setData({ guardians: guardians, submissions: submissions })
    } catch (e) {
      wx.showToast({ title: (e && e.message) || '加载失败', icon: 'none' })
    } finally {
      this.setData({ loadingMine: false })
    }
  },

  goPanda(e) {
    wx.navigateTo({
      url: '/pages/panda-detail/panda-detail?id=' + e.currentTarget.dataset.id,
    })
  },

  goSubmit() {
    wx.navigateTo({ url: '/pages/submit/submit' })
  },

  async unguard(e) {
    const id = e.currentTarget.dataset.id
    try {
      const res = await cloud.database.rpc('f_unclaim_guardian', {
        p_key: '',
        p_panda_id: id,
      })
      if (res.error) throw res.error
      if (res.data && res.data.ok === false) throw new Error(res.data.error)
      wx.showToast({ title: '已取消守护', icon: 'none' })
      this.loadMine()
    } catch (err) {
      wx.showToast({ title: (err && err.message) || '操作失败', icon: 'none' })
    }
  },

  async signOut() {
    try {
      await cloud.auth.signOut()
    } catch (e) {
      /* 忽略登出错误 */
    }
    resetSession()
    this.setData({ authState: 'signed-out', guardians: [], submissions: [], userLabel: '' })
    wx.showToast({ title: '已退出登录', icon: 'none' })
  },

  onShareAppMessage() {
    return { title: '熊猫动态圈', path: '/pages/index/index' }
  },
})
