const { cloud } = require('../../utils/cloud')
const { decoratePanda, paragraphsOf, PANDA_NAME } = require('../../utils/pandas')
const { currentUser, guideLogin, resetSession } = require('../../utils/session')

Page({
  data: {
    viewState: 'loading', // loading | ready | empty | error
    panda: null,
    bioParagraphs: [],
    infoRows: [],
    errorMsg: '',
    guardianCount: 0,
    meGuarding: false,
    guarding: false,
  },

  onLoad(options) {
    this.id = Number(options.id)
    this.fetch()
  },

  async fetch() {
    this.setData({ viewState: 'loading' })
    try {
      const res = await cloud.database
        .from('pandas')
        .select('*')
        .eq('visible', true)
        .eq('id', this.id)
        .maybeSingle()
      if (res.error) throw res.error
      const row = res.data
      if (!row) {
        this.setData({ viewState: 'empty' })
        return
      }
      const panda = decoratePanda(row)
      wx.setNavigationBarTitle({ title: panda.name || '熊猫档案' })

      const rows = []
      if (panda.base) rows.push({ label: '基地', value: panda.base })
      if (panda.gender) rows.push({ label: '性别', value: panda.gender })
      if (panda.birth_date) rows.push({ label: '生日', value: panda.birth_date })
      if (panda.father) rows.push({ label: '爸爸', value: panda.father })
      if (panda.mother) rows.push({ label: '妈妈', value: panda.mother })
      if (panda.personality) rows.push({ label: '性格', value: panda.personality })
      if (panda.hobbies) rows.push({ label: '爱好', value: panda.hobbies })

      this.setData({
        viewState: 'ready',
        panda: panda,
        infoRows: rows,
        bioParagraphs: paragraphsOf(panda.bio),
      })
      this.loadGuardians()
    } catch (e) {
      this.setData({ viewState: 'error', errorMsg: (e && e.message) || '加载失败，请检查网络' })
    }
  },

  async loadGuardians() {
    try {
      const [g, user] = await Promise.all([
        cloud.database.rpc('f_panda_guardians', { p_panda_id: this.id }),
        currentUser(),
      ])
      if (g.error) return
      const data = g.data || {}
      const list = Array.isArray(data.list) ? data.list : []
      this.setData({
        guardianCount: data.count || 0,
        meGuarding: !!(user && list.some(function (x) { return x.user_key === user.id })),
      })
    } catch (e) {
      /* 守护数据读取失败不影响档案 */
    }
  },

  async toggleGuard() {
    if (this.data.guarding) return
    const user = await currentUser()
    if (!user) {
      guideLogin()
      return
    }
    this.setData({ guarding: true })
    try {
      const fn = this.data.meGuarding ? 'f_unclaim_guardian' : 'f_claim_guardian'
      const args = this.data.meGuarding
        ? { p_key: '', p_panda_id: this.id }
        : { p_key: '', p_nickname: '', p_avatar: '', p_panda_id: this.id }
      const res = await cloud.database.rpc(fn, args)
      if (res.error) throw res.error
      const data = res.data || {}
      if (data.ok === false) {
        if (data.error === 'login_required') {
          resetSession()
          guideLogin()
          return
        }
        if (data.error === 'banned') throw new Error('账号已被封禁：' + (data.reason || '违反社区规范'))
        throw new Error(data.error || '操作失败')
      }
      this.setData({ meGuarding: !!data.me, guardianCount: data.guardians || 0 })
      wx.showToast({ title: data.me ? '守护成功 🐼' : '已取消守护', icon: 'none' })
    } catch (e) {
      wx.showToast({ title: (e && e.message) || '操作失败', icon: 'none' })
    } finally {
      this.setData({ guarding: false })
    }
  },

  goSubmit() {
    wx.navigateTo({ url: '/pages/submit/submit?pandaId=' + this.id })
  },

  previewImage(e) {
    const panda = this.data.panda
    const urls = panda.photos.length ? panda.photos : [panda.hero]
    wx.previewImage({ current: e.currentTarget.dataset.src, urls: urls })
  },

  onShareAppMessage() {
    const panda = this.data.panda
    if (!panda) return { title: '熊猫动态圈 · 熊猫图鉴', path: '/pages/pandas/pandas' }
    return {
      title: PANDA_NAME[panda.key] ? panda.name + ' · 熊猫档案' : '熊猫档案',
      path: '/pages/panda-detail/panda-detail?id=' + panda.id,
      imageUrl: panda.hero,
    }
  },
})
