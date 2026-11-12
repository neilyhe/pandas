/* ==========================================================
   熊猫动态圈 · 产品版
   云端：WorkBuddy Cloud（数据库 + 服务端安全函数）
   图片：真实大熊猫摄影作品（本地化资源，见 assets/）
   ========================================================== */

const publicConfig = {
  endpoint: "https://panda-circle-19851.app.workbuddy.host",
  oauthRelayBaseUrl: "https://www.workbuddy.cn/v2/as/genie-baas/oauth",
  publishableKey: "wbpk_7qrA7pxoKX04qB92mUxVeK_K0GWGUEy0cubj5lF6mu3TiGx1b03bkW8",
};

const cloudReady = typeof WorkBuddyCloud !== "undefined";
const cloudApp = cloudReady
  ? WorkBuddyCloud.createWorkBuddyCloud({
      endpoint: publicConfig.endpoint,
      oauthRelayBaseUrl: publicConfig.oauthRelayBaseUrl,
      publishableKey: publicConfig.publishableKey,
    })
  : null;
const db = cloudApp ? cloudApp.database : null;
const auth = cloudApp ? cloudApp.auth : null;

/* ---------------- 基础工具 ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fixText = (s) => String(s ?? "").replace(/\\n/g, "\n");

function hashSeed(s) {
  let h = 0;
  const str = String(s);
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

let toastTimer;
function toast(msg, type = "") {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast " + type;
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => (t.hidden = true), 240);
  }, 2200);
}

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "刚刚";
  if (diff < 3600) return Math.floor(diff / 60) + " 分钟前";
  if (diff < 86400) return Math.floor(diff / 3600) + " 小时前";
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + " 天前";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
function fullTime(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function ageShort(birth) {
  const a = calcAge(birth);
  return a.replace(" 个月", "月").replace(" 岁 ", "岁").replace("年龄未知", "年龄未知");
}
function calcAge(birth) {
  if (!birth) return "年龄未知";
  const b = new Date(birth), n = new Date();
  let m = (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
  if (n.getDate() < b.getDate()) m--;
  if (m < 0) return "未出生";
  const y = Math.floor(m / 12), mm = m % 12;
  return y > 0 ? `${y} 岁${mm ? " " + mm + " 个月" : ""}` : `${mm} 个月`;
}

/* ---------------- 图片资源 ---------------- */
const AVATAR_KEYS = ["hua", "ye", "menglan", "fubao", "qizai", "yuai", "qiyi", "meilan", "aijiu", "runyue", "yuke", "ruibao", "huibao"];
const PANDA_KEY = {
  和花: "hua", 和叶: "ye", 萌兰: "menglan", 福宝: "fubao",
  七仔: "qizai", 渝爱: "yuai", 奇一: "qiyi", 美兰: "meilan",
  艾玖: "aijiu", 润玥: "runyue", 渝可: "yuke", 睿宝: "ruibao", 辉宝: "huibao",
};
/* 文案 → 个体：动态/帖子提到哪只熊猫，就用哪只的照片 */
const PANDA_ALIASES = [
  ["hua", ["和花", "花花", "花局", "果赖", "谭爷爷"]],
  ["ye", ["和叶", "叶子", "叶妹妹"]],
  ["menglan", ["萌兰", "么么儿", "萌兰兰"]],
  ["fubao", ["福宝", "福猪猪", "福公主"]],
  ["qizai", ["七仔", "巧克力熊", "棕色大熊猫"]],
  ["yuai", ["渝爱", "渝爱爱", "重庆小甜心"]],
  ["qiyi", ["奇一", "奇奇"]],
  ["meilan", ["美兰", "美兰兰"]],
  ["aijiu", ["艾玖", "玖玖", "米奇玖玖"]],
  ["runyue", ["润玥", "二狗", "菜菜", "爪爪"]],
  ["yuke", ["渝可", "渝可可"]],
  ["ruibao", ["睿宝", "睿总"]],
  ["huibao", ["辉宝"]],
];

const imgTag = (src, cls = "", extra = "") =>
  `<img src="${src}" alt="" loading="lazy" decoding="async" ${cls ? `class="${cls}"` : ""} ${extra}
     onerror="this.style.opacity=0" />`;

function avatarKeyOf(seed) {
  const s = String(seed ?? "0");
  return AVATAR_KEYS.includes(s) ? s : AVATAR_KEYS[hashSeed(s) % AVATAR_KEYS.length];
}
const avatarOf = (seed) => `assets/${avatarKeyOf(seed)}.webp`;
const avatarImg = (seed, cls = "") => imgTag(avatarOf(seed), cls);

function pandaKey(p) {
  if (!p) return AVATAR_KEYS[0];
  const direct = PANDA_KEY[String(p.name || "").trim()];
  if (direct) return direct;
  return AVATAR_KEYS[hashSeed(p.name || p.id || 0) % AVATAR_KEYS.length];
}
const pandaPhoto = (p) => imgSrcOf(p.photo, "p", pandaKey(p));
const pandaAvatarImg = (p) => imgSrcOf(p.photo, "av", pandaKey(p));

const ICON = {
  news: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4.5h9.5L19 9v10.5H5z"/><path d="M14 4.5V9h5"/><path d="M8 12.5h8M8 15.5h6"/></svg>`,
  paw: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14.4" r="4.6"/><circle cx="6.6" cy="8.6" r="2.1"/><circle cx="17.4" cy="8.6" r="2.1"/><circle cx="10.4" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.6a7.7 7.7 0 0 1-7.7 7.7H8l-4 2 1.1-4.1A7.7 7.7 0 1 1 20.5 11.6Z"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 5.9a5 5 0 0 0-7.1 0L12 7.6l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.2l8.8-8.2a5 5 0 0 0 0-7.1z"/></svg>`,
};

/* 从文案里认出是哪只熊猫；认不出再按 id 稳定兜底（同一篇永远同一张图） */
function pandaKeyOfText(text) {
  const s = String(text || "");
  if (!s) return "";
  for (const [key, words] of PANDA_ALIASES) {
    if (words.some((w) => s.includes(w))) return key;
  }
  return "";
}

/* 基地 → 该基地的明星熊猫（没点名熊猫、只提基地时的兜底） */
const BASE_ALIASES = [
  ["menglan", ["北京动物园", "北京"]],
  ["yuai", ["重庆动物园", "重庆"]],
  ["qizai", ["秦岭", "陕西", "佛坪", "楼观台"]],
  ["fubao", ["卧龙", "神树坪", "都江堰", "雅安", "碧峰峡", "保护研究中心"]],
  ["hua", ["成都", "繁育研究基地", "繁育基地", "培育基地", "四川"]],
];
function baseKeyOfText(text) {
  const s = String(text || "");
  if (!s) return "";
  for (const [key, words] of BASE_ALIASES) {
    if (words.some((w) => s.includes(w))) return key;
  }
  return "";
}

const artKeyOf = (item) => {
  const text = [item.title, item.summary, item.content, item.tag].filter(Boolean).join(" ");
  return (
    pandaKeyOfText(text) ||
    baseKeyOfText(text) ||
    AVATAR_KEYS[Math.abs(Number(item.id) || 0) % AVATAR_KEYS.length]
  );
};

const PANDA_NAME = {
  hua: "和花", ye: "和叶", menglan: "萌兰", fubao: "福宝",
  qizai: "七仔", yuai: "渝爱", qiyi: "奇一", meilan: "美兰",
  aijiu: "艾玖", runyue: "润玥", yuke: "渝可", ruibao: "睿宝", huibao: "辉宝",
};
const pandaNameOf = (item) =>
  PANDA_NAME[pandaKeyOfText([item.title, item.summary, item.content].filter(Boolean).join(" "))] || "";

/* 图片地址解析：支持后台配置的素材 key、外链、上传的 dataURL */
function imgSrcOf(value, kind, fallbackKey) {
  const v = String(value || "").trim();
  if (/^(https?:|data:|assets\/|\/)/.test(v)) return v;
  const key = AVATAR_KEYS.includes(v) ? v : fallbackKey;
  if (kind === "cov") return `assets/cov-${key}.webp`;
  if (kind === "sq") return `assets/sq-${key}.webp`;
  if (kind === "p") return `assets/p-${key}.webp`;
  return `assets/${key}.webp`;
}
const coverOf = (item) => imgSrcOf(item.image, "cov", artKeyOf(item)); // 焦点横幅 1120×644
const thumbOf = (item) => imgSrcOf(item.image, "sq", artKeyOf(item)); // 列表方形缩略图

/* ---------------- 状态 ---------------- */
const state = {
  news: [],
  pandas: [],
  posts: [],
  comments: [],
  tab: "home",
  newsTag: "",
  pandaBase: "",
  nickname: localStorage.getItem("pc_nick") || "",
  seed: localStorage.getItem("pc_seed") || "0",
  pandaQuery: "",
  userKey: (() => {
    let k = localStorage.getItem("pc_ukey");
    if (!k) {
      k = "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("pc_ukey", k);
    }
    return k;
  })(),
  avatar: localStorage.getItem("pc_avatar") || "",
  joinedAt: localStorage.getItem("pc_joined") || "",
  banned: false,
  banReason: "",
  violations: 0,
  /* 账号（登录后由服务端 auth.uid() 决定，不可伪造） */
  account: null, // { user_key, nickname, avatar, email, created_at }
  authed: false,
  loginBusy: false,
  /* 评论开关：全站开关 + 自动关闭天数 */
  commentCfg: { enabled: true, auto_days: 0 },
  /* 守护与用户贡献 */
  guardians: [], // 我守护的熊猫（含档案字段）
  guardIds: new Set(),
  guardCounts: {}, // panda_id -> 守护人数
  mySubs: [], // 我的提交与审核状态
  /* 通知 */
  notifUnread: 0,
  notifList: [],
};

const likedPosts = new Set(JSON.parse(localStorage.getItem("pc_liked_posts") || "[]"));
const likedCmts = new Set(JSON.parse(localStorage.getItem("pc_liked_cmts") || "[]"));
const persistLikes = () => {
  localStorage.setItem("pc_liked_posts", JSON.stringify([...likedPosts]));
  localStorage.setItem("pc_liked_cmts", JSON.stringify([...likedCmts]));
};
const commentCount = (pid) => state.comments.filter((c) => c.post_id === pid).length;
const visiblePosts = () => state.posts.filter((p) => !p.hidden);
const visibleNews = () => state.news.filter((n) => n.visible !== false);
const visiblePandas = () => state.pandas.filter((p) => p.visible !== false);

/* ==========================================================
   Tab 导航
   ========================================================== */
const TABS = ["home", "community", "pandas", "me"];
function switchTab(name) {
  state.tab = name;
  TABS.forEach((t) => {
    const panel = $("#tab-" + t);
    if (panel) panel.classList.toggle("active", t === name);
  });
  $$(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  const idx = TABS.indexOf(name);
  const ind = $("#tabIndicator");
  if (ind) ind.style.transform = `translateX(${idx * 100}%) scaleX(.34)`;
  const fab = $("#fabCompose");
  if (fab) fab.classList.toggle("show", name === "community");
  const fpb = $("#fabPanda");
  if (fpb) fpb.classList.toggle("show", name === "pandas");
  window.scrollTo({ top: 0, behavior: "smooth" });
  /* 每次进入页签都按最新内存数据重绘，避免"操作过了但列表还是旧状态" */
  if (name === "home") renderHome();
  if (name === "community") renderCommunity();
  if (name === "pandas") renderPandas();
  if (name === "me") {
    renderMe();
    syncUserState().then(() => {
      if (state.tab === "me") renderMe();
    });
    refreshNotifCount().then(() => {
      if (state.tab === "me") renderMe();
    });
  }
  syncStickyTools();
}
$$(".tab").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));

/* 图鉴工具条吸顶状态：吸住后才铺背景和阴影，未吸住保持透明避免出现色块 */
function syncStickyTools() {
  const tools = $("#pandaTools");
  if (!tools) return;
  const stuck = state.tab === "pandas" && tools.getBoundingClientRect().top <= 1;
  tools.classList.toggle("stuck", stuck);
}

window.addEventListener(
  "scroll",
  () => {
    const bar = $("#appbar");
    if (bar) bar.classList.toggle("scrolled", window.scrollY > 6);
    syncStickyTools();
  },
  { passive: true }
);

/* ==========================================================
   全屏页面栈
   ========================================================== */
function openPage({ title, body = "", footer = "", onMount, bodyClass = "" }) {
  const page = document.createElement("div");
  page.className = "page";
  page.innerHTML = `
    <header class="page-head">
      <button class="page-back" data-back aria-label="返回">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
      </button>
      <div class="page-title">${esc(title)}</div>
    </header>
    <div class="page-body ${bodyClass}">${body}</div>
    ${footer ? `<div class="comment-bar">${footer}</div>` : ""}`;
  $("#pageStack").appendChild(page);
  const close = () => {
    page.classList.add("closing");
    setTimeout(() => page.remove(), 240);
  };
  page.querySelector("[data-back]").addEventListener("click", close);
  if (onMount) onMount(page, close);
  return { page, close };
}

/* ==========================================================
   数据加载
   ========================================================== */
async function loadAll() {
  const [n, p, po, c] = await Promise.all([
    db.from("news").select("*").order("published_at", { ascending: false }).limit(50),
    db.from("pandas").select("*").order("sort_order", { ascending: true }),
    db.from("posts").select("*").order("created_at", { ascending: false }).limit(120),
    db.from("comments").select("*").order("created_at", { ascending: true }).limit(600),
  ]);
  if (!n.error) state.news = n.data || [];
  if (!p.error) state.pandas = p.data || [];
  if (!po.error) state.posts = po.data || [];
  if (!c.error) state.comments = c.data || [];
  if (n.error || p.error || po.error || c.error) {
    console.warn("load error", n.error || p.error || po.error || c.error);
    toast("数据加载不完整，请刷新重试", "err");
  }
  await loadCommentConfig();
}

/** 评论开关配置（全站开关 + 自动关闭天数） */
async function loadCommentConfig() {
  try {
    const { data, error } = await db.rpc("f_comment_config");
    if (error) throw error;
    if (data) state.commentCfg = { enabled: data.enabled !== false, auto_days: Number(data.auto_days || 0) };
  } catch (e) {
    state.commentCfg = { enabled: true, auto_days: 0 };
  }
}

/** 单个帖子当前是否可评论（与服务端 f_comment_state 规则一致，仅用于界面展示） */
function commentStateOf(p) {
  const cfg = state.commentCfg || { enabled: true, auto_days: 0 };
  if (p && p.hidden) return { open: false, reason: "该帖已隐藏，评论已关闭" };
  if (!cfg.enabled) return { open: false, reason: "全站评论已暂停，稍后再来" };
  if (p && p.allow_comment === false) {
    return { open: false, reason: p.comment_lock_reason || "该帖已关闭评论" };
  }
  const days = Number(cfg.auto_days || 0);
  if (days > 0 && p && p.created_at) {
    const age = (Date.now() - new Date(p.created_at).getTime()) / 86400000;
    if (age > days) return { open: false, reason: `发布已超过 ${days} 天，评论已自动关闭` };
  }
  return { open: true };
}

