/* ==========================================
   🌉 bridge.js v2 — 赤字协议桥接脚本
   - 邮箱+密码登录（无Google/匿名）
   - 字典数据硬编码，即时显示
   - 分类筛选器立即渲染
   - 史记接Firebase
   - 社区帖子实时
   - 评论/举报/删除
   - 管理员页面内删帖
   - 不修改现有world.js/ui.js
   ========================================== */

import {
  db, auth,
  CHARACTER_DATA, CATEGORY_CONFIG,
  syncInitialData,
  registerUser, loginUser, logoutUser, onAuthChange,
  searchCharLocal, getCharsByCategory,
  getTimelinePosts,
  createPost, listenToPosts,
  addComment, listenToComments,
  votePost, reportPost, deletePost
} from './firebase.js';

// ==========================================
// 🚀 初始化入口
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setupAuth();          // 1. 登录系统
  injectStarFilter();   // 2. 星图筛选器
  overrideTerminalSearch(); // 3. 字典搜索接本地数据
  overrideTimelineSwitch(); // 4. 史记接Firebase
  setupCommunityTabs(); // 5. 社区帖子监听
  setupPostModal();     // 6. 帖子弹窗评论
  interceptPostActions(); // 7. 发帖/凿字登录拦截
  injectReportButtons();  // 8. 举报按钮
  fixBonfireLabel();    // 9. 篝火阵标签
  injectDictionaryData(); // 10. 30个字注入字典侧边栏

  syncInitialData();
});

// ==========================================
// 🔐 登录系统
// ==========================================
let _currentUser = null;

function setupAuth() {
  onAuthChange(user => {
    _currentUser = user;
    updateNavUser(user);
    if (user) {
      closeAuthModal();
      const name = user.displayName || user.email || '考古学家';
      window.showSysToast?.(`>> 身份已确认。欢迎，${name}。`);
      // 更新拓片馆代号
      const codenameEl = document.getElementById('val-codename');
      if (codenameEl) codenameEl.textContent = user.displayName || user.email;
      if (window._authPendingAction) {
        const action = window._authPendingAction;
        window._authPendingAction = null;
        setTimeout(action, 300);
      }
    }
  });

  // 用Object.assign追加，不覆盖已有的showPanel/login/register
  window.CrimsonAuth = window.CrimsonAuth || {};
  Object.assign(window.CrimsonAuth, {
    requireAuth(action) {
      if (_currentUser) { action(); }
      else { window._authPendingAction = action; openAuthModal('login'); }
    },
    logout() {
      logoutUser().then(() => window.showSysToast?.('>> 已断开身份连接。'));
    }
  });
}

function openAuthModal(panel = 'login') {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  showAuthPanel(panel);
  modal.classList.add('active');
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('active');
  clearAuthErrors();
}
// 暴露给HTML onclick
window.closeAuthModal = function(e) {
  if (!e || e.target === document.getElementById('auth-modal') || e.target.closest('.modal-close')) {
    closeAuthModal();
  }
};

function showAuthPanel(name) {
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(`auth-panel-${name}`);
  if (panel) panel.classList.add('active');
}
window.CrimsonAuth = window.CrimsonAuth || {};
// showPanel 由HTML按钮调用
Object.assign(window.CrimsonAuth, {
  showPanel: showAuthPanel,
  login: async function() {
    clearAuthErrors();
    const email = document.getElementById('login-email')?.value?.trim();
    const pass  = document.getElementById('login-pass')?.value;
    if (!email || !pass) { showAuthError('login','请填写邮箱和密码'); return; }
    showAuthPanel('loading');
    try {
      await loginUser(email, pass);
      // onAuthChange 会处理后续
    } catch(e) {
      showAuthPanel('login');
      showAuthError('login', friendlyError(e.code));
    }
  },
  register: async function() {
    clearAuthErrors();
    const email    = document.getElementById('reg-email')?.value?.trim();
    const pass     = document.getElementById('reg-pass')?.value;
    const pass2    = document.getElementById('reg-pass2')?.value;
    const codename = document.getElementById('reg-codename')?.value?.trim();
    if (!email || !pass) { showAuthError('reg','请填写邮箱和密码'); return; }
    if (pass.length < 6)  { showAuthError('reg','密码至少6位'); return; }
    if (pass !== pass2)   { showAuthError('reg','两次密码不一致'); return; }
    showAuthPanel('loading');
    try {
      const user = await registerUser(email, pass, codename);
      window.showSysToast?.(`>> 节点已建立。代号：${user.displayName}`);
    } catch(e) {
      showAuthPanel('register');
      showAuthError('reg', friendlyError(e.code));
    }
  }
});

