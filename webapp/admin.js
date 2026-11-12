/* ==========================================================
   熊猫动态圈 · 管理后台
   入口： 地址栏加 #admin ，或在「关于」页连点 logo 5 次
   能力： 内容 CRUD / 帖子评论治理 / 图鉴维护 / 用户封禁 / 违规记录
   ========================================================== */
(function () {
  "use strict";

  const ADM = {
    pwd: sessionStorage.getItem("pc_admin") || "",
    route: "overview",
    filter: "",
    subTab: "pending",
    data: { news: [], posts: [], comments: [], pandas: [], users: [], violations: [], subs: [], reports: [], logs: [], overview: null },
    page: {}, // 各列表路由的当前页码（客户端分页）
    root: null,
    loading: false,
  };

  /* ---------------- 图标 ---------------- */
  const I = (d, extra = "") =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
  const ICON = {
    grid: I(`<rect x="3.4" y="3.4" width="7" height="7" rx="2"/><rect x="13.6" y="3.4" width="7" height="7" rx="2"/><rect x="3.4" y="13.6" width="7" height="7" rx="2"/><rect x="13.6" y="13.6" width="7" height="7" rx="2"/>`),
    news: I(`<path d="M5 4.5h9.5L19 9v10.5H5z"/><path d="M14 4.5V9h5"/><path d="M8 12.5h8M8 15.5h6"/>`),
    chat: I(`<path d="M21 11.6a8 8 0 0 1-8 8H7.6l-4 2 1.1-4.2A8 8 0 1 1 21 11.6Z"/><circle cx="9" cy="11.6" r=".9" fill="currentColor"/><circle cx="12.5" cy="11.6" r=".9" fill="currentColor"/><circle cx="16" cy="11.6" r=".9" fill="currentColor"/>`),
    msg: I(`<path d="M20.5 12a7.6 7.6 0 0 1-7.6 7.6H8.4L4 21.6l1.1-4.1A7.6 7.6 0 1 1 20.5 12Z"/><path d="M8.6 12h6.8"/>`),
    paw: I(`<circle cx="12" cy="15" r="4.1"/><ellipse cx="6.6" cy="9.4" rx="2.1" ry="2.5"/><ellipse cx="10.6" cy="6.8" rx="2" ry="2.4"/><ellipse cx="15.2" cy="7" rx="2" ry="2.4"/><ellipse cx="18.6" cy="10" rx="1.9" ry="2.3"/>`),
    users: I(`<circle cx="9.2" cy="8.4" r="3.5"/><path d="M2.8 20c1.1-3.4 3.4-5.1 6.4-5.1s5.3 1.7 6.4 5.1"/><path d="M16.4 5.2a3.4 3.4 0 0 1 0 6.5"/><path d="M17.6 14.9c2.1.5 3.4 2.2 4 5.1"/>`),
    shield: I(`<path d="M12 3.2 19 6v6c0 4.2-2.9 7.5-7 8.8-4.1-1.3-7-4.6-7-8.8V6z"/><path d="M12 8.4v3.4"/><circle cx="12" cy="15" r=".8" fill="currentColor"/>`),
    gear: I(`<circle cx="12" cy="12" r="3.1"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a1.9 1.9 0 1 1-3.8 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.6 1.6 0 0 0-1.1-2.7h-.2a1.9 1.9 0 1 1 0-3.8h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5v-.2a1.9 1.9 0 1 1 3.8 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a1.9 1.9 0 1 1 0 3.8h-.1a1.6 1.6 0 0 0-1.5 1z"/>`),
    search: I(`<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>`),
    refresh: I(`<path d="M20.5 11.5a8.5 8.5 0 1 1-2.6-6.1"/><path d="M20.8 4.5v5h-5"/>`),
    plus: I(`<path d="M12 5.5v13M5.5 12h13"/>`),
    edit: I(`<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>`),
    trash: I(`<path d="M4 7h16"/><path d="M9.5 7V4.8h5V7"/><path d="M6.5 7l.9 12.2h9.2L17.5 7"/><path d="M10.5 11v5M13.5 11v5"/>`),
    eye: I(`<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>`),
    pin: I(`<path d="M9 4h6l-1 5 3 3v2h-4v6l-1 1-1-1v-6H7v-2l3-3z"/>`),
    hide: I(`<path d="M3 3l18 18"/><path d="M10.6 6.1A8.9 8.9 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.7 3.4"/><path d="M6.3 7.9A16.4 16.4 0 0 0 2.5 12S6 18 12 18a9 9 0 0 0 3.6-.7"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>`),
    ban: I(`<circle cx="12" cy="12" r="8.4"/><path d="M6.2 6.2l11.6 11.6"/>`),
    check: I(`<path d="M4.5 12.5l5 5 10-10"/>`),
    x: I(`<path d="M6 6l12 12M18 6L6 18"/>`),
    logout: I(`<path d="M14.5 4.5h4.2v15h-4.2"/><path d="M4 12h11"/><path d="M11.6 8.4 15.2 12l-3.6 3.6"/>`),
    upload: I(`<path d="M12 16V4.5"/><path d="M7.5 9 12 4.5 16.5 9"/><path d="M4 15v4.5h16V15"/>`),
    image: I(`<rect x="3.4" y="4.4" width="17.2" height="15.2" rx="2.6"/><circle cx="8.6" cy="9.6" r="1.7"/><path d="M4 17l4.8-4.4 3.4 3 3-2.6L20.6 17"/>`),
    user: I(`<circle cx="12" cy="8" r="3.9"/><path d="M4.8 20.4c1.4-3.5 3.9-5.4 7.2-5.4s5.8 1.9 7.2 5.4"/>`),
    arrow: I(`<path d="M9 5l7 7-7 7"/>`),
    menu: I(`<path d="M4 7h16M4 12h16M4 17h16"/>`),
    calendar: I(`<rect x="3.6" y="5" width="16.8" height="15" rx="2.6"/><path d="M8 3.4v3.2M16 3.4v3.2M3.6 10h16.8"/>`),
    review: I(`<rect x="4.4" y="3.6" width="15.2" height="16.8" rx="2.6"/><path d="M8.4 9h7.2M8.4 12.6h4.6"/><path d="m13.6 16.4 1.6 1.7 3-3.2"/>`),
    paw: I(`<path d="M12 20.4c-2.9 0-5.4-1.7-5.4-4.1 0-2.2 2.2-4.2 5.4-4.2s5.4 2 5.4 4.2c0 2.4-2.5 4.1-5.4 4.1z"/><ellipse cx="6.6" cy="9.6" rx="2.3" ry="2.7"/><ellipse cx="10.9" cy="6.4" rx="2.3" ry="2.7"/><ellipse cx="15.9" cy="7" rx="2.2" ry="2.6"/><ellipse cx="19" cy="10.6" rx="2.1" ry="2.5"/>`),
  };

  /* ---------------- 基础工具 ---------------- */
  const e = (s) => window.esc(s);
  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => [...root.querySelectorAll(sel)];

  function ago(iso) {
    try {
      return window.timeAgo(iso);
    } catch (_) {
      return "";
    }
  }
  function full(iso) {
    try {
      return window.fullTime(iso);
    } catch (_) {
      return String(iso || "");
    }
  }
  function toLocalInput(iso) {
    const d = iso ? new Date(iso) : new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  const isUrl = (v) => /^(https?:|data:|assets\/|\/)/.test(String(v || "").trim());
  const coverSrc = (v, key) => (isUrl(v) ? v : `assets/cov-${window.avatarKeyOf(v || key)}.webp`);
  const thumbSrc = (v, key) => (isUrl(v) ? v : `assets/sq-${window.avatarKeyOf(v || key)}.webp`);
  const pandaSrc = (v, key) => (isUrl(v) ? v : `assets/${window.avatarKeyOf(v || key)}.webp`);
  const pandaNameOfKey = (k) => window.PANDA_NAME[k] || k;
  /* 选择器里的缩略图要立即加载，避免出现灰块 */
  const picImg = (src) => `<img src="${src}" alt="" loading="eager" decoding="sync" />`;

  function avatarHTML(user) {
    if (user && user.avatar && isUrl(user.avatar)) return `<img src="${e(user.avatar)}" alt="" />`;
    const seed = user ? user.avatar_seed || user.nickname || "0" : "0";
    return window.avatarImg ? window.avatarImg(seed) : `<img src="assets/${window.avatarKeyOf(seed)}.webp" alt="" />`;
  }

  /** 邮箱脱敏：ab***@qq.com */
  function maskMail(m) {
    const s = String(m || "");
    const at = s.indexOf("@");
    if (at < 1) return s;
    const name = s.slice(0, at);
    const domain = s.slice(at);
    const head = name.slice(0, Math.min(2, name.length));
    return head + "***" + domain;
  }

  /* ---------------- RPC ---------------- */  async function rpc(fn, args = {}, opts = {}) {
    if (!window.db) throw new Error("云服务未连接");
    const { data, error } = await window.db.rpc(fn, { p_pwd: ADM.pwd, ...args });
    if (error) throw error;
    return data;
  }
  async function call(fn, args, okMsg) {
    try {
      const r = await rpc(fn, args);
      if (okMsg) window.toast(okMsg, "ok");
      /* PostgREST 对 void 返回类型的函数返回 data=null：归一成 {}，
         否则调用方的 `if (r !== null)` 会把"成功"误判成"失败"，跳过后续刷新。 */
      writeLog(fn, args, okMsg);
      return r === null || r === undefined ? {} : r;
    } catch (err) {
      const m = String(err.message || err);
      window.toast(m.includes("管理员密码") ? "登录已失效，请重新登录" : m, "err");
      if (m.includes("管理员密码")) logoutAdmin();
      return null;
    }
  }

  /* ---------------- 操作日志：所有写操作统一留痕 ---------------- */
  const LOG_NAME = {
    f_admin_save_news: "发布/编辑动态",
    f_admin_delete_news: "删除动态",
    f_admin_set_news_flags: "动态 Banner/上下线",
    f_admin_save_panda: "保存熊猫档案",
    f_admin_delete_panda: "删除熊猫档案",
    f_admin_set_panda_visible: "熊猫上/下线",
    f_admin_set_post_flags: "帖子置顶/隐藏",
    f_admin_remove_post: "帖子下架",
    f_admin_set_comment: "帖子评论开关",
    f_admin_remove_comment: "删除评论",
    f_admin_set_ban: "封禁/解封用户",
    f_admin_delete_violation: "删除违规记录",
    f_admin_review_submission: "审核用户提交",
    f_admin_handle_report: "处理用户举报",
    f_admin_comment_config: "全站评论设置",
    f_admin_change_pwd: "修改管理密码",
  };
  const LOG_SKIP = new Set(["f_admin_check", "f_admin_login", "f_admin_log", "f_admin_logs"]);
  function writeLog(fn, args, okMsg) {
    if (!LOG_NAME[fn]) return;
    const a = args || {};
    const target = a.p_id != null ? String(a.p_id) : a.p_key != null ? String(a.p_key) : "";
    rpc("f_admin_log", {
      p_action: LOG_NAME[fn] || fn,
      p_target: target,
      p_detail: String(okMsg || "").slice(0, 200),
    }).catch(() => {});
  }

  /* ---------------- 数据加载 ---------------- */
  async function loadData(keys) {
    const want = keys || ["news", "pandas", "admin"];
    const jobs = [];
    if (want.includes("news")) {
      jobs.push(
        window.db
          .from("news")
          .select("*")
          .order("published_at", { ascending: false })
          .then(({ data }) => (ADM.data.news = data || []))
      );
    }
    if (want.includes("pandas")) {
      jobs.push(
        window.db
          .from("pandas")
          .select("*")
          .order("sort_order", { ascending: true })
          .then(({ data }) => (ADM.data.pandas = data || []))
      );
    }
    if (want.includes("admin")) {
      jobs.push(
        rpc("f_admin_overview").then((d) => (ADM.data.overview = d)),
        rpc("f_admin_posts").then((d) => (ADM.data.posts = d || [])),
        rpc("f_admin_comments").then((d) => (ADM.data.comments = d || [])),
        rpc("f_admin_users").then((d) => (ADM.data.users = d || [])),
        rpc("f_admin_submissions").then((d) => (ADM.data.subs = d || [])),
        rpc("f_admin_violations").then((d) => (ADM.data.violations = d || [])),
        rpc("f_admin_reports").then((d) => (ADM.data.reports = d || []))
      );
    }
    if (want.includes("logs")) {
      jobs.push(rpc("f_admin_logs").then((d) => (ADM.data.logs = d || [])));
    }
    await Promise.all(jobs);
  }

  /* ---------------- 外壳 ---------------- */
  const NAV = [
    {
      group: "内容运营",
      items: [
        { key: "overview", label: "数据概览", icon: "grid" },
        { key: "news", label: "首页动态", icon: "news" },
        { key: "posts", label: "熊猫圈帖子", icon: "chat" },
        { key: "comments", label: "评论管理", icon: "msg" },
      ],
    },
    {
      group: "资料维护",
      items: [
        { key: "pandas", label: "熊猫图鉴", icon: "paw" },
        { key: "reviews", label: "贡献审核", icon: "review" },
      ],
    },
    {
      group: "社区治理",
      items: [
        { key: "reports", label: "用户举报", icon: "shield" },
        { key: "users", label: "用户管理", icon: "users" },
        { key: "violations", label: "违规记录", icon: "ban" },
      ],
    },
    {
      group: "系统",
      items: [
        { key: "logs", label: "操作日志", icon: "calendar" },
        { key: "settings", label: "系统设置", icon: "gear" },
      ],
    },
  ];

  const ROUTE_META = {
    overview: { title: "数据概览", sub: "今天的运营情况一览" },
    news: { title: "首页动态", sub: "管理「今日焦点 / 熊猫速览 / 每日动态」的文章与配图" },
    posts: { title: "熊猫圈帖子", sub: "查看、置顶、隐藏或下架违规帖子" },
    comments: { title: "评论管理", sub: "管理帖子下的评论与回复" },
    pandas: { title: "熊猫图鉴", sub: "维护每只熊猫的档案与照片" },
    reviews: { title: "贡献审核", sub: "用户提交的新增熊猫与档案修改，审核通过后自动生效" },
    reports: { title: "用户举报", sub: "处理用户提交的举报：下架违规内容或忽略误报" },
    users: { title: "用户管理", sub: "查看注册用户、违规次数，处理封号" },
    violations: { title: "违规记录", sub: "所有被处理过的违规内容都在这里" },
    logs: { title: "操作日志", sub: "后台每个写操作都会留痕，最近 200 条" },
    settings: { title: "系统设置", sub: "管理密码与系统信息" },
  };

  function renderShell() {
    ADM.root.innerHTML = `
      <aside class="adm-side" id="admSide">
        <div class="adm-brand">
          <span class="adm-brand-logo"><img src="assets/hua.webp" alt="" /></span>
          <span class="adm-brand-txt"><b>熊猫动态圈</b><span>ADMIN CONSOLE</span></span>
        </div>
        <nav class="adm-nav" id="admNav">
          ${NAV.map(
            (g) => `<div class="adm-nav-title">${g.group}</div>
            ${g.items
              .map(
                (it) => `<button class="adm-nav-item" data-route="${it.key}">
                  ${ICON[it.icon]}<span>${it.label}</span>
                  <span class="adm-nav-badge" data-badge="${it.key}" hidden></span>
                </button>`
              )
              .join("")}`
          ).join("")}
        </nav>
        <div class="adm-side-foot">
          <b>云端实时数据</b><br />v1.0 · 内容安全优先
        </div>
      </aside>
      <div class="adm-side-mask" id="admSideMask"></div>
      <div class="adm-main">
        <header class="adm-top">
          <button class="adm-icon-btn adm-burger" id="admBurger" aria-label="菜单">${ICON.menu}</button>
          <div class="adm-crumb">后台 <i>/</i> <b id="admCrumb">数据概览</b></div>
          <div class="adm-top-right">
            <label class="adm-searchbox">
              ${ICON.search}
              <input id="admSearch" placeholder="搜索当前列表…" />
            </label>
            <button class="adm-icon-btn" id="admRefresh" title="刷新数据">${ICON.refresh}</button>
            <div class="adm-who"><i>${ICON.shield}</i>管理员</div>
          </div>
        </header>
        <div class="adm-body" id="admBody"></div>
      </div>`;

    q("#admNav").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-route]");
      if (!b) return;
      ADM.filter = "";
      const s = q("#admSearch");
      if (s) s.value = "";
      go(b.dataset.route);
      q("#admSide").classList.remove("open");
      q("#admSideMask").classList.remove("show");
    });
    q("#admBurger").addEventListener("click", () => {
      q("#admSide").classList.toggle("open");
      q("#admSideMask").classList.toggle("show");
    });
    q("#admSideMask").addEventListener("click", () => {
      q("#admSide").classList.remove("open");
      q("#admSideMask").classList.remove("show");
    });
    q("#admRefresh").addEventListener("click", async () => {
      window.toast("正在刷新…", "");
      await refreshAll();
      window.toast("数据已更新", "ok");
    });
    q("#admSearch").addEventListener("input", (ev) => {
      ADM.filter = ev.target.value.trim();
      paint();
    });
  }

  function markNav() {
    qa(".adm-nav-item").forEach((b) => b.classList.toggle("on", b.dataset.route === ADM.route));
    q("#admCrumb").textContent = ROUTE_META[ADM.route].title;
    const vBadge = q('[data-badge="violations"]');
    if (vBadge) {
      const n = ADM.data.violations.length;
      vBadge.hidden = !n;
      vBadge.textContent = n > 99 ? "99+" : n;
    }
    const rBadge = q('[data-badge="reviews"]');
    if (rBadge) {
      const n = (ADM.data.subs || []).filter((s) => s.status === "pending").length;
      rBadge.hidden = !n;
      rBadge.textContent = n > 99 ? "99+" : n;
    }
    const pBadge = q('[data-badge="reports"]');
    if (pBadge) {
      const n = (ADM.data.reports || []).filter((r) => r.status === "pending").length;
      pBadge.hidden = !n;
      pBadge.textContent = n > 99 ? "99+" : n;
    }
  }

  /* 每个页签依赖的数据集合：切页时按需重新拉取，避免后台一直显示登录那一刻的快照 */
  const ROUTE_DATA = {
    overview: ["admin"],
    news: ["news"],
    posts: ["admin"],
    comments: ["admin"],
    pandas: ["pandas"],
    reviews: ["admin"],
    reports: ["admin"],
    users: ["admin"],
    violations: ["admin"],
    logs: ["logs"],
    settings: ["news", "pandas", "admin"],
  };

  let routeSeq = 0;
  async function refreshRoute(route) {
    const keys = ROUTE_DATA[route] || ["admin"];
    const seq = ++routeSeq;
    try {
      await loadData(keys);
      /* 拉取期间用户可能已经切到别的页签，或又触发了一次刷新 */
      if (seq !== routeSeq || ADM.route !== route) return;
      markNav();
      paint();
    } catch (err) {
      /* 静默失败：保留当前已渲染的数据，不打断正在进行的操作 */
    }
  }

  function go(route) {
    ADM.route = route;
    markNav();
    paint();
    q("#admBody").scrollTop = 0;
    try {
      history.replaceState(null, "", "#admin/" + route);
    } catch (_) {}
    /* 先用内存数据秒开，再静默同步云端最新状态 */
    refreshRoute(route);
  }

  async function refreshAll() {
    const body = q("#admBody");
    if (body) body.style.opacity = ".55";
    try {
      await loadData();
      markNav();
      paint();
    } catch (err) {
      window.toast("刷新失败：" + (err.message || ""), "err");
    } finally {
      if (body) body.style.opacity = "";
    }
  }

  function paint() {
    let body = q("#admBody");
    if (!body) return;
    markNav(); /* 侧边栏角标（违规数 / 待审核数）跟随每次重绘一起更新 */
    const keepTop = body.scrollTop; /* 重绘后要还原滚动位置，否则列表会跳回顶部 */
    /* 每次重绘换一个干净容器，避免委托监听重复叠加 */
    const fresh = body.cloneNode(false);
    body.replaceWith(fresh);
    body = fresh;
    const map = {
      overview: pageOverview,
      news: pageNews,
      posts: pagePosts,
      comments: pageComments,
      pandas: pagePandas,
      reviews: pageReviews,
      reports: pageReports,
      users: pageUsers,
      violations: pageViolations,
      logs: pageLogs,
      settings: pageSettings,
    };
    body.innerHTML = `<div class="adm-page">${(map[ADM.route] || pageOverview)()}</div>`;
    const after = AFTER[ADM.route];
    if (after) after(body);
    /* 分页控件委托：翻页只重绘，不重新拉数据 */
    body.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-pg-prev],[data-pg-next]");
      if (!b || b.disabled) return;
      ADM.page[ADM.route] = Math.max(1, (ADM.page[ADM.route] || 1) + (b.hasAttribute("data-pg-next") ? 1 : -1));
      paint();
    });
    if (keepTop) body.scrollTop = keepTop;
  }

  const AFTER = {};

  /* ---------------- 客户端分页 ---------------- */
  const PER_PAGE = 20;
  function pageSlice(route, list) {
    const total = Math.max(1, Math.ceil(list.length / PER_PAGE));
    ADM.page[route] = Math.min(Math.max(1, ADM.page[route] || 1), total);
    const pg = ADM.page[route];
    return { rows: list.slice((pg - 1) * PER_PAGE, pg * PER_PAGE), pg, total, count: list.length };
  }
  function pageBar(pg, total) {
    if (total <= 1) return "";
    return `<div class="adm-pager">
      <button class="adm-btn sm ghost" data-pg-prev ${pg <= 1 ? "disabled" : ""}>‹ 上一页</button>
      <span class="pg-info">第 ${pg} / ${total} 页</span>
      <button class="adm-btn sm ghost" data-pg-next ${pg >= total ? "disabled" : ""}>下一页 ›</button>
    </div>`;
  }

  /* ---------------- 通用片段 ---------------- */
  function head(right = "") {
    const m = ROUTE_META[ADM.route];
    return `<div class="adm-head">
      <div><h1>${m.title}</h1><p>${m.sub}</p></div>
      <div class="adm-head-acts">${right}</div>
    </div>`;
  }
  function stat(label, value, sub, icon, cls = "") {
    return `<div class="adm-stat ${cls}">
      <div class="adm-stat-top"><span class="ic">${ICON[icon]}</span>${label}</div>
      <b>${value}</b><em>${sub}</em>
    </div>`;
  }
  function emptyBox(title, desc, ico = "🐼") {
    return `<div class="adm-empty"><div class="ic">${ico}</div><b>${title}</b>${desc}</div>`;
  }
  const filtered = (list, fields) => {
    const f = ADM.filter.toLowerCase();
    if (!f) return list;
    return list.filter((it) => fields.some((k) => String(it[k] ?? "").toLowerCase().includes(f)));
  };

  /* ---------------- 概览 ---------------- */
  function pageOverview() {
    const o = ADM.data.overview || {};
    const recent = ADM.data.posts.slice(0, 6);
    const recentV = ADM.data.violations.slice(0, 5);
    const bannedUsers = ADM.data.users.filter((u) => u.banned);
    return `${head(`<button class="adm-btn" data-act="go-news">${ICON.news} 去发动态</button>
      <button class="adm-btn primary" data-act="new-news">${ICON.plus} 新增动态</button>`)}
      <div class="adm-stats">
        ${stat("注册用户", o.users ?? 0, `今日新增 ${o.today_users ?? 0}`, "users")}
        ${stat("圈内帖子", o.posts ?? 0, `今日 +${o.today_posts ?? 0} · 隐藏 ${o.hidden_posts ?? 0}`, "chat")}
        ${stat("评论互动", o.comments ?? 0, `今日 +${o.today_comments ?? 0}`, "msg")}
        ${stat("违规处理", o.violations ?? 0, `${o.banned ?? 0} 个账号已封禁`, "shield", (o.violations || 0) > 0 ? "" : "")}
      </div>
      <div class="adm-cols">
        <div>
          <div class="adm-panel">
            <div class="adm-panel-head"><h3>最新帖子</h3><span class="sub">实时进入熊猫圈的内容</span>
              <div class="right"><button class="adm-btn ghost sm" data-act="go-posts">全部 ${ICON.arrow}</button></div>
            </div>
            <div class="adm-panel-body flush">
              ${
                recent.length
                  ? `<table class="adm-tbl"><thead><tr><th>作者</th><th>内容</th><th>互动</th><th>时间</th></tr></thead><tbody>
                    ${recent
                      .map(
                        (p) => `<tr>
                        <td><div class="adm-cellmain"><span class="adm-thumb sq rd">${avatarHTML({ avatar_seed: p.avatar_seed, nickname: p.nickname })}</span>
                          <span style="font-weight:650">${e(p.nickname)}</span></div></td>
                        <td><div class="adm-text-clip">${e(p.content)}</div></td>
                        <td class="num">❤️ ${p.likes || 0} · 💬 ${p.comment_count || 0}</td>
                        <td class="muted" style="white-space:nowrap">${ago(p.created_at)}</td>
                      </tr>`
                      )
                      .join("")}
                  </tbody></table>`
                  : emptyBox("还没有帖子", "熊猫圈暂时安静", "💬")
              }
            </div>
          </div>
          <div class="adm-panel">
            <div class="adm-panel-head"><h3>首页动态</h3><span class="sub">共 ${ADM.data.news.length} 篇 · Banner ${ADM.data.news.filter((n) => n.is_banner).length} 个</span>
              <div class="right"><button class="adm-btn ghost sm" data-act="go-news">管理 ${ICON.arrow}</button></div>
            </div>
            <div class="adm-panel-body">
              <div style="display:flex;gap:10px;overflow:auto;padding-bottom:2px">
                ${ADM.data.news
                  .slice(0, 5)
                  .map(
                    (n) => `<div style="flex:0 0 168px">
                      <div class="adm-thumb" style="width:168px;height:96px;border-radius:10px">${window.imgTag(
                        coverSrc(n.image, window.artKeyOf ? window.artKeyOf(n) : "hua")
                      )}</div>
                      <div style="font-size:12px;font-weight:650;margin-top:6px;line-height:1.5">${e(n.title)}</div>
                      <div style="font-size:11px;color:#98a2b3;margin-top:3px">${e(n.tag || "动态")} · ${ago(n.published_at)}</div>
                    </div>`
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
        <div>
          <div class="adm-panel">
            <div class="adm-panel-head"><h3>违规提醒</h3>
              <div class="right"><span class="adm-pill ${recentV.length ? "r" : "g"}"><i class="adm-dot"></i>${recentV.length ? "有待关注" : "全部正常"}</span></div>
            </div>
            <div class="adm-panel-body flush">
              ${
                recentV.length
                  ? `<div class="adm-mini-list" style="border:0">
                    ${recentV
                      .map(
                        (v) => `<div class="mi"><div class="mt"><span class="adm-pill ${v.target_type === "post" ? "b" : "y"}">${v.target_type === "post" ? "帖子" : "评论"}</span>
                        <b style="color:#3b4453">${e(v.nickname || "匿名")}</b><span>${ago(v.created_at)}</span></div>
                        <p>${e((v.content || "").slice(0, 60))}</p>
                        <div class="mt" style="margin-top:5px">原因：${e(v.reason || "未填写")}</div></div>`
                      )
                      .join("")}
                  </div>`
                  : emptyBox("暂无违规记录", "社区氛围良好，继续保持", "🛡️")
              }
            </div>
          </div>
          <div class="adm-panel">
            <div class="adm-panel-head"><h3>待办</h3></div>
            <div class="adm-panel-body">
              <div class="adm-kv" style="grid-template-columns:1fr 1fr;margin-bottom:0">
                <div><b>${ADM.data.posts.filter((p) => p.hidden).length}</b><span>被隐藏的帖子</span></div>
                <div><b>${bannedUsers.length}</b><span>已封禁账号</span></div>
                <div><b>${ADM.data.comments.length}</b><span>待审评论总量</span></div>
                <div><b>${ADM.data.pandas.length}</b><span>在册熊猫</span></div>
              </div>
              <button class="adm-btn" style="width:100%;margin-top:12px" data-act="go-violations">${ICON.shield} 查看违规记录</button>
            </div>
          </div>
        </div>
      </div>`;
  }
  AFTER.overview = (root) => {
    root.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-act]");
      if (!b) return;
      const a = b.dataset.act;
      if (a === "go-news") go("news");
      if (a === "go-posts") go("posts");
      if (a === "go-violations") go("violations");
      if (a === "new-news") openNewsForm(null);
    });
  };

  /* ---------------- 首页动态 ---------------- */
  function pageNews() {
    const list = filtered(ADM.data.news, ["title", "summary", "content", "tag"]);
    return `${head(`<button class="adm-btn primary" data-act="new">${ICON.plus} 新增动态</button>`)}
      <div class="adm-stats">
        ${stat("动态总数", ADM.data.news.length, "含已下线内容", "news", "mini")}
        ${stat("Banner", ADM.data.news.filter((n) => n.is_banner).length, "首页轮播位", "image", "mini")}
        ${stat("分类", new Set(ADM.data.news.map((n) => n.tag).filter(Boolean)).size, "标签维度", "grid", "mini")}
        ${stat("本周发布", ADM.data.news.filter((n) => Date.now() - new Date(n.published_at) < 7 * 864e5).length, "近 7 天", "calendar", "mini")}
      </div>
      <div class="adm-panel">
        <div class="adm-panel-head"><h3>动态列表</h3><span class="sub">封面、正文、图集、Banner 位都可编辑</span></div>
        <div class="adm-panel-body flush">
          ${
            list.length
              ? `<div class="adm-tbl-wrap"><table class="adm-tbl">
                <thead><tr><th style="width:76px">封面</th><th>标题</th><th>分类</th><th>Banner</th><th>状态</th><th>发布时间</th><th style="text-align:right">操作</th></tr></thead>
                <tbody>${list
                  .map((n) => {
                    const key = window.artKeyOf ? window.artKeyOf(n) : "hua";
                    return `<tr>
                    <td><div class="adm-thumb">${window.imgTag(thumbSrc(n.image, key))}</div></td>
                    <td><div class="adm-title-cell"><b>${e(n.title)}</b><span>${e((n.summary || n.content || "").slice(0, 46))}</span></div></td>
                    <td><span class="adm-pill b">${e(n.tag || "动态")}</span></td>
                    <td><label class="adm-switch"><input type="checkbox" data-banner="${n.id}" ${n.is_banner ? "checked" : ""}/><i></i></label></td>
                    <td><label class="adm-switch" title="上线 / 下线"><input type="checkbox" data-visible="${n.id}" ${n.visible === false ? "" : "checked"}/><i></i></label></td>
                    <td class="muted" style="white-space:nowrap">${full(n.published_at).slice(0, 10)}</td>
                    <td><div class="adm-rowacts">
                      <button class="adm-btn sm" data-edit="${n.id}">${ICON.edit} 编辑</button>
                      <button class="adm-btn sm ghost" data-preview="${n.id}">${ICON.eye} 预览</button>
                      <button class="adm-btn sm danger" data-del="${n.id}">${ICON.trash}</button>
                    </div></td>
                  </tr>`;
                  })
                  .join("")}</tbody></table></div>`
              : emptyBox("没有匹配的动态", "换个关键词，或新增一篇", "📰")
          }
        </div>
      </div>`;
  }
  AFTER.news = (root) => {
    root.addEventListener("click", async (ev) => {
      const b = ev.target.closest("[data-act],[data-edit],[data-preview],[data-del]");
      if (!b) return;
      if (b.dataset.act === "new") return openNewsForm(null);
      if (b.dataset.edit) return openNewsForm(ADM.data.news.find((n) => n.id === Number(b.dataset.edit)));
      if (b.dataset.preview) return previewNews(ADM.data.news.find((n) => n.id === Number(b.dataset.preview)));
      if (b.dataset.del) {
        const n = ADM.data.news.find((x) => x.id === Number(b.dataset.del));
        const ok = await window.askConfirm("删除这篇动态？", `《${n.title}》将从首页彻底移除，无法恢复。`, "删除");
        if (!ok) return;
        const r = await call("f_admin_delete_news", { p_id: n.id }, "动态已删除");
        if (r !== null) {
          await loadData(["news"]);
          if (window.refreshNews) await window.refreshNews();
          if (window.renderHome) window.renderHome();
          paint();
        }
      }
    });
    root.addEventListener("change", async (ev) => {
      const vb = ev.target.closest("[data-visible]");
      if (vb) {
        const n = ADM.data.news.find((x) => x.id === Number(vb.dataset.visible));
        if (!n) return;
        const r = await call("f_admin_set_news_flags", { p_id: n.id, p_banner: null, p_visible: vb.checked });
        if (r === null) return (vb.checked = !vb.checked);
        n.visible = vb.checked;
        if (window.refreshNews) await window.refreshNews();
        if (window.renderHome) window.renderHome();
        window.toast(vb.checked ? "已上线" : "已下线，前台不再展示", "ok");
        return;
      }
      const cb = ev.target.closest("[data-banner]");
      if (!cb) return;
      const n = ADM.data.news.find((x) => x.id === Number(cb.dataset.banner));
      const r = await call("f_admin_set_news_flags", { p_id: n.id, p_banner: cb.checked, p_visible: null });
      if (r === null) return cb.checked = !cb.checked;
      n.is_banner = cb.checked;
      if (window.refreshNews) await window.refreshNews();
      if (window.renderHome) window.renderHome();
      window.toast(cb.checked ? "已加入首页轮播" : "已移出轮播", "ok");
    });
  };

  /* ---------- 动态表单 ---------- */
  function openNewsForm(n) {
    const edit = !!n;
    const cur = n || { title: "", summary: "", content: "", tag: "熊猫圈", is_banner: false, image: "", images: [] };
    const gallery = Array.isArray(cur.images) ? [...cur.images] : [];
    const d = drawer({
      title: edit ? "编辑动态" : "新增动态",
      body: `
        <div class="adm-field"><label>标题<span>*</span></label>
          <input class="adm-input" id="fTitle" maxlength="60" value="${e(cur.title)}" placeholder="一句话说清这条动态" /></div>
        <div class="adm-field"><label>摘要</label>
          <input class="adm-input" id="fSummary" maxlength="80" value="${e(cur.summary || "")}" placeholder="列表里显示的一句话简介" /></div>
        <div class="adm-grid2">
          <div class="adm-field"><label>分类标签</label>
            <input class="adm-input" id="fTag" maxlength="10" value="${e(cur.tag || "熊猫圈")}" /></div>
          <div class="adm-field"><label>发布时间</label>
            <input class="adm-input" id="fTime" type="datetime-local" value="${toLocalInput(cur.published_at)}" /></div>
        </div>
        <div class="adm-field"><label>封面图（今日焦点 / 列表缩略图）</label>
          <div id="fCoverPick">${coverPickerHTML(cur.image, window.artKeyOf ? window.artKeyOf(cur) : "hua")}</div>
          <div class="adm-uploadrow">
            <input class="adm-input" id="fCoverUrl" placeholder="或粘贴图片链接 https://…" value="${isUrl(cur.image) ? e(cur.image) : ""}" />
            <button class="adm-btn" id="fCoverUpload">${ICON.upload} 上传</button>
          </div>
          <div class="hint">不选则按正文提到的熊猫自动匹配；上传的图片会压缩后存入云端。</div>
        </div>
        <div class="adm-field"><label>正文</label>
          <textarea class="adm-textarea" id="fContent" placeholder="支持换行分段">${e(cur.content || "")}</textarea></div>
        <div class="adm-field"><label>正文配图（最多 6 张）</label>
          <div class="adm-gallery" id="fGallery">
            ${gallery
              .map(
                (g, i) => `<div class="g-item">${window.imgTag(coverSrc(g))}
                  <button data-gdel="${i}" title="移除">✕</button></div>`
              )
              .join("")}
            <button class="g-add" id="fGAdd">＋ 添加配图</button>
          </div>
        </div>
        <div class="adm-field"><label>首页展示</label>
          <label class="adm-check"><input type="checkbox" id="fBanner" ${cur.is_banner ? "checked" : ""}/> 设为首页 Banner 焦点</label>
          <label class="adm-check" style="margin-left:16px"><input type="checkbox" id="fVisible" ${cur.visible === false ? "" : "checked"}/> 对外可见</label>
        </div>
        <div class="adm-field"><label>效果预览</label>${newsPreviewHTML(cur)}</div>`,
      footer: `<button class="adm-btn" data-x>取消</button>
        <button class="adm-btn primary" id="fSave">${edit ? "保存修改" : "发布动态"}</button>`,
      onMount: (dr) => {
        let cover = cur.image || "";
        const refreshCover = () => {
          const box = q("#fCoverPick", dr);
          box.innerHTML = coverPickerHTML(cover, window.artKeyOf ? window.artKeyOf(cur) : "hua");
        };
        q("#fCoverPick", dr).addEventListener("click", (ev) => {
          const b = ev.target.closest("[data-pick]");
          if (!b) return;
          cover = b.dataset.pick;
          refreshCover();
          q("#fCoverUrl", dr).value = "";
          updatePreview();
        });
        q("#fCoverUrl", dr).addEventListener("input", (ev) => {
          cover = ev.target.value.trim();
          qa("#fCoverPick .sel", dr).forEach((x) => x.classList.remove("sel"));
          updatePreview();
        });
        q("#fCoverUpload", dr).addEventListener("click", () => {
          pickLocalImage(1120 / 644, (src) => {
            cover = src;
            refreshCover();
            q("#fCoverUrl", dr).value = "";
            updatePreview();
          });
        });
        q("#fGallery", dr).addEventListener("click", (ev) => {
          const del = ev.target.closest("[data-gdel]");
          if (del) {
            gallery.splice(Number(del.dataset.gdel), 1);
            renderGallery();
            return;
          }
          if (ev.target.closest("#fGAdd")) {
            if (gallery.length >= 6) return window.toast("最多 6 张配图", "err");
            pickLibraryImage((src) => {
              gallery.push(src);
              renderGallery();
            });
          }
        });
        const renderGallery = () => {
          q("#fGallery", dr).innerHTML =
            gallery
              .map(
                (g, i) => `<div class="g-item">${window.imgTag(coverSrc(g))}<button data-gdel="${i}">✕</button></div>`
              )
              .join("") + `<button class="g-add" id="fGAdd">＋ 添加配图</button>`;
        };
        const updatePreview = () => {
          const box = q(".adm-preview", dr);
          if (!box) return;
          const data = readForm();
          box.outerHTML = newsPreviewHTML(data);
        };
        const readForm = () => ({
          title: q("#fTitle", dr).value.trim(),
          summary: q("#fSummary", dr).value.trim(),
          content: q("#fContent", dr).value,
          tag: q("#fTag", dr).value.trim(),
          image: cover,
          is_banner: q("#fBanner", dr).checked,
          published_at: q("#fTime", dr).value || new Date().toISOString(),
        });
        q("#fTitle", dr).addEventListener("input", updatePreview);
        q("#fSummary", dr).addEventListener("input", updatePreview);

        q("#fSave", dr).addEventListener("click", async () => {
          const f = readForm();
          if (!f.title) return window.toast("标题不能为空", "err");
          const btn = q("#fSave", dr);
          btn.disabled = true;
          const r = await call("f_admin_save_news", {
            p_id: edit ? n.id : null,
            p_title: f.title,
            p_summary: f.summary,
            p_content: f.content,
            p_tag: f.tag || "熊猫圈",
            p_banner: q("#fBanner", dr).checked,
            p_image: cover || null,
            p_images: gallery,
            p_published_at: new Date(f.published_at).toISOString(),
          });
          btn.disabled = false;
          if (!r) return;
          if (r.ok === false) return window.toast(r.error || "保存失败", "err");
          const vis = q("#fVisible", dr).checked;
          if (vis !== (cur.visible !== false)) {
            await call("f_admin_set_news_flags", { p_id: r.id, p_banner: null, p_visible: vis });
          }
          dr.close();
          window.toast(edit ? "动态已更新" : "动态已发布 📰", "ok");
          await loadData(["news"]);
          if (window.refreshNews) await window.refreshNews();
          if (window.renderHome) window.renderHome();
          paint();
        });
      },
    });
  }

  function newsPreviewHTML(n) {
    const key = window.artKeyOf ? window.artKeyOf(n) : "hua";
    return `<div class="adm-preview">
      <div class="pv-cover">${window.imgTag(coverSrc(n.image, key))}</div>
      <div class="pv-body">
        <div class="pv-tag">✦ ${e(n.tag || "每日动态")}</div>
        <div class="pv-title">${e(n.title || "标题会显示在这里")}</div>
        <div class="pv-sum">${e((n.summary || n.content || "").slice(0, 60) || "摘要会显示在这里")}</div>
      </div>
    </div>`;
  }

  function coverPickerHTML(current, fallbackKey) {
    const keys = window.AVATAR_KEYS || [];
    const selKey = isUrl(current) ? "" : current || "";
    return `<div class="adm-imgpick">
      ${keys
        .map(
          (k) => `<button data-pick="${k}" class="${selKey === k ? "sel" : ""}">
            ${picImg(`assets/cov-${k}.webp`)}<span>${pandaNameOfKey(k)}</span></button>`
        )
        .join("")}
    </div>`;
  }

  function previewNews(n) {
    if (!n) return;
    const imgs = Array.isArray(n.images) ? n.images : [];
    drawer({
      title: "动态预览",
      body: `<div class="adm-preview" style="margin-bottom:14px">
          <div class="pv-cover">${window.imgTag(coverSrc(n.image, window.artKeyOf(n)))}</div>
          <div class="pv-body">
            <div class="pv-tag">✦ ${e(n.tag || "每日动态")}</div>
            <div class="pv-title" style="font-size:17px">${e(n.title)}</div>
            <div class="pv-sum">${e(n.summary || "")}</div>
            <div style="font-size:11px;color:#98a2b3;margin-top:8px">${full(n.published_at)}</div>
          </div>
        </div>
        <div style="white-space:pre-wrap;line-height:1.9;font-size:13.5px;color:#3b4453">${e(window.fixText ? window.fixText(n.content || "") : n.content || "")}</div>
        ${imgs.length ? `<div class="adm-gallery" style="margin-top:14px">${imgs.map((g) => `<div class="g-item" style="width:120px;height:84px">${window.imgTag(coverSrc(g))}</div>`).join("")}</div>` : ""}`,
      footer: `<button class="adm-btn" data-x>关闭</button><button class="adm-btn primary" data-act="editn">编辑这篇</button>`,
      onMount: (dr) => {
        q('[data-act="editn"]', dr).addEventListener("click", () => {
          dr.close();
          setTimeout(() => openNewsForm(n), 220);
        });
      },
    });
  }

  /* ---------------- 帖子 ---------------- */
  function pagePosts() {
    const listRaw = filtered(ADM.data.posts, ["nickname", "content"]);
    const { rows: list, pg, total } = pageSlice("posts", listRaw);
    const hidden = ADM.data.posts.filter((p) => p.hidden).length;
    return `${head(`<button class="adm-btn" data-act="refresh">${ICON.refresh} 刷新</button>`)}
      <div class="adm-stats">
        ${stat("帖子总数", ADM.data.posts.length, "全部用户发布", "chat", "mini")}
        ${stat("已隐藏", hidden, "前台不可见", "hide", "mini")}
        ${stat("置顶", ADM.data.posts.filter((p) => p.pinned).length, "熊猫圈顶部", "pin", "mini")}
        ${stat("总点赞", ADM.data.posts.reduce((s, p) => s + (p.likes || 0), 0), "互动热度", "grid", "mini")}
      </div>
      <div class="adm-panel">
        <div class="adm-panel-head"><h3>帖子列表</h3><span class="sub">违规内容可下架并计入用户违规次数</span></div>
        <div class="adm-panel-body flush">
          ${
            list.length
              ? `<div class="adm-tbl-wrap"><table class="adm-tbl">
                <thead><tr><th>作者</th><th>内容</th><th>互动</th><th>状态</th><th>发布时间</th><th style="text-align:right">操作</th></tr></thead>
                <tbody>${list
                  .map(
                    (p) => `<tr>
                    <td><div class="adm-cellmain"><span class="adm-thumb sq rd">${avatarHTML({
                      avatar_seed: p.avatar_seed,
                      nickname: p.nickname,
                    })}</span><div><div style="font-weight:650">${e(p.nickname)}</div>
                      <div style="font-size:11px;color:#98a2b3">${e((p.user_key || "").slice(0, 14))}</div></div></div></td>
                    <td><div class="adm-text-clip">${e(p.content)}</div>
                      ${p.images_count ? `<span class="adm-pill" style="margin-top:5px">🖼 图 ${p.images_count}</span>` : ""}
                      ${p.violation_count ? `<span class="adm-pill r" style="margin-top:5px">违规 ${p.violation_count} 次</span>` : ""}</td>
                    <td class="num" style="white-space:nowrap">❤️ ${p.likes || 0} · 💬 ${p.comment_count || 0}</td>
                    <td>
                      ${p.pinned ? `<span class="adm-pill dark">置顶</span>` : ""}
                      ${p.hidden ? `<span class="adm-pill y">已隐藏</span>` : `<span class="adm-pill g">正常</span>`}
                      ${p.allow_comment === false ? `<span class="adm-pill y">评论已关</span>` : ""}
                    </td>
                    <td class="muted" style="white-space:nowrap">${ago(p.created_at)}</td>
                    <td><div class="adm-rowacts">
                      <button class="adm-btn sm" data-view="${p.id}">${ICON.eye} 详情</button>
                      <button class="adm-btn sm ghost" data-pin="${p.id}">${ICON.pin} ${p.pinned ? "取消置顶" : "置顶"}</button>
                      <button class="adm-btn sm ghost" data-cmt="${p.id}">${p.allow_comment === false ? "开评论" : "关评论"}</button>
                      <button class="adm-btn sm ghost" data-hide="${p.id}">${p.hidden ? "恢复" : "隐藏"}</button>
                      <button class="adm-btn sm danger" data-remove="${p.id}">违规下架</button>
                    </div></td>
                  </tr>`
                  )
                  .join("")}</tbody></table></div>${pageBar(pg, total)}`
              : emptyBox("没有匹配的帖子", "换个关键词试试", "💬")
          }
        </div>
      </div>`;
  }
  AFTER.posts = (root) => {
    root.addEventListener("click", async (ev) => {
      const b = ev.target.closest("[data-act],[data-view],[data-pin],[data-cmt],[data-hide],[data-remove]");
      if (!b) return;
      if (b.dataset.act === "refresh") return refreshAll();
      const id = Number(b.dataset.view || b.dataset.pin || b.dataset.cmt || b.dataset.hide || b.dataset.remove);
      const p = ADM.data.posts.find((x) => x.id === id);
      if (!p) return;
      if (b.dataset.view) return openPostAdmin(p);
      if (b.dataset.cmt) {
        const next = p.allow_comment === false;
        let reason = null;
        if (!next) {
          const input = window.prompt("关闭评论的原因（会显示给用户，可留空）", "");
          if (input === null) return;
          reason = input.trim() || null;
        }
        const r = await call("f_admin_set_comment", { p_id: id, p_allow: next, p_reason: reason });
        if (r !== null) {
          p.allow_comment = next;
          p.comment_lock_reason = next ? null : reason || "管理员关闭了本帖评论";
          await syncAppPosts();
          paint();
          window.toast(next ? "已开启评论" : "已关闭评论", "ok");
        }
        return;
      }
      if (b.dataset.pin) {
        const r = await call("f_admin_set_post_flags", { p_id: id, p_pinned: !p.pinned, p_hidden: null });
        if (r !== null) {
          p.pinned = !p.pinned;
          await syncAppPosts();
          paint();
          window.toast(p.pinned ? "已置顶" : "已取消置顶", "ok");
        }
        return;
      }
      if (b.dataset.hide) {
        const r = await call("f_admin_set_post_flags", { p_id: id, p_pinned: null, p_hidden: !p.hidden });
        if (r !== null) {
          p.hidden = !p.hidden;
          await syncAppPosts();
          paint();
          window.toast(p.hidden ? "已隐藏，前台不再展示" : "已恢复展示", "ok");
        }
        return;
      }
      if (b.dataset.remove) return removePost(p);
    });
  };

  async function syncAppPosts() {
    if (window.refreshPosts) await window.refreshPosts();
    if (window.renderCommunity) window.renderCommunity();
  }

  async function removePost(p) {
    const res = await violationDialog({
      title: "违规下架帖子",
      content: p.content,
      author: p.nickname,
      allowHide: true,
    });
    if (!res) return;
    const r = await call("f_admin_remove_post", {
      p_id: p.id,
      p_reason: res.reason,
      p_action: res.action,
    });
    if (r && r.ok) {
      window.toast(`已下架，${r.nickname || ""} 违规次数 ${r.violations} 次`, "ok");
      await loadData(["admin"]);
      await syncAppPosts();
      if (window.refreshComments) await window.refreshComments();
      paint();
    } else if (r) window.toast(r.error || "操作失败", "err");
  }

  function openPostAdmin(p) {
    const cmts = ADM.data.comments.filter((c) => c.post_id === p.id);
    drawer({
      title: "帖子详情",
      body: `
        <div class="adm-user-hero">
          <span class="av">${avatarHTML({ avatar_seed: p.avatar_seed, nickname: p.nickname })}</span>
          <div><b>${e(p.nickname)}</b><span>${full(p.created_at)} · ${e(p.user_key || "无用户标识")}</span></div>
        </div>
        <div style="white-space:pre-wrap;line-height:1.9;font-size:14px;color:#1b2030;padding:14px;background:#fafbff;border:1px solid #f1f4fa;border-radius:12px">${e(p.content)}</div>
        ${
          p.images_count
            ? `<div class="adm-subhead">帖子配图（${p.images_count}）</div>
               <div class="adm-imgs" id="admPostImgs"><div class="adm-empty" style="padding:18px">加载中…</div></div>`
            : ""
        }
        <div class="adm-kv" style="margin-top:14px">
          <div><b>${p.likes || 0}</b><span>点赞</span></div>
          <div><b>${cmts.length}</b><span>评论</span></div>
          <div><b>${p.violation_count || 0}</b><span>违规次数</span></div>
          <div><b>${p.hidden ? "隐藏" : "正常"}</b><span>状态</span></div>
        </div>
        <div class="adm-subhead">评论区（${cmts.length}）</div>
        ${
          cmts.length
            ? `<div class="adm-mini-list">${cmts
                .map(
                  (c) => `<div class="mi">
                    <div class="mt"><b style="color:#3b4453">${e(c.nickname)}</b><span>${ago(c.created_at)}</span>
                      ${c.parent_id ? `<span class="adm-pill">回复 #${c.parent_id}</span>` : ""}
                      <button class="adm-btn sm danger" style="margin-left:auto;height:22px" data-cdel="${c.id}">删除</button></div>
                    <p>${e(c.content)}</p></div>`
                )
                .join("")}</div>`
            : `<div class="adm-empty" style="padding:24px">还没有评论</div>`
        }`,
      footer: `<button class="adm-btn" data-x>关闭</button>
        <button class="adm-btn" data-act="hidep">${p.hidden ? "恢复展示" : "隐藏帖子"}</button>
        <button class="adm-btn danger" data-act="delp">违规下架</button>`,
      onMount: (dr) => {
        /* 配图不再随列表全量下发，打开详情时按需取一次 */
        if (p.images_count) {
          window.db
            .from("posts")
            .select("images")
            .eq("id", p.id)
            .then(({ data }) => {
              const box = q("#admPostImgs", dr);
              if (!box) return;
              const imgs = Array.isArray(data && data[0] && data[0].images) ? data[0].images : [];
              box.innerHTML = imgs.length
                ? imgs.map((u) => `<span style="background-image:url('${u}')"></span>`).join("")
                : `<div class="adm-empty" style="padding:18px">图片读取失败</div>`;
            });
        }
        q('[data-act="hidep"]', dr).addEventListener("click", async () => {
          const r = await call("f_admin_set_post_flags", { p_id: p.id, p_pinned: null, p_hidden: !p.hidden });
          if (r !== null) {
            p.hidden = !p.hidden;
            await syncAppPosts();
            dr.close();
            paint();
          }
        });
        q('[data-act="delp"]', dr).addEventListener("click", () => {
          dr.close();
          setTimeout(() => removePost(p), 220);
        });
        qa("[data-cdel]", dr).forEach((b) =>
          b.addEventListener("click", async () => {
            const cid = Number(b.dataset.cdel);
            const c = ADM.data.comments.find((x) => x.id === cid);
            if (!c) return;
            const ok = await window.askConfirm("删除这条评论？", "删除后可计入作者违规次数。", "删除");
            if (!ok) return;
            const r = await call("f_admin_remove_comment", { p_id: cid, p_reason: "评论违规", p_action: "delete" });
            if (r) {
              window.toast("评论已删除", "ok");
              await loadData(["admin"]);
              await syncAppPosts();
              dr.close();
              paint();
            }
          })
        );
      },
    });
  }

  /* ---------------- 评论 ---------------- */
  function pageComments() {
    const { rows: list, pg, total } = pageSlice("comments", filtered(ADM.data.comments, ["nickname", "content", "post_content"]));
    return `${head("")}
      <div class="adm-stats">
        ${stat("评论总数", ADM.data.comments.length, "包含回复", "msg", "mini")}
        ${stat("今日新增", ADM.data.comments.filter((c) => Date.now() - new Date(c.created_at) < 864e5).length, "最近 24 小时", "calendar", "mini")}
        ${stat("回复", ADM.data.comments.filter((c) => c.parent_id).length, "多层对话", "chat", "mini")}
        ${stat("评论者", new Set(ADM.data.comments.map((c) => c.nickname)).size, "参与用户", "users", "mini")}
      </div>
      <div class="adm-panel">
        <div class="adm-panel-head"><h3>评论列表</h3><span class="sub">点击删除会记录违规，可在违规记录里追溯</span></div>
        <div class="adm-panel-body flush">
          ${
            list.length
              ? `<div class="adm-tbl-wrap"><table class="adm-tbl">
                <thead><tr><th>评论者</th><th>内容</th><th>所属帖子</th><th>时间</th><th style="text-align:right">操作</th></tr></thead>
                <tbody>${list
                  .map(
                    (c) => `<tr>
                    <td><div class="adm-cellmain"><span class="adm-thumb sq rd">${avatarHTML({
                      avatar_seed: c.avatar_seed,
                      nickname: c.nickname,
                    })}</span><span style="font-weight:650">${e(c.nickname)}</span></div></td>
                    <td><div class="adm-text-clip" style="max-width:340px">${e(c.content)}</div>
                      ${c.parent_id ? `<span class="adm-pill" style="margin-top:4px">回复 #${c.parent_id}</span>` : ""}</td>
                    <td><div class="adm-text-clip muted" style="max-width:220px;font-size:12px">${e(c.post_content || "（帖子已删除）")}</div></td>
                    <td class="muted" style="white-space:nowrap">${ago(c.created_at)}</td>
                    <td><div class="adm-rowacts">
                      <button class="adm-btn sm ghost" data-cdel="${c.id}">删除</button>
                      <button class="adm-btn sm danger" data-cremove="${c.id}">记违规下架</button>
                    </div></td>
                  </tr>`
                  )
                  .join("")}</tbody></table></div>${pageBar(pg, total)}`
              : emptyBox("没有匹配的评论", "换个关键词试试", "💬")
          }
        </div>
      </div>`;
  }
  AFTER.comments = (root) => {
    root.addEventListener("click", async (ev) => {
      const b = ev.target.closest("[data-cdel],[data-cremove]");
      if (!b) return;
      const id = Number(b.dataset.cdel || b.dataset.cremove);
      const c = ADM.data.comments.find((x) => x.id === id);
      if (!c) return;
      if (b.dataset.cdel) {
        const ok = await window.askConfirm("删除这条评论？", "仅删除内容，不计入违规次数。", "删除");
        if (!ok) return;
        const r = await call("f_admin_remove_comment", { p_id: id, p_reason: null, p_action: "delete" });
        if (r) {
          window.toast("评论已删除", "ok");
          await loadData(["admin"]);
          await syncAppPosts();
          if (window.refreshComments) await window.refreshComments();
          paint();
        }
        return;
      }
      const res = await violationDialog({ title: "违规评论", content: c.content, author: c.nickname });
      if (!res) return;
      const r = await call("f_admin_remove_comment", { p_id: id, p_reason: res.reason, p_action: "delete" });
      if (r && r.ok) {
        window.toast(`已下架，${r.nickname || ""} 违规次数 ${r.violations} 次`, "ok");
        await loadData(["admin"]);
        await syncAppPosts();
        if (window.refreshComments) await window.refreshComments();
        paint();
      }
    });
  };

  /* ---------------- 熊猫图鉴 ---------------- */
  function pagePandas() {
    const list = filtered(ADM.data.pandas, ["name", "base", "personality", "hobbies", "bio"]);
    return `${head(`<button class="adm-btn primary" data-act="new">${ICON.plus} 添加熊猫</button>`)}
      <div class="adm-panel">
        <div class="adm-panel-head"><h3>在册熊猫 ${ADM.data.pandas.length} 只</h3><span class="sub">名字、基地、父母、性格、爱好与照片均可修改</span></div>
        <div class="adm-panel-body">
          ${
            list.length
              ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(238px,1fr));gap:12px">
                ${list
                  .map(
                    (p) => `<div style="border:1px solid #e9edf5;border-radius:13px;overflow:hidden;background:#fcfdff">
                    <div style="height:118px;background:#eef1f7;position:relative">
                      ${window.imgTag(pandaSrc(p.photo, window.pandaKey(p)), "", 'style="width:100%;height:100%;object-fit:cover"')}
                      <span class="adm-pill ${p.visible === false ? "" : "g"}" style="position:absolute;left:8px;top:8px">${p.visible === false ? "已下线" : "展示中"}</span>
                      <span class="adm-pill ${p.gender === "女" ? "r" : "b"}" style="position:absolute;right:8px;top:8px">${p.gender === "女" ? "♀ 女" : "♂ 男"}</span>
                    </div>
                    <div style="padding:11px 12px 12px">
                      <div style="display:flex;align-items:center;gap:6px">
                        <b style="font-size:14.5px">${e(p.name)}</b>
                        <span style="font-size:11px;color:#98a2b3">${window.calcAge ? window.calcAge(p.birth_date) : ""}</span>
                      </div>
                      <div style="font-size:11.5px;color:#8d97a8;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e(p.base || "基地未知")}</div>
                      <div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap">
                        ${(p.personality || "")
                          .split("、")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((t) => `<span class="adm-pill">${e(t)}</span>`)
                          .join("")}
                      </div>
                      <div class="adm-rowacts" style="margin-top:10px;justify-content:flex-start">
                        <button class="adm-btn sm" data-pedit="${p.id}">${ICON.edit} 编辑</button>
                        <button class="adm-btn sm ghost" data-pview="${p.id}">${ICON.eye}</button>
                        <button class="adm-btn sm ghost" data-pvis="${p.id}">${p.visible === false ? "上线" : "下线"}</button>
                        <button class="adm-btn sm danger" data-pdel="${p.id}">${ICON.trash}</button>
                      </div>
                    </div>
                  </div>`
                  )
                  .join("")}</div>`
              : emptyBox("没有匹配的熊猫", "换个关键词，或添加一只", "🐼")
          }
        </div>
      </div>`;
  }
  AFTER.pandas = (root) => {
    root.addEventListener("click", async (ev) => {
      const b = ev.target.closest("[data-act],[data-pedit],[data-pview],[data-pvis],[data-pdel]");
      if (!b) return;
      if (b.dataset.act === "new") return openPandaForm(null);
      const id = Number(b.dataset.pedit || b.dataset.pview || b.dataset.pvis || b.dataset.pdel);
      const p = ADM.data.pandas.find((x) => x.id === id);
      if (!p) return;
      if (b.dataset.pedit) return openPandaForm(p);
      if (b.dataset.pview && window.openPanda) return window.openPanda(p.id);
      if (b.dataset.pvis) {
        const r = await call("f_admin_set_panda_visible", { p_id: p.id, p_visible: p.visible === false });
        if (r !== null) {
          await loadData(["pandas"]);
          if (window.renderPandas) window.renderPandas();
          if (window.renderHome) window.renderHome(); /* 首页「熊猫速览」同步 */
          paint();
          window.toast("已更新展示状态", "ok");
        }
        return;
      }
      if (b.dataset.pdel) {
        const ok = await window.askConfirm("删除这只熊猫？", `${p.name} 的档案会从图鉴中移除，帖子与动态不受影响。`, "删除");
        if (!ok) return;
        const r = await call("f_admin_delete_panda", { p_id: p.id }, "已删除");
        if (r !== null) {
          await loadData(["pandas"]);
          if (window.renderPandas) window.renderPandas();
          if (window.renderHome) window.renderHome(); /* 首页「熊猫速览」同步 */
          paint();
        }
      }
    });
  };

  function openPandaForm(p) {
    const edit = !!p;
    const cur = p || { name: "", base: "", gender: "女", birth_date: "", father: "", mother: "", personality: "", hobbies: "", bio: "", photo: "", sort_order: 100 };
    const keys = window.AVATAR_KEYS || [];
    drawer({
      title: edit ? `编辑 · ${cur.name}` : "添加熊猫",
      body: `
        <div class="adm-grid2">
          <div class="adm-field"><label>名字<span>*</span></label><input class="adm-input" id="pName" value="${e(cur.name)}" maxlength="20" /></div>
          <div class="adm-field"><label>性别</label>
            <select class="adm-select" id="pGender">
              <option value="女" ${cur.gender === "女" ? "selected" : ""}>女</option>
              <option value="男" ${cur.gender === "男" ? "selected" : ""}>男</option>
              <option value="未知" ${cur.gender === "未知" ? "selected" : ""}>未知</option>
            </select></div>
        </div>
        <div class="adm-field"><label>所在基地</label><input class="adm-input" id="pBase" value="${e(cur.base || "")}" placeholder="如：成都大熊猫繁育研究基地" /></div>
        <div class="adm-grid2">
          <div class="adm-field"><label>出生日期</label><input class="adm-input" id="pBirth" value="${e(cur.birth_date || "")}" placeholder="2020-07-04" /></div>
          <div class="adm-field"><label>排序（小的靠前）</label><input class="adm-input" id="pSort" type="number" value="${cur.sort_order ?? 100}" /></div>
        </div>
        <div class="adm-grid2">
          <div class="adm-field"><label>父亲</label><input class="adm-input" id="pFather" value="${e(cur.father || "")}" /></div>
          <div class="adm-field"><label>母亲</label><input class="adm-input" id="pMother" value="${e(cur.mother || "")}" /></div>
        </div>
        <div class="adm-field"><label>性格</label><input class="adm-input" id="pPersonality" value="${e(cur.personality || "")}" placeholder="用、分隔，如：温顺、好奇、贪吃" /></div>
        <div class="adm-field"><label>爱好</label><input class="adm-input" id="pHobbies" value="${e(cur.hobbies || "")}" placeholder="如：爬树、滚泥巴" /></div>
        <div class="adm-field"><label>小传</label><textarea class="adm-textarea" id="pBio" style="min-height:88px">${e(cur.bio || "")}</textarea></div>
        <div class="adm-field"><label>封面照片</label>
          <div class="adm-imgpick" id="pPhotoPick">
            ${keys
              .map(
                (k) => `<button data-pkey="${k}" class="${!isUrl(cur.photo) && (cur.photo || window.pandaKey(cur)) === k ? "sel" : ""}">
                  ${picImg(`assets/p-${k}.webp`)}<span>${pandaNameOfKey(k)}</span></button>`
              )
              .join("")}
          </div>
          <div class="adm-uploadrow">
            <input class="adm-input" id="pPhotoUrl" placeholder="或粘贴照片链接" value="${isUrl(cur.photo) ? e(cur.photo) : ""}" />
            <button class="adm-btn" id="pPhotoUp">${ICON.upload} 上传</button>
          </div>
        </div>`,
      footer: `<button class="adm-btn" data-x>取消</button><button class="adm-btn primary" id="pSave">${edit ? "保存" : "添加"}</button>`,
      onMount: (dr) => {
        let photo = cur.photo || "";
        q("#pPhotoPick", dr).addEventListener("click", (ev) => {
          const b = ev.target.closest("[data-pkey]");
          if (!b) return;
          photo = b.dataset.pkey;
          qa("#pPhotoPick .sel", dr).forEach((x) => x.classList.remove("sel"));
          b.classList.add("sel");
          q("#pPhotoUrl", dr).value = "";
        });
        q("#pPhotoUrl", dr).addEventListener("input", (ev) => {
          photo = ev.target.value.trim();
          qa("#pPhotoPick .sel", dr).forEach((x) => x.classList.remove("sel"));
        });
        q("#pPhotoUp", dr).addEventListener("click", () =>
          pickLocalImage(4 / 3, (src) => {
            photo = src;
            q("#pPhotoUrl", dr).value = "";
            qa("#pPhotoPick .sel", dr).forEach((x) => x.classList.remove("sel"));
          })
        );
        q("#pSave", dr).addEventListener("click", async () => {
          const name = q("#pName", dr).value.trim();
          if (!name) return window.toast("名字不能为空", "err");
          const btn = q("#pSave", dr);
          btn.disabled = true;
          const r = await call("f_admin_save_panda", {
            p_id: edit ? p.id : null,
            p_name: name,
            p_base: q("#pBase", dr).value.trim(),
            p_gender: q("#pGender", dr).value,
            p_birth_date: q("#pBirth", dr).value.trim(),
            p_father: q("#pFather", dr).value.trim(),
            p_mother: q("#pMother", dr).value.trim(),
            p_personality: q("#pPersonality", dr).value.trim(),
            p_hobbies: q("#pHobbies", dr).value.trim(),
            p_bio: q("#pBio", dr).value.trim(),
            p_photo: photo || null,
            p_sort_order: Number(q("#pSort", dr).value) || 100,
          });
          btn.disabled = false;
          if (!r) return;
          if (r.ok === false) return window.toast(r.error || "保存失败", "err");
          dr.close();
          window.toast(edit ? "档案已更新" : "已添加", "ok");
          await loadData(["pandas"]);
          if (window.renderPandas) window.renderPandas();
          if (window.renderHome) window.renderHome(); /* 首页「熊猫速览」同步 */
          paint();
        });
      },
    });
  }

  /* ---------------- 用户 ---------------- */
  function pageUsers() {
    const { rows: list, pg, total } = pageSlice("users", filtered(ADM.data.users, ["nickname", "user_key"]));
    const banned = ADM.data.users.filter((u) => u.banned).length;
    return `${head("")}
      <div class="adm-stats">
        ${stat("注册用户", ADM.data.users.length, "本机身份聚合", "users", "mini")}
        ${stat("已封禁", banned, "禁止发帖评论", "ban", "mini")}
        ${stat("有违规记录", ADM.data.users.filter((u) => (u.violations || 0) > 0).length, "需重点关注", "shield", "mini")}
        ${stat("发过帖的用户", ADM.data.users.filter((u) => (u.posts || 0) > 0).length, "活跃创作者", "chat", "mini")}
      </div>
      <div class="adm-panel">
        <div class="adm-panel-head"><h3>用户列表</h3><span class="sub">封号后该用户无法继续发帖与评论</span></div>
        <div class="adm-panel-body flush">
          ${
            list.length
              ? `<div class="adm-tbl-wrap"><table class="adm-tbl">
                <thead><tr><th>用户</th><th>账号</th><th>注册时间</th><th>内容</th><th>违规次数</th><th>状态</th><th style="text-align:right">操作</th></tr></thead>
                <tbody>${list
                  .map(
                    (u) => `<tr>
                    <td><div class="adm-cellmain"><span class="adm-thumb sq rd">${avatarHTML(u)}</span>
                      <div><div style="font-weight:650">${e(u.nickname || "未设置昵称")}</div>
                      <div style="font-size:11px;color:#98a2b3">${e((u.user_key || "").slice(0, 20))}</div></div></div></td>
                    <td>${
                      u.email
                        ? `<span class="adm-pill" title="${e(u.email)}">${e(maskMail(u.email))}</span>`
                        : `<span class="adm-pill y">未绑定</span>`
                    }</td>
                    <td class="muted" style="white-space:nowrap">${full(u.created_at).slice(0, 10)}</td>
                    <td class="num" style="white-space:nowrap">帖 ${u.posts || 0} · 评 ${u.comments || 0}</td>
                    <td>${u.violations ? `<span class="adm-pill r">${u.violations} 次</span>` : `<span class="adm-pill g">0</span>`}</td>
                    <td>${u.banned ? `<span class="adm-pill r">已封禁</span>` : `<span class="adm-pill g">正常</span>`}</td>
                    <td><div class="adm-rowacts">
                      <button class="adm-btn sm" data-uview="${e(u.user_key)}">${ICON.eye} 详情</button>
                      ${
                        u.banned
                          ? `<button class="adm-btn sm" data-unban="${e(u.user_key)}">解封</button>`
                          : `<button class="adm-btn sm danger" data-ban="${e(u.user_key)}">封号</button>`
                      }
                    </div></td>
                  </tr>`
                  )
                  .join("")}</tbody></table></div>${pageBar(pg, total)}`
              : emptyBox("还没有用户", "用户首次登录后会出现在这里", "👤")
          }
        </div>
      </div>`;
  }
  AFTER.users = (root) => {
    root.addEventListener("click", async (ev) => {
      const b = ev.target.closest("[data-uview],[data-ban],[data-unban]");
      if (!b) return;
      const key = b.dataset.uview || b.dataset.ban || b.dataset.unban;
      const u = ADM.data.users.find((x) => x.user_key === key);
      if (!u) return;
      if (b.dataset.uview) return openUserDrawer(u);
      if (b.dataset.unban) {
        const r = await call("f_admin_set_ban", { p_key: key, p_banned: false, p_reason: null });
        if (r && r.ok) {
          u.banned = false;
          window.toast("已解封", "ok");
          await loadData(["admin"]);
          paint();
        }
        return;
      }
      const reason = await banDialog(u);
      if (reason === null) return;
      const r = await call("f_admin_set_ban", { p_key: key, p_banned: true, p_reason: reason });
      if (r && r.ok) {
        window.toast("已封禁该账号", "ok");
        await loadData(["admin"]);
        paint();
      }
    });
  };

  function banDialog(u) {
    return new Promise((resolve) => {
      const dr = drawer({
        title: `封禁 · ${u.nickname || "用户"}`,
        body: `<div class="adm-field"><label>封禁原因</label>
            <textarea class="adm-textarea" id="banReason" placeholder="如：多次发布攻击性言论">${e(u.ban_reason || "")}</textarea>
            <div class="hint">原因会展示给该用户，也会记入本次操作。</div></div>
          <div class="adm-field"><label>该用户累计违规 <b style="color:#e5484d">${u.violations || 0}</b> 次</label></div>`,
        footer: `<button class="adm-btn" data-x>取消</button><button class="adm-btn danger" id="banGo">确认封禁</button>`,
        onMount: (d) => {
          q("#banGo", d).addEventListener("click", () => {
            const v = q("#banReason", d).value.trim() || "违反社区规范";
            resolve(v);
            d.close();
          });
          d._onClose(() => resolve(null));
        },
      });
    });
  }

  function openUserDrawer(u) {
    const posts = ADM.data.posts.filter((p) => p.user_key === u.user_key);
    const cmts = ADM.data.comments.filter((c) => c.user_key === u.user_key);
    const vs = ADM.data.violations.filter((v) => v.user_key === u.user_key);
    drawer({
      title: "用户详情",
      body: `
        <div class="adm-user-hero">
          <span class="av">${avatarHTML(u)}</span>
          <div><b>${e(u.nickname || "未设置昵称")}</b>
            <span>${e(u.user_key)} · 加入于 ${full(u.created_at).slice(0, 10)}</span></div>
          ${u.banned ? `<span class="adm-pill r" style="margin-left:auto">已封禁</span>` : `<span class="adm-pill g" style="margin-left:auto">正常</span>`}
        </div>
        ${u.banned && u.ban_reason ? `<div style="background:#fff7f7;border:1px solid #fbd5d6;color:#b42318;border-radius:10px;padding:10px 12px;font-size:12.5px;margin-bottom:14px">封禁原因：${e(u.ban_reason)}</div>` : ""}
        <div class="adm-kv">
          <div><b>${u.posts || 0}</b><span>帖子</span></div>
          <div><b>${u.comments || 0}</b><span>评论</span></div>
          <div><b>${u.violations || 0}</b><span>违规</span></div>
          <div><b>${u.likes || 0}</b><span>获赞</span></div>
        </div>
        <div class="adm-subhead">违规内容（${vs.length}）</div>
        ${
          vs.length
            ? `<div class="adm-mini-list">${vs
                .map(
                  (v) => `<div class="mi"><div class="mt"><span class="adm-pill ${v.target_type === "post" ? "b" : "y"}">${v.target_type === "post" ? "帖子" : "评论"}</span>
                  <span>${full(v.created_at)}</span></div><p>${e(v.content || "")}</p>
                  <div class="mt" style="margin-top:4px">原因：${e(v.reason || "")} · 处理：${v.action === "hide" ? "隐藏" : "删除"}</div></div>`
                )
                .join("")}</div>`
            : `<div class="adm-empty" style="padding:20px">没有违规记录</div>`
        }
        <div class="adm-subhead">该用户的帖子（${posts.length}）</div>
        ${
          posts.length
            ? `<div class="adm-mini-list">${posts
                .map(
                  (p) => `<div class="mi"><div class="mt"><span>${full(p.created_at)}</span>
                  ${p.hidden ? `<span class="adm-pill y">隐藏</span>` : ""}<span>❤️ ${p.likes || 0} · 💬 ${p.comment_count || 0}</span></div>
                  <p>${e(p.content)}</p></div>`
                )
                .join("")}</div>`
            : `<div class="adm-empty" style="padding:20px">还没有发过帖子</div>`
        }
        <div class="adm-subhead">该用户的评论（${cmts.length}）</div>
        ${
          cmts.length
            ? `<div class="adm-mini-list">${cmts
                .slice(0, 20)
                .map((c) => `<div class="mi"><div class="mt"><span>${full(c.created_at)}</span></div><p>${e(c.content)}</p></div>`)
                .join("")}</div>`
            : `<div class="adm-empty" style="padding:20px">还没有评论</div>`
        }`,
      footer: `<button class="adm-btn" data-x>关闭</button>
        ${
          u.banned
            ? `<button class="adm-btn primary" data-act="unban">解除封禁</button>`
            : `<button class="adm-btn danger" data-act="ban">封禁账号</button>`
        }`,
      onMount: (dr) => {
        const un = q('[data-act="unban"]', dr);
        if (un)
          un.addEventListener("click", async () => {
            const r = await call("f_admin_set_ban", { p_key: u.user_key, p_banned: false, p_reason: null });
            if (r && r.ok) {
              u.banned = false;
              dr.close();
              await loadData(["admin"]);
              paint();
              window.toast("已解封", "ok");
            }
          });
        const bn = q('[data-act="ban"]', dr);
        if (bn)
          bn.addEventListener("click", async () => {
            dr.close();
            const reason = await banDialog(u);
            if (reason === null) return;
            const r = await call("f_admin_set_ban", { p_key: u.user_key, p_banned: true, p_reason: reason });
            if (r && r.ok) {
              u.banned = true;
              await loadData(["admin"]);
              paint();
              window.toast("已封禁", "ok");
            }
          });
      },
    });
  }

  /* ---------------- 违规记录 ---------------- */
  function pageViolations() {
    const { rows: list, pg, total } = pageSlice("violations", filtered(ADM.data.violations, ["nickname", "content", "reason"]));
    return `${head("")}
      <div class="adm-panel">
        <div class="adm-panel-head"><h3>违规记录 ${ADM.data.violations.length} 条</h3>
          <span class="sub">记录会持续保留，可追溯到具体内容与处理原因</span></div>
        <div class="adm-panel-body flush">
          ${
            list.length
              ? `<div class="adm-tbl-wrap"><table class="adm-tbl">
                <thead><tr><th>时间</th><th>用户</th><th>类型</th><th>违规内容</th><th>处理原因</th><th>累计</th><th style="text-align:right">操作</th></tr></thead>
                <tbody>${list
                  .map(
                    (v) => `<tr>
                    <td class="muted" style="white-space:nowrap">${full(v.created_at)}</td>
                    <td><div style="font-weight:650">${e(v.nickname || "匿名")}</div>
                      <div style="font-size:11px;color:#98a2b3">${e((v.user_key || "").slice(0, 16))}</div></td>
                    <td><span class="adm-pill ${v.target_type === "post" ? "b" : "y"}">${v.target_type === "post" ? "帖子" : "评论"}</span></td>
                    <td><div class="adm-text-clip" style="max-width:300px">${e(v.content || "")}</div></td>
                    <td class="muted">${e(v.reason || "—")}</td>
                    <td>${v.user_banned ? `<span class="adm-pill r">已封禁</span>` : `<span class="adm-pill">${v.user_violations || 0} 次</span>`}</td>
                    <td><div class="adm-rowacts">
                      <button class="adm-btn sm ghost" data-vdel="${v.id}">删除记录</button>
                      ${v.user_key ? `<button class="adm-btn sm danger" data-vban="${e(v.user_key)}">封号</button>` : ""}
                    </div></td>
                  </tr>`
                  )
                  .join("")}</tbody></table></div>${pageBar(pg, total)}`
              : emptyBox("暂无违规记录", "所有处理过的违规内容都会记录在这里", "🛡️")
          }
        </div>
      </div>`;
  }
  /* ---------------- 用户举报 ---------------- */
  function pageReports() {
    const all = ADM.data.reports || [];
    const tab = ADM.rTab || "pending";
    const pend = all.filter((r) => r.status === "pending");
    const { rows: list, pg, total } = pageSlice(
      "reports",
      (tab === "handled" ? all.filter((r) => r.status !== "pending") : pend).filter((r) => {
        const f = ADM.filter.toLowerCase();
        if (!f) return true;
        return [r.reporter_nickname, r.reason, r.detail, r.handle_note].some((v) => String(v || "").toLowerCase().includes(f));
      })
    );
    const tabBtn = (k, label, n) =>
      `<button class="adm-seg ${tab === k ? "on" : ""}" data-rtab="${k}">${label}${k === "pending" && n ? `<i>${n}</i>` : ""}</button>`;

    return `${head("")}
      <div class="adm-panel">
        <div class="adm-panel-head">
          <h3>举报 ${all.length} 条</h3>
          <span class="sub">处理时可选「隐藏」「下架」或「忽略误报」，处理后用户侧不再提示</span>
          <div class="right adm-segtabs">
            ${tabBtn("pending", "待处理", pend.length)}${tabBtn("handled", "已处理")}
          </div>
        </div>
        <div class="adm-panel-body flush">
          ${
            list.length
              ? `<table class="adm-tbl"><thead><tr>
                  <th>举报人</th><th>举报内容</th><th>原因</th><th>时间</th><th>状态</th><th style="text-align:right">操作</th>
                </tr></thead><tbody>
                ${list
                  .map((r) => {
                    const isPost = r.target_type === "post";
                    const stillThere = isPost
                      ? ADM.data.posts.some((p) => p.id === r.target_id)
                      : ADM.data.comments.some((c) => c.id === r.target_id);
                    return `<tr>
                      <td><b>${e(r.reporter_nickname || "熊猫迷")}</b><div class="muted" style="font-size:11px">${ago(r.created_at)}</div></td>
                      <td>
                        <span class="adm-pill ${isPost ? "b" : ""}">${isPost ? "帖子" : "评论"} #${r.target_id}</span>
                        ${!stillThere ? `<span class="adm-pill g" style="margin-top:4px">内容已不在</span>` : ""}
                        <div class="adm-text-clip" style="margin-top:5px;max-width:280px">${e(r.detail || "")}</div>
                      </td>
                      <td><div class="adm-text-clip" style="max-width:150px">${e(r.reason || "")}</div></td>
                      <td class="muted" style="white-space:nowrap">${full(r.created_at).slice(0, 16)}</td>
                      <td>${
                        r.status === "pending"
                          ? `<span class="adm-pill y">待处理</span>`
                          : `<span class="adm-pill g">已处理</span>${
                              r.handle_note ? `<div class="muted" style="font-size:11px;margin-top:4px">${e(r.handle_note)}</div>` : ""
                            }`
                      }</td>
                      <td><div class="adm-rowacts">
                        ${
                          r.status === "pending" && stillThere
                            ? `<button class="adm-btn sm ghost" data-rhide="${r.id}">隐藏</button>
                               <button class="adm-btn sm danger" data-rdel="${r.id}">下架</button>
                               <button class="adm-btn sm" data-rskip="${r.id}">忽略</button>`
                            : r.status === "pending"
                              ? `<button class="adm-btn sm" data-rskip="${r.id}">忽略</button>`
                              : ""
                        }
                      </div></td>
                    </tr>`;
                  })
                  .join("")}
                </tbody></table>${pageBar(pg, total)}`
              : emptyBox(tab === "pending" ? "没有待处理的举报" : "暂无已处理记录", "用户在帖子或评论里点「举报」后会出现在这里", "🚩")
          }
        </div>
      </div>`;
  }
  AFTER.reports = (root) => {
    root.addEventListener("click", async (ev) => {
      const seg = ev.target.closest("[data-rtab]");
      if (seg) {
        ADM.rTab = seg.dataset.rtab;
        paint();
        return;
      }
      const b = ev.target.closest("[data-rhide],[data-rdel],[data-rskip]");
      if (!b) return;
      const r = (ADM.data.reports || []).find((x) => x.id === Number(b.dataset.rhide || b.dataset.rdel || b.dataset.rskip));
      if (!r) return;

      if (b.dataset.rskip) {
        const ok = await window.askConfirm("忽略这条举报？", "标记为已处理，不处置内容。", "忽略");
        if (!ok) return;
        const res = await call("f_admin_handle_report", { p_id: r.id, p_action: "ignore", p_note: null }, "已忽略");
        if (res && res.ok !== false) {
          r.status = "handled";
          r.handle_note = "忽略";
          await loadData(["admin"]);
          paint();
        }
        return;
      }

      const act = b.dataset.rhide ? "hide" : "delete";
      const ok = await window.askConfirm(
        act === "hide" ? "隐藏该内容并处理举报？" : "下架（彻底删除）该内容？",
        act === "hide"
          ? "内容将对所有人隐藏并锁定评论，作者违规次数 +1，无法自行恢复。"
          : "内容和它的全部评论将被彻底删除，作者违规次数 +1，无法恢复。",
        act === "hide" ? "隐藏" : "下架"
      );
      if (!ok) return;
      const note = window.prompt("处理原因（会记录在违规档案里，可留空）", r.reason || "") || "";
      if (note === null) return;
      const fn = r.target_type === "post" ? "f_admin_remove_post" : "f_admin_remove_comment";
      const res = await call(fn, { p_id: r.target_id, p_reason: note || r.reason || "用户举报核实", p_action: act });
      if (res === null) return;
      const res2 = await call("f_admin_handle_report", { p_id: r.id, p_action: act, p_note: note || r.reason || "" });
      if (res2 && res2.ok !== false) {
        r.status = "handled";
        r.handle_note = (note || r.reason || "") + ` (${act})`;
        await loadData(["admin"]);
        paint();
        window.toast("已处理举报", "ok");
      }
    });
  };

  /* ---------------- 操作日志 ---------------- */
  function pageLogs() {
    const { rows: list, pg, total } = pageSlice("logs", ADM.data.logs || []);
    return `${head("")}
      <div class="adm-panel">
        <div class="adm-panel-head"><h3>最近操作</h3>
          <span class="sub">后台的每个写操作都会自动留痕，用于回溯问题</span></div>
        <div class="adm-panel-body flush">
          ${
            list.length
              ? `<table class="adm-tbl"><thead><tr><th>操作</th><th>对象</th><th>说明</th><th>时间</th></tr></thead><tbody>
                ${list
                  .map(
                    (l) => `<tr>
                      <td><b>${e(l.action || "")}</b></td>
                      <td class="muted">${e(l.target || "—")}</td>
                      <td><div class="adm-text-clip" style="max-width:280px">${e(l.detail || "")}</div></td>
                      <td class="muted" style="white-space:nowrap">${full(l.created_at).slice(0, 19)}</td>
                    </tr>`
                  )
                  .join("")}
                </tbody></table>${pageBar(pg, total)}`
              : emptyBox("还没有日志", "对内容或用户做出第一个操作后，这里就会有记录", "🗒️")
          }
        </div>
      </div>`;
  }

  AFTER.violations = (root) => {
    root.addEventListener("click", async (ev) => {
      const b = ev.target.closest("[data-vdel],[data-vban]");
      if (!b) return;
      if (b.dataset.vdel) {
        const ok = await window.askConfirm("删除这条记录？", "仅删除记录，不会恢复已删除的内容。", "删除");
        if (!ok) return;
        const r = await call("f_admin_delete_violation", { p_id: Number(b.dataset.vdel) });
        if (r !== null) {
          await loadData(["admin"]);
          paint();
          window.toast("记录已删除", "ok");
        }
        return;
      }
      const key = b.dataset.vban;
      const u = ADM.data.users.find((x) => x.user_key === key) || { user_key: key, nickname: b.dataset.nick || "用户" };
      const reason = await banDialog(u);
      if (reason === null) return;
      const r = await call("f_admin_set_ban", { p_key: key, p_banned: true, p_reason: reason });
      if (r && r.ok) {
        await loadData(["admin"]);
        paint();
        window.toast("已封禁", "ok");
      }
    });
  };

  /* ---------------- 设置 ---------------- */
  function pageSettings() {
    return `${head("")}
      <div class="adm-cols">
        <div>
        <div class="adm-panel">
          <div class="adm-panel-head"><h3>修改管理密码</h3><span class="sub">修改后需要重新登录</span></div>
          <div class="adm-panel-body">
            <div class="adm-field"><label>当前密码</label><input class="adm-input" type="password" id="oldPwd" placeholder="当前管理员密码" /></div>
            <div class="adm-grid2">
              <div class="adm-field"><label>新密码</label><input class="adm-input" type="password" id="newPwd" placeholder="至少 6 位" /></div>
              <div class="adm-field"><label>确认新密码</label><input class="adm-input" type="password" id="newPwd2" placeholder="再输入一次" /></div>
            </div>
            <button class="adm-btn primary" id="pwdGo">保存新密码</button>
            <div class="hint" style="margin-top:10px">密码以加盐 MD5 存储于云端，页面代码里没有任何明文。</div>
          </div>
        </div>
        <div class="adm-panel">
          <div class="adm-panel-head"><h3>评论开关</h3><span class="sub">紧急时可一键暂停全站评论</span></div>
          <div class="adm-panel-body">
            <label style="display:flex;align-items:center;gap:9px;font-size:13px;font-weight:650;color:#344054;margin-bottom:14px;cursor:pointer">
              <input type="checkbox" id="cmtEnabled" style="width:16px;height:16px;accent-color:#2158e8" />
              全站允许评论
            </label>
            <div class="adm-field">
              <label>帖子发布多少天后自动关闭评论（0 = 不自动关闭）</label>
              <input class="adm-input" id="cmtDays" type="number" min="0" max="365" placeholder="0" />
            </div>
            <button class="adm-btn primary" id="cmtSave">保存评论设置</button>
            <div class="hint" style="margin-top:10px">关闭后所有帖子的评论入口变灰，服务端也会拒绝提交。单个帖子的开关在「熊猫圈帖子」里。</div>
          </div>
        </div>
        </div>
        <div>
          <div class="adm-panel">
            <div class="adm-panel-head"><h3>系统信息</h3></div>
            <div class="adm-panel-body">
              <div class="adm-kv" style="grid-template-columns:1fr 1fr;margin-bottom:0">
                <div><b>${ADM.data.news.length}</b><span>首页动态</span></div>
                <div><b>${ADM.data.pandas.length}</b><span>熊猫档案</span></div>
                <div><b>${ADM.data.posts.length}</b><span>帖子</span></div>
                <div><b>${ADM.data.comments.length}</b><span>评论</span></div>
              </div>
            </div>
          </div>
          <div class="adm-panel">
            <div class="adm-panel-head"><h3>会话</h3></div>
            <div class="adm-panel-body">
              <p style="margin:0 0 12px;font-size:12.5px;color:#8d97a8;line-height:1.8">
                当前为管理员会话，关闭浏览器标签后自动失效。<br/>
                前台入口：关于页连点 logo 5 次，或访问 #admin。
              </p>
              <button class="adm-btn danger" id="admLogout" style="width:100%">${ICON.logout} 退出后台</button>
            </div>
          </div>
        </div>
      </div>`;
  }
  AFTER.settings = (root) => {
    /* 评论开关：读取当前配置并回填 */
    (async () => {
      try {
        const { data } = await window.db.rpc("f_comment_config");
        if (data) {
          const en = q("#cmtEnabled", root);
          const days = q("#cmtDays", root);
          if (en) en.checked = data.enabled !== false;
          if (days) days.value = Number(data.auto_days || 0);
        }
      } catch (e) {
        /* 读取失败时保留默认值 */
      }
    })();

    const cmtBtn = q("#cmtSave", root);
    if (cmtBtn)
      cmtBtn.addEventListener("click", async () => {
        const enabled = q("#cmtEnabled", root).checked;
        const days = Math.max(0, Math.min(365, Number(q("#cmtDays", root).value || 0)));
        cmtBtn.disabled = true;
        const r = await call("f_admin_comment_config", { p_enabled: enabled, p_days: days });
        cmtBtn.disabled = false;
        if (r === null) return;
        if (window.loadCommentConfig) await window.loadCommentConfig();
        window.toast(enabled ? "已开放全站评论" : "已暂停全站评论", "ok");
      });

    q("#pwdGo", root).addEventListener("click", async () => {
      const cur = q("#oldPwd", root).value;
      const a = q("#newPwd", root).value;
      const b = q("#newPwd2", root).value;
      if (!cur) return window.toast("请输入当前密码", "err");
      if (a.length < 6) return window.toast("新密码至少 6 位", "err");
      if (a !== b) return window.toast("两次输入的新密码不一致", "err");
      const r = await call("f_admin_change_pwd", { p_new: a });
      if (!r) return;
      if (r.ok === false) return window.toast(r.error || "修改失败", "err");
      ADM.pwd = a;
      sessionStorage.setItem("pc_admin", a);
      q("#oldPwd", root).value = q("#newPwd", root).value = q("#newPwd2", root).value = "";
      window.toast("密码已更新", "ok");
    });
    q("#admLogout", root).addEventListener("click", async () => {
      const ok = await window.askConfirm("退出后台？", "退出后需要重新输入管理密码。", "退出");
      if (ok) logoutAdmin();
    });
  };

  /* ---------------- 违规处理弹层 ---------------- */
  function violationDialog({ title, content, author, allowHide }) {
    return new Promise((resolve) => {
      let done = false;
      const dr = drawer({
        title,
        body: `<div style="background:#fff7f7;border:1px solid #fbd5d6;border-radius:11px;padding:12px 13px;margin-bottom:14px">
            <div style="font-size:11.5px;color:#b42318;font-weight:700;margin-bottom:5px">待处理内容 · ${e(author || "匿名")}</div>
            <div style="font-size:13px;line-height:1.75;color:#3b4453">${e((content || "").slice(0, 300))}</div>
          </div>
          <div class="adm-field"><label>违规原因<span>*</span></label>
            <select class="adm-select" id="vReason">
              <option>攻击谩骂他人</option>
              <option>广告与引流</option>
              <option>不实信息</option>
              <option>色情低俗</option>
              <option>血腥暴力</option>
              <option>与熊猫无关的刷屏</option>
              <option>其他违规内容</option>
            </select>
          </div>
          <div class="adm-field"><label>补充说明</label>
            <input class="adm-input" id="vNote" placeholder="可留空，会追加在原因后面" /></div>
          <div class="adm-field"><label>处理方式</label>
            ${
              allowHide
                ? `<label class="adm-check" style="margin-right:16px"><input type="radio" name="vact" value="hide" /> 仅隐藏（保留内容）</label>`
                : ""
            }
            <label class="adm-check"><input type="radio" name="vact" value="delete" checked /> 删除并记 1 次违规</label>
            <div class="hint">违规次数累计到该用户档案，前台「我的」页也能看到自己的违规状态。</div>
          </div>`,
        footer: `<button class="adm-btn" data-x>取消</button><button class="adm-btn danger" id="vGo">确认处理</button>`,
        onMount: (d) => {
          q("#vGo", d).addEventListener("click", () => {
            const reason = q("#vReason", d).value;
            const note = q("#vNote", d).value.trim();
            const act = (q('input[name="vact"]:checked', d) || {}).value || "delete";
            done = true;
            resolve({ reason: note ? `${reason}（${note}）` : reason, action: act });
            d.close();
          });
          d._onClose(() => {
            if (!done) resolve(null);
          });
        },
      });
    });
  }

  /* ---------------- 贡献审核 ---------------- */
  const SUB_NAME = { name: "名字", gender: "性别", base: "基地", birth_date: "生日", father: "父亲", mother: "母亲", personality: "性格", hobbies: "爱好", bio: "小传", photo: "封面", images_append: "照片集" };

  function subDispName(s) {
    if (s.kind === "new") return (s.payload && s.payload.name) || "（未命名）";
    return s.result_name || s.target_name || (s.payload && s.payload.name) || "（已删除）";
  }
  const FIELD_ORDER = ["name", "gender", "base", "birth_date", "father", "mother", "personality", "hobbies", "bio", "photo"];
  function subKeys(s) {
    return Object.keys(s.payload || {}).sort(
      (a, b) => FIELD_ORDER.indexOf(a) - FIELD_ORDER.indexOf(b)
    );
  }

  function pageReviews() {
    const all = ADM.data.subs || [];
    const cnt = (k) => all.filter((s) => s.status === k).length;
    const tab = ADM.subTab || "pending";
    const list = (tab === "all" ? all : all.filter((s) => s.status === tab)).filter((s) => {
      const f = ADM.filter.toLowerCase();
      if (!f) return true;
      return [s.nickname, subDispName(s), s.note].some((v) => String(v || "").toLowerCase().includes(f));
    });
    const tabBtn = (k, label) =>
      `<button class="adm-seg ${tab === k ? "on" : ""}" data-subtab="${k}">${label}${
        k === "pending" && cnt("pending") ? `<i>${cnt("pending")}</i>` : ""
      }</button>`;

    const bulkBar =
      tab === "pending" && list.length
        ? `<div class="adm-bulkbar">
            <label class="bulk-all"><input type="checkbox" id="rvAll" /> 全选</label>
            <span class="pg-info" id="rvSelInfo">已选 0 条</span>
            <span style="flex:1"></span>
            <button class="adm-btn sm primary" data-bulk-ok disabled>${ICON.check} 批量通过</button>
            <button class="adm-btn sm danger" data-bulk-no disabled>${ICON.x} 批量驳回</button>
          </div>`
        : "";

    return `${head(`<button class="adm-btn" data-act="go-pandas">${ICON.paw} 去图鉴</button>`)}
      ${bulkBar}
      <div class="adm-panel">
        <div class="adm-panel-head">
          <h3>用户提交 ${all.length} 条</h3>
          <span class="sub">通过后自动写入图鉴；新增熊猫的作者自动获得守护权</span>
          <div class="right adm-segtabs">
            ${tabBtn("pending", "待审核")}${tabBtn("approved", "已通过")}${tabBtn("rejected", "已驳回")}${tabBtn("all", "全部")}
          </div>
        </div>
        <div class="adm-panel-body flush">
          ${
            list.length
              ? `<table class="adm-tbl"><thead><tr>
                  <th style="width:34px">${tab === "pending" ? "选" : ""}</th>
                  <th>提交人</th><th>类型 / 对象</th><th>改动项</th><th>时间</th><th>状态</th><th>操作</th>
                </tr></thead><tbody>
                ${list
                  .map((s) => {
                    const keys = subKeys(s);
                    const isNew = s.kind === "new";
                    return `<tr>
                      <td>${tab === "pending" ? `<input type="checkbox" class="rv-ck" data-ck="${s.id}" />` : ""}</td>
                      <td><b>${e(s.nickname || "熊猫迷")}</b></td>
                      <td>
                        <div class="adm-cellmain">
                          <span class="adm-pill ${isNew ? "b" : ""}">${isNew ? "新增" : "修改"}</span>
                          <b style="font-size:13px">${e(subDispName(s))}</b>
                        </div>
                      </td>
                      <td><div class="adm-text-clip">${keys.map((k) => SUB_NAME[k] || k).join(" · ") || "—"}</div></td>
                      <td class="muted" style="white-space:nowrap">${ago(s.created_at)}</td>
                      <td><span class="adm-pill ${
                        s.status === "approved" ? "g" : s.status === "rejected" ? "r" : "y"
                      }">${s.status === "approved" ? "已通过" : s.status === "rejected" ? "已驳回" : "待审核"}</span></td>
                      <td><div class="adm-rowacts">
                        <button class="adm-btn sm" data-sview="${s.id}">${ICON.eye} 查看</button>
                        ${
                          s.status === "pending"
                            ? `<button class="adm-btn sm primary" data-sok="${s.id}">${ICON.check} 通过</button>
                               <button class="adm-btn sm danger" data-sno="${s.id}">${ICON.x}</button>`
                            : ""
                        }
                      </div></td>
                    </tr>`;
                  })
                  .join("")}
              </tbody></table>`
              : emptyBox(
                  tab === "pending" ? "没有待审核的提交" : "这里是空的",
                  tab === "pending" ? "用户新增熊猫或补充资料后会出现在这里" : "换个状态看看",
                  "📝"
                )
          }
        </div>
      </div>`;
  }
  AFTER.reviews = (root) => {
    const syncBulk = () => {
      const boxes = qa(".rv-ck", root);
      const n = boxes.filter((b) => b.checked).length;
      const info = q("#rvSelInfo", root);
      if (info) info.textContent = `已选 ${n} 条`;
      qa("[data-bulk-ok],[data-bulk-no]", root).forEach((b) => (b.disabled = !n));
    };
    root.addEventListener("change", (ev) => {
      if (ev.target.id === "rvAll") {
        qa(".rv-ck", root).forEach((b) => (b.checked = ev.target.checked));
        syncBulk();
        return;
      }
      if (ev.target.classList.contains("rv-ck")) syncBulk();
    });
    root.addEventListener("click", async (ev) => {
      const bulk = ev.target.closest("[data-bulk-ok],[data-bulk-no]");
      if (bulk) {
        const approve = bulk.hasAttribute("data-bulk-ok");
        const ids = qa(".rv-ck", root).filter((b) => b.checked).map((b) => Number(b.dataset.ck));
        if (!ids.length) return;
        let note = "";
        if (!approve) {
          note = window.prompt(`批量驳回 ${ids.length} 条提交，原因（会展示给提交者）`, "资料还需要核实，请补充来源后重新提交");
          if (note === null) return;
          if (!String(note).trim()) note = "资料还需要核实";
        } else {
          const ok = await window.askConfirm(`批量通过 ${ids.length} 条提交？`, "通过后立即写入图鉴，新增熊猫的提交者将自动获得守护权。", "全部通过");
          if (!ok) return;
        }
        bulk.disabled = true;
        let okN = 0;
        let failN = 0;
        for (const id of ids) {
          const r = await call("f_admin_review_submission", { p_id: id, p_approve: approve, p_note: note || null });
          if (r && r.ok !== false) okN++;
          else failN++;
        }
        await loadData(["admin"]);
        paint();
        window.toast(`批量${approve ? "通过" : "驳回"}完成：成功 ${okN}${failN ? ` · 失败 ${failN}` : ""}`, failN ? "err" : "ok");
        return;
      }
      const seg = ev.target.closest("[data-subtab]");
      if (seg) {
        ADM.subTab = seg.dataset.subtab;
        paint();
        return;
      }
      const b = ev.target.closest("[data-act],[data-sview],[data-sok],[data-sno]");
      if (!b) return;
      if (b.dataset.act === "go-pandas") return go("pandas");
      const id = Number(b.dataset.sview || b.dataset.sok || b.dataset.sno);
      const s = (ADM.data.subs || []).find((x) => x.id === id);
      if (!s) return;
      if (b.dataset.sview) return openReview(s);
      if (b.dataset.sok) return doReview(s, true);
      if (b.dataset.sno) return doReview(s, false);
    });
  };

  async function doReview(s, approve) {
    let note = "";
    if (!approve) {
      note = window.prompt("驳回原因（会展示给提交者）", "资料还需要核实，请补充来源后重新提交");
      if (note === null) return;
      if (!String(note).trim()) note = "资料还需要核实";
    }
    const r = await call("f_admin_review_submission", {
      p_id: s.id,
      p_approve: approve,
      p_note: note || null,
    });
    if (r === null) return;
    if (r && r.ok === false) {
      window.toast(r.error || "操作失败", "err");
    } else {
      window.toast(approve ? "已通过，档案已更新" : "已驳回", "ok");
    }
    await loadData(["news", "pandas", "admin"]);
    if (window.renderPandas) window.renderPandas();
    if (window.renderHome) window.renderHome();
    markNav();
    paint();
  }

  function openReview(s) {
    const isNew = s.kind === "new";
    const keys = subKeys(s);
    const rows = keys
      .filter((k) => k !== "photo" && k !== "images_append")
      .map((k) => {
        const oldV = isNew ? "" : String(s["target_" + (k === "birth_date" ? "birth" : k)] ?? "");
        const newV = String((s.payload || {})[k] ?? "");
        return `<tr>
          <td style="width:88px;color:#8d97a8">${SUB_NAME[k] || k}</td>
          ${isNew ? "" : `<td style="color:#98a2b3">${oldV ? e(oldV) : "<i style='color:#c9d0dc'>空</i>"}</td>`}
          <td style="font-weight:600;color:${isNew ? "#0d9b6c" : "#2158e8"}">${newV ? e(newV) : "<i style='color:#c9d0dc'>清空</i>"}</td>
        </tr>`;
      })
      .join("");
    const photoNew = (s.payload || {}).photo;
    const photoOld = s.target_photo;
    const imgsNew = Array.isArray((s.payload || {}).images_append) ? s.payload.images_append : [];
    const photoBlock =
      (photoNew ? `<div class="adm-field"><label>封面照片</label>
          <div style="display:flex;gap:10px;align-items:flex-start">
            ${photoOld ? `<div style="flex:1"><div style="font-size:11px;color:#98a2b3;margin-bottom:5px">原图</div>
              <div class="rv-photo">${picImg(photoOld)}</div></div>` : ""}
            <div style="flex:1"><div style="font-size:11px;color:#2158e8;margin-bottom:5px">新图</div>
              <div class="rv-photo">${picImg(photoNew)}</div></div>
          </div>
        </div>` : "") +
      (imgsNew.length
        ? `<div class="adm-field"><label>新增照片集 ${imgsNew.length} 张</label>
            <div class="adm-imgpick">
              ${imgsNew.map((u) => `<div class="rv-thumb">${picImg(u)}</div>`).join("")}
            </div>
          </div>`
        : "");
    drawer({
      title: `${isNew ? "新增熊猫申请" : "档案修改申请"} · ${subDispName(s)}`,
      body: `
        <div class="adm-kv">
          <div><b>${e(s.nickname || "熊猫迷")}</b><span>提交人</span></div>
          <div><b>${full(s.created_at)}</b><span>提交时间</span></div>
          <div><b>${keys.length} 项</b><span>改动字段</span></div>
          <div><b>${{ approved: "已通过", rejected: "已驳回", pending: "待审核" }[s.status] || s.status}</b><span>当前状态</span></div>
        </div>
        ${photoBlock}
        <div class="adm-field"><label>${isNew ? "将创建以下档案" : "字段对照（左：现有，右：提交）"}</label>
          <table class="adm-tbl" style="background:#fff;border-radius:10px">
            <tbody>${rows || `<tr><td style="color:#98a2b3">没有文本字段改动</td></tr>`}</tbody>
          </table>
        </div>
        ${
          s.note
            ? `<div class="adm-field"><label>审核备注</label><div class="rv-note">${e(s.note)}</div></div>`
            : ""
        }
      `,
      footer:
        s.status === "pending"
          ? `<button class="adm-btn danger" id="rvNo">${ICON.x} 驳回</button>
             <button class="adm-btn primary" id="rvOk">${ICON.check} 通过并生效</button>`
          : `<button class="adm-btn" data-x>关闭</button>`,
      onMount: (el, close) => {
        const ok = q("#rvOk", el);
        if (ok)
          ok.addEventListener("click", async () => {
            ok.disabled = true;
            await doReview(s, true);
            close();
          });
        const no = q("#rvNo", el);
        if (no)
          no.addEventListener("click", async () => {
            no.disabled = true;
            const note = window.prompt("驳回原因（会展示给提交者）", "资料还需要核实，请补充来源后重新提交");
            if (note === null) {
              no.disabled = false;
              return;
            }
            close();
            const r = await call("f_admin_review_submission", {
              p_id: s.id,
              p_approve: false,
              p_note: String(note).trim() || "资料还需要核实",
            });
            if (r !== null) window.toast("已驳回", "ok");
            await loadData(["news", "pandas", "admin"]);
            markNav();
            paint();
          });
      },
    });
  }

  /* ---------------- 抽屉组件 ---------------- */
  function drawer({ title, body, footer, onMount }) {
    const mask = document.createElement("div");
    mask.className = "adm-drawer-mask";
    const el = document.createElement("div");
    el.className = "adm-drawer";
    el.innerHTML = `
      <div class="adm-drawer-head"><h3>${e(title)}</h3><button class="x" data-close>${ICON.x}</button></div>
      <div class="adm-drawer-body">${body}</div>
      ${footer ? `<div class="adm-drawer-foot">${footer}</div>` : ""}`;
    document.body.appendChild(mask);
    document.body.appendChild(el);
    let closed = false;
    const closeHandlers = [];
    const close = () => {
      if (closed) return;
      closed = true;
      el.classList.add("closing");
      mask.style.opacity = "0";
      mask.style.transition = "opacity .2s ease";
      setTimeout(() => {
        el.remove();
        mask.remove();
      }, 210);
      closeHandlers.forEach((f) => f());
    };
    mask.addEventListener("click", close);
    q("[data-close]", el).addEventListener("click", close);
    qa("[data-x]", el).forEach((b) => b.addEventListener("click", close));
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") close();
    });
    el._onClose = (f) => closeHandlers.push(f);
    if (onMount) onMount(el, close);
    const api = { el, close, onClose: (f) => closeHandlers.push(f) };
    return api;
  }

  /* ---------------- 图片选择 ---------------- */
  function pickLibraryImage(cb) {
    const keys = window.AVATAR_KEYS || [];
    const dr = drawer({
      title: "从素材库选择配图",
      body: `<div class="adm-imgpick">
        ${keys
          .map(
            (k) => `<button data-gpick="${k}">${picImg(`assets/cov-${k}.webp`)}<span>${pandaNameOfKey(k)}</span></button>`
          )
          .join("")}
      </div>
      <div class="adm-uploadrow" style="margin-top:12px">
        <input class="adm-input" id="gUrl" placeholder="或粘贴图片链接" />
        <button class="adm-btn" id="gUpload">${ICON.upload} 上传</button>
      </div>`,
    });
    q(".adm-imgpick", dr.el).addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-gpick]");
      if (!b) return;
      cb(b.dataset.gpick);
      dr.close();
    });
    q("#gUpload", dr.el).addEventListener("click", () =>
      pickLocalImage(16 / 10, (src) => {
        cb(src);
        dr.close();
      })
    );
    q("#gUrl", dr.el).addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter") return;
      const v = ev.target.value.trim();
      if (!v) return;
      cb(v);
      dr.close();
    });
  }

  function pickLocalImage(ratio, cb) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", () => {
      const f = input.files && input.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) return window.toast("请选择图片文件", "err");
      if (f.size > 12 * 1024 * 1024) return window.toast("图片太大，请选 12MB 以内的", "err");
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          try {
            cb(cropToDataUrl(img, ratio));
            window.toast("图片已就绪", "ok");
          } catch (err) {
            window.toast("图片处理失败，换一张试试", "err");
          }
        };
        img.onerror = () => window.toast("这张图片读不出来", "err");
        img.src = fr.result;
      };
      fr.readAsDataURL(f);
    });
    input.click();
  }

  function cropToDataUrl(img, ratio) {
    const W = ratio > 1 ? 1000 : 900;
    const H = Math.round(W / ratio);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#eef1f7";
    ctx.fillRect(0, 0, W, H);
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const s = Math.max(W / iw, H / ih);
    const dw = iw * s;
    const dh = ih * s;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    let out = c.toDataURL("image/webp", 0.82);
    if (!out || out.indexOf("data:image") !== 0 || out.length > 900000) out = c.toDataURL("image/jpeg", 0.78);
    return out;
  }

  /* ---------------- 登录 / 启动 ---------------- */
  function logoutAdmin() {
    ADM.pwd = "";
    sessionStorage.removeItem("pc_admin");
    if (ADM.root) ADM.root.remove();
    ADM.root = null;
    document.body.style.overflow = "";
    renderLogin();
  }

  function renderLogin() {
    const layer = document.createElement("div");
    layer.className = "adm-login";
    layer.id = "admLogin";
    layer.innerHTML = `
      <div class="adm-login-card">
        <div class="adm-login-logo"><img src="assets/hua.webp" alt="" /></div>
        <h2>熊猫动态圈 · 管理后台</h2>
        <p>内容、评论、图鉴与用户治理<br/>请输入管理员密码继续</p>
        <input class="adm-input" id="admPwd" type="password" placeholder="管理员密码" />
        <div class="adm-login-err" id="admErr"></div>
        <button class="adm-login-btn" id="admGo">进入后台</button>
        <button class="adm-login-back" id="admBack">返回前台</button>
        <div class="adm-login-tip">密码在服务端加盐校验，页面代码中不含明文</div>
      </div>`;
    document.body.appendChild(layer);
    document.body.style.overflow = "hidden";
    const pwdEl = q("#admPwd", layer);
    const errEl = q("#admErr", layer);
    const go = async () => {
      const pwd = pwdEl.value.trim();
      if (!pwd) return (errEl.textContent = "请输入密码");
      const btn = q("#admGo", layer);
      btn.disabled = true;
      errEl.textContent = "";
      try {
        /* f_admin_login：连续失败 8 次锁定 5 分钟，防止密码被爆破 */
        const { data, error } = await window.db.rpc("f_admin_login", { p_pwd: pwd });
        if (error) throw error;
        if (data && data.ok === false) {
          if (data.error === "locked") {
            const s = Number(data.retry_after || 300);
            errEl.textContent = s >= 60 ? `失败次数过多，已临时锁定，约 ${Math.ceil(s / 60)} 分钟后再试` : `已临时锁定，${s} 秒后再试`;
          } else {
            errEl.textContent = `密码错误${data.left != null ? `，还可尝试 ${data.left} 次` : ""}，请重试`;
          }
          btn.disabled = false;
          pwdEl.select();
          return;
        }
        ADM.pwd = pwd;
        sessionStorage.setItem("pc_admin", pwd);
        layer.remove();
        await startConsole();
      } catch (err) {
        errEl.textContent = "校验失败：" + (err.message || "网络异常");
        btn.disabled = false;
      }
    };
    q("#admGo", layer).addEventListener("click", go);
    pwdEl.addEventListener("keydown", (ev) => ev.key === "Enter" && go());
    q("#admBack", layer).addEventListener("click", () => {
      layer.remove();
      document.body.style.overflow = "";
      if (location.hash === "#admin") history.replaceState(null, "", location.pathname + location.search);
    });
    setTimeout(() => pwdEl.focus(), 260);
  }

  async function startConsole() {
    const root = document.createElement("div");
    root.className = "adm";
    root.id = "admRoot";
    document.body.appendChild(root);
    document.body.style.overflow = "hidden";
    ADM.root = root;
    renderShell();
    q("#admBody").innerHTML = `<div class="adm-page"><div class="adm-panel"><div class="adm-panel-body">
      ${emptyBox("正在加载云端数据…", "稍等一下，马上就好", "⏳")}</div></div></div>`;
    try {
      await loadData();
      markNav();
      paint();
    } catch (err) {
      q("#admBody").innerHTML = `<div class="adm-page"><div class="adm-panel"><div class="adm-panel-body">
        ${emptyBox("加载失败", (err.message || "网络异常") + "，请刷新重试", "⚠️")}</div></div></div>`;
    }
  }

  function openAdminConsole() {
    const existing = q("#admRoot");
    if (existing) existing.remove();
    const login = q("#admLogin");
    if (login) login.remove();
    if (ADM.pwd) startConsole();
    else renderLogin();
  }

  window.openAdmin = openAdminConsole;
  window.openAdminConsole = openAdminConsole;

  /* URL #admin 直达（支持 #admin/news 之类的深链） */
  function hashCheck() {
    if (!/^#admin(\/|$)/.test(location.hash)) return;
    const r = location.hash.split("/")[1];
    if (r && ROUTE_META[r]) ADM.route = r;
    openAdminConsole();
  }
  window.addEventListener("hashchange", hashCheck);
  /* 从其它标签页切回来时静默同步一次，避免继续看着过期的列表 */
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && ADM.root && q("#admBody")) refreshRoute(ADM.route);
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hashCheck);
  else setTimeout(hashCheck, 300);
})();