/* ==========================================================
   首页
   ========================================================== */
function renderHero() {
  const heroEl = $("#heroCard");
  if (!heroEl) return; // 首页已改为纯内容页，无 Hero 卡
  const d = new Date();
  const posts = visiblePosts();
  const likes = posts.reduce((s, p) => s + (p.likes || 0), 0);
  heroEl.innerHTML = `
    <div class="hero-eyebrow"><i></i>今日动态已更新 · ${d.getMonth() + 1} 月 ${d.getDate()} 日</div>
    <h1 class="hero-title">每天，看滚滚。<span class="grad">动态，全在这里。</span></h1>
    <p class="hero-desc">每日最新消息、粉丝真实分享、每只国宝的完整档案——一个页面全部看完。</p>
    <div class="hero-actions">
      <button class="btn btn-primary" id="heroCompose">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        我要发一帖
      </button>
      <button class="btn btn-ghost" id="heroBrowse">看熊猫档案</button>
    </div>
    <div class="hero-stats">
      <div class="hs-item">
        <span class="hs-ico">${ICON.news}</span>
        <div><b>${state.news.length}</b><span>今日动态</span></div>
      </div>
      <div class="hs-item">
        <span class="hs-ico v">${ICON.paw}</span>
        <div><b>${state.pandas.length}</b><span>在册熊猫</span></div>
      </div>
      <div class="hs-item">
        <span class="hs-ico p">${ICON.chat}</span>
        <div><b>${posts.length}</b><span>圈内帖子</span></div>
      </div>
      <div class="hs-item">
        <span class="hs-ico g">${ICON.heart}</span>
        <div><b>${likes}</b><span>累计点赞</span></div>
      </div>
    </div>`;
  $("#heroCompose")?.addEventListener("click", openCompose);
  $("#heroBrowse")?.addEventListener("click", () => switchTab("pandas"));
}

function renderHomeChips() {
  const tags = [...new Set(visibleNews().map((n) => n.tag).filter(Boolean))].slice(0, 7);
  const items = ["全部", ...tags];
  $("#homeChips").innerHTML = items
    .map(
      (t) => `<button class="chip ${(t === "全部" && !state.newsTag) || state.newsTag === t ? "on" : ""}" data-tag="${esc(
        t === "全部" ? "" : t
      )}"><span class="dot"></span>${esc(t)}</button>`
    )
    .join("");
  $$("#homeChips .chip").forEach((b) =>
    b.addEventListener("click", () => {
      state.newsTag = b.dataset.tag;
      renderHomeChips();
      renderNewsFeed();
    })
  );
}

function renderBanners() {
  const list = visibleNews();
  const banners = (list.filter((n) => n.is_banner).length
    ? list.filter((n) => n.is_banner)
    : list
  ).slice(0, 5);
  const track = $("#bannerTrack");
  track.innerHTML =
    banners
      .map(
        (n) => `<div class="slide" data-nid="${n.id}">
          ${imgTag(coverOf(n))}
          <div class="slide-ov"></div>
          <div class="slide-body">
            <span class="slide-tag">✦ ${esc(n.tag || "每日动态")}</span>
            <div class="slide-title">${esc(n.title)}</div>
          </div>
        </div>`
      )
      .join("") || `<div class="slide"><div class="slide-ov"></div><div class="slide-body"><div class="slide-title">暂无焦点动态</div></div></div>`;
  $$(".slide", track).forEach((el) => {
    if (!el.dataset.nid) return;
    el.addEventListener("click", () => openNews(Number(el.dataset.nid)));
  });

  $("#bannerDots").innerHTML = banners.map((_, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("");
  track.onscroll = () => {
    const max = track.scrollWidth - track.clientWidth;
    const idx = Math.round((track.scrollLeft / (max || 1)) * Math.max(banners.length - 1, 0));
    $$("#bannerDots i").forEach((d, i) => d.classList.toggle("on", i === idx));
  };
}

function renderQuickPandas() {
  $("#quickPandas").innerHTML = visiblePandas()
    .slice(0, 8)
    .map(
      (p) => `<div class="rp" data-pid="${p.id}">
        <div class="rp-img">${imgTag(pandaAvatarImg(p))}</div>
        <span class="rp-name">${esc(p.name)}</span>
      </div>`
    )
    .join("");
  $$("#quickPandas .rp").forEach((el) => el.addEventListener("click", () => openPanda(Number(el.dataset.pid))));
}

function renderNewsFeed() {
  const base = visibleNews();
  const list = state.newsTag ? base.filter((n) => n.tag === state.newsTag) : base;
  $("#newsCount").textContent = list.length ? `共 ${list.length} 条` : "";
  const feed = $("#newsFeed");
  if (!list.length) {
    feed.innerHTML = `<div class="cmt-empty">这个分类下暂时没有动态，换个分类看看～</div>`;
    return;
  }
  feed.innerHTML = list
    .map((n, i) => {
      if (i === 0) {
        return `<article class="news-lead" data-nid="${n.id}">
          <div class="nl-glance">
            <span class="nl-tag">头条 · ${esc(n.tag || "每日动态")}</span>
            ${imgTag(thumbOf(n), "nl-av")}
            <span class="nl-from">${esc(pandaNameOf(n) || "熊猫动态圈")}</span>
          </div>
          <div class="nl-body">
            <div class="nl-title">${esc(n.title)}</div>
            <div class="nl-desc">${esc(n.summary || "")}</div>
            <div class="nl-meta"><span>熊猫动态圈</span><i class="sep"></i><span>${timeAgo(n.published_at)}</span><span class="nl-more">阅读全文 ›</span></div>
          </div>
        </article>`;
      }
      return `<article class="news-item" data-nid="${n.id}">
        <div class="ni-thumb">${imgTag(thumbOf(n))}</div>
        <div class="ni-body">
          <span class="ni-tag">${esc(n.tag || "动态")}</span>
          <div class="ni-title">${esc(n.title)}</div>
          <div class="ni-meta">${timeAgo(n.published_at)} · ${esc((n.summary || "").slice(0, 18))}</div>
        </div>
      </article>`;
    })
    .join("");
  $$("[data-nid]", feed).forEach((el) => el.addEventListener("click", () => openNews(Number(el.dataset.nid))));
}

function renderHome() {
  renderHero();
  renderHomeChips();
  renderBanners();
  renderQuickPandas();
  renderNewsFeed();
}

/* 新闻详情 */
function openNews(id) {
  const n = state.news.find((x) => x.id === id);
  if (!n) return;
  const body = `
    <div class="article-hero">${imgTag(coverOf(n))}</div>
    <div class="article-wrap">
      <span class="article-tag">${esc(n.tag || "每日动态")}</span>
      <h1 class="article-title">${esc(n.title)}</h1>
      <div class="article-meta"><span>熊猫动态圈</span><span>·</span><span>${fullTime(n.published_at)}</span></div>
      <div class="article-body">${esc(fixText(n.content || n.summary || ""))}</div>
      ${
        Array.isArray(n.images) && n.images.length
          ? `<div class="article-gallery">${n.images
              .map((g) => `<figure>${imgTag(imgSrcOf(g, "cov", artKeyOf(n)))}</figure>`)
              .join("")}</div>`
          : ""
      }
      <p class="fineprint">本文为社区整理内容，仅供交流参考</p>
    </div>`;
  openPage({ title: "每日动态", body, bodyClass: "no-pad" });
}

/* ==========================================================
   熊猫圈
   ========================================================== */
/* 帖子提到哪只熊猫就配哪只的照片；提到的才配图，避免图文对不上 */
function postPandaKey(p) {
  return pandaKeyOfText(p.content);
}
function postHasImage(p) {
  return !!postPandaKey(p) || hashSeed("img" + p.id) % 3 !== 0;
}
/* 用户自己上传的图片（优先于系统配图） */
function postImages(p) {
  return Array.isArray(p.images) ? p.images.filter((x) => typeof x === "string" && x.trim()) : [];
}

function postImageSrc(p) {
  const key = postPandaKey(p) || AVATAR_KEYS[hashSeed("pi" + p.id) % AVATAR_KEYS.length];
  return `assets/cov-${key}.webp`;
}

function postCardHTML(p, opts = {}) {
  const liked = likedPosts.has(p.id);
  return `<article class="post-card" data-pid="${p.id}">
    <div class="pc-head">
      <span class="pc-av">${posterAvatar(p.avatar_seed, p.nickname)}</span>
      <div class="pc-who">
        <div class="pc-nick">${esc(p.nickname)}${p.pinned ? `<span class="pin-chip">置顶</span>` : ""}</div>
        <div class="pc-time">${timeAgo(p.created_at)}</div>
      </div>
    </div>
    <div class="pc-text ${opts.clamp ? "clamp" : ""}">${esc(p.content)}</div>
    ${(() => {
      const imgs = postImages(p);
      if (imgs.length)
        return `<div class="pc-gal g${Math.min(imgs.length, 4)}">${imgs
          .map((u, i) => `<span class="it" data-pid="${p.id}" data-pi="${i}"><img src="${esc(u)}" alt="" /></span>`)
          .join("")}</div>`;
      return postHasImage(p) && (opts.clamp || opts.detail) ? `<div class="pc-img">${imgTag(postImageSrc(p))}</div>` : "";
    })()}
    <div class="pc-acts">
      <button class="pc-act like ${liked ? "liked" : ""}" data-pid="${p.id}">
        <svg viewBox="0 0 24 24" fill="${liked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 21.4l8.8-8.4a5.2 5.2 0 0 0 0-7.4z"/></svg>
        <span>${p.likes || 0}</span>
      </button>
      <button class="pc-act open" data-pid="${p.id}" ${opts.detail ? "hidden" : ""}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8 8 0 0 1-8 8H8l-4 2 1-4A8 8 0 1 1 21 11.5z"/></svg>
        <span>${commentCount(p.id)}</span>
      </button>
      ${opts.clamp ? `<span class="pc-more" data-open="${p.id}">看全文 ›</span>` : ""}
      ${opts.detail && !isMyPost(p) ? `<button class="pc-act pc-report" data-report="${p.id}">🚩 举报</button>` : ""}
      ${opts.detail ? `<button class="pc-act pc-share" data-share="${p.id}">↗ 分享</button>` : ""}
    </div>
  </article>`;
}

function bindPostCards(scope) {
  $$(".pc-act.like", scope).forEach((b) =>
    b.addEventListener("click", async (e) => {
      e.stopPropagation();
      const pid = Number(b.dataset.pid);
      if (!isLoggedIn()) return openAuth({ onDone: renderCommunity });
      b.disabled = true;
      try {
        /* 服务端 toggle：同一账号一条赞记录，可再次点击取消 */
        const { data, error } = await db.rpc("f_like_post", { p_id: pid });
        if (error) throw error;
        if (data && data.ok === false) {
          if (data.error === "login_required") { state.authed = false; state.account = null; openAuth(); throw new Error("登录已过期，请重新登录"); }
          throw new Error("点赞失败，请稍后再试");
        }
        const liked = !!data.liked;
        if (liked) likedPosts.add(pid);
        else likedPosts.delete(pid);
        persistLikes();
        b.classList.toggle("liked", liked);
        b.querySelector("svg").setAttribute("fill", liked ? "currentColor" : "none");
        b.querySelector("span").textContent = data.likes;
        const p = state.posts.find((x) => x.id === pid);
        if (p) p.likes = data.likes;
      } catch (err) {
        toast(err.message || "点赞失败", "err");
      } finally {
        b.disabled = false;
      }
    })
  );
  $$(".pc-gal .it", scope).forEach((el) =>
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const p = state.posts.find((x) => x.id === Number(el.dataset.pid));
      const src = p ? postImages(p)[Number(el.dataset.pi)] : "";
      if (src) openPhotoView(src);
    })
  );
  $$(".pc-report", scope).forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      openReport("post", Number(b.dataset.report));
    })
  );
  $$(".pc-share", scope).forEach((b) =>
    b.addEventListener("click", async (e) => {
      e.stopPropagation();
      const pid = Number(b.dataset.share);
      const p = state.posts.find((x) => x.id === pid);
      const payload = {
        title: "熊猫动态圈",
        text: (p ? p.content.slice(0, 60) : "每天和滚滚见面") + " …来熊猫动态圈看看",
        url: location.origin + location.pathname,
      };
      try {
        if (navigator.share) await navigator.share(payload);
        else {
          await navigator.clipboard.writeText(payload.url);
          toast("链接已复制，去粘贴给朋友吧", "ok");
        }
      } catch (err) {
        /* 用户取消分享不提示 */
      }
    })
  );
  $$(".pc-act.open, [data-open]", scope).forEach((b) =>
    b.addEventListener("click", () => openPost(Number(b.dataset.pid || b.dataset.open)))
  );
}

function renderCommunity() {
  const list = visiblePosts();
  const sorted = [...list].sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.created_at) - new Date(a.created_at)
  );
  const feed = $("#postFeed");
  feed.innerHTML =
    sorted.map((p) => postCardHTML(p, { clamp: true })).join("") ||
    `<div class="cmt-empty">这里还很安静，点右下角发第一帖吧 🐼</div>`;
  bindPostCards(feed);
}

$("#fabCompose").addEventListener("click", openCompose);
$("#fabPanda").addEventListener("click", () => {
  if (!needLogin("先登录才能添加熊猫档案 🐼", () => openPandaForm({}))) return;
  openPandaForm({});
});