function showAuthError(panel, msg) {
  const el = document.getElementById(`auth-err-${panel}`);
  if (el) { el.textContent = '> ⚠️ ' + msg; el.style.display = 'block'; }
}
function clearAuthErrors() {
  document.querySelectorAll('.auth-err').forEach(e => { e.textContent=''; e.style.display='none'; });
}
function friendlyError(code) {
  const map = {
    'auth/user-not-found':    '该邮箱尚未注册',
    'auth/wrong-password':    '密码错误',
    'auth/invalid-credential':'邮箱或密码错误',
    'auth/email-already-in-use':'该邮箱已注册，请直接登录',
    'auth/invalid-email':     '邮箱格式不正确',
    'auth/weak-password':     '密码强度不够，至少6位',
    'auth/network-request-failed':'网络连接失败，请检查网络',
    'auth/too-many-requests': '操作频繁，请稍后再试'
  };
  return map[code] || '操作失败，请重试';
}

function updateNavUser(user) {
  // 不改导航栏原有结构，只更新频段按钮旁的状态
  // 已登录：不显示任何额外元素
  // 未登录：不显示任何额外元素（只在需要时弹窗）
  // 拓片馆页面如果有用户名显示区域，更新它
  const nameEl = document.getElementById('profile-display-name');
  if (nameEl && user) {
    nameEl.textContent = user.displayName || user.email;
  }
}

// ==========================================
// 🌟 星图分类筛选器（立即渲染，无需等Firebase）
// ==========================================
function injectStarFilter() {
  // 注入到 #page-mother-star 而非 #ui-layer（ui-layer有pointer-events:none会挡住点击）
  const motherStar = document.getElementById('page-mother-star');
  if (!motherStar) return;

  // 暴露字典数据给 three-scene.js
  window.CHARACTER_DATA_CACHE = CHARACTER_DATA;

  const cats = Object.entries(CATEGORY_CONFIG);
  const filterDiv = document.createElement('div');
  filterDiv.id = 'star-filter-wrapper';
  filterDiv.innerHTML = `
    <div id="star-filter-bar">
      ${cats.map(([key,cfg],i) => `
        <button class="star-filter-btn${i===0?' active':''}"
                data-cat="${key}"
                style="--filter-color:${cfg.color}"
                onclick="window.applyStarFilter('${key}',this)">
          ${cfg.label}
        </button>`).join('')}
    </div>
    <div id="star-filter-count">> 当前星域显示 ${Object.keys(CHARACTER_DATA).length} 个语言锚点</div>
    <div id="star-char-expand"></div>
  `;
  motherStar.appendChild(filterDiv);

  let _activeFilterCat = 'all';

  window.applyStarFilter = (cat, btn) => {
    document.querySelectorAll('.star-filter-btn').forEach(b=>b.classList.remove('active'));
    btn?.classList.add('active');
    const chars = getCharsByCategory(cat);
    const countEl = document.getElementById('star-filter-count');
    if (countEl) countEl.textContent = `> 当前星域显示 ${chars.length} 个语言锚点`;

    const expandEl = document.getElementById('star-char-expand');
    if (!expandEl) return;

    if (cat === 'all') {
      expandEl.classList.remove('active');
      expandEl.innerHTML = '';
      _activeFilterCat = 'all';
      return;
    }
    if (_activeFilterCat === cat && expandEl.classList.contains('active')) {
      expandEl.classList.remove('active');
      _activeFilterCat = '';
      return;
    }
    _activeFilterCat = cat;
    expandEl.innerHTML = chars.map(c => 
      `<div class="star-char-item cat-${c.category}" onclick="window.flyToCharCard('${c.char}')">${c.char}</div>`
    ).join('');
    expandEl.classList.add('active');
  };

  // 点击字 → 显示详情卡
  window.flyToCharCard = (char) => {
    const data = CHARACTER_DATA[char];
    if (!data) return;
    document.getElementById('star-char-expand')?.classList.remove('active');

    const card = document.getElementById('detail-card');
    if (!card) return;
    const titleEl = document.getElementById('card-title');
    const typeEl = document.getElementById('card-type');
    const descEl = document.getElementById('card-desc');
    const catLabels = { stigma:'贬义字', institution:'制度字', matrilineal:'母系遗存', reclaim:'褒义字', neutral:'中性字' };
    const catColors = { stigma:'#ff6b6b', institution:'var(--terracotta)', matrilineal:'var(--amber)', reclaim:'#5a9e6f', neutral:'var(--bone)' };
    if (titleEl) { titleEl.innerText = char; titleEl.style.color = catColors[data.category] || 'var(--terracotta)'; }
    if (typeEl) typeEl.innerText = `${catLabels[data.category]||''} · 污染等级 ${data.pollutionLevel}/5`;
    if (descEl) { descEl.classList.remove('revealed'); descEl.innerText = `${data.shuowen||''}\n${data.modern||''}`; }
    card.classList.add('active');
  };
}

