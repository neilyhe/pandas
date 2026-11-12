const { cloud } = require('../../utils/cloud')
const { resetSession } = require('../../utils/session')

const FIELDS = [
  { k: 'name', label: '名字', ph: '如：和花', req: true },
  { k: 'gender', label: '性别', type: 'select', opts: ['', '女', '男', '未知'] },
  { k: 'base', label: '所在基地', ph: '如：成都大熊猫繁育研究基地' },
  { k: 'birth_date', label: '出生日期', ph: '如：2020-07-04' },
  { k: 'father', label: '父亲', ph: '父亲名字' },
  { k: 'mother', label: '母亲', ph: '母亲名字' },
  { k: 'personality', label: '性格', ph: '用、分隔，如：温顺、好奇' },
  { k: 'hobbies', label: '爱好', ph: '如：爬树、滚泥巴' },
  { k: 'bio', label: '小传', type: 'textarea', ph: '这只熊猫的故事、趣事…' },
]

Page({
  data: {
    editMode: false,
    fields: FIELDS,
    values: { name: '', gender: '', base: '', birth_date: '', father: '', mother: '', personality: '', hobbies: '', bio: '' },
    photos: [], // dataURL 数组
    submitting: false,
    error: '',
  },

  _cur: null, // 编辑模式时的原始档案（用于 diff）

  onLoad(options) {
    if (options.pandaId) {
      this.setData({ editMode: true })
      this._pandaId = Number(options.pandaId)
      this.loadCurrent()
    }
  },

  async loadCurrent() {
    try {
      const res = await cloud.database
        .from('pandas')
        .select('id,name,gender,base,birth_date,father,mother,personality,hobbies,bio')
        .eq('id', this._pandaId)
        .maybeSingle()
      if (res.error) throw res.error
      const row = res.data
      if (!row) {
        this.setData({ error: '找不到这只熊猫，可能已下架' })
        return
      }
      this._cur = row
      const values = {}
      FIELDS.forEach(function (f) {
        values[f.k] = String(row[f.k] || '')
      })
      this.setData({ values: values })
      wx.setNavigationBarTitle({ title: '完善「' + (row.name || '') + '」的档案' })
    } catch (e) {
      this.setData({ error: (e && e.message) || '加载档案失败' })
    }
  },

  setField(e) {
    const k = e.currentTarget.dataset.k
    const values = Object.assign({}, this.data.values)
    values[k] = e.detail.value
    this.setData({ values: values, error: '' })
  },

  pickPhoto() {
    const left = 4 - this.data.photos.length
    if (left <= 0) {
      wx.showToast({ title: '最多 4 张照片', icon: 'none' })
      return
    }
    wx.chooseMedia({
      count: left,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const files = (res.tempFiles || []).map(function (f) { return f.tempFilePath })
        this.compressAll(files)
      },
      fail: function () {
        /* 用户取消选择 */
      },
    })
  },

  async compressAll(paths) {
    wx.showLoading({ title: '处理照片…' })
    const out = []
    const fs = wx.getFileSystemManager()
    for (let i = 0; i < paths.length; i++) {
      try {
        let src = paths[i]
        try {
          const c = await wx.compressImage({ src: src, quality: 55 })
          if (c && c.tempFilePath) src = c.tempFilePath
        } catch (e) {
          /* 压缩失败就用原图 */
        }
        const data = await new Promise(function (resolve, reject) {
          fs.readFile({
            filePath: src,
            encoding: 'base64',
            success: function (r) { resolve(r.data) },
            fail: reject,
          })
        })
        out.push('data:image/jpeg;base64,' + data)
      } catch (e) {
        /* 单张失败跳过 */
      }
    }
    wx.hideLoading()
    if (!out.length) {
      wx.showToast({ title: '照片处理失败', icon: 'none' })
      return
    }
    this.setData({ photos: this.data.photos.concat(out).slice(0, 4) })
  },

  removePhoto(e) {
    const i = e.currentTarget.dataset.i
    const photos = this.data.photos.slice()
    photos.splice(i, 1)
    this.setData({ photos: photos })
  },

  previewPhoto(e) {
    wx.previewImage({ urls: this.data.photos, current: this.data.photos[e.currentTarget.dataset.i] })
  },

  async submit() {
    if (this.data.submitting) return
    const editMode = this.data.editMode
    const values = this.data.values
    const payload = {}

    if (!editMode) {
      FIELDS.forEach(function (f) {
        const nv = String(values[f.k] || '').trim()
        if (nv) payload[f.k] = nv
      })
      if (!payload.name) {
        this.setData({ error: '请先填写熊猫名字' })
        return
      }
      if (this.data.photos.length) payload.photo = this.data.photos[0]
      if (this.data.photos.length > 1) payload.images_append = this.data.photos.slice(1)
    } else {
      const cur = this._cur || {}
      FIELDS.forEach(function (f) {
        const nv = String(values[f.k] || '').trim()
        const ov = String(cur[f.k] == null ? '' : cur[f.k]).trim()
        if (nv !== ov) payload[f.k] = nv
      })
      if (this.data.photos.length) payload.images_append = this.data.photos
      if (!Object.keys(payload).length) {
        this.setData({ error: '还没有任何修改哦' })
        return
      }
    }

    this.setData({ submitting: true, error: '' })
    try {
      const args = editMode
        ? { p_key: '', p_nickname: '', p_panda_id: this._pandaId, p_payload: payload }
        : { p_key: '', p_nickname: '', p_payload: payload }
      const res = await cloud.database.rpc(editMode ? 'f_submit_panda_edit' : 'f_submit_panda_new', args)
      if (res.error) throw res.error
      const data = res.data || {}
      if (data.ok === false) {
        if (data.error === 'login_required') {
          resetSession()
          wx.showToast({ title: '请先到「我的」页登录', icon: 'none' })
          setTimeout(function () {
            wx.switchTab({ url: '/pages/profile/profile' })
          }, 800)
          return
        }
        if (data.error === 'banned') throw new Error('账号已被封禁：' + (data.reason || '违反社区规范'))
        throw new Error(data.error || '提交失败')
      }
      wx.showToast({ title: '已提交，等待审核 🐼', icon: 'none' })
      setTimeout(function () {
        wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/profile/profile' }) } })
      }, 900)
    } catch (e) {
      this.setData({ error: (e && e.message) || '提交失败，请稍后再试' })
    } finally {
      this.setData({ submitting: false })
    }
  },
})