/* 大图预览 */
function openPhotoView(src) {
  const el = document.createElement("div");
  el.className = "photo-view";
  el.innerHTML = `<img src="${esc(src)}" alt="" /><button class="pv-x" aria-label="关闭">×</button>`;
  document.body.appendChild(el);
  const kill = () => {
    el.classList.remove("on");
    setTimeout(() => el.remove(), 180);
  };
  el.addEventListener("click", kill);
  const onKey = (e) => {
    if (e.key === "Escape") {
      kill();
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);
  requestAnimationFrame(() => el.classList.add("on"));
}

/* 发帖 */
function openCompose() {
  if (!isLoggedIn()) {
    toast("先登录再发帖吧 🐼");
    return openAuth({ onDone: openCompose });
  }
  if (state.banned) {
    return toast("账号已被封禁，暂时无法发帖", "err");
  }
  const body = `
    <div class="compose-page">
      <div class="compose-av-row" id="cAvRow">
        ${AVATAR_KEYS.map(
          (k) =>
            `<button class="av-opt ${avatarKeyOf(state.seed) === k ? "sel" : ""}" data-seed="${k}">
               ${imgTag(`assets/${k}.webp`)}
             </button>`
        ).join("")}
      </div>
      <div class="compose-nick">
        <span style="font-size:15px">🐼</span>
        <input id="cNick" maxlength="16" placeholder="你的昵称（必填）" value="${esc(state.nickname)}" />
      </div>
      <textarea id="cText" maxlength="500" placeholder="分享你和滚滚的故事，或今天看到的新鲜事…"></textarea>
      <div class="compose-counter"><span id="cCount">0</span>/500</div>
      <div class="cp-gal" id="cGal"></div>
      <div class="cp-imgs-tip">可添加最多 4 张图片，会自动压缩</div>
    </div>`;
  const { page, close } = openPage({
    title: "发布帖子",
    body,
    onMount: (pg) => {
      const head = pg.querySelector(".page-head");
      const btn = document.createElement("button");
      btn.className = "publish-btn";
      btn.textContent = "发布";
      btn.style.marginRight = "6px";
      head.appendChild(btn);

      const ta = $("#cText", pg);
      ta.addEventListener("input", () => ($("#cCount", pg).textContent = ta.value.length));

      $$("#cAvRow .av-opt", pg).forEach((b) =>
        b.addEventListener("click", () => {
          $$("#cAvRow .av-opt", pg).forEach((x) => x.classList.remove("sel"));
          b.classList.add("sel");
          state.seed = b.dataset.seed;
          localStorage.setItem("pc_seed", state.seed);
        })
      );

      /* 配图：最多 4 张，选完立刻压缩成 dataURL */
      const imgs = [];
      const gal = $("#cGal", pg);
      const paintGal = () => {
        gal.innerHTML =
          imgs
            .map(
              (u, i) => `<span class="cp-thumb"><img src="${u}" alt="" />
                <button type="button" class="cp-x" data-ix="${i}" aria-label="移除">×</button></span>`
            )
            .join("") +
          (imgs.length < 4
            ? `<button type="button" class="cp-add" id="cAddImg">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                 <span>${imgs.length ? "再加一张" : "添加图片"}</span>
               </button>`
            : "");
        const add = $("#cAddImg", gal);
        if (add)
          add.addEventListener("click", () => {
            if (imgs.length >= 4) return toast("最多 4 张图片", "err");
            pickPostImage((url) => {
              imgs.push(url);
              paintGal();
            });
          });
        $$("[data-ix]", gal).forEach((b) =>
          b.addEventListener("click", () => {
            imgs.splice(Number(b.dataset.ix), 1);
            paintGal();
          })
        );
      };
      paintGal();

      btn.addEventListener("click", async () => {
        const nick = $("#cNick", pg).value.trim();
        const content = ta.value.trim();
        if (nick.length < 2) return toast("昵称至少 2 个字", "err");
        if (!content) return toast("还没写内容哦～", "err");
        btn.disabled = true;
        try {
          const { data, error } = await db.rpc("f_create_post", {
            p_key: state.userKey,
            p_nickname: nick,
            p_avatar_seed: state.seed,
            p_content: content,
            p_images: imgs,
          });
          if (error) throw error;
          if (data && data.ok === false) {
            if (data.error === "login_required") { state.authed = false; state.account = null; openAuth(); throw new Error("登录已过期，请重新登录"); }
            if (data.error === "comment_closed") throw new Error(data.reason || "该帖已关闭评论");
            if (data.error === "banned") throw new Error("账号已被封禁：" + (data.reason || "违反社区规范"));
            if (data.error === "too_many_images") throw new Error("最多只能发 4 张图片");
            if (data.error === "bad_image") throw new Error("图片格式不支持，请重新选择");
            throw new Error("发布失败，请稍后再试");
          }
          state.nickname = nick;
          localStorage.setItem("pc_nick", nick);
          toast("发布成功 🐼", "ok");
          await refreshPosts();
          renderCommunity();
          renderHero();
          renderMe(); /* 我的页面的发帖数 */
          close();
          switchTab("community");
        } catch (err) {
          toast("发布失败：" + (err.message || "网络异常"), "err");
          btn.disabled = false;
        }
      });
    },
  });
  setTimeout(() => page.querySelector("#cText")?.focus(), 340);
}

/* 帖子详情 */
function openPost(pid) {
  const p = state.posts.find((x) => x.id === pid);
  if (!p) return toast("帖子不存在或已删除", "err");
  let replyTo = null;

  const cmtHTML = (c, all) => {
    const replies = all.filter((x) => x.parent_id === c.id);
    const parent = c.parent_id ? all.find((x) => x.id === c.parent_id) : null;
    return `<div class="cmt" data-cid="${c.id}">
      <span class="cmt-av">${posterAvatar(c.avatar_seed, c.nickname)}</span>
      <div class="cmt-main">
        <div class="cmt-top">
          <span class="cmt-nick">${esc(c.nickname)}</span>
          ${parent ? `<span class="cmt-reply-chip">回复 @${esc(parent.nickname)}</span>` : ""}
          <span class="cmt-time">${timeAgo(c.created_at)}</span>
        </div>
        <div class="cmt-text">${esc(c.content)}</div>
        <div class="cmt-acts">
          <button class="like-cmt ${likedCmts.has(c.id) ? "liked" : ""}" data-cid="${c.id}">❤️ ${c.likes || 0}</button>
          <button class="reply-cmt" data-cid="${c.id}" data-nick="${esc(c.nickname)}">回复</button>
          ${c.user_key && c.user_key === state.userKey ? "" : `<button class="report-cmt" data-cid="${c.id}">举报</button>`}
        </div>
        ${replies.length ? `<div class="cmt-replies">${replies.map((r) => cmtHTML(r, all)).join("")}</div>` : ""}
      </div>
    </div>`;
  };

  const body = `
    <div class="pd-post">${postCardHTML(p, { detail: true })}</div>
    <div class="pd-comments">
      <div class="pd-cmt-head" id="cmtHead">全部评论</div>
      <div id="cmtList"></div>
    </div>`;

  const cs = commentStateOf(p);
  openPage({
    title: "帖子详情",
    body,
    footer: cs.open
      ? `
      <input id="cbarInput" maxlength="200" placeholder="友善评论，共建熊猫圈…" />
      <button class="send" id="cbarSend" aria-label="发送">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
      </button>`
      : `<div class="cbar-closed">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4.6" y="10.4" width="14.8" height="9.6" rx="2.6"/><path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6"/></svg>
           <span>${esc(cs.reason)}</span>
         </div>`,
    onMount: (pg) => {
      bindPostCards(pg);
      /* 评论开关以服务端为准：管理员刚改过设置时本地推算可能滞后 */
      db.rpc("f_comment_state", { p_post_id: pid }).then(({ data }) => {
        if (!data || data.open !== false || !cs.open) return;
        cs.open = false;
        cs.reason = data.reason || "该帖已关闭评论";
        const bar = pg.querySelector(".comment-bar");
        if (bar)
          bar.innerHTML = `<div class="cbar-closed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4.6" y="10.4" width="14.8" height="9.6" rx="2.6"/><path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6"/></svg>
            <span>${esc(cs.reason)}</span>
          </div>`;
      });
      if (!cs.open) return;
      const input = $("#cbarInput", pg);
      const bar = pg.querySelector(".comment-bar");

      const setReply = (cid, nick) => {
        replyTo = cid;
        let chip = bar.querySelector(".reply-hint");
        if (!chip) {
          chip = document.createElement("span");
          chip.className = "reply-hint";
          bar.insertBefore(chip, input);
        }
        chip.innerHTML = `回复 @${esc(nick)} <button data-cancel>✕</button>`;
        chip.querySelector("[data-cancel]").addEventListener("click", () => {
          replyTo = null;
          chip.remove();
        });
        input.focus();
      };

      const bindList = () => {
        const all = state.comments.filter((c) => c.post_id === pid);
        const roots = all.filter((c) => !c.parent_id);
        $("#cmtHead", pg).textContent = `全部评论（${all.length}）`;
        $("#cmtList", pg).innerHTML =
          roots.map((c) => cmtHTML(c, all)).join("") || `<div class="cmt-empty">还没有评论，来说两句吧 💬</div>`;
        $$(".reply-cmt", pg).forEach((b) =>
          b.addEventListener("click", () => setReply(Number(b.dataset.cid), b.dataset.nick))
        );
        $$(".report-cmt", pg).forEach((b) =>
          b.addEventListener("click", () => openReport("comment", Number(b.dataset.cid)))
        );
        $$(".like-cmt", pg).forEach((b) =>
          b.addEventListener("click", async () => {
            const cid = Number(b.dataset.cid);
            if (!isLoggedIn()) return openAuth();
            b.disabled = true;
            try {
              const { data, error } = await db.rpc("f_like_comment", { p_id: cid });
              if (error) throw error;
              if (data && data.ok === false) {
                if (data.error === "login_required") { state.authed = false; state.account = null; openAuth(); throw new Error("登录已过期，请重新登录"); }
                throw new Error("操作失败");
              }
              if (data.liked) likedCmts.add(cid);
              else likedCmts.delete(cid);
              persistLikes();
              b.classList.toggle("liked", data.liked);
              b.textContent = `❤️ ${data.likes}`;
            } catch (err) {
              toast(err.message || "操作失败", "err");
            } finally {
              b.disabled = false;
            }
          })
        );
      };
      bindList();

      const send = async () => {
        const nick = state.nickname || localStorage.getItem("pc_nick") || "";
        const content = input.value.trim();
        if (!nick) return toast("请先在「我的」里设置昵称 😊", "err");
        if (!content) return toast("说点什么吧～", "err");
        try {
          const { data, error } = await db.rpc("f_create_comment", {
            p_post_id: pid,
            p_key: state.userKey,
            p_nickname: nick,
            p_avatar_seed: state.seed,
            p_content: content,
            p_parent_id: replyTo || null,
          });
          if (error) throw error;
          if (data && data.ok === false) {
            if (data.error === "login_required") { state.authed = false; state.account = null; openAuth(); throw new Error("登录已过期，请重新登录"); }
            if (data.error === "comment_closed") throw new Error(data.reason || "该帖已关闭评论");
            if (data.error === "banned") throw new Error("账号已被封禁：" + (data.reason || "违反社区规范"));
            throw new Error("评论失败，请稍后再试");
          }
          input.value = "";
          replyTo = null;
          bar.querySelector(".reply-hint")?.remove();
          toast("评论成功 💬", "ok");
          await refreshComments();
          bindList();
          renderCommunity(); /* 同步列表卡片上的评论数 */
          renderMe();
          setTimeout(() => pg.querySelector(".page-body").scrollTo({ top: 9999, behavior: "smooth" }), 60);
        } catch (err) {
          toast("评论失败：" + (err.message || "网络异常"), "err");
        }
      };
      $("#cbarSend", pg).addEventListener("click", send);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") send();
      });
    },
  });
}

/* ==========================================================
   图鉴
   ========================================================== */
const BASE_FILTERS = [
  { key: "", label: "全部" },
  { key: "成都", label: "成都基地" },
  { key: "北京", label: "北京动物园" },
  { key: "卧龙", label: "卧龙" },
  { key: "秦岭", label: "秦岭" },
  { key: "重庆", label: "重庆" },
];

function renderPandaChips() {
  $("#pandaChips").innerHTML = BASE_FILTERS.map(
    (f) =>
      `<button class="chip ${state.pandaBase === f.key ? "on" : ""}" data-base="${f.key}">
        <span class="dot"></span>${esc(f.label)}
      </button>`
  ).join("");
  $$("#pandaChips .chip").forEach((b) =>
    b.addEventListener("click", () => {
      state.pandaBase = b.dataset.base;
      renderPandaChips();
      renderPandas();
    })
  );
}

function renderPandas() {
  const q = state.pandaQuery.trim();
  const list = visiblePandas().filter((p) => {
    if (state.pandaBase && !String(p.base || "").includes(state.pandaBase)) return false;
    if (!q) return true;
    return [p.name, p.base, p.personality, p.hobbies, p.father, p.mother].some((v) =>
      String(v || "").includes(q)
    );
  });
  $("#pandaGrid").innerHTML =
    list
      .map((p) => {
        const female = p.gender === "女";
        const gc = Number(state.guardCounts[p.id] || 0);
        const mine = state.guardIds.has(p.id);
        return `<div class="panda-card" data-pid="${p.id}">
          <div class="pd-img">
            ${imgTag(pandaAvatarImg(p))}
            <span class="pd-badge ${female ? "f" : ""}">${female ? "♀ 女士" : "♂ 先生"}</span>
            <span class="pd-age">${ageShort(p.birth_date)}</span>
            ${gc || mine ? `<span class="pd-guard-badge ${mine ? "mine" : ""}">🛡 ${mine ? "已守护" : gc + " 人守护"}</span>` : ""}
          </div>
          <div class="pd-body">
            <div class="pd-name">${esc(p.name)}</div>
            <div class="pd-base">${esc(shortBase(p.base))}</div>
            <div class="pd-chips">
              ${p.personality ? `<span class="mini-chip">${esc(p.personality.split("、")[0].slice(0, 6))}</span>` : ""}
            </div>
            ${p.father || p.mother ? `<div class="pd-parent">${p.father ? "父 " + esc(p.father) : ""}${p.father && p.mother ? " · " : ""}${p.mother ? "母 " + esc(p.mother) : ""}</div>` : ""}
          </div>
        </div>`;
      })
      .join("") ||
    `<div class="cmt-empty" style="grid-column:1/-1">没有找到相关的滚滚，换个条件试试 🐾</div>`;
  $$("#pandaGrid .panda-card").forEach((el) =>
    el.addEventListener("click", () => openPanda(Number(el.dataset.pid)))
  );
}

function shortBase(base) {
  return String(base || "基地未知")
    .replace("大熊猫繁育研究基地", "繁育基地")
    .replace("中国大熊猫保护研究中心", "")
    .replace("大熊猫研究中心", "研究中心");
}

$("#pandaSearch").addEventListener("input", (e) => {
  state.pandaQuery = e.target.value;
  renderPandas();
});