// ==========================================
// 🔍 终端搜索接本地字典数据
// ==========================================
function overrideTerminalSearch() {
  setTimeout(() => {
    const inp = document.getElementById('term-search-input');
    if (!inp) return;
    const newInp = inp.cloneNode(true); // 移除旧事件
    inp.parentNode.replaceChild(newInp, inp);

    newInp.addEventListener('keypress', async function(e) {
      if (e.key !== 'Enter') return;
      const val = this.value.trim();
      if (!val) return;
      window.currentWord = val;
      this.blur();

      const out     = document.getElementById('term-output-area');
      const reject  = document.getElementById('btn-reject');
      const manual  = document.getElementById('manual-old-def-input');
      if (!out) return;

      out.style.display = 'block';
      out.innerHTML = '';
      out.classList.remove('confidential');
      if (reject) reject.style.display = 'none';
      if (manual) { manual.style.display='none'; manual.value=''; }

      const data = searchCharLocal(val);
      let text, isHit;

      if (data) {
        isHit = true;
        const bars = data.pollutionLevel > 0 ? '▓'.repeat(data.pollutionLevel)+'░'.repeat(5-data.pollutionLevel) : '░░░░░';
        const catNames = { stigma:'贬义字', institution:'制度字', matrilineal:'母系遗存', reclaim:'褒义字', neutral:'中性字' };
        text = `THE CRIMSON PROTOCOL\nARCHIVE NO. ${Math.floor(Math.random()*90000+10000)}\n`
             + `\n【 字符：${data.char} / ${data.pinyin} 】`
             + `\n【 分类：${catNames[data.category]||data.category} 】`
             + `\n【 污染等级：${bars} ${data.pollutionLevel}/5 】`
             + `\n\n《说文解字》原文：\n${data.shuowen}`
             + `\n\n现代字典义：\n${data.modern}`;
        window._currentCharData = data;
      } else {
        isHit = false;
        text = `⚠️ WARNING: Archive Incomplete.\n> 检索失败：旧世档案库残缺。\n> 检测到词源含规训基因，请手动录入父权旧义。`;
        window._currentCharData = null;
      }

      if (window.typeWriterLab) {
        window.typeWriterLab(text, out, 0, () => {
          if (isHit) {
            out.classList.add('confidential');
            if (reject) { reject.innerText='🚫 拒绝接受！进入重塑台 ➔'; setTimeout(()=>reject.style.display='block',500); }
          } else {
            if (manual) manual.style.display='block';
            if (reject) { reject.innerText='🔒 锁定旧字！进入重塑台 ➔'; setTimeout(()=>reject.style.display='block',500); }
          }
        });
      } else {
        out.textContent = text;
      }
    });
  }, 800);
}

