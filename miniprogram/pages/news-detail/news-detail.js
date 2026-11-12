const { cloud } = require('../../utils/cloud')
const { decorateNews, paragraphsOf, isRemoteImage } = require('../../utils/pandas')
const { currentUser, guideLogin, resetSession } = require('../../utils/session')

Page({
  data: {
    viewState: 'loading', // loading | ready | empty | error
    item: null,
    paragraphs: [],
    extras: [],
    errorMsg: '',
    likes: 0,
    liked: false,
    liking: false,
  },

  onLoad(options) {
    this.id = Number(options.id)
    this.fetch()
  },

  async fetch() {
    this.setData({ viewState: 'loading' })
    try {
      const res = await cloud.database
        .from('news')
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
      const item = decorateNews(row)
      const extras = (Array.isArray(row.images) ? row.images : [])
        .filter(isRemoteImage)
        .slice(0, 6)
      wx.setNavigationBarTitle({ title: item.pandaName || '熊猫动态圈' })
      this.setData({
        viewState: 'ready',
        item: item,
        paragraphs: paragraphsOf(row.content),
        extras: extras,
      })
      this.loadLikeState()
    } catch (e) {
      this.setData({ viewState: 'error', errorMsg: (e && e.message) || '加载失败，请检查网络' })
    }
  },

  async loadLikeState() {
    try {
      const res = await cloud.database.rpc('f_news_like_state', { p_ids: [this.id] })
      if (res.error || !Array.isArray(res.data) || !res.data.length) return
      const st = res.data[0]
      this.setData({ likes: st.likes || 0, liked: !!st.liked })
    } catch (e) {
      /* 状态读取失败不影响正文 */
    }
  },

  async toggleLike() {
    if (this.data.liking) return
    const user = await currentUser()
    if (!user) {
      guideLogin()
      return
    }
    this.setData({ liking: true })
    try {
      const res = await cloud.database.rpc('f_like_news', { p_id: this.id })
      if (res.error) throw res.error
      const data = res.data || {}
      if (data.ok === false) {
        if (data.error === 'login_required') {
          resetSession()
          guideLogin()
          return
        }
        throw new Error(data.error || '操作失败')
      }
      this.setData({ liked: !!data.liked, likes: data.likes || 0 })
      wx.showToast({ title: data.liked ? '已点赞 ♥' : '已取消点赞', icon: 'none' })
    } catch (e) {
      wx.showToast({ title: (e && e.message) || '操作失败', icon: 'none' })
    } finally {
      this.setData({ liking: false })
    }
  },

  previewImage(e) {
    const current = e.currentTarget.dataset.src
    const urls = this.data.extras.length ? this.data.extras : [this.data.item.cover]
    wx.previewImage({ current: current, urls: urls })
  },

  onShareAppMessage() {
    const item = this.data.item
    if (!item) return { title: '熊猫动态圈', path: '/pages/index/index' }
    return {
      title: item.title,
      path: '/pages/news-detail/news-detail?id=' + item.id,
      imageUrl: item.cover,
    }
  },
})