function openPanda(pid) {
  const p = state.pandas.find((x) => x.id === pid);
  if (!p) return;
  const row = (ico, key, val) =>
    `<div class="info-row">
       <span class="info-ico">${ico}</span>
       <span class="info-key">${key}</span>
       <span class="info-val ${val ? "" : "muted"}">${val ? esc(val) : "暂无记录"}</span>
     </div>`;
  const female = p.gender === "女";
  const guarded = state.guardIds.has(p.id);
  const body = `
    <div class="panda-hero" style="background-image:url('${pandaPhoto(p)}')">
      <div class="ph-info">
        <div class="ph-name">${esc(p.name)}<span class="g-chip">${female ? "♀ 女士" : "♂ 先生"}</span></div>
        <div class="ph-base">📍 ${esc(p.base || "基地未知")}</div>
        <div class="ph-chips">
          <span class="ph-chip">${calcAge(p.birth_date)}</span>
          <span class="ph-chip">生日 ${esc(p.birth_date || "未知")}</span>
        </div>
      </div>
    </div>
    <div class="panda-sheet">
      <div class="info-card">
        ${row(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c1.2-3.4 3.7-5.2 7-5.2s5.8 1.8 7 5.2"/><path d="M9 4.6 12 2l3 2.6"/></svg>`, "父亲", p.father)}
        ${row(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c1.2-3.4 3.7-5.2 7-5.2s5.8 1.8 7 5.2"/></svg>`, "母亲", p.mother)}
        ${row(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3.4 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/></svg>`, "性格", p.personality)}
        ${row(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21c0-6 2-10 7-13"/><path d="M8 21c-1-4 0-7 3-9"/><path d="M13 6c2-2 5-2 7 0-2 2-5 2-7 0z"/><path d="M9 12c-2-1-4 0-5 2 2 1 4 0 5-2z"/></svg>`, "爱好", p.hobbies)}
      </div>
      <div class="info-card">${row(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.4C10.4 4.9 8.2 4.2 5 4.4v13c3.2-.2 5.4.5 7 2 1.6-1.5 3.8-2.2 7-2v-13c-3.2-.2-5.4.5-7 2z"/><path d="M12 6.4v13"/></svg>`, "小传", p.bio)}</div>

      ${
        Array.isArray(p.images) && p.images.length
          ? `<div class="info-card pd-gal-card">
               <div class="pd-gal-head">照片集 <span>${p.images.length} 张</span></div>
               <div class="pd-gallery">
                 ${p.images
                   .map(
                     (u) =>
                       `<span class="pd-gal-item" style="background-image:url('${esc(imgSrcOf(u, "p", pandaKey(p)))}')"></span>`
                   )
                   .join("")}
               </div>
             </div>`
          : ""
      }

      <div class="guard-card">
        <div class="gc-head">
          <span class="gc-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.6 5.4 6.4v5.2c0 4.1 2.7 7.6 6.6 8.8 3.9-1.2 6.6-4.7 6.6-8.8V6.4z"/><path d="m9 11.8 2.2 2.3 4-4.4"/></svg>
            守护者
          </span>
          <span class="gc-count" id="gcCount">—</span>
        </div>
        <div class="gc-people" id="gcPeople"><span class="gc-empty">正在加载…</span></div>
      </div>

      <p class="fineprint">档案根据公开资料整理，欢迎提交更正 · 经审核后更新</p>
    </div>`;
  const footer = `
    <div class="pd-bar">
      <button class="pd-guard ${guarded ? "on" : ""}" id="pdGuard">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.6 5.4 6.4v5.2c0 4.1 2.7 7.6 6.6 8.8 3.9-1.2 6.6-4.7 6.6-8.8V6.4z"/><path d="m9 11.8 2.2 2.3 4-4.4"/></svg>
        <span id="pdGuardTxt">${guarded ? "已守护" : "守护 TA"}</span>
      </button>
      <button class="pd-suggest" id="pdSuggest">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 19.5h3.2L19 8.4l-3.2-3.2L4.5 16.3z"/><path d="M14.6 6.4 17.8 9.6"/></svg>
        提交修改
      </button>
    </div>`;
  const { page } = openPage({ title: "熊猫档案", body, footer, bodyClass: "no-pad" });

  paintGuardians(p, $("#gcPeople", page), $("#gcCount", page));

  let guardBusy = false;
  $("#pdGuard", page).addEventListener("click", async () => {
    if (guardBusy) return;
    if (!needLogin("先登录才能守护熊猫 🐼", () => openPanda(p.id))) return;
    const on = state.guardIds.has(p.id);
    const btn = $("#pdGuard", page);
    guardBusy = true;
    btn.disabled = true;
    try {
      if (on) {
        const ok = await askConfirm("取消守护？", `取消后「我的守护」里将不再有 ${p.name}，随时可以再来守护。`, "取消守护");
        if (!ok) {
          btn.disabled = false;
          return;
        }
        const { data, error } = await db.rpc("f_unclaim_guardian", {
          p_key: state.userKey,
          p_panda_id: p.id,
        });
        if (error) throw error;
        state.guardIds.delete(p.id);
        state.guardCounts[p.id] = (data && data.guardians) || 0;
        state.guardians = state.guardians.filter((g) => g.panda_id !== p.id);
        toast("已取消守护", "ok");
      } else {
        const { data, error } = await db.rpc("f_claim_guardian", {
          p_key: state.userKey,
          p_nickname: state.nickname,
          p_avatar: state.avatar || null,
          p_panda_id: p.id,
        });
        if (error) throw error;
        if (data && data.ok === false) {
          if (data.error === "login_required") { state.authed = false; state.account = null; openAuth(); throw new Error("登录已过期，请重新登录"); }
          if (data.error === "comment_closed") throw new Error(data.reason || "该帖已关闭评论");
          if (data.error === "banned") throw new Error("账号已被封禁：" + (data.reason || "违反社区规范"));
          throw new Error(data.error || "操作失败");
        }
        state.guardIds.add(p.id);
        state.guardCounts[p.id] = (data && data.guardians) || 1;
        await loadMyGuardians();
        toast(`你成为了 ${p.name} 的守护者 🛡`, "ok");
      }
      btn.classList.toggle("on", state.guardIds.has(p.id));
      $("#pdGuardTxt", page).textContent = state.guardIds.has(p.id) ? "已守护" : "守护 TA";
      paintGuardians(p, $("#gcPeople", page), $("#gcCount", page));
      renderPandas();
      renderMe(); /* 我的页面里的守护数 */
    } catch (err) {
      toast(err.message || "操作失败，请稍后再试", "err");
    } finally {
      btn.disabled = false;
      setTimeout(() => (guardBusy = false), 400);
    }
  });

  $("#pdSuggest", page).addEventListener("click", () => {
    if (!needLogin("先登录才能提交修改 🐼", () => openPanda(p.id))) return;
    openPandaForm({ panda: p });
  });
}

/* 守护人展示条 */
async function paintGuardians(p, peopleEl, countEl) {
  if (!peopleEl) return;
  const fallback = () => {
    const n = state.guardCounts[p.id] || 0;
    if (countEl) countEl.textContent = n ? `${n} 人` : "暂无";
  };
  if (!db) return fallback();
  try {
    const { data, error } = await db.rpc("f_panda_guardians", { p_panda_id: p.id });
    if (error) throw error;
    const list = (data && data.list) || [];
    const count = (data && data.count) || 0;
    state.guardCounts[p.id] = count;
    if (countEl) countEl.textContent = count ? `${count} 人` : "暂无";
    if (!list.length) {
      peopleEl.innerHTML = `<span class="gc-empty">还没有人守护，做第一个吧</span>`;
      return;
    }
    peopleEl.innerHTML = list
      .slice(0, 12)
      .map(
        (g) => `<span class="gc-person ${g.source === "founder" ? "founder" : ""}" title="${esc(g.nickname || "熊猫迷")}">
          <span class="gc-av">${g.avatar ? `<img src="${esc(g.avatar)}" alt="" />` : PANDA_FACE_SVG}</span>
          <em>${esc(g.nickname || "熊猫迷")}</em>
          ${g.source === "founder" ? `<i class="gc-tag">建档</i>` : ""}
        </span>`
      )
      .join("") +
      (list.length > 12 ? `<span class="gc-more">+${list.length - 12}</span>` : "");
  } catch (e) {
    fallback();
  }
}

/* ==========================================================
   用户贡献：添加熊猫 / 提交修改（均需审核）
   ========================================================== */
const PANDA_FIELDS = [
  { k: "name", label: "名字", ph: "如：和花", req: true, max: 20 },
  { k: "gender", label: "性别", type: "select", opts: ["女", "男", "未知"] },
  { k: "base", label: "所在基地", ph: "如：成都大熊猫繁育研究基地" },
  { k: "birth_date", label: "出生日期", ph: "如：2020-07-04" },
  { k: "father", label: "父亲", ph: "父亲名字" },
  { k: "mother", label: "母亲", ph: "母亲名字" },
  { k: "personality", label: "性格", ph: "用、分隔，如：温顺、好奇" },
  { k: "hobbies", label: "爱好", ph: "如：爬树、滚泥巴" },
  { k: "bio", label: "小传", type: "textarea", ph: "这只熊猫的故事、趣事…" },
];
const PANDA_LABEL = PANDA_FIELDS.reduce((m, f) => ((m[f.k] = f.label), m), {});
PANDA_LABEL.photo = "封面照片";
PANDA_LABEL.images_append = "照片集";

function needLogin(tip, onDone) {
  if (!isLoggedIn()) {
    toast(tip || "先登录再操作吧 🐼");
    openAuth({ onDone });
    return false;
  }
  if (state.banned) {
    toast("账号已被封禁，暂时无法操作", "err");
    return false;
  }
  return true;
}

/* 熊猫照片：等比缩放到 1100 以内，压到 webp */
function compressPandaPhoto(img) {
  const MAX = 1100;
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  const scale = Math.min(1, MAX / Math.max(w0, h0));
  const w = Math.round(w0 * scale);
  const h = Math.round(h0 * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#f2f5fa";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  let out = c.toDataURL("image/webp", 0.82);
  if (!out || out.indexOf("data:image") !== 0 || out.length > 900000) out = c.toDataURL("image/jpeg", 0.78);
  return out;
}

/* 帖子配图：长边 960 起，逐步降级压到 ~260KB 字符以内（≈190KB 图片） */
function compressPostImage(img) {
  const encode = (max, type, q) => {
    const w0 = img.naturalWidth || img.width;
    const h0 = img.naturalHeight || img.height;
    const s = Math.min(1, max / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * s));
    const h = Math.max(1, Math.round(h0 * s));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#f2f5fa";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return c.toDataURL(type, q);
  };
  let out = encode(960, "image/webp", 0.74);
  if (!out || out.indexOf("data:image") !== 0) out = encode(960, "image/jpeg", 0.72);
  if (out.length > 260000) out = encode(760, "image/jpeg", 0.66);
  if (out.length > 260000) out = encode(620, "image/jpeg", 0.6);
  return out;
}

function pickImageFile(compress, onDone) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", () => {
    const f = input.files && input.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) return toast("请选择图片文件", "err");
    if (f.size > 12 * 1024 * 1024) return toast("图片太大了，请选 12MB 以内的", "err");
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          onDone(compress(img));
        } catch (e) {
          toast("图片处理失败，换一张试试", "err");
        }
      };
      img.onerror = () => toast("这张图片读不出来，换一张试试", "err");
      img.src = fr.result;
    };
    fr.onerror = () => toast("读取图片失败", "err");
    fr.readAsDataURL(f);
  });
  input.click();
}

const pickPhoto = (onDone) => pickImageFile(compressPandaPhoto, onDone);
const pickPostImage = (onDone) => pickImageFile(compressPostImage, onDone);

/**
 * 添加熊猫 / 修改档案表单
 * @param {{ panda?: object }} opts 不传 panda 即「新增」
 */
function openPandaForm({ panda = null } = {}) {
  const edit = !!panda;
  const cur = panda || {};
  let photo = "";
  let photoChanged = false;
  const oldImages = Array.isArray(cur.images) ? cur.images.slice(0, 4) : [];
  const extraImages = [];

  const fieldHTML = (f) => {
    const v = cur[f.k] ?? "";
    if (f.type === "select")
      return `<label class="pf-field"><span>${f.label}</span>
        <select id="pf_${f.k}">
          ${f.opts.map((o) => `<option value="${o}" ${String(v || "未知") === o ? "selected" : ""}>${o}</option>`).join("")}
        </select></label>`;
    if (f.type === "textarea")
      return `<label class="pf-field"><span>${f.label}</span>
        <textarea id="pf_${f.k}" maxlength="600" placeholder="${f.ph || ""}">${esc(v)}</textarea></label>`;
    return `<label class="pf-field"><span>${f.label}${f.req ? ' <i>*</i>' : ""}</span>
      <input id="pf_${f.k}" maxlength="${f.max || 60}" placeholder="${f.ph || ""}" value="${esc(v)}" /></label>`;
  };

  const body = `
    <div class="pf-page">
      <div class="pf-photo" id="pfPhotoBox">
        ${
          edit && cur.photo
            ? `<img id="pfPhotoImg" src="${esc(imgSrcOf(cur.photo, "p", pandaKey(cur)))}" alt="" />`
            : edit
              ? `<img id="pfPhotoImg" src="${esc(pandaPhoto(cur))}" alt="" />`
              : `<span class="pf-photo-empty">点这里上传熊猫照片</span>`
        }
      </div>
      <div class="pf-photo-acts">
        <button class="pf-mini" id="pfPickPhoto">${edit ? "换一张照片" : "上传照片"}</button>
        <span class="pf-photo-tip">建议横图，会自动压缩</span>
      </div>

      <div class="pf-grid">${PANDA_FIELDS.map(fieldHTML).join("")}</div>

      <div class="pf-field" style="margin-top:14px">
        <span>照片集（可选，最多 4 张）</span>
        <div class="pf-gal" id="pfGal"></div>
        <button class="pf-mini" id="pfAddGal" type="button" style="margin-top:9px">+ 添加一张</button>
      </div>

      <div class="pf-note">
        <b>${edit ? "提交后需要审核" : "审核通过即获守护权"}</b>
        <span>${
          edit
            ? "只提交你改动过的字段，管理员审核通过后才会更新到图鉴。"
            : "审核通过后，这只熊猫会出现在图鉴里，并默认由你担任建档守护人。"
        }</span>
      </div>
    </div>`;

  const { page, close } = openPage({
    title: edit ? "提交修改" : "添加熊猫",
    body,
    onMount: (pg) => {
      const head = pg.querySelector(".page-head");
      const btn = document.createElement("button");
      btn.className = "publish-btn";
      btn.textContent = "提交审核";
      btn.style.marginRight = "6px";
      head.appendChild(btn);

      const box = $("#pfPhotoBox", pg);
      const choose = () =>
        pickPhoto((url) => {
          photo = url;
          photoChanged = true;
          box.innerHTML = `<img id="pfPhotoImg" src="${url}" alt="" />`;
          toast("照片已就绪", "ok");
        });
      box.addEventListener("click", choose);
      $("#pfPickPhoto", pg).addEventListener("click", choose);

      /* 照片集 */
      const gal = $("#pfGal", pg);
      const paintGal = () => {
        const rows = [
          ...oldImages.map((u) => ({ u: imgSrcOf(u, "p", pandaKey(cur)), own: false })),
          ...extraImages.map((u) => ({ u, own: true })),
        ];
        gal.innerHTML = rows.length
          ? rows
              .map(
                (it, i) => `<span class="pf-gal-item" style="background-image:url('${esc(it.u)}')">
                  ${it.own ? `<button type="button" class="pf-gal-x" data-gx="${i - oldImages.length}">×</button>` : ""}
                </span>`
              )
              .join("")
          : `<span class="pf-gal-empty">还没有照片</span>`;
        $$("[data-gx]", gal).forEach((b) =>
          b.addEventListener("click", (ev) => {
            ev.stopPropagation();
            extraImages.splice(Number(b.dataset.gx), 1);
            paintGal();
          })
        );
      };
      paintGal();
      $("#pfAddGal", pg).addEventListener("click", () => {
        if (oldImages.length + extraImages.length >= 4) return toast("最多 4 张照片", "err");
        pickPhoto((url) => {
          extraImages.push(url);
          paintGal();
        });
      });

      btn.addEventListener("click", async () => {
        const payload = {};
        PANDA_FIELDS.forEach((f) => {
          const el = $("#pf_" + f.k, pg);
          if (!el) return;
          const nv = String(el.value || "").trim();
          if (!edit) {
            if (nv) payload[f.k] = nv;
          } else {
            const ov = String(cur[f.k] ?? "").trim();
            if (nv !== ov) payload[f.k] = nv;
          }
        });
        if (photoChanged && photo) payload.photo = photo;
        if (extraImages.length) payload.images_append = extraImages;

        if (!edit) {
          if (!payload.name) return toast("请先填写熊猫名字", "err");
        } else if (!Object.keys(payload).length) {
          return toast("还没有任何修改哦", "err");
        }

        btn.disabled = true;
        btn.textContent = "提交中…";
        try {
          const fn = edit ? "f_submit_panda_edit" : "f_submit_panda_new";
          const args = edit
            ? { p_key: state.userKey, p_nickname: state.nickname, p_panda_id: panda.id, p_payload: payload }
            : { p_key: state.userKey, p_nickname: state.nickname, p_payload: payload };
          const { data, error } = await db.rpc(fn, args);
          if (error) throw error;
          if (data && data.ok === false) {
            if (data.error === "login_required") { state.authed = false; state.account = null; openAuth(); throw new Error("登录已过期，请重新登录"); }
            if (data.error === "comment_closed") throw new Error(data.reason || "该帖已关闭评论");
            if (data.error === "banned") throw new Error("账号已被封禁：" + (data.reason || "违反社区规范"));
            throw new Error(data.error || "提交失败");
          }
          await loadMySubmissions();
          renderMe();
          close();
          toast("已提交，等待审核 🐼", "ok");
          setTimeout(() => openMySubmissions(), 260);
        } catch (err) {
          toast(err.message || "提交失败，请稍后再试", "err");
          btn.disabled = false;
          btn.textContent = "提交审核";
        }
      });
    },
  });
  return page;
}

/* ==========================================================
   我的（登录 / 个人中心）
   ========================================================== */
/* 默认头像：手绘风卡通熊猫（矢量，任意尺寸都清晰） */
const PANDA_FACE_SVG = `<svg class="panda-face" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="32" cy="33" r="17.5" fill="#161b24"/>
  <circle cx="88" cy="33" r="17.5" fill="#161b24"/>
  <ellipse cx="60" cy="70" rx="42" ry="37.5" fill="#fff"/>
  <ellipse cx="44.5" cy="63" rx="12.6" ry="14.6" fill="#161b24" transform="rotate(-15 44.5 63)"/>
  <ellipse cx="75.5" cy="63" rx="12.6" ry="14.6" fill="#161b24" transform="rotate(15 75.5 63)"/>
  <circle cx="45.6" cy="61.6" r="4.9" fill="#fff"/>
  <circle cx="46.8" cy="62.1" r="2.9" fill="#0d1117"/>
  <circle cx="74.4" cy="61.6" r="4.9" fill="#fff"/>
  <circle cx="73.2" cy="62.1" r="2.9" fill="#0d1117"/>
  <ellipse cx="60" cy="78.6" rx="6.1" ry="4.4" fill="#161b24"/>
  <path d="M60 83v4.2" stroke="#161b24" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M60 87.2c2.7 0 4.7-1.5 5.7-3.3M60 87.2c-2.7 0-4.7-1.5-5.7-3.3" stroke="#161b24" stroke-width="2.6" stroke-linecap="round" fill="none"/>
  <ellipse cx="30.5" cy="76" rx="7.6" ry="4.9" fill="#ff9dbc" opacity=".5"/>
  <ellipse cx="89.5" cy="76" rx="7.6" ry="4.9" fill="#ff9dbc" opacity=".5"/>
</svg>`;

/** 是否已登录（真正登录：服务端 auth.uid() 存在才算） */
const isLoggedIn = () => !!state.authed && !!state.account;
/** 帖子是否属于当前用户：账号体系下只看服务端身份 */
const isMyPost = (p) => isLoggedIn() && !!p.user_key && p.user_key === state.userKey;

/** 同步账号在云端的治理状态（封禁 / 违规次数） */
async function syncUserState() {
  if (!db || !isLoggedIn()) return;
  try {
    const { data, error } = await db.rpc("f_me");
    if (error) throw error;
    if (data && data.ok && data.registered) {
      state.banned = !!data.banned;
      state.banReason = data.ban_reason || "";
      state.violations = data.violations || 0;
      if (data.nickname) state.nickname = data.nickname;
    }
  } catch (e) {
    /* 静默失败：不阻塞正常浏览 */
  }
}

/** 拉取「我守护的熊猫」 */
async function loadMyGuardians() {
  if (!db || !isLoggedIn()) {
    state.guardians = [];
    state.guardIds = new Set();
    return;
  }
  try {
    const { data, error } = await db.rpc("f_my_guardians", { p_key: state.userKey });
    if (error) throw error;
    state.guardians = Array.isArray(data) ? data : [];
    state.guardIds = new Set(state.guardians.map((g) => Number(g.panda_id)));
    state.guardians.forEach((g) => {
      if (g.guardian_count != null) state.guardCounts[g.panda_id] = g.guardian_count;
    });
  } catch (e) {
    state.guardians = [];
    state.guardIds = new Set();
  }
}

/** 拉取「我提交的审核」 */
async function loadMySubmissions() {
  if (!db || !isLoggedIn()) {
    state.mySubs = [];
    return;
  }
  try {
    const { data, error } = await db.rpc("f_my_submissions", { p_key: state.userKey });
    if (error) throw error;
    state.mySubs = Array.isArray(data) ? data : [];
  } catch (e) {
    state.mySubs = [];
  }
}

/** 全站熊猫守护人数（用于图鉴卡片） */
async function loadGuardianCounts() {
  if (!db) return;
  try {
    const { data, error } = await db.rpc("f_guardian_counts", {});
    if (error) throw error;
    if (data && typeof data === "object" && !Array.isArray(data)) state.guardCounts = data;
  } catch (e) {
    /* 静默：仅影响角标展示 */
  }
}

const pendingSubCount = () => state.mySubs.filter((s) => s.status === "pending").length;

function myAvatarHTML() {  if (state.avatar) return `<img class="me-av-img" src="${state.avatar}" alt="我的头像" />`;
  return PANDA_FACE_SVG;
}

/** 帖子里自己的头像：用了自定义头像就显示自己的，其余用熊猫头像 */
function posterAvatar(seed, nickname, cls = "") {
  if (state.avatar && nickname && nickname === state.nickname)
    return `<img src="${state.avatar}" alt="" ${cls ? `class="${cls}"` : ""} />`;
  return avatarImg(seed, cls);
}

/* ---------- 头像上传（本地裁切压缩，只存在本机） ---------- */
function pickAvatarImage(onDone) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", () => {
    const f = input.files && input.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) return toast("请选择图片文件", "err");
    if (f.size > 10 * 1024 * 1024) return toast("图片太大了，请选 10MB 以内的", "err");
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          onDone(compressAvatar(img));
        } catch (e) {
          toast("图片处理失败，换一张试试", "err");
        }
      };
      img.onerror = () => toast("这张图片读不出来，换一张试试", "err");
      img.src = fr.result;
    };
    fr.onerror = () => toast("读取图片失败", "err");
    fr.readAsDataURL(f);
  });
  input.click();
}

function compressAvatar(img) {
  const S = 320;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#f2f5fa";
  ctx.fillRect(0, 0, S, S);
  const s = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
  const sx = ((img.naturalWidth || img.width) - s) / 2;
  const sy = ((img.naturalHeight || img.height) - s) * 0.3; // 略微偏上，人脸更居中
  ctx.drawImage(img, sx, sy, s, s, 0, 0, S, S);
  let out = c.toDataURL("image/webp", 0.84);
  if (!out || out.indexOf("data:image") !== 0 || out.length > 420000) out = c.toDataURL("image/jpeg", 0.8);
  return out;
}

function setMyAvatar(dataUrl) {
  state.avatar = dataUrl;
  try {
    localStorage.setItem("pc_avatar", dataUrl);
  } catch (e) {
    toast("头像太大，本机存储空间不足", "err");
  }
}

/* ---------- 轻量确认弹层 ---------- */
function askConfirm(title, desc, okText = "确定") {
  return new Promise((resolve) => {
    const mask = document.createElement("div");
    mask.className = "modal-mask";
    mask.innerHTML = `<div class="modal-card">
      <div class="modal-title">${esc(title)}</div>
      ${desc ? `<div class="modal-desc">${esc(desc)}</div>` : ""}
      <div class="modal-acts">
        <button class="modal-btn ghost" data-r="0">取消</button>
        <button class="modal-btn danger" data-r="1">${esc(okText)}</button>
      </div>
    </div>`;
    document.body.appendChild(mask);
    requestAnimationFrame(() => mask.classList.add("show"));
    let closed = false;
    const done = (v) => {
      if (closed) return;
      closed = true;
      mask.classList.remove("show");
      setTimeout(() => mask.remove(), 220);
      resolve(v);
    };
    mask.addEventListener("click", (e) => {
      const b = e.target.closest("[data-r]");
      if (b) return done(b.dataset.r === "1");
      if (e.target === mask) done(false);
    });
  });
}

/* ---------- 我的页 ---------- */
function renderMe() {
  const root = $("#meRoot");
  if (!root) return;
  const logged = isLoggedIn();
  const mine = logged ? state.posts.filter((p) => isMyPost(p) && !p.hidden) : [];
  const likes = mine.reduce((s, p) => s + (p.likes || 0), 0);
  const cmts = logged ? state.comments.filter((c) => c.user_key && c.user_key === state.userKey).length : 0;

  const menuItem = (id, icon, label, extra = "") =>
    `<button class="me-row" id="${id}">
       <span class="me-ico">${icon}</span>
       <span class="me-label">${label}</span>
       ${extra}
       <span class="me-arrow">›</span>
     </button>`;

  const IC = {
    post: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14 3.5V8h5"/><path d="M9 12h7M9 15.5h5"/></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`,
    about: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.4"/><path d="M12 10.8v5.4"/><circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none"/></svg>`,
    logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4.5h4.2v15h-4.2"/><path d="M4 12h11"/><path d="M11.6 8.4 15.2 12l-3.6 3.6"/></svg>`,
    camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.4h3l1.4-2.2h7.2L17 8.4h3v10.2H4z"/><circle cx="12" cy="13.2" r="3.2"/></svg>`,
    paw: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.4c-2.9 0-5.4-1.7-5.4-4.1 0-2.2 2.2-4.2 5.4-4.2s5.4 2 5.4 4.2c0 2.4-2.5 4.1-5.4 4.1z"/><ellipse cx="6.6" cy="9.6" rx="2.3" ry="2.7"/><ellipse cx="10.9" cy="6.4" rx="2.3" ry="2.7"/><ellipse cx="15.9" cy="7" rx="2.2" ry="2.6"/><ellipse cx="19" cy="10.6" rx="2.1" ry="2.5"/></svg>`,
    draft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 19.5h3.2L19 8.4l-3.2-3.2L4.5 16.3z"/><path d="M14.6 6.4 17.8 9.6"/></svg>`,
    bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 9.5a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/></svg>`,
    merge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v5a4 4 0 0 0 4 4h8"/><path d="m17 9 3 3-3 3"/><path d="M8 21v-5a4 4 0 0 1 4-4"/></svg>`,
  };

  root.innerHTML = `
    <div class="me-hero${logged ? "" : " guest"}">
      <button class="me-avatar" id="meAvatarBtn" aria-label="头像">
        ${myAvatarHTML()}
        ${logged ? `<span class="me-av-cam">${IC.camera}</span>` : ""}
      </button>
      <div class="me-info">
        <div class="me-name">${logged ? esc(state.nickname) : "还没登录"}</div>
        <div class="me-sub">${
          logged
            ? `${esc(maskAccount(state.account) || "已登录")}${state.joinedAt ? " · 加入于 " + esc(state.joinedAt) : ""}`
            : "登录后可以发帖、评论，管理自己的内容"
        }</div>
      </div>
      ${
        logged
          ? `<button class="me-pill" id="meEditBtn">编辑</button>`
          : `<button class="me-pill primary" id="meLoginBtn">登录</button>`
      }
    </div>

    ${
      logged && (state.banned || state.violations > 0)
        ? `<div class="me-notice ${state.banned ? "bad" : ""}">
             <div class="mn-ico">${state.banned ? "🚫" : "⚠️"}</div>
             <div class="mn-txt">
               <b>${state.banned ? "账号已被封禁" : `累计违规 ${state.violations} 次`}</b>
               <span>${
                 state.banned
                   ? esc(state.banReason || "违反社区规范") + "，暂时无法发帖与评论"
                   : "请遵守社区规范，多次违规会被限制发言"
               }</span>
             </div>
           </div>`
        : ""
    }

    ${
      logged
        ? `<div class="me-stats">
             <button class="me-stat" id="statPosts"><b>${mine.length}</b><span>我的帖子</span></button>
             <div class="me-stat"><b>${likes}</b><span>收到的赞</span></div>
             <button class="me-stat" id="statCmts"><b>${cmts}</b><span>我的评论</span></button>
           </div>
           <div class="me-list">
             ${menuItem(
               "rowNotif",
               IC.bell,
               "通知中心",
               state.notifUnread ? `<span class="me-count warn">${state.notifUnread > 99 ? "99+" : state.notifUnread}</span>` : ""
             )}
             ${menuItem("rowMyPosts", IC.post, "我的帖子", mine.length ? `<span class="me-count">${mine.length}</span>` : "")}
             ${menuItem("rowMyGuard", IC.paw, "我的守护", state.guardians.length ? `<span class="me-count">${state.guardians.length}</span>` : "")}
             ${menuItem("rowMySubs", IC.draft, "我的提交", pendingSubCount() ? `<span class="me-count warn">待审 ${pendingSubCount()}</span>` : state.mySubs.length ? `<span class="me-count">${state.mySubs.length}</span>` : "")}
             ${menuItem("rowSearch", IC.search, "搜索熊猫、动态、帖子")}
           </div>
           <div class="me-list">
             ${menuItem("rowAbout", IC.about, "关于熊猫动态圈")}
             ${menuItem("rowMerge", IC.merge, "账号合并")}
           </div>
           <div class="me-list">
             <button class="me-row danger" id="rowLogout">
               <span class="me-ico">${IC.logout}</span>
               <span class="me-label">退出登录</span>
               <span class="me-arrow">›</span>
             </button>
           </div>`
        : `<div class="me-guest-tip">
             <b>登录后可以做什么</b>
             <ul>
               <li>发布帖子，和熊猫迷一起聊滚滚</li>
               <li>守护喜欢的熊猫，收进「我的守护」</li>
               <li>补充熊猫档案，审核通过后展示</li>
             </ul>
           </div>
           <button class="me-explore" id="meExplore">
             <span class="me-explore-txt">
               <b>去图鉴逛逛</b>
               <em>八只国宝的档案、性格、爱好都在这里</em>
             </span>
             <span class="me-explore-go">查看档案 ›</span>
           </button>
           <div class="me-list">
             ${menuItem("rowSearch", IC.search, "搜索熊猫、动态、帖子")}
             ${menuItem("rowAbout", IC.about, "关于熊猫动态圈")}
           </div>`
    }`;

  bindMe(root);
}

function bindMe(root) {
  const on = (sel, fn) => {
    const el = $(sel, root);
    if (el) el.addEventListener("click", fn);
  };

  on("#meLoginBtn", () => openAuth({ onDone: renderMe }));
  on("#meExplore", () => switchTab("pandas"));
  on("#meEditBtn", () => openAuth({ editing: true, onDone: renderMe }));
  on("#meAvatarBtn", () => {
    if (!isLoggedIn()) return openAuth({ onDone: renderMe });
    openAuth({ editing: true, onDone: renderMe });
  });
  on("#statPosts", () => openMyPosts());
  on("#rowMyPosts", () => openMyPosts());
  on("#statCmts", () => openMyComments());
  on("#rowNotif", () => openNotifications());
  on("#rowMyGuard", () => openMyGuardians());
  on("#rowMySubs", () => openMySubmissions());
  on("#rowSearch", () => openGlobalSearch());
  on("#rowAbout", () => openAbout());
  on("#rowMerge", () => openAccountMerge());
  on("#rowLogout", async () => {
    const ok = await askConfirm("退出登录？", "退出后需要重新收验证码才能登录，已发布的帖子、守护记录都还在账号里。", "退出");
    if (!ok) return;
    await signOut();
  });
}

/* ---------- 登录 / 编辑资料页 ---------- */
/* ---------- 登录：邮箱 / 手机号验证码（账号由服务端 auth.uid() 唯一确定） ---------- */
function openAuth({ editing = false, onDone = null } = {}) {
  if (editing) {
    if (!isLoggedIn()) return openAuth({ onDone });
    return openProfileEdit({ onDone });
  }
  if (!auth) {
    toast("云服务未就绪，请刷新后重试", "err");
    return;
  }

  const body = `
    <div class="auth-wrap">
      <div class="auth-head">
        <div class="auth-logo">${myAvatarHTML()}</div>
        <h2>登录熊猫动态圈</h2>
        <p>用邮箱或手机号收一条验证码，登录后昵称、帖子、守护都跟着账号走</p>
      </div>

      <div class="auth-tabs">
        <button class="auth-tab on" data-kind="email" type="button">邮箱</button>
        <button class="auth-tab" data-kind="phone" type="button">手机号</button>
      </div>

      <input class="auth-input" id="authId" type="text" inputmode="email" autocomplete="email" placeholder="你的邮箱" />
      <div class="auth-code-row">
        <input class="auth-input" id="authCode" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="6 位验证码" />
        <button class="auth-code-btn" id="authSend" type="button">获取验证码</button>
      </div>
      <div class="auth-err" id="authErr"></div>

      <button class="auth-submit" id="authGo" type="button">登录 / 注册</button>
      <p class="auth-tip">一个邮箱或手机号只对应一个账号，换设备登录也是同一个人。未注册的会自动创建账号。</p>
    </div>`;

  const { page, close } = openPage({ title: "登录", body });

  const idEl = $("#authId", page);
  const codeEl = $("#authCode", page);
  const errEl = $("#authErr", page);
  const sendBtn = $("#authSend", page);
  const goBtn = $("#authGo", page);

  let kind = "email";
  let pending = null;
  let timer = null;
  let left = 0;

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const isPhone = (v) => /^1\d{10}$/.test(v);
  const fail = (m) => {
    errEl.textContent = m;
  };

  const startCount = () => {
    left = 60;
    sendBtn.disabled = true;
    sendBtn.textContent = left + "s";
    clearInterval(timer);
    timer = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(timer);
        sendBtn.disabled = false;
        sendBtn.textContent = "重新获取";
      } else {
        sendBtn.textContent = left + "s";
      }
    }, 1000);
  };

  $$(".auth-tab", page).forEach((b) =>
    b.addEventListener("click", () => {
      kind = b.dataset.kind;
      $$(".auth-tab", page).forEach((x) => x.classList.toggle("on", x === b));
      idEl.value = "";
      codeEl.value = "";
      pending = null;
      errEl.textContent = "";
      idEl.placeholder = kind === "email" ? "你的邮箱" : "11 位手机号";
      idEl.setAttribute("inputmode", kind === "email" ? "email" : "numeric");
      idEl.focus();
    })
  );

  const sendCode = async () => {
    const v = idEl.value.trim();
    if (kind === "email" && !isEmail(v)) return fail("请输入正确的邮箱地址");
    if (kind === "phone" && !isPhone(v)) return fail("请输入正确的 11 位手机号");
    errEl.textContent = "";
    sendBtn.disabled = true;
    sendBtn.textContent = "发送中…";
    try {
      const sent = kind === "email" ? await auth.sendOtp({ email: v }) : await auth.sendOtp({ phone: v });
      if (sent.error) throw new Error(sent.error.message || "验证码发送失败");
      pending = {
        kind,
        value: v,
        verificationId: sent.data.verificationId,
        isExistingUser: sent.data.isExistingUser,
      };
      toast("验证码已发送", "ok");
      codeEl.focus();
      startCount();
    } catch (e) {
      fail(e.message || "验证码发送失败，请稍后再试");
      sendBtn.disabled = false;
      sendBtn.textContent = "获取验证码";
    }
  };

  const doLogin = async () => {
    const v = idEl.value.trim();
    const code = codeEl.value.trim();
    if (!pending || pending.value !== v) return fail("请先获取验证码");
    if (!/^\d{4,8}$/.test(code)) return fail("请输入收到的验证码");
    errEl.textContent = "";
    goBtn.disabled = true;
    goBtn.textContent = "登录中…";
    try {
      const payload = {
        verificationId: pending.verificationId,
        isExistingUser: pending.isExistingUser,
        token: code,
      };
      const done = await auth.verifyOtp(
        pending.kind === "email" ? { email: v, ...payload } : { phone: v, ...payload }
      );
      if (done.error) throw new Error(done.error.message || "验证码不正确或已过期");
      await afterLogin();
      clearInterval(timer);
      close();
      toast("登录成功 🐼", "ok");
      if (typeof onDone === "function") setTimeout(onDone, 260);
    } catch (e) {
      fail(e.message || "登录失败，请重试");
      goBtn.disabled = false;
      goBtn.textContent = "登录 / 注册";
    }
  };

  sendBtn.addEventListener("click", sendCode);
  goBtn.addEventListener("click", doLogin);
  codeEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLogin();
  });
  setTimeout(() => idEl.focus(), 320);
}

