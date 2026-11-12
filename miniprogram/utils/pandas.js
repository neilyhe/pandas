/* 熊猫个体识别与封面策略（与 webapp 端逻辑一致） */

const AVATAR_KEYS = ['hua', 'ye', 'menglan', 'fubao', 'qizai', 'yuai', 'qiyi', 'meilan', 'aijiu', 'runyue', 'yuke', 'ruibao', 'huibao']

const PANDA_KEY = {
  和花: 'hua', 和叶: 'ye', 萌兰: 'menglan', 福宝: 'fubao',
  七仔: 'qizai', 渝爱: 'yuai', 奇一: 'qiyi', 美兰: 'meilan',
  艾玖: 'aijiu', 润玥: 'runyue', 渝可: 'yuke', 睿宝: 'ruibao', 辉宝: 'huibao',
}

/* 文案 → 个体：提到哪只熊猫就用哪只的封面 */
const PANDA_ALIASES = [
  ['hua', ['和花', '花花', '花局', '果赖', '谭爷爷']],
  ['ye', ['和叶', '叶子', '叶妹妹']],
  ['menglan', ['萌兰', '么么儿', '萌兰兰']],
  ['fubao', ['福宝', '福猪猪', '福公主']],
  ['qizai', ['七仔', '巧克力熊', '棕色大熊猫']],
  ['yuai', ['渝爱', '渝爱爱', '重庆小甜心']],
  ['qiyi', ['奇一', '奇奇']],
  ['meilan', ['美兰', '美兰兰']],
  ['aijiu', ['艾玖', '玖玖', '米奇玖玖']],
  ['runyue', ['润玥', '二狗', '菜菜', '爪爪']],
  ['yuke', ['渝可', '渝可可']],
  ['ruibao', ['睿宝', '睿总']],
  ['huibao', ['辉宝']],
]

const PANDA_NAME = {
  hua: '和花', ye: '和叶', menglan: '萌兰', fubao: '福宝',
  qizai: '七仔', yuai: '渝爱', qiyi: '奇一', meilan: '美兰',
  aijiu: '艾玖', runyue: '润玥', yuke: '渝可', ruibao: '睿宝', huibao: '辉宝',
}

/* 基地 → 该基地的明星熊猫（正文没点名熊猫、只提基地时的兜底） */
const BASE_ALIASES = [
  ['menglan', ['北京动物园', '北京']],
  ['yuai', ['重庆动物园', '重庆']],
  ['qizai', ['秦岭', '陕西', '佛坪', '楼观台']],
  ['fubao', ['卧龙', '神树坪', '都江堰', '雅安', '碧峰峡', '保护研究中心']],
  ['hua', ['成都', '繁育研究基地', '繁育基地', '培育基地', '四川']],
]

function pandaKeyOfText(text) {
  const s = String(text || '')
  if (!s) return ''
  for (let i = 0; i < PANDA_ALIASES.length; i++) {
    const words = PANDA_ALIASES[i][1]
    for (let j = 0; j < words.length; j++) {
      if (s.indexOf(words[j]) !== -1) return PANDA_ALIASES[i][0]
    }
  }
  return ''
}

/* 只提基地没点名熊猫 → 配该基地熊猫的封面 */
function baseKeyOfText(text) {
  const s = String(text || '')
  if (!s) return ''
  for (let i = 0; i < BASE_ALIASES.length; i++) {
    const words = BASE_ALIASES[i][1]
    for (let j = 0; j < words.length; j++) {
      if (s.indexOf(words[j]) !== -1) return BASE_ALIASES[i][0]
    }
  }
  return ''
}

function artKeyOf(item) {
  const text = [item.title, item.summary, item.content, item.tag]
    .filter(Boolean).join(' ')
  return pandaKeyOfText(text) || baseKeyOfText(text) || AVATAR_KEYS[Math.abs(Number(item.id) || 0) % AVATAR_KEYS.length]
}

function isRemoteImage(v) {
  return /^(https?:|data:)/.test(String(v || '').trim())
}

/* 动态封面：后台配了外链/上传图就用配置，否则按内容配档案封面 */
function coverOf(item) {
  const v = String(item.image || '').trim()
  if (isRemoteImage(v)) return v
  const imgs = Array.isArray(item.images) ? item.images : []
  if (imgs.length && isRemoteImage(imgs[0])) return imgs[0]
  return '/assets/cov-' + artKeyOf(item) + '.webp'
}

function pandaKeyOfRecord(p) {
  if (!p) return AVATAR_KEYS[0]
  const direct = PANDA_KEY[String(p.name || '').trim()]
  if (direct) return direct
  return AVATAR_KEYS[Math.abs(Number(p.id) || 0) % AVATAR_KEYS.length]
}

function dateTextOf(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  return (d.getMonth() + 1) + '月' + d.getDate() + '日'
}

function paragraphsOf(content) {
  return String(content || '').split(/\n+/).map(function (s) { return s.trim() }).filter(Boolean)
}

/* 列表/详情共用的动态装饰 */
function decorateNews(item) {
  const text = [item.title, item.summary, item.tag].filter(Boolean).join(' ')
  return Object.assign({}, item, {
    cover: coverOf(item),
    pandaName: PANDA_NAME[pandaKeyOfText(text)] || '',
    dateText: dateTextOf(item.published_at),
  })
}

/* 图鉴记录装饰 */
function decoratePanda(p) {
  const key = pandaKeyOfRecord(p)
  const photo = String(p.photo || '').trim()
  const imgs = Array.isArray(p.images) ? p.images : []
  return Object.assign({}, p, {
    key: key,
    hero: isRemoteImage(photo) ? photo : '/assets/cov-' + key + '.webp',
    avatar: '/assets/sq-' + key + '.webp',
    photos: imgs.filter(isRemoteImage),
  })
}

/* 图鉴宫格头像地址 */
function avatarOf(p) {
  return '/assets/sq-' + pandaKeyOfRecord(p) + '.webp'
}

module.exports = {
  AVATAR_KEYS: AVATAR_KEYS,
  PANDA_NAME: PANDA_NAME,
  pandaKeyOfText: pandaKeyOfText,
  artKeyOf: artKeyOf,
  coverOf: coverOf,
  decorateNews: decorateNews,
  decoratePanda: decoratePanda,
  paragraphsOf: paragraphsOf,
  dateTextOf: dateTextOf,
  isRemoteImage: isRemoteImage,
  pandaKeyOfRecord: pandaKeyOfRecord,
  avatarOf: avatarOf,
}