// ==========================================
// 📜 史记接Firebase
// ==========================================
function overrideTimelineSwitch() {
  setTimeout(() => {
    // 强制覆盖world.js的switchDimension
    window.switchDimension = async function(dimKey, btnEl) {
      document.querySelectorAll('.chron-tab').forEach(b=>b.classList.remove('active'));
      btnEl?.classList.add('active');
      const cont = document.getElementById('timeline-scroll-area');
      if (!cont) return;
      cont.style.opacity = 0;
      const posts = await getTimelinePosts(dimKey);
      setTimeout(() => { renderTimeline(cont, posts); cont.style.opacity=1; cont.scrollTop=0; }, 300);
    };
    // 触发初始加载
    const activeBtn = document.querySelector('.chron-tab.active');
    if (activeBtn) window.switchDimension('huaxia', activeBtn);
  }, 900);
}

function renderTimeline(cont, posts) {
  const eraMap = {};
  posts.forEach(p => { (eraMap[p.era]||(eraMap[p.era]=[])).push(p); });
  if (!Object.keys(eraMap).length) {
    cont.innerHTML = `<div class="placeholder-box">[ 暂无档案记录 / AWAITING_RECORDS ]</div>`;
    return;
  }
  cont.innerHTML = Object.entries(eraMap).map(([era,stories])=>`
    <div class="era-section">
      <div class="era-header" onclick="this.parentElement.classList.toggle('collapsed')">${era}</div>
      <div class="era-content">
        ${stories.map(s=>`
          <article class="hist-card" onclick="this.classList.toggle('expanded')">
            <div class="card-tags">
              <span class="tag">${s.tag||''}</span>
              ${s.promoted?'<span class="tag tag-promoted">✦ 已收录正典</span>':''}
            </div>
            <div class="card-meta-line">
              <span class="timeline-author">${s.author||''}</span>
              <span class="timeline-votes">▵ ${s.votes||0}</span>
            </div>
            <h3>${s.title}</h3>
            <div class="card-summary">${s.summary} <span class="read-more-btn">[ 点击阅览 ]</span></div>
            <div class="card-full-content">
              <div class="full-article">${s.content}</div>
              <div style="margin-top:1rem">
                <button class="tl-action-btn" onclick="event.stopPropagation();tlVote('${s.id}',this)">▵ 收录投票 <span>${s.votes||0}</span></button>
              </div>
            </div>
          </article>`).join('')}
      </div>
    </div>`).join('');
}

window.tlVote = async function(postId, btn) {
  try {
    const {updateDoc,doc,increment:inc} = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    await updateDoc(doc(db,'timeline_posts',postId),{votes:inc(1)});
    const sp = btn.querySelector('span');
    if(sp) sp.textContent = parseInt(sp.textContent||'0')+1;
    btn.disabled = true; btn.style.color='var(--amber)';
  } catch(e){}
};

// ==========================================
// 🏛️ 社区帖子实时监听
// ==========================================
const tabTypeMap = { 'tab-glyphs':'glyph', 'tab-parchments':'parchment', 'tab-terracotta':'terracotta', 'tab-bonfire':'bonfire' };
const unsubs = {};

function setupCommunityTabs() {
  setTimeout(() => {
    const orig = window.switchMireTab;
    window.switchMireTab = function(tabId, btn) {
      orig?.(tabId, btn);
      const type = tabTypeMap[tabId];
      if (type) loadTabPosts(tabId, type);
    };
    // 初始加载当前可见tab
    loadTabPosts('tab-glyphs','glyph');
  }, 800);
}

function loadTabPosts(tabId, type) {
  if (unsubs[tabId]) unsubs[tabId]();
  const cont = document.getElementById(tabId);
  if (!cont) return;
  unsubs[tabId] = listenToPosts(type, posts => renderPosts(cont, posts, type));
}