/** 登录成功后的账号初始化（服务端以 auth.uid() 为准） */
async function afterLogin() {
  const prevKey = localStorage.getItem("pc_ukey") || "";
  const { data, error } = await db.rpc("f_signin_sync", {
    p_nickname: state.nickname || null,
    p_avatar: state.avatar || null,
    p_avatar_seed: state.seed || "0",
  });
  if (error) throw error;
  if (!data || data.ok === false) {
    throw new Error(data && data.error === "login_required" ? "登录状态未生效，请重试" : "账号初始化失败");
  }
  state.account = data;
  state.authed = true;
  state.userKey = data.user_key;
  state.nickname = data.nickname || state.nickname;
  if (state.nickname) localStorage.setItem("pc_nick", state.nickname);
  state.seed = data.avatar_seed != null ? String(data.avatar_seed) : state.seed;
  state.banned = !!data.banned;
  state.banReason = data.ban_reason || "";
  state.violations = data.violations || 0;
  if (data.created_at) {
    const d = new Date(data.created_at);
    state.joinedAt = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    localStorage.setItem("pc_joined", state.joinedAt);
  }
  if (prevKey && prevKey !== data.user_key && prevKey.startsWith("u_")) {
    localStorage.setItem("pc_legacy_key", prevKey);
  }
  localStorage.setItem("pc_ukey", data.user_key);
  await claimLegacyContent();
  await syncMyLikes();
  await loadMyGuardians();
  await loadMySubmissions();
  /* 登录态变了，所有依赖身份的视图都要重绘一次，否则页面还停留在"未登录"的样子 */
  refreshUserViews();
}

