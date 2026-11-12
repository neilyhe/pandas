const { createMiniProgramWorkBuddyCloud } = require('@tencent-ai/workbuddy-cloud-sdk/miniprogram')
const { createDiagnosticWx } = require('./workbuddy-cloud-diagnostics')

// WorkBuddy 云服务公开配置（来自 publicConfig，无敏感凭证）
const publicConfig = {
  endpoint: 'https://panda-circle-19851.app.workbuddy.host',
  publishableKey: 'wbpk_7qrA7pxoKX04qB92mUxVeK_K0GWGUEy0cubj5lF6mu3TiGx1b03bkW8',
}

const cloud = createMiniProgramWorkBuddyCloud({
  endpoint: publicConfig.endpoint,
  publishableKey: publicConfig.publishableKey,
  wx: createDiagnosticWx(wx),
})

module.exports = { cloud, publicConfig }
