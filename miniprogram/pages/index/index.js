const { cloud } = require('../../utils/cloud')
const { decorateNews } = require('../../utils/pandas')

const PAGE_SIZE = 10

Page({
  data: {
    viewState: 'loading', // loading | ready | empty | error
    banners: [],
    bannerCur: 0,
    items: [],
    page: 0,
    hasMore: true,
    loadingMore: false,
    errorMsg: '',
  },

  onLoad() {
    this.reload(false)
  },

  onPullDownRefresh() {
    this.reload(true)
  },

  onReachBottom() {
    this.loadMore()
  },

  fetchPage(pageIndex) {
    const from = pageIndex * PAGE_SIZE
    return cloud.database
      .from('news')
      .select('id,title,summary,content,tag,is_banner,published_at,image,images,likes')
      .eq('visible', true)
      .order('published_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
  },

  async reload(fromPull) {
    if (!fromPull) this.setData({ viewState: 'loading' })
    try {
      const [bannerRes, pageRes] = await Promise.all([
        cloud.database
          .from('news')
          .select('id,title,summary,tag,published_at,image,images')
          .eq('visible', true)
          .eq('is_banner', true)
          .order('published_at', { ascending: false })
          .limit(3),
        this.fetchPage(0),
      ])
      if (bannerRes.error) throw bannerRes.error
      if (pageRes.error) throw pageRes.error
      const banners = (bannerRes.data || []).map(decorateNews)
      const items = (pageRes.data || []).map(decorateNews)
      this.setData({
        banners: banners,
        items: items,
        page: 1,
        hasMore: (pageRes.data || []).length === PAGE_SIZE,
        viewState: items.length ? 'ready' : 'empty',
      })
      this.mergeLikeState(items.map(function (x) { return x.id }))
    } catch (e) {
      this.setData({ viewState: 'error', errorMsg: (e && e.message) || '加载失败，请检查网络' })
    } finally {
      if (fromPull || wx.stopPullDownRefresh) wx.stopPullDownRefresh()
    }
  },

  async loadMore() {
    if (!this.data.hasMore || this.data.loadingMore) return
    this.setData({ loadingMore: true })
    try {
      const res = await this.fetchPage(this.data.page)
      if (res.error) throw res.error
      const more = (res.data || []).map(decorateNews)
      this.setData({
        items: this.data.items.concat(more),
        page: this.data.page + 1,
        hasMore: (res.data || []).length === PAGE_SIZE,
      })
      this.mergeLikeState(more.map(function (x) { return x.id }))
    } catch (e) {
      wx.showToast({ title: '加载更多失败', icon: 'none' })
    } finally {
      this.setData({ loadingMore: false })
    }
  },

  onBannerChange(e) {
    this.setData({ bannerCur: e.detail.current })
  },

  openDetail(e) {
    wx.navigateTo({
      url: '/pages/news-detail/news-detail?id=' + e.currentTarget.dataset.id,
    })
  },

  /* 合并当前用户的点赞状态（未登录时 liked 恒为 false） */
  async mergeLikeState(ids) {
    if (!ids || !ids.length) return
    try {
      const res = await cloud.database.rpc('f_news_like_state', { p_ids: ids })
      if (res.error || !Array.isArray(res.data)) return
      const map = {}
      res.data.forEach(function (r) { map[r.id] = r })
      const items = this.data.items.map(function (x) {
        const st = map[x.id]
        return st ? Object.assign({}, x, { likes: st.likes, liked: st.liked }) : x
      })
      this.setData({ items: items })
    } catch (e) {
      /* 点赞状态合并失败不影响列表 */
    }
  },

  onShareAppMessage() {
    return { title: '熊猫动态圈 · 今日顶流速览', path: '/pages/index/index' }
  },
})