/** 从服务端同步「我赞过」的记录：换设备、清缓存后点赞状态仍然准确 */
async function syncMyLikes() {
  if (!isLoggedIn()) return;
  try {
    const { data } = await db.rpc("f_my_likes");
    if (data && data.ok) {
      likedPosts.clear();
      (data.posts || []).forEach((id) => likedPosts.add(Number(id)));
      likedCmts.clear();
      (data.comments || []).forEach((id) => likedCmts.add(Number(id)));
      persistLikes();
    }
  } catch (e) {
    /* 同步失败时沿用本机记录 */
  }
}

/** 通知：未读数 + 列表 */
async function refreshNotifCount() {
  if (!isLoggedIn()) return;
  try {
    const { data } = await db.rpc("f_notifications");
    if (data) {
      state.notifUnread = Number(data.unread || 0);
      state.notifList = data.list || [];
      const badge = $("#notifBadge");
      if (badge) {
        badge.hidden = !state.notifUnread;
        badge.textContent = state.notifUnread > 99 ? "99+" : state.notifUnread;
      }
    }
  } catch (e) {
    /* 静默 */
  }
}

function openNotifications() {
  if (!isLoggedIn()) return openAuth({ onDone: openNotifications });
  const body = `<div class="nt-wrap" id="ntWrap"><div class="gd-loading">正在加载通知…</div></div>`;
  const { page } = openPage({ title: "通知", body });
  const paint = () => {
    const wrap = $("#ntWrap", page);
    const list = state.notifList || [];
    if (!list.length) {
      wrap.innerHTML = `<div class="mp-empty">
        <div class="mp-empty-ico">🔔</div>
        <b>还没有通知</b>
        <p>有人回复你、评论你的帖子时会出现在这里</p>
      </div>`;
      return;
    }
    wrap.innerHTML =
      `<div class="gd-top">未读 <b>${state.notifUnread || 0}</b> 条 · 点条目去原帖看看</div>` +
      `<button class="nt-readall" id="ntReadAll">全部标为已读</button>` +
      list
        .map(
          (n) => `<button class="nt-item ${n.is_read ? "" : "unread"}" data-nid="${n.id}" data-npost="${n.post_id || ""}">
            <span class="nt-ico">${n.kind === "reply" ? "💬" : "🐼"}</span>
            <span class="nt-main"><b>${esc(n.title)}</b><em>${esc(n.body || "")}</em><i>${timeAgo(n.created_at)}</i></span>
            ${n.is_read ? "" : `<span class="nt-dot"></span>`}
          </button>`
        )
        .join("");
    $("#ntReadAll", wrap)?.addEventListener("click", async () => {
      await db.rpc("f_notif_read", { p_id: null });
      await refreshNotifCount();
      state.notifList = (state.notifList || []).map((n) => ({ ...n, is_read: true }));
      paint();
      renderMe();
    });
    $$(".nt-item", wrap).forEach((el) =>
      el.addEventListener("click", async () => {
        const nid = Number(el.dataset.nid);
        const pid = Number(el.dataset.npost);
        try { await db.rpc("f_notif_read", { p_id: nid }); } catch (e) { /* 忽略 */ }
        await refreshNotifCount();
        page.querySelector("[data-back]")?.click();
        if (pid) openPost(pid);
        renderMe();
      })
    );
  };
  refreshNotifCount().then(paint);
}

/** 账号合并：把另一个登录渠道的账号内容并到当前账号 */
function openAccountMerge() {
  if (!isLoggedIn()) return openAuth({ onDone: openAccountMerge });
  const body = `
    <div class="mg-wrap">
      <div class="mg-card">
        <b>第一步 · 在旧账号上生成合并码</b>
        <p>先用邮箱/手机号的另一个账号登录（会顶掉当前登录），在「我的 → 账号合并」里生成 6 位码。</p>
        <button class="mg-btn" id="mgCreate">生成合并码</button>
        <div class="mg-code" id="mgCode" hidden></div>
      </div>
      <div class="mg-card">
        <b>第二步 · 在当前账号输入码</b>
        <p>把旧账号的帖子、评论、守护、点赞全部并入当前账号，旧账号资料随后删除，<b>不可撤销</b>。</p>
        <input class="mg-input" id="mgToken" maxlength="6" placeholder="6 位合并码" autocomplete="off" />
        <button class="mg-btn primary" id="mgGo">合并到当前账号</button>
        <div class="mg-err" id="mgErr"></div>
      </div>
    </div>`;
  const { page } = openPage({ title: "账号合并", body });
  $("#mgCreate", page).addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const { data, error } = await db.rpc("f_merge_token_create");
      if (error) throw error;
      if (data && data.ok === false) throw new Error(data.error === "login_required" ? "请先登录" : "生成失败，请重试");
      const codeEl = $("#mgCode", page);
      codeEl.hidden = false;
      codeEl.innerHTML = `合并码 <b>${esc(data.code)}</b><span>10 分钟内有效，去另一个账号输入它</span>`;
      toast("合并码已生成 ✅", "ok");
    } catch (err) {
      toast(err.message || "生成失败", "err");
    } finally {
      btn.disabled = false;
    }
  });
  $("#mgGo", page).addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    const code = $("#mgToken", page).value.trim().toUpperCase();
    const err = $("#mgErr", page);
    err.textContent = "";
    if (!/^[A-Z0-9]{6}$/.test(code)) return (err.textContent = "请输入 6 位合并码");
    const okGo = await askConfirm("确认合并？", "另一个账号的帖子、评论、守护、点赞会全部并入当前账号，旧账号资料将被删除，操作不可撤销。", "确认合并");
    if (!okGo) return;
    btn.disabled = true;
    btn.textContent = "合并中…";
    try {
      const { data, error } = await db.rpc("f_merge_account", { p_token: code });
      if (error) throw error;
      if (data && data.ok === false) {
        const map = {
          bad_token: "合并码不存在，检查后再试",
          used: "这个码已经用过了",
          expired: "合并码已过期，请重新生成",
          same_account: "不能和自己合并",
        };
        throw new Error(map[data.error] || "合并失败，请重试");
      }
      toast(`合并完成：帖子 ${data.posts} · 评论 ${data.comments} · 守护 ${data.guardians}`, "ok");
      page.querySelector("[data-back]")?.click();
      await afterLogin();
    } catch (err2) {
      err.textContent = err2.message || "合并失败";
      btn.disabled = false;
      btn.textContent = "合并到当前账号";
    }
  });
}

/** 举报：帖子 / 评论 */
const REPORT_REASONS = ["垃圾广告或营销", "辱骂攻击他人", "色情低俗内容", "虚假不实信息", "其他违规内容"];
function openReport(type, id) {
  if (!isLoggedIn()) return openAuth({ onDone: () => openReport(type, id) });
  const body = `
    <div class="rp-wrap">
      <p class="rp-tip">举报 ${type === "post" ? "这条帖子" : "这条评论"}，管理员会尽快处理：</p>
      ${REPORT_REASONS.map((r, i) => `<label class="rp-opt"><input type="radio" name="rpReason" value="${r}" ${i === 0 ? "checked" : ""}/><span>${r}</span></label>`).join("")}
      <button class="rp-go" id="rpGo">提交举报</button>
      <div class="rp-err" id="rpErr"></div>
    </div>`;
  const { page } = openPage({ title: "举报", body });
  $("#rpGo", page).addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    const reason = page.querySelector('input[name="rpReason"]:checked')?.value || REPORT_REASONS[0];
    btn.disabled = true;
    try {
      const { data, error } = await db.rpc("f_report", { p_target_type: type, p_target_id: id, p_reason: reason });
      if (error) throw error;
      if (data && data.ok === false) {
        const map = {
          login_required: "请先登录",
          duplicated: "你已经举报过这条内容了",
          already: "管理员正在处理你的举报",
          too_many: "今天举报次数已达上限，明天再来",
          self_report: "不能举报自己的内容",
          empty_reason: "请选择举报原因",
          bad_target: "内容不存在或已被删除",
          not_found: "内容不存在或已被删除",
        };
        throw new Error(map[data.error] || "举报失败，请稍后再试");
      }
      page.querySelector("[data-back]")?.click();
      toast("已提交举报，感谢你的守护 🛡", "ok");
    } catch (err) {
      $("#rpErr", page).textContent = err.message || "举报失败";
      btn.disabled = false;
    }
  });
}

