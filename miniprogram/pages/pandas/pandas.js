const { cloud } = require('../../utils/cloud')
const { decoratePanda } = require('../../utils/pandas')

Page({
  data: {
    viewState: 'loading', // loading | ready | empty | error
    list: [],
    errorMsg: '',
  },

  onLoad() {
    this.fetch()
  },

  onPullDownRefresh() {
    this.fetch()
  },

  async fetch() {
    this.setData({ viewState: this.data.list.length ? 'ready' : 'loading' })
    try {
      const res = await cloud.database
        .from('pandas')
        .select('id,name,gender,base,birth_date,personality,hobbies,photo,images,sort_order')
        .eq('visible', true)
        .order('sort_order', { ascending: true })
      if (res.error) throw res.error
      const list = (res.data || []).map(decoratePanda)
      this.setData({ list: list, viewState: list.length ? 'ready' : 'empty' })
    } catch (e) {
      this.setData({ viewState: 'error', errorMsg: (e && e.message) || '加载失败，请检查网络' })
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  openPanda(e) {
    wx.navigateTo({
      url: '/pages/panda-detail/panda-detail?id=' + e.currentTarget.dataset.id,
    })
  },

  onShareAppMessage() {
    return { title: '熊猫动态圈 · 熊猫图鉴', path: '/pages/pandas/pandas' }
  },
})
