/* 会话管理：登录态缓存 + 通用判断 */
const { cloud } = require('./cloud')

let sessionPromise = null

function ensureSession() {
  if (!sessionPromise) {
    sessionPromise = cloud.auth.getSession()
  }
  return sessionPromise
}

function resetSession() {
  sessionPromise = null
}

/* 返回当前用户（未登录返回 null），不抛异常 */
async function currentUser() {
  try {
    const res = await ensureSession()
    const session = res && res.data && res.data.session
    return (session && session.user) || null
  } catch (e) {
    resetSession()
    return null
  }
}

/* 未登录引导：toast + 跳「我的」页登录 */
function guideLogin() {
  wx.showToast({ title: '先登录再操作吧 🐼', icon: 'none' })
  setTimeout(function () {
    wx.switchTab({ url: '/pages/profile/profile' })
  }, 600)
}

module.exports = { ensureSession, resetSession, currentUser, guideLogin }
