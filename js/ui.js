// 竹北政策島 — 2D 介面層
// export createUI(root, data, { onSelectTheme, onReset, onTimeChange, onPauseToggle, onLinksToggle })
//   → { openTheme(id), closeDetail() }

const TOUR_KEY = 'zhubei-island:tour-seen:v1';
const MOBILE_MQ = '(max-width: 767px)';

// 靜態 SVG 圖示（不含任何外部資料，可安全用 innerHTML）
const ICONS = {
  dawn: '<svg viewBox="0 0 24 24"><path d="M4 18h16M7 18a5 5 0 0 1 10 0M12 6v3M5.6 10.6l1.8 1.4M18.4 10.6l-1.8 1.4M3 14.5h2M19 14.5h2"/></svg>',
  day: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg>',
  dusk: '<svg viewBox="0 0 24 24"><path d="M3 17h18M6 20h12M7 17a5 5 0 0 1 10 0M12 4v4M9.5 6.5 12 9l2.5-2.5"/></svg>',
  night: '<svg viewBox="0 0 24 24"><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z"/></svg>',
  links: '<svg viewBox="0 0 24 24"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="6.5" r="2.5"/><path d="M7.5 15.8c3-1 3.4-4.6 5.6-6.2 1-.7 2-1.1 3.2-1.6"/></svg>',
  tag: '<svg viewBox="0 0 24 24"><rect x="3.5" y="7" width="17" height="10" rx="5"/><path d="M8 12h8"/></svg>',
  carry: '<svg viewBox="0 0 24 24"><rect x="8" y="2.5" width="8" height="6" rx="1.2"/><circle cx="12" cy="11.5" r="1.8"/><path d="M12 13.5v4.5M9 21l3-3 3 3M8.5 15.5h7"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8.5 5.5v13M15.5 5.5v13"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10-6.5z"/></svg>',
  overview: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  list: '<svg viewBox="0 0 24 24"><path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/></svg>',
  help: '<svg viewBox="0 0 24 24"><path d="M9.3 9a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4.2M12 17.6h.01"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
  chevron: '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  island: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="33" rx="17" ry="6"/><path d="M11 32c2-6 6-9 13-9s11 3 13 9M24 23v-9M24 14c-4-3-8-2-10 0 4 0 7 1 10 0Zm0 0c4-3 8-2 10 0-4 0-7 1-10 0Z"/></svg>',
  bridge: '<svg viewBox="0 0 48 48"><ellipse cx="11" cy="32" rx="7" ry="3"/><ellipse cx="37" cy="32" rx="7" ry="3"/><path d="M14 29c4-9 16-9 20 0" stroke-dasharray="3 3"/></svg>',
  clock: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="14"/><path d="M24 15v9l6 4"/></svg>',
};

const TIMES = [
  { id: 'dawn', label: '清晨' },
  { id: 'day', label: '白天' },
  { id: 'dusk', label: '黃昏' },
  { id: 'night', label: '夜晚' },
];

const pad2 = (n) => String(n).padStart(2, '0');
const circled = (i) => (i < 20 ? String.fromCharCode(0x2460 + i) : `(${i + 1})`);

// 小型 DOM 建構器：文字一律走 textContent，避免注入
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v; // 僅用於上方靜態 ICONS
    else if (k === 'style' && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) el.style.setProperty(sk, sv);
    } else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
const icon = (name, cls = 'zb-ico') => h('span', { class: cls, 'aria-hidden': 'true', html: ICONS[name] || '' });

// 把關鍵字標記出來（回傳節點陣列）
function highlight(text, q) {
  const s = String(text || '');
  if (!q) return [s];
  const lower = s.toLowerCase();
  const out = [];
  let i = 0;
  let j;
  while ((j = lower.indexOf(q, i)) !== -1) {
    if (j > i) out.push(s.slice(i, j));
    out.push(h('mark', { text: s.slice(j, j + q.length) }));
    i = j + q.length;
  }
  if (i < s.length) out.push(s.slice(i));
  return out;
}

function safeStorage(fn, fallback) {
  try { return fn(); } catch { return fallback; }
}