function renderPosts(cont, posts, type) {
  let fbSec = cont.querySelector('.fb-posts');
  if (!fbSec) { fbSec = document.createElement('div'); fbSec.className='fb-posts'; cont.appendChild(fbSec); }

  // 空占位符显示控制
  const empty = cont.querySelector('.empty-state');
  if (empty) empty.style.display = posts.length ? 'none' : 'block';

  const typeClass = { glyph:'card-glyph', parchment:'card-parchment', terracotta:'card-terracotta', bonfire:'card-bonfire' }[type]||'';
  const isAdmin = window._isAdmin;

  fbSec.innerHTML = posts.map(p => {
    const t = p.createdAt ? fmtTime(p.createdAt.toDate?.() || new Date(p.createdAt.seconds*1000)) : '刚刚';
    return `
      <div class="post-card ${typeClass}" data-type="${type}" data-post-id="${p.id}">
        <div class="card-meta">
          <span class="card-author">${esc(p.authorName||'')}</span>
          <span class="card-stats">${t}</span>
        </div>
        ${p.targetChar?`<div class="post-target-char">${esc(p.targetChar)}</div>`:''}
        ${p.title?`<h3>${esc(p.title)}</h3>`:''}
        <div class="card-content">${esc(p.content||'')}</div>
        <div class="card-actions">
          <div class="action-group">
            <button class="action-btn like" onclick="fbLike('${p.id}',this)">❤ 共鸣 <span>${p.votes||0}</span></button>
          </div>
          <button class="action-btn comment" onclick="openFbPost('${p.id}',this.closest('.post-card'))">💬 响应 <span>${p.comments||0}</span></button>
          <button class="report-btn" onclick="fbReport('${p.id}')" title="举报">⚑</button>
          ${isAdmin?`<button class="admin-delete-btn" onclick="fbDelete('${p.id}',this.closest('.post-card'))">🗑 删除</button>`:''}
        </div>
      </div>`;
  }).join('');
}

// 点赞
window.fbLike = function(postId, btn) {
  window.CrimsonAuth.requireAuth(async () => {
    try { await votePost(postId); const sp=btn.querySelector('span'); if(sp) sp.textContent=parseInt(sp.textContent||0)+1; btn.disabled=true; }
    catch(e){}
  });
};

// 举报
window.fbReport = function(postId) {
  if (!confirm('确认举报该内容？')) return;
  reportPost(postId).then(()=>window.showSysToast?.('>> 举报已提交，感谢维护社区安全。'));
};

// 管理员删除
window.fbDelete = function(postId, card) {
  if (!confirm('确认删除该帖子？此操作不可撤销。')) return;
  deletePost(postId).then(()=>{ card?.remove(); window.showSysToast?.('>> 已删除。'); });
};

// ==========================================
// 💬 帖子弹窗 + 评论
// ==========================================
let _currentPostId = null;
let _commentUnsub = null;

function setupPostModal() {
  setTimeout(()=>{
    const modal = document.getElementById('post-modal');
    if (!modal) return;

    // 替换评论提交按钮
    const submitBtn = modal.querySelector('.comment-submit');
    if (submitBtn) submitBtn.onclick = submitComment;

    // 监听modal开关
    new MutationObserver(()=>{
      if (modal.classList.contains('active')) {
        // 如果是通过openFbPost打开的，_currentPostId已设
      } else {
        _commentUnsub?.(); _commentUnsub=null; _currentPostId=null;
      }
    }).observe(modal,{attributes:true,attributeFilter:['class']});
  },1000);
}

window.openFbPost = function(postId, card) {
  _currentPostId = postId;
  // 复用现有的 openPostModal
  if (card && window.openPostModal) window.openPostModal(card);
  else { document.getElementById('post-modal')?.classList.add('active'); }
  // 加载评论
  loadComments(postId);
};

function loadComments(postId) {
  _commentUnsub?.();
  const list = document.getElementById('modal-comment-list');
  if (!list) return;
  _commentUnsub = listenToComments(postId, comments => {
    if (!comments.length) { list.innerHTML='<div class="empty-state" style="padding:1rem;font-size:0.72rem;">[ 暂无回响 ]</div>'; return; }
    list.innerHTML = comments.map(c=>`
      <div class="comment-item">
        <div class="comment-meta"><span>${esc(c.authorName||'')}</span><span>${c.createdAt?fmtTime(c.createdAt.toDate?.()??new Date(c.createdAt.seconds*1000)):''}</span></div>
        <div class="comment-text">${esc(c.text||'')}</div>
      </div>`).join('');
  });
}

async function submitComment() {
  const ta = document.querySelector('#post-modal .comment-input');
  const text = ta?.value?.trim();
  if (!text) return;
  window.CrimsonAuth.requireAuth(async ()=>{
    if (!_currentPostId) { window.showSysToast?.('>> 静态帖子暂不支持评论'); return; }
    try {
      await addComment(_currentPostId, text);
      ta.value='';
      window.showSysToast?.('>> 回响已注入。');
    } catch(e){ window.showSysToast?.('>> 提交失败，请重试。'); }
  });
}