/** 身份变化后统一刷新受影响的前台视图 */
function refreshUserViews() {
  try {
    renderMe();
    renderCommunity();
    renderPandas();
    renderHome();
  } catch (e) {
    /* 视图重绘失败不应影响登录本身 */
  }
}

/** 把本机旧匿名身份的内容并入当前账号（旧 key 只存在本机，属于合理凭证） */
async function claimLegacyContent() {
  const old = localStorage.getItem("pc_legacy_key");
  if (!old || old === state.userKey || !old.startsWith("u_")) return;
  try {
    const { data } = await db.rpc("f_link_legacy", { p_old_key: old });
    if (data && data.ok && data.moved > 0) {
      toast(`已把本机 ${data.moved} 条历史内容并入当前账号`, "ok");
      await refreshPosts();
      await refreshComments();
    }
    if (data && data.ok) localStorage.removeItem("pc_legacy_key");
  } catch (e) {
    /* 迁移失败不阻塞登录 */
  }
}

/** 登录后的资料编辑（昵称 / 头像） */
function openProfileEdit({ onDone = null } = {}) {
  const body = `
    <div class="auth-wrap">
      <div class="auth-head">
        <div class="auth-logo" id="authAv">${myAvatarHTML()}</div>
        <h2>编辑资料</h2>
        <p>昵称可以重名，但账号只属于你；换设备登录还是同一个身份</p>
      </div>

      <button class="auth-av-btn" id="authPick" type="button">更换头像</button>

      <label class="auth-label">昵称</label>
      <input class="auth-input" id="authNick" maxlength="16" placeholder="给自己起个名字（2-16 字）" value="${esc(state.nickname || "")}" />
      <div class="auth-err" id="authErr"></div>

      <button class="auth-submit" id="authGo" type="button">保存</button>
      <p class="auth-tip">已绑定：${esc(maskAccount(state.account))}</p>
    </div>`;

  const { page, close } = openPage({ title: "编辑资料", body });
  const nickEl = $("#authNick", page);
  const avEl = $("#authAv", page);

  $("#authPick", page).addEventListener("click", () =>
    pickAvatarImage(async (dataUrl) => {
      setMyAvatar(dataUrl);
      avEl.innerHTML = myAvatarHTML();
      /* 头像立即落库：不点「保存」也不会丢，换设备同样生效 */
      try {
        await afterLogin();
        renderMe();
        toast("头像已更新", "ok");
      } catch (e) {
        toast("头像已存在本机，联网后会同步", "err");
      }
    })
  );

  const submit = async () => {
    const v = nickEl.value.trim();
    const err = $("#authErr", page);
    if (v.length < 2) return (err.textContent = "昵称至少 2 个字");
    if (v.length > 16) return (err.textContent = "昵称最多 16 个字");
    const btn = $("#authGo", page);
    btn.disabled = true;
    btn.textContent = "保存中…";
    try {
      state.nickname = v;
      localStorage.setItem("pc_nick", v);
      await afterLogin();
      renderMe();
      close();
      toast("资料已保存", "ok");
      if (typeof onDone === "function") setTimeout(onDone, 260);
    } catch (e) {
      err.textContent = e.message || "保存失败，请重试";
      btn.disabled = false;
      btn.textContent = "保存";
    }
  };

  $("#authGo", page).addEventListener("click", submit);
  nickEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
  setTimeout(() => nickEl.focus(), 320);
}

/** 账号脱敏展示：邮箱只留前两位，手机号留后四位 */
function maskAccount(acc) {
  if (!acc) return "";
  const mail = acc.email || "";
  if (mail) {
    const [name, domain] = mail.split("@");
    const head = name.slice(0, 2);
    return `${head}${"*".repeat(Math.max(1, name.length - 2))}@${domain || ""}`;
  }
  return "已登录账号";
}

/** 退出登录 */
async function signOut() {
  try {
    if (auth && auth.signOut) await auth.signOut();
  } catch (e) {
    /* 忽略 */
  }
  state.account = null;
  state.authed = false;
  state.banned = false;
  state.banReason = "";
  state.violations = 0;
  state.nickname = "";
  state.avatar = "";
  state.userKey = "";
  state.joinedAt = "";
  state.guardians = [];
  state.guardIds = new Set();
  state.mySubs = [];
  ["pc_nick", "pc_avatar", "pc_ukey", "pc_joined", "pc_legacy_key"].forEach((k) => localStorage.removeItem(k));
  renderMe();
  renderCommunity();
  renderPandas();
  renderPandaChips();
  toast("已退出登录");
}

/* ---------- 我的帖子（可删除） ---------- */
function openMyPosts() {
  if (!isLoggedIn()) return openAuth({ onDone: openMyPosts });

  const body = `<div class="mypost-wrap" id="myPostWrap"></div>`;
  const { page } = openPage({ title: "我的帖子", body });
  const wrap = $("#myPostWrap", page);

  const paint = () => {
    const mine = state.posts
      .filter((p) => isMyPost(p) && !p.hidden)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (!mine.length) {
      wrap.innerHTML = `<div class="mp-empty">
        <div class="mp-empty-ico">🐼</div>
        <b>还没有发过帖子</b>
        <p>去熊猫圈点右下角的 + 号，发第一帖吧</p>
      </div>`;
      return;
    }

    wrap.innerHTML =
      `<div class="mp-count">共 ${mine.length} 条 · 可编辑或删除</div>` +
      mine
        .map(
          (p) => `<article class="mp-card" data-pid="${p.id}">
            <div class="mp-top">
              <span class="mp-time">${timeAgo(p.created_at)}</span>
              <span class="mp-acts"><button class="mp-edit" data-edit="${p.id}">编辑</button><button class="mp-del" data-del="${p.id}">删除</button></span>
            </div>
            <div class="mp-text">${esc(p.content)}</div>
            ${postImages(p).length ? `<div class="mp-imgs">${postImages(p).map((u) => `<img src="${esc(u)}" alt="" />`).join("")}</div>` : ""}
            <div class="mp-meta">
              <span>❤️ ${p.likes || 0}</span>
              <span>💬 ${commentCount(p.id)}</span>
              <button class="mp-open" data-open="${p.id}">查看详情 ›</button>
            </div>
          </article>`
        )
        .join("");

    $$(".mp-edit", wrap).forEach((b) =>
      b.addEventListener("click", () => {
        const p = state.posts.find((x) => x.id === Number(b.dataset.edit));
        if (p) openEditPost(p, paint);
      })
    );

    $$(".mp-del", wrap).forEach((b) =>
      b.addEventListener("click", async () => {
        const pid = Number(b.dataset.del);
        const ok = await askConfirm("删除这条帖子？", "删除后无法恢复，帖子下的评论也会一起消失。", "删除");
        if (!ok) return;
        b.disabled = true;
        try {
          const { data, error } = await db.rpc("f_delete_own_post", {
            p_id: pid,
            p_key: state.userKey,
            p_nickname: state.nickname,
          });
          if (error) throw error;
          if (data !== true) throw new Error("只能删除自己发布的帖子");
          state.posts = state.posts.filter((p) => p.id !== pid);
          state.comments = state.comments.filter((c) => c.post_id !== pid);
          toast("帖子已删除", "ok");
          paint();
          renderCommunity();
          renderMe();
        } catch (e) {
          toast("删除失败：" + (e.message || "网络异常"), "err");
          b.disabled = false;
        }
      })
    );

    $$(".mp-open", wrap).forEach((b) =>
      b.addEventListener("click", () => openPost(Number(b.dataset.open)))
    );
  };

  paint();
}

/* ---------- 编辑自己的帖子 ---------- */
function openEditPost(p, onSaved) {
  const imgs = postImages(p).slice();
  const body = `
    <div class="compose-page">
      <textarea id="epText" maxlength="500" placeholder="分享你和滚滚的故事…">${esc(p.content)}</textarea>
      <div class="compose-counter"><span id="epCount">${p.content.length}</span>/500</div>
      <div class="cp-gal" id="epGal"></div>
      <div class="cp-imgs-tip">可替换或删除配图，最多 4 张</div>
    </div>`;
  const { page, close } = openPage({
    title: "编辑帖子",
    body,
    onMount: (pg) => {
      const head = pg.querySelector(".page-head");
      const btn = document.createElement("button");
      btn.className = "publish-btn";
      btn.textContent = "保存";
      btn.style.marginRight = "6px";
      head.appendChild(btn);

      const ta = $("#epText", pg);
      ta.addEventListener("input", () => ($("#epCount", pg).textContent = ta.value.length));

      const gal = $("#epGal", pg);
      const paintGal = () => {
        gal.innerHTML =
          imgs
            .map(
              (u, i) => `<span class="cp-thumb"><img src="${u}" alt="" />
                <button type="button" class="cp-x" data-ix="${i}" aria-label="移除">×</button></span>`
            )
            .join("") +
          (imgs.length < 4
            ? `<button type="button" class="cp-add" id="epAddImg">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                 <span>${imgs.length ? "再加一张" : "添加图片"}</span>
               </button>`
            : "");
        $("#epAddImg", gal)?.addEventListener("click", () => {
          pickPostImage((url) => {
            imgs.push(url);
            paintGal();
          });
        });
        $$("[data-ix]", gal).forEach((b) =>
          b.addEventListener("click", () => {
            imgs.splice(Number(b.dataset.ix), 1);
            paintGal();
          })
        );
      };
      paintGal();

      btn.addEventListener("click", async () => {
        const content = ta.value.trim();
        if (!content) return toast("内容不能为空", "err");
        btn.disabled = true;
        btn.textContent = "保存中…";
        try {
          const { data, error } = await db.rpc("f_update_own_post", {
            p_id: p.id,
            p_content: content,
            p_images: imgs,
          });
          if (error) throw error;
          if (data && data.ok === false) {
            if (data.error === "login_required") { state.authed = false; state.account = null; openAuth(); throw new Error("登录已过期，请重新登录"); }
            if (data.error === "not_owner") throw new Error("只能编辑自己发布的帖子");
            if (data.error === "too_many_images") throw new Error("最多 4 张图片");
            if (data.error === "bad_image") throw new Error("图片格式不支持，请重新选择");
            if (data.error === "empty") throw new Error("内容不能为空");
            throw new Error("保存失败，请稍后再试");
          }
          p.content = content;
          p.images = imgs;
          toast("帖子已更新 ✅", "ok");
          close();
          renderCommunity();
          renderMe();
          if (typeof onSaved === "function") onSaved();
        } catch (err) {
          toast(err.message || "保存失败", "err");
          btn.disabled = false;
          btn.textContent = "保存";
        }
      });
    },
  });
  setTimeout(() => page.querySelector("#epText")?.focus(), 340);
}

/* ---------- 我的评论（可删除） ---------- */
function openMyComments() {
  if (!isLoggedIn()) return openAuth({ onDone: openMyComments });

  const body = `<div class="mypost-wrap" id="myCmtWrap"><div class="mp-empty"><div class="mp-empty-ico">💬</div><b>正在加载…</b></div></div>`;
  const { page } = openPage({ title: "我的评论", body });
  const wrap = $("#myCmtWrap", page);

  const paint = (list) => {
    if (!list.length) {
      wrap.innerHTML = `<div class="mp-empty">
        <div class="mp-empty-ico">💬</div>
        <b>还没有发过评论</b>
        <p>去帖子下方说点什么吧</p>
      </div>`;
      return;
    }
    wrap.innerHTML =
      `<div class="mp-count">共 ${list.length} 条 · 评论删除后其回复一并删除</div>` +
      list
        .map(
          (c) => `<article class="mp-card" data-cid="${c.id}">
            <div class="mp-top">
              <span class="mp-time">${timeAgo(c.created_at)}${c.post_hidden ? " · 原帖已被隐藏" : ""}</span>
              <button class="mp-del" data-cdel="${c.id}">删除</button>
            </div>
            <div class="mp-text">${esc(c.content)}</div>
            <div class="mp-meta">
              <span>${c.parent_id ? "↩ 回复" : "帖"}：${esc(c.post_brief || "原帖已删除")}</span>
              <span>❤️ ${c.likes || 0}</span>
              ${c.post_id && !c.post_hidden ? `<button class="mp-open" data-copen="${c.post_id}">查看原帖 ›</button>` : ""}
            </div>
          </article>`
        )
        .join("");
    $$(".mp-del", wrap).forEach((b) =>
      b.addEventListener("click", async () => {
        const cid = Number(b.dataset.cdel);
        const ok = await askConfirm("删除这条评论？", "评论下的回复会一起删除，删除后无法恢复。", "删除");
        if (!ok) return;
        b.disabled = true;
        try {
          const r = await db.rpc("f_delete_own_comment", { p_id: cid });
          if (r.error) throw r.error;
          if (r.data !== true) throw new Error("只能删除自己发布的评论");
          state.comments = state.comments.filter((c) => c.id !== cid && c.parent_id !== cid);
          toast("评论已删除", "ok");
          list.splice(list.findIndex((x) => x.id === cid), 1);
          paint(list);
          renderCommunity();
          renderMe();
        } catch (e) {
          toast("删除失败：" + (e.message || "网络异常"), "err");
          b.disabled = false;
        }
      })
    );
    $$(".mp-open", wrap).forEach((b) => b.addEventListener("click", () => openPost(Number(b.dataset.copen))));
  };

  (async () => {
    try {
      const { data, error } = await db.rpc("f_my_comments");
      if (error) throw error;
      paint(Array.isArray(data) ? data : []);
    } catch (e) {
      wrap.innerHTML = `<div class="mp-empty"><div class="mp-empty-ico">⚠️</div><b>加载失败</b><p>${esc(e.message || "请稍后再试")}</p></div>`;
    }
  })();
}