function isSafeUrl(url) {
  try {
    const u = new URL(url, location.href);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch { return false; }
}

export function createUI(root, data, callbacks = {}) {
  const { onSelectTheme, onSelectTask, onReset, onTimeChange, onPauseToggle, onLinksToggle, onCarriersToggle, onNamesToggle, onDetailToggle } = callbacks || {};
  const meta = (data && data.meta) || {};
  const sources = Array.isArray(meta.sources) ? meta.sources : [];
  const themes = ((data && data.themes) || []).slice().sort((a, b) => (a.no || 0) - (b.no || 0));
  const byId = new Map(themes.map((t) => [t.id, t]));
  const itemTotal = themes.reduce((n, t) => n + ((t.items && t.items.length) || 0), 0);
  const mq = window.matchMedia ? window.matchMedia(MOBILE_MQ) : { matches: false, addEventListener() {} };

  // 協作關係：去重配對
  const pairs = [];
  {
    const seen = new Set();
    for (const t of themes) {
      for (const lid of t.links || []) {
        const o = byId.get(lid);
        if (!o || o.id === t.id) continue;
        const [a, b] = (t.no || 0) <= (o.no || 0) ? [t, o] : [o, t];
        const key = `${a.id}|${b.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push([a, b]);
      }
    }
    pairs.sort((x, y) => x[0].no - y[0].no || x[1].no - y[1].no);
  }
  const tasks = ((data && data.tasks) || []).filter((k) => byId.has(k.from) && byId.has(k.to));
  const taskById = new Map(tasks.map((k) => [k.id, k]));
  const tasksOf = (t) => tasks.filter((k) => k.from === t.id || k.to === t.id);
  const relatedOf = (t) => {
    const set = new Set((t.links || []).filter((id) => byId.has(id) && id !== t.id));
    for (const o of themes) if ((o.links || []).includes(t.id) && o.id !== t.id) set.add(o.id);
    return [...set].map((id) => byId.get(id)).sort((a, b) => a.no - b.no);
  };

  const state = {
    time: 'day',
    paused: false,
    links: false,
    carriers: true,
    names: false,
    openTask: null, // 左側卡片顯示的搬運任務
    tab: 'themes',
    query: '',
    expanded: null, // 右側清單展開的主題
    openId: null, // 左側細項卡開啟的主題
    openItem: null, // 細項卡內展開的細項 id
    pendingItem: null,
    panelHidden: false,
    drawerOpen: false,
    tourStep: -1,
    lastFocus: null,
  };

  root.classList.add('zb-ui');
  root.replaceChildren();

  // ───────── 左上：品牌卡＋工具列＋細項卡 ─────────
  const sloganParts = String(meta.slogan || '竹北共識，聖凱延續').split(/[，,、\s]+/).filter(Boolean);
  const brand = h('header', { class: 'zb-brand zb-panel' },
    h('div', { class: 'zb-brand-slogan', 'aria-label': sloganParts.join('，') },
      sloganParts.length >= 2 ? [h('span', { text: sloganParts[0] }), h('span', { text: sloganParts.slice(1).join('') })] : h('span', { text: sloganParts[0] || '' })),
    h('span', { class: 'zb-brand-rule', 'aria-hidden': 'true' }),
    h('div', { class: 'zb-brand-name' },
      h('strong', { text: meta.title || '竹北政策島' }),
      h('span', { class: 'zb-mono', text: 'ZHUBEI POLICY ISLAND' })),
  );

  const timeBtns = TIMES.map((t) => h('button', {
    type: 'button', class: 'zb-tbtn zb-tbtn-icon', 'data-time': t.id,
    'aria-label': `時間：${t.label}`, title: t.label, 'aria-pressed': String(state.time === t.id),
    onclick: () => setTime(t.id),
  }, icon(t.id)));
  const timeBar = h('div', { class: 'zb-pill zb-panel', role: 'group', 'aria-label': '時間' }, timeBtns);

  const linksBtn = h('button', { type: 'button', class: 'zb-tbtn', 'aria-label': '顯示協作線', 'aria-pressed': 'false', onclick: () => setLinks(!state.links) },
    icon('links'), h('span', { class: 'zb-lbl', text: '協作線' }));
  const pauseIco = icon('pause');
  const pauseLbl = h('span', { class: 'zb-lbl', text: '暫停' });
  const pauseBtn = h('button', { type: 'button', class: 'zb-tbtn', 'aria-label': '暫停動畫', 'aria-pressed': 'false', onclick: () => setPaused(!state.paused) },
    pauseIco, pauseLbl);
  const overviewBtn = h('button', { type: 'button', class: 'zb-tbtn', 'aria-label': '回到全景', onclick: () => goOverview() },
    icon('overview'), h('span', { class: 'zb-lbl', text: '全景' }));
  const namesBtn = h('button', { type: 'button', class: 'zb-tbtn', 'aria-label': '顯示小人名牌', 'aria-pressed': 'false', onclick: () => setNames(!state.names) },
    icon('tag'), h('span', { class: 'zb-lbl', text: '名牌' }));
  const carryBtn = h('button', { type: 'button', class: 'zb-tbtn', 'aria-label': '隱藏搬運小人', 'aria-pressed': 'true', onclick: () => setCarriers(!state.carriers) },
    icon('carry'), h('span', { class: 'zb-lbl', text: '搬運' }));
  const funcBar = h('div', { class: 'zb-pill zb-panel', role: 'group', 'aria-label': '場景功能' },
    tasks.length ? [namesBtn, carryBtn] : null, linksBtn, pauseBtn, overviewBtn);

  const detail = h('section', { class: 'zb-detail zb-panel', role: 'dialog', 'aria-modal': 'false', 'aria-label': '政策細項', 'aria-hidden': 'true', tabindex: '-1' });
  detail.inert = true;

  const topLeft = h('div', { class: 'zb-topleft' }, brand, h('div', { class: 'zb-toolbars' }, timeBar, funcBar), detail);

  // ───────── 右上按鈕 ─────────
  const listBtn = h('button', { type: 'button', class: 'zb-chip-btn zb-panel', 'aria-label': '開關政策清單', 'aria-expanded': 'true', onclick: () => togglePanel() },
    icon('list'), h('span', { class: 'zb-lbl', text: '清單' }));
  const topRight = h('div', { class: 'zb-topright' },
    h('button', { type: 'button', class: 'zb-chip-btn zb-panel', 'aria-label': '回到全景', onclick: () => goOverview() },
      icon('overview'), h('span', { class: 'zb-lbl', text: '全景' })),
    listBtn,
    h('button', { type: 'button', class: 'zb-chip-btn zb-chip-round zb-panel', 'aria-label': '使用說明與資料來源', onclick: () => openTour(0) }, icon('help')),
  );

  // ───────── 右側：THE POLICY INDEX ─────────
  const drawerHandle = h('button', { type: 'button', class: 'zb-drawer-handle', 'aria-label': '展開或收合政策清單', 'aria-expanded': 'false', onclick: () => setDrawer(!state.drawerOpen) },
    h('span', { class: 'zb-grabber', 'aria-hidden': 'true' }),
    h('span', { class: 'zb-mono zb-kicker', text: 'THE POLICY INDEX' }),
    h('span', { class: 'zb-drawer-sum', text: `${themes.length} 項主題・${itemTotal} 個細項` }));

  const searchInput = h('input', {
    type: 'search', class: 'zb-search-input', placeholder: '搜尋政策、細項、關鍵字…', 'aria-label': '搜尋政策', autocomplete: 'off',
    oninput: (e) => { state.query = e.target.value.trim().toLowerCase(); renderBody(); },
    onkeydown: (e) => { if (e.key === 'Escape' && searchInput.value) { e.stopPropagation(); searchInput.value = ''; state.query = ''; renderBody(); } },
  });
  const tabThemes = h('button', { type: 'button', role: 'tab', class: 'zb-tab', id: 'zb-tab-themes', 'aria-controls': 'zb-index-body', onclick: () => setTab('themes') }, '政策主題');
  const tabPairs = h('button', { type: 'button', role: 'tab', class: 'zb-tab', id: 'zb-tab-pairs', 'aria-controls': 'zb-index-body', onclick: () => setTab('pairs') },
    tasks.length ? '協作任務 ' : '協作關係 ', h('span', { class: 'zb-tab-n', text: String(tasks.length || pairs.length) }));
  const tabs = h('div', { class: 'zb-tabs', role: 'tablist', 'aria-label': '清單分頁' }, tabThemes, tabPairs);
  const indexBody = h('div', { class: 'zb-index-body', id: 'zb-index-body', role: 'tabpanel' });

  const srcList = h('ul', { class: 'zb-src-list' }, sources.map((s) => h('li', {},
    isSafeUrl(s.url) ? h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.title || s.url, ' ↗') : h('span', { text: s.title || '' }))));
  const footer = h('footer', { class: 'zb-index-foot' },
    h('p', { class: 'zb-disclaimer', text: meta.disclaimer || '非官方整理，資料來自公開新聞報導' }),
    sources.length ? h('details', { class: 'zb-src' }, h('summary', {}, `資料來源（${sources.length}）`), srcList) : null);

  const index = h('aside', { class: 'zb-index zb-panel', 'aria-label': '政策索引' },
    drawerHandle,
    h('div', { class: 'zb-index-head' },
      h('p', { class: 'zb-mono zb-kicker zb-hide-mobile', text: 'THE POLICY INDEX' }),
      h('h1', { class: 'zb-index-title', text: '一座城，十座島。' }),
      h('p', { class: 'zb-index-stats' },
        h('strong', { text: String(themes.length) }), ' 項政策主題　/　', h('strong', { text: String(itemTotal) }), ' 個細項'),
      h('p', { class: 'zb-index-sub', text: '選一項政見，走進它的城市風景。' }),
      h('label', { class: 'zb-search' }, icon('search'), searchInput),
      tabs),
    indexBody,
    footer);

  // ───────── 開場導覽 ─────────
  const TOUR = [
    { ico: 'island', title: '每塊島是一項政見', body: `竹北政策島把 ${themes.length} 項政策主題做成 ${themes.length} 座小島。點島嶼或政策清單，就能看到細項、說明與資料來源。拖曳可以移動地圖，雙指或滾輪縮放；迷路了就按「全景」。` },
    tasks.length
      ? { ico: 'bridge', title: '小人在幫不同政見搬資源', body: `木棧道上有 ${tasks.length} 組小人來回搬運，每組代表兩項政見之間的一項協作。點路上的小人，就能看到他在替哪兩座島搬什麼。` }
      : { ico: 'bridge', title: '線條是政見之間的協作', body: '打開「協作線」，島與島之間會連起來——交通牽著教育，韌性連著數位。政策不是各做各的。' },
    { ico: 'clock', title: '城市的一天會自己流動', body: '清晨、白天、黃昏、夜晚，用左上的時間按鈕切換；想慢慢看，就按暫停。' },
  ];
  const tourIcon = h('div', { class: 'zb-tour-ico', 'aria-hidden': 'true' });
  const tourKicker = h('p', { class: 'zb-mono zb-kicker' });
  const tourTitle = h('h2', { class: 'zb-tour-title', id: 'zb-tour-title' });
  const tourBody = h('p', { class: 'zb-tour-body' });
  const tourDots = h('div', { class: 'zb-tour-dots', 'aria-hidden': 'true' }, TOUR.map(() => h('span')));
  const tourNote = h('div', { class: 'zb-tour-note' },
    h('p', { text: meta.disclaimer || '非官方整理，資料來自公開新聞報導' }),
    sources.length ? h('details', { class: 'zb-src' }, h('summary', {}, `資料來源（${sources.length}）`), srcList.cloneNode(true)) : null);
  const tourSkip = h('button', { type: 'button', class: 'zb-btn zb-btn-ghost', 'aria-label': '略過導覽', onclick: () => closeTour() }, '略過');
  const tourNext = h('button', { type: 'button', class: 'zb-btn zb-btn-primary', onclick: () => (state.tourStep < TOUR.length - 1 ? showTourStep(state.tourStep + 1) : closeTour()) }, '下一步');
  const tourCard = h('div', { class: 'zb-tour-card zb-panel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'zb-tour-title' },
    h('button', { type: 'button', class: 'zb-icon-btn zb-tour-x', 'aria-label': '關閉導覽', onclick: () => closeTour() }, icon('close')),
    tourIcon, tourKicker, tourTitle, tourBody, tourNote,
    h('div', { class: 'zb-tour-foot' }, tourDots, h('div', { class: 'zb-tour-actions' }, tourSkip, tourNext)));
  const tour = h('div', { class: 'zb-tour', hidden: true }, tourCard);

  const wrap = h('div', { class: 'zb' }, index, topLeft, topRight, tour);
  root.append(wrap);

  // ───────── 狀態更新 ─────────
  function fire(fn, ...args) {
    if (typeof fn !== 'function') return;
    try { fn(...args); } catch (err) { console.error('[ui] callback error', err); }
  }
  function setTime(t) {
    state.time = t;
    for (const b of timeBtns) b.setAttribute('aria-pressed', String(b.dataset.time === t));
    fire(onTimeChange, t);
  }
  function setLinks(on) {
    state.links = on;
    linksBtn.setAttribute('aria-pressed', String(on));
    linksBtn.setAttribute('aria-label', on ? '隱藏協作線' : '顯示協作線');
    fire(onLinksToggle, on);
  }
  function setPaused(p) {
    state.paused = p;
    pauseBtn.setAttribute('aria-pressed', String(p));
    pauseBtn.setAttribute('aria-label', p ? '繼續播放動畫' : '暫停動畫');
    pauseIco.innerHTML = ICONS[p ? 'play' : 'pause'];
    pauseLbl.textContent = p ? '播放' : '暫停';
    fire(onPauseToggle, p);
  }
  function setCarriers(on) {
    state.carriers = on;
    carryBtn.setAttribute('aria-pressed', String(on));
    carryBtn.setAttribute('aria-label', on ? '隱藏搬運小人' : '顯示搬運小人');
    fire(onCarriersToggle, on);
  }
  function setNames(on) {
    state.names = on;
    namesBtn.setAttribute('aria-pressed', String(on));
    namesBtn.setAttribute('aria-label', on ? '隱藏小人名牌' : '顯示小人名牌');
    fire(onNamesToggle, on);
  }
  function selectTask(id) {
    if (!taskById.has(id)) return;
    if (mq.matches) setDrawer(false);
    fire(onSelectTask, id);
    if (state.openTask !== id) openTask(id);
  }
  function goOverview() {
    closeDetail();
    state.expanded = null;
    renderBody();
    fire(onReset);
  }
  function togglePanel() {
    if (mq.matches) { setDrawer(!state.drawerOpen); return; }
    state.panelHidden = !state.panelHidden;
    wrap.classList.toggle('is-panel-hidden', state.panelHidden);
    listBtn.setAttribute('aria-expanded', String(!state.panelHidden));
  }
  function setDrawer(open) {
    state.drawerOpen = open;
    wrap.classList.toggle('is-drawer-open', open);
    drawerHandle.setAttribute('aria-expanded', String(open));
    if (mq.matches) listBtn.setAttribute('aria-expanded', String(open));
  }
  function setTab(tab) {
    state.tab = tab;
    renderBody();
  }

  // 使用者從清單／搜尋選了主題
  function select(id, itemId = null) {
    if (!byId.has(id)) return;
    state.pendingItem = itemId;
    state.expanded = id;
    if (mq.matches) setDrawer(false);
    fire(onSelectTheme, id);
    // main.js 理應回呼 openTheme；若沒有，就自己開
    if (state.openId !== id || (itemId && state.openItem !== itemId)) openTheme(id);
  }

  // ───────── 右側清單渲染 ─────────
  function renderBody() {
    const searching = !!state.query;
    tabs.hidden = searching;
    tabThemes.setAttribute('aria-selected', String(state.tab === 'themes'));
    tabPairs.setAttribute('aria-selected', String(state.tab === 'pairs'));
    indexBody.setAttribute('aria-labelledby', state.tab === 'themes' ? 'zb-tab-themes' : 'zb-tab-pairs');
    let content;
    if (searching) content = renderSearch(state.query);
    else if (state.tab === 'pairs') content = renderPairs();
    else content = renderThemes();
    indexBody.replaceChildren(content);
  }

  function renderThemes() {
    return h('ol', { class: 'zb-themes' }, themes.map((t) => {
      const expanded = state.expanded === t.id;
      const items = t.items || [];
      return h('li', { class: `zb-theme${expanded ? ' is-expanded' : ''}${state.openId === t.id ? ' is-open' : ''}`, style: { '--c': t.color || '#d9673f' }, 'data-id': t.id },
        h('button', {
          type: 'button', class: 'zb-theme-head', 'aria-expanded': String(expanded),
          'aria-label': `${pad2(t.no)} ${t.title}，${items.length} 個細項`,
          onclick: () => {
            if (expanded && state.openId === t.id) { state.expanded = null; renderBody(); }
            else select(t.id);
          },
        },
        h('span', { class: 'zb-no', text: pad2(t.no) }),
        h('span', { class: 'zb-theme-title', text: t.title }),
        h('span', { class: 'zb-theme-count' }, String(items.length), h('span', { class: 'zb-arrow', 'aria-hidden': 'true', text: '↗' }))),
        expanded ? h('div', { class: 'zb-theme-sub' },
          h('button', { type: 'button', class: 'zb-explore', onclick: () => select(t.id) }, '探索此政策格 ', h('span', { 'aria-hidden': 'true', text: '↗' })),
          h('ol', { class: 'zb-sub-items' }, items.map((it, i) => h('li', {},
            h('button', { type: 'button', class: 'zb-sub-item', onclick: () => select(t.id, it.id) },
              h('span', { class: 'zb-circ', 'aria-hidden': 'true', text: circled(i) }), h('span', { text: it.title })))))) : null);
    }));
  }

  function renderTasks() {
    return h('div', {},
      h('p', { class: 'zb-pairs-note', text: '每組小人在兩座島之間來回搬運。點一項任務，鏡頭會飛到他們的路線。' }),
      h('ul', { class: 'zb-tasks' }, tasks.map((k) => {
        const a = byId.get(k.from), b = byId.get(k.to);
        return h('li', {},
          h('button', { type: 'button', class: `zb-task${state.openTask === k.id ? ' is-open' : ''}`, 'data-task': k.id, style: { '--c': a.color, '--c2': b.color }, onclick: () => selectTask(k.id) },
            h('span', { class: 'zb-task-id zb-mono', text: k.id }),
            h('span', { class: 'zb-task-main' },
              h('span', { class: 'zb-task-title' }, k.cargo ? `${k.cargo} ` : '', k.title),
              h('span', { class: 'zb-task-route' },
                h('span', { class: 'zb-task-end', style: { '--c': a.color }, text: a.title }), ' → ',
                h('span', { class: 'zb-task-end', style: { '--c': b.color }, text: b.title })))));
      })));
  }

  function renderPairs() {
    if (tasks.length) return renderTasks();
    if (!pairs.length) return h('p', { class: 'zb-empty', text: '目前沒有協作關係資料。' });
    return h('div', {},
      h('p', { class: 'zb-pairs-note', text: '點一組關係，開啟其中的主題。' }),
      h('ul', { class: 'zb-pairs' }, pairs.map(([a, b]) => h('li', {},
        h('button', { type: 'button', class: 'zb-pair', 'aria-label': `${a.title} 與 ${b.title} 的協作，開啟 ${a.title}`, onclick: () => select(a.id) },
          h('span', { class: 'zb-pair-side', style: { '--c': a.color } }, h('span', { class: 'zb-no zb-no-sm', text: pad2(a.no) }), h('span', { text: a.title })),
          h('span', { class: 'zb-pair-link', 'aria-hidden': 'true', text: '⟷' }),
          h('span', { class: 'zb-pair-side', style: { '--c': b.color } }, h('span', { class: 'zb-no zb-no-sm', text: pad2(b.no) }), h('span', { text: b.title })))))));
  }

  function renderSearch(q) {
    const results = [];
    for (const t of themes) {
      if (String(t.title || '').toLowerCase().includes(q)) results.push({ t, it: null });
      for (const it of t.items || []) {
        if (String(it.title || '').toLowerCase().includes(q) || String(it.desc || '').toLowerCase().includes(q)) results.push({ t, it });
      }
    }
    if (!results.length) return h('p', { class: 'zb-empty', text: `找不到「${state.query}」相關的政策。` });
    return h('div', {},
      h('p', { class: 'zb-results-n', 'aria-live': 'polite', text: `${results.length} 筆結果` }),
      h('ul', { class: 'zb-results' }, results.map(({ t, it }) => h('li', {},
        h('button', { type: 'button', class: 'zb-result', style: { '--c': t.color }, onclick: () => select(t.id, it ? it.id : null) },
          h('span', { class: 'zb-result-kicker zb-mono' }, `${pad2(t.no)} · `, it ? highlight(t.title, null) : '政策主題'),
          h('span', { class: 'zb-result-title' }, highlight(it ? it.title : t.title, q)),
          it && it.desc ? h('span', { class: 'zb-result-desc' }, snippet(it.desc, q)) : null)))));
  }
  function snippet(desc, q) {
    const s = String(desc);
    const i = s.toLowerCase().indexOf(q);
    if (i < 0 || s.length <= 60) return highlight(s, q);
    const start = Math.max(0, i - 20);
    return [start > 0 ? '…' : '', ...highlight(s.slice(start, start + 60), q), start + 60 < s.length ? '…' : ''];
  }

  // ───────── 左側細項卡 ─────────
  function renderDetail(t) {
    const items = t.items || [];
    const related = relatedOf(t);
    detail.style.setProperty('--c', t.color || '#d9673f');
    detail.setAttribute('aria-label', `政策 ${pad2(t.no)}：${t.title}`);
    detail.replaceChildren(...[
      h('div', { class: 'zb-detail-top' },
        h('p', { class: 'zb-mono zb-detail-kicker', text: `POLICY ${pad2(t.no)} · 政見` }),
        h('button', { type: 'button', class: 'zb-icon-btn', 'aria-label': '關閉細項卡', onclick: () => closeDetail() }, icon('close'))),
      h('div', { class: 'zb-detail-titlerow' },
        h('span', { class: 'zb-detail-ico', 'aria-hidden': 'true', text: t.icon || '🏝️' }),
        h('h2', { class: 'zb-detail-title', text: t.title })),
      t.landmark ? h('p', { class: 'zb-detail-landmark' }, h('span', { class: 'zb-mono', text: '島上地標' }), t.landmark) : null,
      t.summary ? h('p', { class: 'zb-detail-summary', text: t.summary }) : null,
      t.quote ? h('blockquote', { class: 'zb-quote', text: `「${String(t.quote).replace(/^「|」$/g, '')}」` }) : null,
      h('div', { class: 'zb-tags' },
        (t.tags || []).map((g) => h('span', { class: 'zb-tag zb-tag-c', text: g })),
        h('span', { class: 'zb-tag', text: `${items.length} 個細項` }),
        related.length ? h('span', { class: 'zb-tag', text: `${related.length} 項協作` }) : null),
      h('p', { class: 'zb-mono zb-section-label', text: '政策細項' }),
      h('ul', { class: 'zb-items' }, items.map((it, i) => {
        const open = state.openItem === it.id;
        const src = Number.isInteger(it.source) ? sources[it.source] : null;
        const bodyId = `zb-item-${String(it.id).replace(/[^\w-]/g, '_')}`;
        return h('li', { class: `zb-item${open ? ' is-open' : ''}`, 'data-item': it.id },
          h('button', {
            type: 'button', class: 'zb-item-head', 'aria-expanded': String(open), 'aria-controls': bodyId,
            onclick: () => { state.openItem = open ? null : it.id; renderDetail(t); },
          },
          h('span', { class: 'zb-dot', 'aria-hidden': 'true' }),
          h('span', { class: 'zb-item-title', text: it.title }),
          icon('chevron', 'zb-ico zb-chev')),
          open ? h('div', { class: 'zb-item-body', id: bodyId },
            it.desc ? h('p', { text: it.desc }) : null,
            src && isSafeUrl(src.url) ? h('a', { class: 'zb-src-link', href: src.url, target: '_blank', rel: 'noopener noreferrer' }, `來源：${src.title || src.url} ↗`) : null) : null);
      })),
      related.length ? h('p', { class: 'zb-mono zb-section-label', text: '和誰一起做' }) : null,
      related.length ? h('div', { class: 'zb-related' }, related.map((r) => h('button', {
        type: 'button', class: 'zb-rel', style: { '--c': r.color }, 'aria-label': `前往協作主題 ${r.title}`, onclick: () => select(r.id),
      }, h('span', { class: 'zb-rel-no', text: pad2(r.no) }), `→ ${r.title}`))) : null,
      tasksOf(t).length ? h('p', { class: 'zb-mono zb-section-label', text: '搬運任務' }) : null,
      tasksOf(t).length ? h('ul', { class: 'zb-tasks zb-tasks-compact' }, tasksOf(t).map((k) => h('li', {},
        h('button', { type: 'button', class: 'zb-task', style: { '--c': byId.get(k.from).color, '--c2': byId.get(k.to).color }, onclick: () => selectTask(k.id) },
          h('span', { class: 'zb-task-id zb-mono', text: k.id }),
          h('span', { class: 'zb-task-title' }, k.cargo ? `${k.cargo} ` : '', k.title))))) : null,
      h('p', { class: 'zb-detail-foot', text: meta.disclaimer || '非官方整理，資料來自公開新聞報導' }),
    ].filter(Boolean));
  }

  // 搬運任務卡
  function renderTaskDetail(k) {
    const a = byId.get(k.from), b = byId.get(k.to);
    const src = Number.isInteger(k.source) ? sources[k.source] : null;
    const end = (t, role) => h('button', { type: 'button', class: 'zb-task-stop', style: { '--c': t.color }, 'aria-label': `前往政策 ${t.title}`, onclick: () => select(t.id) },
      h('span', { class: 'zb-mono zb-task-stop-role', text: role }),
      h('span', { class: 'zb-task-stop-name' }, h('span', { class: 'zb-rel-no', text: pad2(t.no) }), ' ', t.title));
    detail.style.setProperty('--c', a.color || '#d9673f');
    detail.setAttribute('aria-label', `搬運任務 ${k.id}：${k.title}`);
    detail.replaceChildren(...[
      h('div', { class: 'zb-detail-top' },
        h('p', { class: 'zb-mono zb-detail-kicker', text: `TASK ${k.id} · 搬運任務` }),
        h('button', { type: 'button', class: 'zb-icon-btn', 'aria-label': '關閉任務卡', onclick: () => closeDetail() }, icon('close'))),
      h('div', { class: 'zb-detail-titlerow' },
        h('span', { class: 'zb-detail-ico', 'aria-hidden': 'true', text: k.cargo || '📦' }),
        h('h2', { class: 'zb-detail-title', text: k.title })),
      h('div', { class: 'zb-task-path' }, end(a, '從'), h('span', { class: 'zb-task-arrow', 'aria-hidden': 'true', text: '⇄' }), end(b, '到')),
      k.desc ? h('p', { class: 'zb-detail-summary', text: k.desc }) : null,
      (k.crew || []).length ? h('div', { class: 'zb-crew' },
        h('span', { class: 'zb-mono zb-section-label', text: '搬運人員' }),
        h('div', { class: 'zb-tags' }, k.crew.map((c) => h('span', { class: 'zb-tag', text: c })))) : null,
      h('p', { class: 'zb-task-note', text: '這組小人去程搬「' + a.title + '」的資源，到站後換上「' + b.title + '」的資源再走回來。' }),
      src && isSafeUrl(src.url) ? h('a', { class: 'zb-src-link', href: src.url, target: '_blank', rel: 'noopener noreferrer' }, `依據：${src.title || src.url} ↗`) : null,
      h('p', { class: 'zb-detail-foot', text: meta.disclaimer || '非官方整理，資料來自公開新聞報導' }),
    ].filter(Boolean));
  }

  function openTask(id) {
    const k = taskById.get(id);
    if (!k) return;
    state.openTask = id;
    state.openId = null;
    state.openItem = null;
    renderTaskDetail(k);
    detail.classList.add('is-visible');
    detail.setAttribute('aria-hidden', 'false');
    detail.inert = false;
    detail.scrollTop = 0;
    renderBody();
    reportDetail();
  }

  // 告訴場景：手機上的底部卡片蓋住了多少畫面
  function reportDetail() {
    const open = detail.classList.contains('is-visible');
    fire(onDetailToggle, open, open && mq.matches ? detail.offsetHeight : 0);
  }

  function openTheme(id) {
    const t = byId.get(id);
    if (!t) return;
    const switching = state.openId !== id;
    if (state.pendingItem) { state.openItem = state.pendingItem; state.pendingItem = null; }
    else if (switching) state.openItem = null;
    state.openId = id;
    state.openTask = null;
    state.expanded = id;
    renderDetail(t);
    detail.classList.add('is-visible');
    detail.setAttribute('aria-hidden', 'false');
    detail.inert = false;
    if (switching) detail.scrollTop = 0;
    if (state.openItem) {
      const el = detail.querySelector(`[data-item="${CSS.escape(state.openItem)}"]`);
      if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    }
    if (!state.query && state.tab === 'themes') {
      renderBody();
      const row = indexBody.querySelector(`[data-id="${CSS.escape(id)}"]`);
      if (row && !mq.matches) requestAnimationFrame(() => row.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    } else {
      renderBody();
    }
    reportDetail();
  }

  function closeDetail() {
    if (!state.openId && !state.openTask && !detail.classList.contains('is-visible')) return;
    state.openId = null;
    state.openItem = null;
    state.openTask = null;
    detail.classList.remove('is-visible');
    detail.setAttribute('aria-hidden', 'true');
    detail.inert = true;
    renderBody();
    reportDetail();
  }

  // ───────── 導覽 ─────────
  function showTourStep(i) {
    state.tourStep = i;
    const s = TOUR[i];
    tourIcon.innerHTML = ICONS[s.ico];
    tourKicker.textContent = `STEP ${i + 1} / ${TOUR.length}`;
    tourTitle.textContent = s.title;
    tourBody.textContent = s.body;
    tourNote.hidden = i !== TOUR.length - 1;
    [...tourDots.children].forEach((d, k) => d.classList.toggle('is-on', k === i));
    const last = i === TOUR.length - 1;
    tourNext.textContent = last ? '走進城市 →' : '下一步';
    tourNext.setAttribute('aria-label', last ? '結束導覽，走進城市' : '下一步');
    tourSkip.hidden = last;
    tourNext.focus({ preventScroll: true });
  }
  function openTour(i = 0) {
    state.lastFocus = document.activeElement;
    tour.hidden = false;
    requestAnimationFrame(() => tour.classList.add('is-visible'));
    showTourStep(i);
  }
  function closeTour() {
    if (tour.hidden) return;
    state.tourStep = -1;
    tour.classList.remove('is-visible');
    tour.hidden = true;
    safeStorage(() => localStorage.setItem(TOUR_KEY, '1'));
    if (state.lastFocus && typeof state.lastFocus.focus === 'function') state.lastFocus.focus({ preventScroll: true });
  }
  tour.addEventListener('click', (e) => { if (e.target === tour) closeTour(); });
  tourCard.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = [...tourCard.querySelectorAll('button, summary, a[href]')].filter((el) => !el.hidden && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // ───────── 全域鍵盤＋響應式 ─────────
  function onKey(e) {
    if (e.key !== 'Escape') return;
    if (!tour.hidden) { closeTour(); return; }
    if (state.openId || state.openTask) { closeDetail(); return; }
    if (mq.matches && state.drawerOpen) setDrawer(false);
  }
  document.addEventListener('keydown', onKey);
  const onMq = () => {
    wrap.classList.toggle('is-mobile', mq.matches);
    listBtn.setAttribute('aria-expanded', String(mq.matches ? state.drawerOpen : !state.panelHidden));
  };
  if (mq.addEventListener) mq.addEventListener('change', onMq);
  onMq();

  renderBody();
  setTimeout(() => {
    const seen = safeStorage(() => localStorage.getItem(TOUR_KEY), null);
    if (!seen) openTour(0);
  }, 0);

  return { openTheme, openTask, closeDetail };
}