// ==========================================
// 🚪 发帖/凿字 登录拦截
// ==========================================
function interceptPostActions() {
  setTimeout(()=>{
    // 覆盖全局mintPoster（造字刻录按钮调用的函数）
    window.mintPoster = function() {
      window.CrimsonAuth.requireAuth(()=> handleForge());
    };
    // 覆盖全局submitNormalPost（常规发帖按钮调用的函数）
    window.submitNormalPost = function() {
      window.CrimsonAuth.requireAuth(()=> handleNormalPost());
    };
    // 覆盖全局openLabModal（凿字/发帖按钮）- 需要登录
    const origOpenLab = window.openLabModal;
    window.openLabModal = function() {
      window.CrimsonAuth.requireAuth(()=>{ if(origOpenLab) origOpenLab(); });
    };
    // 拓片馆入口 — 进入时需要登录
    const profileLink = document.querySelector('.nav-links a[onclick*="rubbing-pavilion"]');
    if (profileLink) {
      const origOnClick = profileLink.getAttribute('onclick');
      profileLink.removeAttribute('onclick');
      profileLink.addEventListener('click', e=>{
        e.preventDefault();
        window.CrimsonAuth.requireAuth(()=>{ eval(origOnClick); });
      });
    }
  }, 500);
}

async function handleForge() {
  const word = window.currentWord || '';
  // 从当前活跃的wb-panel里找textarea
  const activePanel = document.querySelector('.wb-panel.active');
  let newDef = '', reason = '';
  if (activePanel) {
    const textareas = activePanel.querySelectorAll('textarea.wb-textarea, input.wb-textarea');
    if (textareas.length >= 1) newDef = textareas[0]?.value?.trim() || '';
    if (textareas.length >= 2) reason = textareas[1]?.value?.trim() || '';
  }
  if (!word && !newDef) { window.showSysToast?.('>> ⚠️ 请输入要重塑的字并填写新释义。'); return; }
  if (!newDef) newDef = '(偏旁手术/字词替换 — 详见画板)';
  try {
    await createPost({ type:'glyph', targetChar:word, title:`重塑「${word}」的释义提案`, content:newDef, reasoning:reason });
    window.showSysToast?.('>> ✅ 刻录完成！正在传送至【女娲的泥潭·凿字库】...');
    window.closeLabModal?.();
    setTimeout(() => {
      window.switchPage?.('page-mire', document.querySelector('.nav-links a[onclick*="page-mire"]'));
      setTimeout(() => {
        const glyphTab = document.querySelector('.mire-tab[onclick*="tab-glyphs"]');
        if (glyphTab) window.switchMireTab?.('tab-glyphs', glyphTab);
      }, 300);
    }, 800);
  } catch(e) {
    console.error('Forge error:', e);
    window.showSysToast?.('>> 发射失败：' + (e.message||'请重试'));
  }
}

async function handleNormalPost() {
  const typeSelect = document.querySelector('#lab-view-normal-post .fbi-select');
  const titleInput = document.querySelector('#lab-view-normal-post .fbi-input');
  const contentArea = document.querySelector('#lab-view-normal-post .fbi-textarea');
  const type = typeSelect?.value || 'parchment';
  const title = titleInput?.value?.trim();
  const content = contentArea?.value?.trim();
  if (!title||!content) { window.showSysToast?.('>> ⚠️ 标题和正文不能为空。'); return; }
  try {
    await createPost({type, title, content});
    window.showSysToast?.('>> ✅ 封卷成功！已同步至泥潭。');
    if (titleInput) titleInput.value = '';
    if (contentArea) contentArea.value = '';
    window.closeLabModal?.();
    const tabMap = { 'parchment':'tab-parchments', 'terracotta':'tab-terracotta', 'bonfire':'tab-bonfire' };
    const targetTab = tabMap[type] || 'tab-parchments';
    setTimeout(() => {
      window.switchPage?.('page-mire', document.querySelector('.nav-links a[onclick*="page-mire"]'));
      setTimeout(() => {
        const tabBtn = document.querySelector(`.mire-tab[onclick*="${targetTab}"]`);
        if (tabBtn) window.switchMireTab?.(targetTab, tabBtn);
      }, 300);
    }, 800);
  } catch(e) {
    console.error('Post error:', e);
    window.showSysToast?.('>> 刻录失败：' + (e.message||'请重试'));
  }
}