/* ---------- 我的守护 ---------- */
function openMyGuardians() {
  if (!isLoggedIn()) return openAuth({ onDone: openMyGuardians });

  const body = `<div class="gd-wrap" id="gdWrap">
    <div class="gd-loading">正在加载守护列表…</div>
  </div>`;
  const { page } = openPage({ title: "我的守护", body });
  const wrap = $("#gdWrap", page);

  const paint = () => {
    const list = state.guardians || [];
    if (!list.length) {
      wrap.innerHTML = `<div class="mp-empty">
        <div class="mp-empty-ico">🛡</div>
        <b>还没有守护任何熊猫</b>
        <p>去图鉴点开一只熊猫，点「守护 TA」就能把它收进这里</p>
        <button class="gd-go" id="gdGo">去图鉴看看 ›</button>
      </div>`;
      const go = $("#gdGo", wrap);
      if (go)
        go.addEventListener("click", () => {
          page.querySelector("[data-back]").click();
          switchTab("pandas");
        });
      return;
    }
    wrap.innerHTML =
      `<div class="gd-top">已守护 <b>${list.length}</b> 只滚滚 · 你的守护会显示在档案页</div>` +
      list
        .map(
          (g) => `<button class="gd-card" data-pid="${g.panda_id}">
            <span class="gd-photo" style="background-image:url('${esc(imgSrcOf(g.photo, "p", pandaKey(g)))}')"></span>
            <span class="gd-main">
              <b class="gd-name">${esc(g.name)}<i class="gd-sex">${g.gender === "女" ? "♀" : "♂"}</i></b>
              <em class="gd-base">${esc(shortBase(g.base))}</em>
              <span class="gd-meta">
                <span class="gd-chip">🛡 ${g.guardian_count || 1} 人守护</span>
                ${g.source === "founder" ? `<span class="gd-chip gold">建档守护人</span>` : ""}
                <span class="gd-chip ghost">${timeAgo(g.guarded_at)}守护</span>
              </span>
            </span>
            <span class="gd-arrow">›</span>
          </button>`
        )
        .join("") +
      `<div class="gd-foot">
        <button class="gd-go" id="gdGo">再挑一只守护 ›</button>
      </div>`;

    $$(".gd-card", wrap).forEach((b) =>
      b.addEventListener("click", () => openPanda(Number(b.dataset.pid)))
    );
    const go = $("#gdGo", wrap);
    if (go)
      go.addEventListener("click", () => {
        page.querySelector("[data-back]").click();
        switchTab("pandas");
      });
  };

  paint();
  loadMyGuardians().then(() => {
    paint();
    renderMe();
  });
}

/* ---------- 我的提交（审核状态） ---------- */
const SUB_STATUS = {
  pending: { label: "审核中", cls: "wait", tip: "已提交，等待管理员审核" },
  approved: { label: "已通过", cls: "ok", tip: "已更新到图鉴" },
  rejected: { label: "未通过", cls: "no", tip: "可以修改后重新提交" },
};

function openMySubmissions() {
  if (!isLoggedIn()) return openAuth({ onDone: openMySubmissions });

  const body = `<div class="gd-wrap" id="msWrap">
    <div class="gd-loading">正在加载提交记录…</div>
  </div>`;
  const { page } = openPage({ title: "我的提交", body });
  const wrap = $("#msWrap", page);

  const paint = () => {
    const list = (state.mySubs || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (!list.length) {
      wrap.innerHTML = `<div class="mp-empty">
        <div class="mp-empty-ico">📝</div>
        <b>还没有提交过内容</b>
        <p>在图鉴里可以添加新熊猫，或给已有熊猫补充、更正资料</p>
        <button class="gd-go" id="msGo">去图鉴看看 ›</button>
      </div>`;
      const go = $("#msGo", wrap);
      if (go)
        go.addEventListener("click", () => {
          page.querySelector("[data-back]").click();
          switchTab("pandas");
        });
      return;
    }
    const pending = list.filter((s) => s.status === "pending").length;
    wrap.innerHTML =
      `<div class="gd-top">共 <b>${list.length}</b> 条提交${pending ? ` · <span class="gd-warn">${pending} 条审核中</span>` : ""}</div>` +
      list
        .map((s) => {
          const st = SUB_STATUS[s.status] || SUB_STATUS.pending;
          const isNew = s.kind === "new";
          const name = s.panda_name || (s.payload && s.payload.name) || "（未命名）";
          const keys = Object.keys(s.payload || {});
          const photo = (s.payload && s.payload.photo) || s.target_photo || "";
          const chips = keys
            .slice(0, 6)
            .map((k) => `<span class="ms-chip">${esc(PANDA_LABEL[k] || k)}</span>`);
          return `<div class="ms-card">
            <div class="ms-head">
              <span class="ms-kind ${isNew ? "new" : ""}">${isNew ? "新增熊猫" : "修改档案"}</span>
              <span class="ms-name">${esc(name)}</span>
              <span class="ms-pill ${st.cls}">${st.label}</span>
            </div>
            ${
              photo
                ? `<div class="ms-photo-row">
                    <span class="ms-photo" style="background-image:url('${esc(imgSrcOf(photo, "p", "hua"))}')"></span>
                    <span class="ms-fields">${chips.join("")}</span>
                  </div>`
                : `<div class="ms-fields">${chips.join("")}</div>`
            }
            <div class="ms-foot">
              <span class="ms-time">${fullTime(s.created_at)}</span>
              <span class="ms-state">${s.note ? esc(s.note) : st.tip}</span>
            </div>
          </div>`;
        })
        .join("") +
      `<p class="fineprint">审核一般会在 1-2 天内完成，通过后自动生效</p>`;

    const go = $("#msGo", wrap);
    if (go)
      go.addEventListener("click", () => {
        page.querySelector("[data-back]").click();
        switchTab("pandas");
      });
  };

  paint();
  loadMySubmissions().then(() => {
    paint();
    renderMe();
  });
}

/* ---------- 关于 ---------- */
function openAbout() {
  let taps = 0;
  let tapTimer;
  const { page } = openPage({
    title: "关于",
    body: `
      <div class="login-card" style="text-align:left">
        <div id="aboutLogo" style="width:64px;height:64px;border-radius:20px;overflow:hidden;margin:0 auto 12px">
          ${imgTag("assets/hua.webp")}
        </div>
        <h3 style="text-align:center;margin-top:0">熊猫动态圈</h3>
        <p style="text-align:center">每天和滚滚见面</p>
        <div style="font-size:13px;line-height:1.9;color:#5a6478">
          这里汇集熊猫的每日动态、粉丝的真实分享，以及每一只国宝的完整档案。<br/><br/>
          · 帖子与评论实时保存在云端<br/>
          · 昵称与头像只存在本机，随时可改可清<br/>
          · 熊猫图鉴中的照片按个体一一对应（来源：人民网、央视网、百度百科等公开报道与资料）<br/>
          <span style="color:#98a2b3;font-size:11.5px">图片版权归原作者与拍摄机构所有，本站仅作展示，不作商业使用</span><br/><br/>
          <span style="color:#98a2b3">理智追星，文明观熊，让每一只滚滚都被温柔以待。</span>
        </div>
      </div>`,
  });
  // 隐藏入口：连点 logo 5 次进入管理后台（「我的」页不再展示管理员入口）
  const logo = $("#aboutLogo", page);
  if (logo)
    logo.addEventListener("click", () => {
      taps++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => (taps = 0), 1200);
      if (taps >= 5) {
        taps = 0;
        /* 新后台由 admin.js 以 #admin 覆盖层接管 */
        location.hash = "#admin";
      }
    });
}

/* ==========================================================
   刷新辅助
   ========================================================== */
async function refreshNews() {
  const { data, error } = await db.from("news").select("*").order("published_at", { ascending: false }).limit(50);
  if (!error) state.news = data || [];
}
async function refreshPosts() {
  const { data, error } = await db.from("posts").select("*").order("created_at", { ascending: false }).limit(120);
  if (!error) state.posts = data || [];
}
async function refreshComments() {
  const { data, error } = await db.from("comments").select("*").order("created_at", { ascending: true }).limit(600);
  if (!error) state.comments = data || [];
}

/* ==========================================================
   搜索
   ========================================================== */
function openGlobalSearch() {
  const body = `
    <div class="search-box" style="margin:0 0 14px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      <input id="gSearch" placeholder="搜熊猫、动态或帖子内容" />
    </div>
    <div id="gResult"></div>`;
  const { page } = openPage({
    title: "搜索",
    body,
    onMount: (pg) => {
      const input = $("#gSearch", pg);
      const result = $("#gResult", pg);
      let seq = 0;
      let timer = null;
      const paint = (q, r) => {
        const pd = r.pandas || [];
        const nw = r.news || [];
        const po = r.posts || [];
        result.innerHTML = `
          ${pd.length ? `<div class="pd-cmt-head">熊猫（${pd.length}）</div><div class="panda-grid" style="padding:0;margin-bottom:16px">${pd
            .map(
              (p) => `<div class="panda-card" data-sp="${p.id}">
                <div class="pd-img">${imgTag(pandaAvatarImg(p))}</div>
                <div class="pd-body"><div class="pd-name">${esc(p.name)}</div><div class="pd-base">${esc(shortBase(p.base))}</div></div>
              </div>`
            )
            .join("")}</div>` : ""}
          ${nw.length ? `<div class="pd-cmt-head">动态（${nw.length}）</div><div class="feed" style="padding:0;margin-bottom:16px">${nw
            .map(
              (n) => `<article class="news-item" data-sn="${n.id}"><div class="ni-thumb">${imgTag(thumbOf(n))}</div><div class="ni-body"><span class="ni-tag">${esc(n.tag || "动态")}</span><div class="ni-title">${esc(n.title)}</div></div></article>`
            )
            .join("")}</div>` : ""}
          ${po.length ? `<div class="pd-cmt-head">帖子（${po.length}）</div><div class="post-feed" style="padding:0">${po.map((p) => postCardHTML(p, { clamp: true })).join("")}</div>` : ""}
          ${!pd.length && !nw.length && !po.length ? `<div class="cmt-empty">没有找到「${esc(q)}」相关内容</div>` : ""}`;
        $$("#gResult [data-sp]", result).forEach((el) => el.addEventListener("click", () => openPanda(Number(el.dataset.sp))));
        $$("#gResult [data-sn]", result).forEach((el) => el.addEventListener("click", () => openNews(Number(el.dataset.sn))));
        bindPostCards(result);
      };
      const run = async () => {
        const q = input.value.trim();
        if (!q) {
          result.innerHTML = `<div class="cmt-empty">输入关键词开始搜索 🔍</div>`;
          return;
        }
        const my = ++seq;
        result.innerHTML = `<div class="cmt-empty">搜索中…</div>`;
        try {
          const { data, error } = await db.rpc("f_search", { p_q: q });
          if (error) throw error;
          if (my !== seq) return; /* 已有更新的搜索，丢弃本次结果 */
          const r = data || {};
          /* 服务端可能搜出本地未加载的老帖，先并入 state 才能打开详情 */
          (r.posts || []).forEach((p) => {
            if (!state.posts.some((x) => x.id === p.id)) state.posts.push(p);
          });
          paint(q, r);
        } catch (e) {
          if (my === seq) result.innerHTML = `<div class="cmt-empty">搜索失败，请稍后再试</div>`;
        }
      };
      input.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(run, 320);
      });
      setTimeout(() => input.focus(), 320);
    },
  });
  return page;
}
$("#btnSearch")?.addEventListener("click", openGlobalSearch);
$("#rowSearch")?.addEventListener("click", openGlobalSearch);

/* ==========================================================
   启动
   ========================================================== */
function paintStatic() {
  const brand = $("#brandMark");
  if (brand) brand.innerHTML = imgTag("assets/hua.webp");
  $("#bannerTrack").innerHTML = `<div class="skel skel-banner" style="margin:0;flex:1"></div>`;
  $("#newsFeed").innerHTML = `<div class="skel skel-card"></div><div class="skel skel-card"></div><div class="skel skel-card"></div>`;
  $("#quickPandas").innerHTML = AVATAR_KEYS.slice(0, 6)
    .map(
      (k) => `<div class="rp"><div class="rp-img">${imgTag(`assets/${k}.webp`)}</div><span class="rp-name" style="color:#c3cad8">···</span></div>`
    )
    .join("");
  const heroSkel = $("#heroCard");
  if (heroSkel) heroSkel.innerHTML = `
    <div class="hero-eyebrow"><i></i>正在加载今日动态…</div>
    <h1 class="hero-title">每天，看滚滚。<span class="grad">动态，全在这里。</span></h1>
    <p class="hero-desc">每日最新消息、粉丝真实分享、每只国宝的完整档案。</p>
    <div class="hero-stats">
      <div class="hs-item"><span class="hs-ico">动</span><div><b>—</b><span>今日动态</span></div></div>
      <div class="hs-item"><span class="hs-ico v">熊</span><div><b>—</b><span>在册熊猫</span></div></div>
      <div class="hs-item"><span class="hs-ico p">帖</span><div><b>—</b><span>圈内帖子</span></div></div>
      <div class="hs-item"><span class="hs-ico g">赞</span><div><b>—</b><span>累计点赞</span></div></div>
    </div>`;
  $("#pandaGrid").innerHTML = `<div class="skel" style="height:170px"></div><div class="skel" style="height:170px"></div>`;
}

/* 供管理后台复用的前端工具与数据实例 */
Object.assign(window, {
  db,
  state,
  esc,
  fixText,
  imgTag,
  avatarImg,
  avatarOf,
  avatarKeyOf,
  artKeyOf,
  pandaKey,
  PANDA_NAME,
  AVATAR_KEYS,
  coverOf,
  thumbOf,
  askConfirm,
  visibleNews,
  visiblePosts,
  syncUserState,
});

/** 恢复已登录会话（SDK 会持久化 access token 与 refresh handle） */
async function restoreSession() {
  if (!auth) return;
  try {
    const { data } = await auth.getSession();
    const session = data && data.session ? data.session : data;
    if (session && (session.user || session.access_token)) {
      await afterLogin();
    } else {
      state.authed = false;
      state.account = null;
    }
  } catch (e) {
    state.authed = false;
    state.account = null;
  }
  if (auth.onAuthStateChange) {
    try {
      auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT" && state.authed) {
          state.authed = false;
          state.account = null;
          renderMe();
        }
      });
    } catch (e) {
      /* 忽略 */
    }
  }
}

async function boot() {
  paintStatic();
  switchTab("home");
  if (!db) {
    $("#newsFeed").innerHTML = `<div class="cmt-empty">云服务未加载成功，请检查网络后刷新重试</div>`;
    $("#bannerTrack").innerHTML = "";
    return;
  }
  await restoreSession();
  await loadAll();
  renderHome();
  renderCommunity();
  renderPandaChips();
  renderPandas();
  renderMe();
  loadGuardianCounts().then(() => {
    if (state.tab === "pandas") renderPandas();
  });
  Promise.all([loadMyGuardians(), loadMySubmissions()]).then(() => {
    renderMe();
    if (state.tab === "pandas") renderPandas();
  });
  syncUserState().then(() => {
    if (state.tab === "me") renderMe();
  });
  refreshNotifCount().then(() => {
    if (state.tab === "me") renderMe();
  });
}

/* 供后台（admin.js）复用的接口 */
window.db = db;
window.refreshPosts = refreshPosts;
window.refreshComments = refreshComments;
window.renderCommunity = renderCommunity;
window.renderPandas = renderPandas;
window.loadCommentConfig = loadCommentConfig;
window.imgTag = imgTag;
window.toast = toast;
window.askConfirm = askConfirm;

boot();