// ==========================================
// 📖 30个字注入字典侧边栏
// ==========================================
function injectDictionaryData() {
  setTimeout(() => {
    const sidebarContainer = document.getElementById('word-list-container');
    const azContainer = document.getElementById('az-container');
    if (!sidebarContainer) return;

    // 构建按拼音首字母分组的数据
    const charsByLetter = {};
    Object.entries(CHARACTER_DATA).forEach(([char, data]) => {
      const letter = data.pinyin.charAt(0).toUpperCase();
      if (!charsByLetter[letter]) charsByLetter[letter] = [];
      charsByLetter[letter].push({ char, ...data });
    });

    // 重建A-Z矩阵高亮
    if (azContainer) {
      const existingCells = azContainer.querySelectorAll('.pinyin-cell');
      existingCells.forEach(cell => {
        const letter = cell.innerText.trim();
        if (charsByLetter[letter] && charsByLetter[letter].length > 0) {
          cell.classList.add('has-data');
        }
        // 覆盖点击事件
        cell.onclick = () => bridgeLoadNetwork(letter);
      });
    }

    // 搜索框覆盖
    const searchInput = document.querySelector('#layer-definition .search-bar input');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        const val = this.value.trim().toLowerCase();
        if (!val) { bridgeLoadNetwork(''); return; }
        const matches = Object.entries(CHARACTER_DATA).filter(([char, data]) => 
          char.includes(val) || data.pinyin.toLowerCase().includes(val)
        );
        renderDictSidebar(matches.map(([char, data]) => ({ char, ...data })));
      });
    }

    // 初始加载全部
    bridgeLoadNetwork('');

    function bridgeLoadNetwork(letter) {
      document.querySelectorAll('.pinyin-cell').forEach(el => {
        el.classList.toggle('active', el.innerText.trim() === letter);
      });
      let chars;
      if (!letter) {
        chars = Object.entries(CHARACTER_DATA).map(([c,d]) => ({ char:c, ...d }));
      } else {
        chars = (charsByLetter[letter] || []);
      }
      renderDictSidebar(chars);

      // 显示network view, 隐藏detail view
      const nv = document.getElementById('network-view');
      const dv = document.getElementById('detail-view');
      const aw = document.getElementById('archive-wrapper');
      if (nv) nv.style.display = 'flex';
      if (dv) dv.style.display = 'none';
      if (aw) { aw.classList.remove('bg-detail'); aw.classList.add('bg-network'); }
    }

    function renderDictSidebar(chars) {
      sidebarContainer.innerHTML = '';
      if (chars.length === 0) {
        sidebarContainer.innerHTML = '<li class="term-item" style="color:var(--ash);justify-content:center;font-size:0.8rem;cursor:default;border:none;background:transparent;">无可用锚点 / NO_NODES</li>';
        return;
      }
      chars.forEach(data => {
        const li = document.createElement('li');
        li.className = 'term-item';
        li.innerHTML = `<span class="char">${data.char}</span><span class="meta">[${data.pinyin.toUpperCase()}]</span>`;
        li.onclick = () => bridgeOpenWord(data.char);
        sidebarContainer.appendChild(li);
      });
    }

    function bridgeOpenWord(char) {
      const data = CHARACTER_DATA[char];
      if (!data) return;

      // 隐藏network, 显示detail
      const nv = document.getElementById('network-view');
      const dv = document.getElementById('detail-view');
      const aw = document.getElementById('archive-wrapper');
      if (nv) nv.style.display = 'none';
      if (dv) dv.style.display = 'flex';
      if (aw) { aw.classList.remove('bg-network'); aw.classList.add('bg-detail'); }

      // 高亮侧边栏
      sidebarContainer.querySelectorAll('.term-item').forEach(li => {
        li.classList.toggle('active', li.querySelector('.char')?.textContent === char);
      });

      // 填充详情
      const uiChar = document.getElementById('ui-char');
      const uiMeta = document.getElementById('ui-meta');
      const uiOldDef = document.getElementById('ui-old-def');
      const catLabels = { stigma:'贬义字', institution:'制度字', matrilineal:'母系遗存', reclaim:'褒义字', neutral:'中性字' };

      if (uiChar) uiChar.innerText = char;
      if (uiMeta) uiMeta.innerHTML = `ARCHIVE · ${catLabels[data.category]||''} · 污染等级 ${data.pollutionLevel}/5`;
      if (uiOldDef) {
        uiOldDef.innerHTML = `<span class="redacted">${data.shuowen}</span><br><br><span class="redacted">${data.modern}</span>`;
      }

      // 填充提案区（用analysis作为系统提案）
      const proposalsList = document.getElementById('ui-proposals-list');
      if (proposalsList) {
        proposalsList.innerHTML = `
          <div class="proposal-item">
            <div class="proposal-meta">
              <span>> 提议者：<span class="proposal-author">@系统解析</span></span>
              <span>[ 深度分析 ]</span>
            </div>
            <div class="proposal-text">${data.analysis || ''}</div>
          </div>`;
      }

      // 重置刮刮乐按钮
      const btn = document.getElementById('btn-decipher');
      if (btn) {
        btn.innerText = '[ ⚠️ 侦察释义 ]';
        btn.classList.remove('mutated');
        btn.onclick = () => {
          document.querySelectorAll('#ui-old-def .redacted').forEach(el => el.classList.add('revealed'));
          btn.innerText = '驳回旧叙事，发起新提案 ➔';
          btn.classList.add('mutated');
          btn.onclick = () => window.openLabWithWord?.(char);
          document.getElementById('new-def-area')?.classList.add('active');
        };
      }
      document.getElementById('new-def-area')?.classList.remove('active');

      // 移动端收起侧边栏
      if (window.innerWidth <= 900) {
        document.getElementById('dict-sidebar')?.classList.add('collapsed');
      }
    }

    // 覆盖全局的backToNetwork
    window.backToNetwork = () => bridgeLoadNetwork('');
  }, 600);
}

// ==========================================
// ⚑ 举报按钮注入到现有卡片
// ==========================================
function injectReportButtons() {
  setTimeout(()=>{
    document.querySelectorAll('.post-card:not([data-post-id])').forEach(card=>{
      if (card.querySelector('.report-btn')) return;
      const btn = document.createElement('button');
      btn.className='report-btn'; btn.title='举报'; btn.textContent='⚑';
      btn.onclick = e=>{ e.stopPropagation(); window.showSysToast?.('>> 静态示例帖，无法举报。'); };
      card.querySelector('.card-actions')?.appendChild(btn);
    });
  },600);
}

// ==========================================
// 🔧 篝火阵高优标签（JS层双重修复）
// ==========================================
function fixBonfireLabel() {
  // CSS已处理，这里再做一次DOM层清理
  setTimeout(()=>{
    document.querySelectorAll('.card-bonfire h3').forEach(h3=>{
      h3.childNodes.forEach(n=>{
        if (n.nodeType===3 && n.textContent.includes('高优')) {
          n.textContent = n.textContent.replace(/[\[【]?\s*[▲⚠️]?\s*高优\s*[\]】]?/g,'').trim();
        }
      });
    });
  },300);
}

// ==========================================
// 🛡️ 管理员模式（在控制台运行激活）
// ==========================================
// 在浏览器控制台输入 window.activateAdmin('你的密码') 来激活管理员模式
window.activateAdmin = function(password) {
  // 简单本地验证（你可以自己改这个密码）
  if (password === 'crimson_admin_2024') {
    window._isAdmin = true;
    window.showSysToast?.('>> ⚡ 管理员模式已激活。刷新帖子列表以显示删除按钮。');
    // 重新渲染所有tab
    Object.entries(tabTypeMap).forEach(([tabId,type])=>loadTabPosts(tabId,type));
  } else {
    window.showSysToast?.('>> 密码错误。');
  }
};

// ==========================================
// 🛠️ 工具函数
// ==========================================
function esc(s){
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtTime(d){
  if(!d) return '';
  const diff = Math.floor((Date.now()-d)/1000);
  if(diff<60) return '刚刚';
  if(diff<3600) return `${Math.floor(diff/60)}分钟前`;
  if(diff<86400) return `${Math.floor(diff/3600)}小时前`;
  return `${Math.floor(diff/86400)}天前`;
}
