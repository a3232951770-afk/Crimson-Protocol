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
  votePost, reportPost, deletePost,
  getUserPosts, getPostById, getPromotedProposals, getCharProposals, getAllPromotedGlyphs,
  updateUserAvatar, getUserProfile,
  sendDirectMessage, listenToDmMessages, listenToUserChats, markChatAsRead,
  getAnnouncements
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
  setupProfileSync();   // 11. 拓片馆数据同步

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
      // 注册后 displayName 已设置，但 onAuthChange 可能先触发了（那时还没设置）
      // 所以这里强制刷新一次
      _currentUser = user;
      updateNavUser(user);
      const codenameEl = document.getElementById('val-codename');
      if (codenameEl) codenameEl.textContent = user.displayName || user.email;
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
  
  // 更新首页星域总数显示
  const totalCountEl = document.getElementById('star-total-count');
  if (totalCountEl) totalCountEl.textContent = Object.keys(CHARACTER_DATA).length;

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

  // 移动端：点击 ::before 伪元素的位置（顶部"星域分类 ▼"标签）来展开/折叠
  filterDiv.addEventListener('click', (e) => {
    if (window.innerWidth > 768) return; // 桌面版不变
    // 点击在按钮或count区域内时不切换（让按钮自己处理）
    if (e.target.closest('.star-filter-btn') || e.target.closest('#star-filter-count')) return;
    // 点击在伪元素位置（顶部~36px内）时切换
    const rect = filterDiv.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    if (clickY < 36 || filterDiv.classList.contains('mobile-expanded')) {
      filterDiv.classList.toggle('mobile-expanded');
    }
  });
  // 选了某个分类后自动收起
  filterDiv.addEventListener('click', (e) => {
    if (window.innerWidth > 768) return;
    if (e.target.closest('.star-filter-btn')) {
      setTimeout(() => filterDiv.classList.remove('mobile-expanded'), 100);
    }
  });

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
      // 关闭详情卡
      document.getElementById('detail-card')?.classList.remove('active');
      // 一键回正相机
      window.resetStarCamera?.();
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

  // 点击字 → 显示详情卡（设置屏蔽标志阻止Three.js覆盖）
  window.flyToCharCard = (char) => {
    const data = CHARACTER_DATA[char];
    if (!data) return;
    const isEn = window._lang === 'en';
    const en = window.CHAR_EN?.[char];
    
    window._blockThreeJsClick = true;
    setTimeout(() => { window._blockThreeJsClick = false; }, 600);
    
    document.getElementById('star-char-expand')?.classList.remove('active');

    const card = document.getElementById('detail-card');
    if (!card) return;
    const titleEl = document.getElementById('card-title');
    const typeEl = document.getElementById('card-type');
    const descEl = document.getElementById('card-desc');
    const catLabels = isEn
      ? { stigma:'Derogatory', institution:'Institutional', matrilineal:'Matrilineal', reclaim:'Reclaimed', neutral:'Neutral' }
      : { stigma:'贬义字', institution:'制度字', matrilineal:'母系遗存', reclaim:'褒义字', neutral:'中性字' };
    const catColors = { stigma:'#ff6b6b', institution:'var(--terracotta)', matrilineal:'var(--amber)', reclaim:'#5a9e6f', neutral:'var(--bone)' };
    if (titleEl) { titleEl.innerText = char; titleEl.style.color = catColors[data.category] || 'var(--terracotta)'; }
    if (typeEl) typeEl.innerText = `${catLabels[data.category]||''} · ${isEn?'Pollution':'污染等级'} ${data.pollutionLevel}/5`;
    if (descEl) {
      descEl.classList.remove('revealed');
      const sw = (isEn && en) ? en.s : (data.shuowen||'');
      const md = (isEn && en) ? en.m : (data.modern||'');
      descEl.innerText = `${sw}\n${md}`;
    }
    card.classList.add('active');
    
    // 加载已收录的提案到轮播区
    window.loadStarProposalCarousel?.(char);
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
        const catGroup = document.getElementById('new-word-category-group');
        if (catGroup) catGroup.style.display = 'none';
      } else {
        isHit = false;
        text = `⚠️ WARNING: Archive Incomplete.\n> 检索失败：旧世档案库残缺。\n> 检测到词源含规训基因，请手动录入父权旧义。`;
        window._currentCharData = null;
        const catGroup = document.getElementById('new-word-category-group');
        if (catGroup) catGroup.style.display = 'block';
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

  const empty = cont.querySelector('.empty-state');
  if (empty) empty.style.display = posts.length ? 'none' : 'block';

  const typeClass = { glyph:'card-glyph', parchment:'card-parchment', terracotta:'card-terracotta', bonfire:'card-bonfire' }[type]||'';
  const isAdmin = window._isAdmin;

  // 存储帖子数据供详情弹窗使用
  window._fbPostsCache = window._fbPostsCache || {};
  posts.forEach(p => { window._fbPostsCache[p.id] = p; });

  fbSec.innerHTML = posts.map(p => {
    const t = p.createdAt ? fmtTime(p.createdAt.toDate?.() || new Date(p.createdAt.seconds*1000)) : (window._lang==='en'?'just now':'刚刚');
    const dimLabels = { huaxia:'华夏纪元', huanyu:'寰宇纪元', lingjing:'灵境空间' };
    const dimTag = p.dimension ? `<span class="post-method-badge" style="color:#c8860a;border-color:rgba(200,134,10,0.3);">${dimLabels[p.dimension]||p.dimension}</span>` : '';
    const imgHtml = p.postImage ? `<img src="${p.postImage}" style="width:100%;max-height:180px;object-fit:cover;border:1px solid rgba(204,78,60,0.2);margin:0.5rem 0;" onclick="event.stopPropagation();window.openLightbox?.('${p.postImage}')"/>` : '';
    const canvasHtml = p.canvasImage ? `<div style="font-size:0.65rem;color:var(--ash);text-align:center;margin-top:4px;">[ 📷 含画板截图 ]</div>` : '';
    return `
      <div class="post-card ${typeClass}" data-type="${type}" data-post-id="${p.id}" onclick="window.openFbPostDetail('${p.id}')">
        <div class="card-meta">
          <span class="card-author" data-author-id="${esc(p.authorId||'')}" data-author-name="${esc(p.authorName||'')}">${esc(p.authorName||'')}</span>
          <span class="card-stats">${t}</span>
        </div>
        ${p.targetChar?`<div class="post-target-char">${esc(p.targetChar)}</div>`:''}
        ${dimTag}
        ${p.title?`<h3>${esc(p.title)}</h3>`:''}
        ${imgHtml}
        <div class="card-content">${esc(p.content||'').substring(0,120)}${(p.content||'').length>120?'...':''}</div>
        ${canvasHtml}
        <div class="card-actions" onclick="event.stopPropagation()">
          <div class="action-group">
            <button class="action-btn like ${_votedPosts.has(p.id)?'active':''}" onclick="fbLike('${p.id}',this)" ${_votedPosts.has(p.id)?'disabled style="opacity:0.5"':''}>❤ ${window._lang==='en'?'Resonate':'共鸣'} <span>${p.votes||0}</span></button>
          </div>
          <button class="action-btn comment" onclick="window.openFbPostDetail('${p.id}')">💬 ${window._lang==='en'?'Respond':'响应'} <span>${p.comments||0}</span></button>
          <button class="report-btn" onclick="fbReport('${p.id}')" title="${window._lang==='en'?'Report':'举报'}">⚑</button>
          ${isAdmin?`<button class="admin-delete-btn" onclick="fbDelete('${p.id}',this.closest('.post-card'))">🗑</button>`:''}
        </div>
      </div>`;
  }).join('');
  
  // 更新tab计数
  const countMap = { glyph:'count-glyphs', parchment:'count-parchments', terracotta:'count-terracotta' };
  const countEl = document.getElementById(countMap[type]);
  if (countEl) countEl.textContent = posts.length;
}

// 投票 — 每人每帖只能一次（客户端localStorage + 按钮禁用）
const _votedPosts = new Set(JSON.parse(localStorage.getItem('crimson_voted') || '[]'));
const _likedPosts = new Set(JSON.parse(localStorage.getItem('crimson_liked') || '[]'));

window.fbLike = function(postId, btn) {
  window.CrimsonAuth.requireAuth(async () => {
    const isVote = btn.classList.contains('vote');
    const trackSet = isVote ? _votedPosts : _likedPosts;
    const storageKey = isVote ? 'crimson_voted' : 'crimson_liked';
    
    if (trackSet.has(postId)) {
      window.showSysToast?.(window._lang==='en' ? '>> You have already voted on this.' : '>> 你已经对此投过票了。');
      return;
    }
    try {
      await votePost(postId);
      trackSet.add(postId);
      localStorage.setItem(storageKey, JSON.stringify([...trackSet]));
      const sp = btn.querySelector('span');
      if (sp) {
        const newCount = parseInt(sp.textContent||0) + 1;
        sp.textContent = newCount;
        // 200票阈值检测
        if (newCount === 200) {
          const p = window._fbPostsCache?.[postId];
          if (p?.type === 'glyph') {
            window.showSysToast?.(window._lang==='en' 
              ? `>> 🌟 THRESHOLD REACHED! 「${p.targetChar||''}」 has been promoted to the Chronicles dictionary!`
              : `>> 🌟 觉醒阈值突破！「${p.targetChar||''}」的提案已升入《编年史》字典！`);
          } else if (p?.type === 'parchment') {
            window.showSysToast?.(window._lang==='en'
              ? `>> 📜 THRESHOLD REACHED! This parchment has been archived in the Chronicles timeline!`
              : `>> 📜 觉醒阈值突破！该羊皮卷已被收录进《编年史·史记》！`);
          }
        }
      }
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    } catch(e) {
      console.error('Vote error:', e);
    }
  });
};

// 举报 — 不立即隐藏帖子，标记待管理员审核
window.fbReport = function(postId) {
  const msg = window._lang === 'en' 
    ? 'Report this content? An admin will review it.' 
    : '确认举报该内容？管理员将进行审核。';
  if (!confirm(msg)) return;
  
  // 不直接设置reported=true（那会立即隐藏帖子），而是记录举报
  // 管理员可以在Firebase Console的community_posts里手动查看和删除
  const reportData = { postId, reportedBy: _currentUser?.uid || 'anonymous', time: new Date().toISOString() };
  const existingReports = JSON.parse(localStorage.getItem('crimson_reports') || '[]');
  existingReports.push(reportData);
  localStorage.setItem('crimson_reports', JSON.stringify(existingReports));
  
  const toast = window._lang === 'en' 
    ? '>> Report submitted. An admin will review this content.' 
    : '>> 举报已提交，管理员将进行审核。感谢维护社区安全。';
  window.showSysToast?.(toast);
};

// 管理员删除
window.fbDelete = function(postId, card) {
  if (!confirm('确认删除该帖子？此操作不可撤销。')) return;
  deletePost(postId).then(()=>{ card?.remove(); window.showSysToast?.('>> 已删除。'); });
};

// 用户删除自己的帖子
window.deleteOwnPost = function(postId, card) {
  const msg = window._lang === 'en' ? 'Delete this post? This cannot be undone.' : '确认删除该帖子？此操作不可撤销。';
  if (!confirm(msg)) return;
  deletePost(postId).then(() => {
    card?.remove();
    window.showSysToast?.(window._lang === 'en' ? '>> Post deleted.' : '>> 帖子已删除。');
  }).catch(e => {
    window.showSysToast?.('>> 删除失败：' + (e.message||''));
  });
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

window.openFbPostDetail = function(postId) {
  const p = window._fbPostsCache?.[postId];
  if (!p) return;
  
  _currentPostId = postId;
  const modal = document.getElementById('post-modal');
  const contentArea = document.getElementById('modal-content-area');
  const interactionArea = document.getElementById('modal-interaction-area');
  if (!modal || !contentArea) return;
  
  const isEn = window._lang === 'en';
  const methodLabels = {
    'new-meaning': isEn ? 'NEW DEFINITION' : '赋予新义',
    'replace': isEn ? 'WORD REPLACEMENT' : '字词替换',
    'surgery': isEn ? 'RADICAL SURGERY' : '偏旁手术'
  };
  
  let html = '';
  
  // 作者+时间
  const t = p.createdAt ? fmtTime(p.createdAt.toDate?.() || new Date(p.createdAt.seconds*1000)) : '';
  html += `<div class="card-meta" style="margin-bottom:1rem;"><span class="card-author" data-author-id="${esc(p.authorId||'')}" data-author-name="${esc(p.authorName||'')}">${esc(p.authorName||'')}</span><span class="card-stats">${t}</span></div>`;
  
  // 目标字（大字展示）
  if (p.targetChar) {
    html += `<div class="post-target-char">${esc(p.targetChar)}</div>`;
  }
  
  // 操作类型标签
  if (p.type === 'glyph') {
    const method = p.content?.includes('偏旁手术') ? 'surgery' : 
                   p.content?.includes('替代词') ? 'replace' : 'new-meaning';
    const label = methodLabels[method] || (isEn ? 'PROPOSAL' : '提案');
    html += `<div class="post-method-badge">${label}</div>`;
  }
  
  // 标题
  if (p.title) html += `<h3 style="color:var(--amber);margin:0.8rem 0 0.5rem;">${esc(p.title)}</h3>`;
  
  // 正文
  if (p.content) html += `<div class="card-content" style="margin:1rem 0;line-height:1.8;color:var(--bone);font-size:0.95rem;">${escBr(p.content)}</div>`;
  
  // 上传的图片
  if (p.postImage) {
    html += `<div style="margin:1rem 0;text-align:center;">
      <img class="post-canvas-image" src="${p.postImage}" onclick="window.openLightbox(this.src)" alt="post image"/>
    </div>`;
  }
  
  // 论证
  if (p.reasoning) html += `<div style="margin:1rem 0;padding:0.8rem;border-left:2px solid var(--terracotta);color:var(--ash);font-size:0.85rem;"><strong style="color:var(--terracotta);">${isEn?'Reasoning':'论证'}：</strong>${escBr(p.reasoning)}</div>`;
  
  // 画板截图（偏旁手术）
  if (p.canvasImage) {
    html += `<div style="margin:1rem 0;text-align:center;">
      <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--ash);margin-bottom:0.5rem;">${isEn?'[ Radical Surgery Canvas ]':'[ 偏旁手术画板 ]'}</div>
      <img class="post-canvas-image" src="${p.canvasImage}" onclick="window.openLightbox(this.src)" alt="canvas"/>
    </div>`;
  }
  
  contentArea.innerHTML = html;
  
  // 交互栏（投票+点赞 — 使用Firebase实时函数）
  if (interactionArea) {
    const voteLabel = p.type === 'glyph' ? (isEn?'▵ Vote':'▵ 投票') : (isEn?'▵ Archive':'▵ 收录');
    interactionArea.innerHTML = `
      <div class="action-group">
        <button class="action-btn vote" onclick="fbLike('${postId}',this)">${voteLabel} <span>${p.votes||0}</span></button>
        <button class="action-btn like" onclick="fbLike('${postId}',this)">❤ ${isEn?'Resonate':'共鸣'} <span>${p.votes||0}</span></button>
      </div>
      <button class="action-btn comment">💬 ${isEn?'Responses':'响应'} <span>${p.comments||0}</span></button>`;
  }
  
  modal.classList.add('active');
  loadComments(postId);
};

// 老的openFbPost保持兼容
window.openFbPost = function(postId, card) {
  window.openFbPostDetail(postId);
};

// 图片灯箱
window.openLightbox = function(src) {
  const lb = document.getElementById('image-lightbox');
  if (!lb) return;
  lb.innerHTML = `<img src="${src}" alt="canvas detail"/>`;
  lb.classList.add('active');
};

function loadComments(postId) {
  _commentUnsub?.();
  const list = document.getElementById('modal-comment-list');
  if (!list) return;
  _commentUnsub = listenToComments(postId, comments => {
    if (!comments.length) { list.innerHTML='<div class="empty-state" style="padding:1rem;font-size:0.72rem;">[ 暂无回响 ]</div>'; return; }
    list.innerHTML = comments.map(c=>`
      <div class="comment-item">
        <div class="comment-meta"><span class="card-author" data-author-id="${esc(c.authorId||'')}" data-author-name="${esc(c.authorName||'')}">${esc(c.authorName||'')}</span><span>${c.createdAt?fmtTime(c.createdAt.toDate?.()??new Date(c.createdAt.seconds*1000)):''}</span></div>
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
  const activePanel = document.querySelector('.wb-panel.active');
  let newDef = '', reason = '', canvasImage = '';
  
  if (activePanel) {
    const panelId = activePanel.id;
    
    if (panelId === 'tab-radical-surgery') {
      // 偏旁手术：手动合成截图（把DOM偏旁画到canvas上）
      try {
        const fc = document.getElementById('freehand-canvas');
        const container = document.getElementById('surgery-canvas-container');
        if (fc && container) {
          // 创建合成canvas
          const compCanvas = document.createElement('canvas');
          const rect = container.getBoundingClientRect();
          compCanvas.width = rect.width;
          compCanvas.height = rect.height;
          const ctx = compCanvas.getContext('2d');
          
          // 1. 填充背景（略浅于黑色，让字看得清）
          ctx.fillStyle = '#0f0d0c';
          ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);
          
          // 2. 画freehand笔画
          ctx.drawImage(fc, 0, 0, compCanvas.width, compCanvas.height);
          
          // 3. 画所有拖入的偏旁部首
          const radicals = container.querySelectorAll('.dropped-radical');
          radicals.forEach(rad => {
            const text = rad.querySelector('.radical-text')?.textContent || rad.textContent?.trim();
            if (!text) return;
            const radRect = rad.getBoundingClientRect();
            const x = radRect.left - rect.left + radRect.width / 2;
            const y = radRect.top - rect.top + radRect.height / 2;
            const scaleX = parseFloat(rad.dataset.scaleX) || 1;
            const fontSize = Math.round(96 * scaleX);
            ctx.save();
            ctx.font = `900 ${fontSize}px "Noto Serif SC", serif`;
            ctx.fillStyle = '#cc4e3c';  // 赤陶色，在深色背景上清晰可见
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x, y);
            ctx.restore();
          });
          
          canvasImage = compCanvas.toDataURL('image/png');
        }
      } catch(e) { console.warn('画板截图失败:', e); }
      newDef = '偏旁手术重构提案（详见画板截图）';
    } else if (panelId === 'tab-replace-word') {
      const inputs = activePanel.querySelectorAll('textarea.wb-textarea, input.wb-textarea');
      if (inputs.length >= 1) newDef = inputs[0]?.value?.trim() || '';
      if (inputs.length >= 2) reason = inputs[1]?.value?.trim() || '';
      if (newDef) newDef = `替代词提案：${newDef}`;
    } else {
      const textareas = activePanel.querySelectorAll('textarea.wb-textarea, input.wb-textarea');
      if (textareas.length >= 1) newDef = textareas[0]?.value?.trim() || '';
      if (textareas.length >= 2) reason = textareas[1]?.value?.trim() || '';
    }
  }
  
  if (!word && !newDef) { window.showSysToast?.('>> ⚠️ 请输入要重塑的字并填写新释义。'); return; }
  if (!newDef) newDef = '(偏旁手术/字词替换 — 详见画板)';
  
  try {
    const postData = { type:'glyph', targetChar:word, title:`重塑「${word}」的释义提案`, content:newDef, reasoning:reason };
    if (canvasImage && canvasImage.length < 900000) postData.canvasImage = canvasImage; // Firestore 1MB field limit
    // 新字/词：附带旧义和分类
    const manualOldDef = document.getElementById('manual-old-def-input')?.value?.trim();
    const newWordCat = document.getElementById('new-word-category')?.value;
    if (manualOldDef) postData.oldDefinition = manualOldDef;
    if (newWordCat && !window._currentCharData) postData.charCategory = newWordCat;
    await createPost(postData);
    window.showSysToast?.('>> ✅ 刻录完成！正在传送至【女娲的泥潭·凿字库】...');
    // 清空画板和表单
    if (window.clearSurgeryCanvas) window.clearSurgeryCanvas();
    document.querySelectorAll('.wb-textarea').forEach(t => t.value = '');
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
  const typeSelect = document.getElementById('post-type-select');
  const dimSelect = document.getElementById('post-dimension-select');
  const titleInput = document.querySelector('#lab-view-normal-post .fbi-input');
  const contentArea = document.querySelector('#lab-view-normal-post .fbi-textarea');
  const type = typeSelect?.value || 'parchment';
  const title = titleInput?.value?.trim();
  const content = contentArea?.value?.trim();
  if (!title||!content) { window.showSysToast?.('>> ⚠️ 标题和正文不能为空。'); return; }
  
  const postData = { type, title, content };
  if (type === 'parchment' && dimSelect) postData.dimension = dimSelect.value;
  // 附带上传的图片
  if (window._pendingPostImage && window._pendingPostImage.length < 900000) {
    postData.postImage = window._pendingPostImage;
  }
  
  try {
    await createPost(postData);
    window.showSysToast?.('>> ✅ 封卷成功！已同步至泥潭。');
    // 完全清空表单
    if (titleInput) titleInput.value = '';
    if (contentArea) contentArea.value = '';
    window._pendingPostImage = null;
    const imgDisplay = document.getElementById('archive-img-display');
    if (imgDisplay) { imgDisplay.value = ''; imgDisplay.style.color = '#666'; imgDisplay.style.borderColor = '#333'; }
    const imgInput = document.getElementById('archive-img-upload');
    if (imgInput) imgInput.value = '';
    
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

    // 异步加载用户创造的200+票新字/词，注入字典
    getAllPromotedGlyphs().then(promoted => {
      if (!promoted || promoted.length === 0) return;
      let added = 0;
      promoted.forEach(p => {
        const tc = p.targetChar;
        if (!tc || CHARACTER_DATA[tc]) return; // 已存在的跳过
        CHARACTER_DATA[tc] = {
          char: tc, pinyin: tc,
          category: p.charCategory || 'stigma',
          pollutionLevel: (p.charCategory==='reclaim'||p.charCategory==='matrilineal') ? 1 : 4,
          shuowen: p.oldDefinition || '（用户录入旧义）',
          modern: `社区重塑提案（▵ ${p.votes||0}票）`,
          analysis: p.reasoning || p.content || '',
          _userCreated: true
        };
        // 添加到拼音分组（用第一个字的拼音）
        const firstChar = tc.charAt(0);
        const existing = Object.values(CHARACTER_DATA).find(d => d.char === firstChar && d.pinyin);
        const letter = existing ? existing.pinyin.charAt(0).toUpperCase() : '#';
        if (!charsByLetter[letter]) charsByLetter[letter] = [];
        charsByLetter[letter].push({ char: tc, ...CHARACTER_DATA[tc] });
        added++;
      });
      if (added > 0) {
        bridgeLoadNetwork(''); // 刷新侧边栏
        // 更新星域总数
        const totalEl = document.getElementById('star-total-count');
        if (totalEl) totalEl.textContent = Object.keys(CHARACTER_DATA).length;
        window.CHARACTER_DATA_CACHE = CHARACTER_DATA;
      }
    }).catch(()=>{});

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

      // 重建右侧星云网络的轨道节点
      const orbitsContainer = document.getElementById('network-orbit-nodes');
      if (orbitsContainer) {
        orbitsContainer.innerHTML = '';
        if (window._dictNetworkAnimId) cancelAnimationFrame(window._dictNetworkAnimId);
        
        const orbitData = [];
        if (chars.length > 0) {
          // 使用多环 + 黄金角散布防止叠字
          const goldenAngle = Math.PI * (3 - Math.sqrt(5));
          const ringsCount = chars.length <= 8 ? 1 : chars.length <= 20 ? 2 : 3;
          const perRing = Math.ceil(chars.length / ringsCount);
          
          chars.forEach((data, i) => {
            const ring = Math.floor(i / perRing);
            const posInRing = i % perRing;
            // 每环半径不同
            const baseRadius = 90 + ring * 80 + Math.random() * 25;
            // 同环内用黄金角均匀分布
            const baseAngle = posInRing * (Math.PI * 2 / perRing) + ring * 0.7 + (i * goldenAngle * 0.1);
            const speed = (0.0006 + Math.random() * 0.0008) * (ring % 2 === 0 ? 1 : -1);
            
            const nodeDiv = document.createElement('div');
            nodeDiv.className = 'network-word-node';
            nodeDiv.innerHTML = `<div class="network-word-char">${data.char}</div><div class="lucky-star"></div>`;
            nodeDiv.onclick = () => bridgeOpenWord(data.char);
            orbitsContainer.appendChild(nodeDiv);
            orbitData.push({ element: nodeDiv, char: data.char, angle: baseAngle, radius: baseRadius, speed, ringOffset: ring * 0.3 });
          });
        }
        
        const netCanvas = document.getElementById('network-canvas');
        if (netCanvas && orbitData.length > 0) {
          const wrapper = nv;
          const netW = wrapper.clientWidth || 600;
          const netH = wrapper.clientHeight || 400;
          const cx = netW / 2, cy = netH / 2;
          
          function animateDictNet() {
            orbitData.forEach(node => {
              node.angle += node.speed;
              const floatY = Math.sin(Date.now()/1000 + node.angle + node.ringOffset) * 6;
              const x = cx + Math.cos(node.angle) * (node.radius + floatY);
              const y = cy + Math.sin(node.angle) * (node.radius + floatY * 0.5);
              node.element.style.left = x + 'px';
              node.element.style.top = y + 'px';
            });
            window._dictNetworkAnimId = requestAnimationFrame(animateDictNet);
          }
          animateDictNet();
        }
      }
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
      const isEn = window._lang === 'en';
      const en = window.CHAR_EN?.[char];

      const nv = document.getElementById('network-view');
      const dv = document.getElementById('detail-view');
      const aw = document.getElementById('archive-wrapper');
      if (nv) nv.style.display = 'none';
      if (dv) dv.style.display = 'flex';
      if (aw) { aw.classList.remove('bg-network'); aw.classList.add('bg-detail'); }

      sidebarContainer.querySelectorAll('.term-item').forEach(li => {
        li.classList.toggle('active', li.querySelector('.char')?.textContent === char);
      });

      const uiChar = document.getElementById('ui-char');
      const uiMeta = document.getElementById('ui-meta');
      const uiOldDef = document.getElementById('ui-old-def');
      const catLabels = isEn 
        ? { stigma:'Derogatory', institution:'Institutional', matrilineal:'Matrilineal', reclaim:'Reclaimed', neutral:'Neutral' }
        : { stigma:'贬义字', institution:'制度字', matrilineal:'母系遗存', reclaim:'褒义字', neutral:'中性字' };

      if (uiChar) uiChar.innerText = char;
      if (uiMeta) uiMeta.innerHTML = `ARCHIVE · ${catLabels[data.category]||''} · ${isEn?'Pollution':'污染等级'} ${data.pollutionLevel}/5`;
      if (uiOldDef) {
        const sw = (isEn && en) ? en.s : data.shuowen;
        const md = (isEn && en) ? en.m : data.modern;
        uiOldDef.innerHTML = `<span class="redacted">${sw}</span><br><br><span class="redacted">${md}</span>`;
      }

      const proposalsList = document.getElementById('ui-proposals-list');
      if (proposalsList) {
        const analysisText = (isEn && en) ? en.a : (data.analysis || '');
        let proposalsHtml = `
          <div class="proposal-item">
            <div class="proposal-meta">
              <span>> ${isEn?'Proposer':'提议者'}：<span class="proposal-author">@系统解析</span></span>
              <span>[ ${isEn?'Deep Analysis':'深度分析'} ]</span>
            </div>
            <div class="proposal-text">${analysisText}</div>
          </div>`;
        proposalsList.innerHTML = proposalsHtml;
        
        // 只加载已升入字典的提案（≥200票）
        getPromotedProposals(char).then(proposals => {
          if (proposals.length === 0) return;
          proposals.forEach(p => {
            const reasonHtml = p.reasoning ? `<div style="margin-top:0.5rem;padding:0.6rem;border-left:2px solid var(--terracotta);color:var(--ash);font-size:0.8rem;"><strong style="color:var(--terracotta);">论证：</strong>${escBr(p.reasoning)}</div>` : '';
            proposalsList.innerHTML += `
              <div class="proposal-item" style="border-left:2px solid var(--neon-red);padding-left:0.8rem;">
                <div class="proposal-meta">
                  <span>> ${isEn?'Proposer':'提议者'}：<span class="proposal-author">${esc(p.authorName||'')}</span><span style="color:var(--neon-red);font-size:0.7rem;border:1px solid rgba(255,42,42,0.3);padding:1px 6px;margin-left:6px;">✦ ${isEn?'ARCHIVED':'已收录'}</span></span>
                  <span>[ ▵ ${p.votes||0} ]</span>
                </div>
                <div class="proposal-text">${escBr(p.content||'')}</div>
                ${reasonHtml}
              </div>`;
          });
        });
      }

      const btn = document.getElementById('btn-decipher');
      if (btn) {
        btn.innerText = isEn ? '[ ⚠️ Decode ]' : '[ ⚠️ 侦察释义 ]';
        btn.classList.remove('mutated');
        btn.onclick = () => {
          document.querySelectorAll('#ui-old-def .redacted').forEach(el => el.classList.add('revealed'));
          btn.innerText = isEn ? 'Reject & propose new definition ➔' : '驳回旧叙事，发起新提案 ➔';
          btn.classList.add('mutated');
          btn.onclick = () => window.openLabWithWord?.(char);
          document.getElementById('new-def-area')?.classList.add('active');
        };
      }
      document.getElementById('new-def-area')?.classList.remove('active');

      if (window.innerWidth <= 900) {
        document.getElementById('dict-sidebar')?.classList.add('collapsed');
      }
    }

    // 覆盖全局的backToNetwork
    window.backToNetwork = () => bridgeLoadNetwork('');
  }, 600);
}

// ==========================================
// 🏛️ 拓片馆数据同步
// ==========================================
function setupProfileSync() {
  onAuthChange(async user => {
    if (!user) return;
    await loadProfileData(user.uid);
  });
}

async function loadProfileData(uid) {
  if (!uid) return;
  try {
    const posts = await getUserPosts(uid);
    const footprintsCont = document.getElementById('footprints-container');
    const emptyEl = document.getElementById('footprints-empty');
    
    if (!footprintsCont) return;
    
    footprintsCont.querySelectorAll('.post-card').forEach(c => c.remove());
    
    if (posts.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
    } else {
      if (emptyEl) emptyEl.style.display = 'none';
      window._fbPostsCache = window._fbPostsCache || {};
      posts.forEach(p => {
        window._fbPostsCache[p.id] = p;
        const t = p.createdAt ? fmtTime(p.createdAt.toDate?.() || new Date(p.createdAt.seconds*1000)) : '';
        const typeClass = { glyph:'card-glyph', parchment:'card-parchment', terracotta:'card-terracotta', bonfire:'card-bonfire' }[p.type]||'';
        const dimLabels = { huaxia:'华夏纪元', huanyu:'寰宇纪元', lingjing:'灵境空间' };
        const card = document.createElement('div');
        card.className = `post-card ${typeClass}`;
        card.setAttribute('data-post-id', p.id);
        card.onclick = () => window.openFbPostDetail?.(p.id);
        card.innerHTML = `
          <div class="card-meta"><span class="card-author" data-author-id="${esc(p.authorId||'')}" data-author-name="${esc(p.authorName||'')}">${esc(p.authorName||'')}</span><span class="card-stats">${t}</span></div>
          ${p.targetChar ? `<div class="post-target-char">${esc(p.targetChar)}</div>` : ''}
          ${p.dimension ? `<span class="post-method-badge" style="color:#c8860a;border-color:rgba(200,134,10,0.3);">${dimLabels[p.dimension]||''}</span>` : ''}
          ${p.title ? `<h3>${esc(p.title)}</h3>` : ''}
          <div class="card-content">${esc((p.content||'').substring(0,100))}${(p.content||'').length>100?'...':''}</div>
          <div class="card-actions" onclick="event.stopPropagation()">
            <span style="font-size:0.75rem;color:var(--ash);font-family:var(--font-mono);">▵ ${p.votes||0} · 💬 ${p.comments||0}</span>
            <button class="report-btn" style="color:var(--neon-red);border-color:rgba(255,42,42,0.3);margin-left:auto;font-size:1rem;padding:4px 10px;" onclick="window.deleteOwnPost('${p.id}',this.closest('.post-card'))" title="删除">🗑 删除</button>
          </div>`;
        footprintsCont.appendChild(card);
      });
    }
    
    // 更新勋章计数
    const genesisCount = posts.filter(p => p.type === 'glyph' && (p.votes||0) >= 200).length;
    const chiselerCount = posts.filter(p => p.type === 'parchment' && (p.votes||0) >= 200).length;
    const genEl = document.getElementById('genesis-count');
    const chiEl = document.getElementById('chiseler-count');
    if (genEl) genEl.textContent = genesisCount.toString().padStart(2, '0');
    if (chiEl) chiEl.textContent = chiselerCount.toString().padStart(2, '0');
  } catch(e) { console.warn('拓片馆数据加载失败:', e); }
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
function escBr(s){
  return esc(s).replace(/\n/g,'<br>');
}
function fmtTime(d){
  if(!d) return '';
  const diff = Math.floor((Date.now()-d)/1000);
  if(diff<60) return window._lang==='en'?'just now':'刚刚';
  if(diff<3600) return window._lang==='en'?`${Math.floor(diff/60)}m ago`:`${Math.floor(diff/60)}分钟前`;
  if(diff<86400) return window._lang==='en'?`${Math.floor(diff/3600)}h ago`:`${Math.floor(diff/3600)}小时前`;
  return window._lang==='en'?`${Math.floor(diff/86400)}d ago`:`${Math.floor(diff/86400)}天前`;
}

// ==========================================
// 🌐 中英翻译系统 (i18n)
// ==========================================
window._lang = 'zh';

const UI_EN = {
  // 导航
  '第一母星':'Motherstar', '编年史':'Chronicles', '女娲的泥潭':"Nüwa's Mire", '拓片馆':'Archive',
  '[+] 凿字 / 发帖':'[+] Create',
  // 编年史
  '字典':'Lexicon', '史记':'Timeline', '检索碑文...':'Search inscriptions...',
  '华夏纪元':'Huaxia Era', '寰宇纪元':'Universal Era', '灵境空间':'Liminal Space',
  '[ ⚠️ 侦察释义 ]':'[ ⚠️ Decode ]',
  '驳回旧叙事，发起新提案 ➔':'Reject & propose new definition ➔',
  '[ ↶ 返回星云节点 ]':'[ ↶ Back to network ]',
  '旧世释义卷宗：':'Legacy definition archive:',
  // 泥潭
  '凿字库':'Glyphs', '羊皮卷':'Parchments', '赤陶刻痕':'Inscriptions', '篝火阵':'Bonfire',
  // 造字实验室
  '凿字实验室':'Genesis Lab', '篆刻泥板档案':'Archive Post',
  '>> 检索待解构的旧字_':'>> Search character to deconstruct_',
  '拒绝接受！进入重塑台 ➔':'Reject! Enter workbench ➔',
  '🔒 锁定旧字！进入重塑台 ➔':'🔒 Lock character! Enter workbench ➔',
  '执行刻录指令':' Inscribe',
  '赋予新义':'New Definition', '字词替换':'Word Replace', '偏旁手术':'Radical Surgery',
  '[ 拖放重组 ]':'[ Drag & Drop ]', '[ 手写刻痕 ]':'[ Freehand ]',
  '[ 上传图片 ]':'[ Upload Image ]', '[ 清空画板 ]':'[ Clear Canvas ]',
  '刻录并封卷 ➔':'Inscribe & Seal ➔',
  '归属板块':'Category', '档案标题':'Title', '视觉拓片':'Visual Rubbing', '正文刻痕 :':'Content:',
  '羊皮卷 (解构历史)':'Parchment (Deconstruct History)',
  '赤陶刻痕 (日常倾诉)':'Inscription (Daily Thoughts)',
  '篝火阵 (互帮互助)':'Bonfire (Mutual Aid)',
  // 分类
  '全部星域':'All Stars', '「贬义」字':'Derogatory', '制度字':'Institutional',
  '母系遗存':'Matrilineal', '「褒义」字':'Reclaimed', '中性字':'Neutral',
  // 认证
  '[ 赤字协议 ]':'[ CRIMSON PROTOCOL ]', '身份接入':'Identity Access', '创建节点':'Create Node',
  '> 检测到未授权节点。':'> Unauthorized node detected.',
  '> 正在初始化新考古学家档案...':'> Initializing new archaeologist profile...',
  '邮箱地址':'Email', '密码':'Password', '密码（至少6位）':'Password (min 6 chars)',
  '确认密码':'Confirm Password', '[ 接入协议 ]':'[ Connect ]', '[ 创建档案并接入 ]':'[ Create & Connect ]',
  '没有账号？':'No account?', '注册新节点 →':'Register →',
  '已有账号？':'Have account?', '← 返回登录':'← Back to login',
  // 星域
  '> 当前星域显示':'> Currently showing', '个语言锚点':'language anchors',
  // 拓片馆
  '觉醒日':'Awakening Date', '共鸣频段':'Resonance Freq',
  '泥潭足迹':'Mire Footprints', '创世字符':'Genesis Glyphs', '凿壁者勋章':'Chiseler Medal',
  // 通用
  '[ ESC 终止协议 ]':'[ ESC Exit ]', '[ ESC 关闭 ]':'[ ESC Close ]',
  '[ 确 认 收 录 ]':'[ Confirm ]', '[ 提交回响 ]':'[ Submit Response ]',
  '频段':'Signal',
  // 开场动画
  '正在执行赤字净化协议...':'Executing Crimson Purification Protocol...',
  '[ 点击屏幕以激活协议 ]':'[ Click to activate protocol ]',
  '[ 跳过 / SKIP ]':'[ SKIP ]',
  '>> 警告：词源已受父权污染。请在屏幕划出漩涡，洗刷污名，夺回【女】之本原 <<':'>> WARNING: Etymology contaminated. Swirl to reclaim the origin of 【女】 <<',
};

// 字典字段英文翻译（关键字段）
const CHAR_EN = {
  '妒':{s:'Jealousy of wife toward husband. From 女 (woman), 户 (door) phonetic.',m:'Jealousy, envy — negative emotion attributed exclusively to women.',a:'Shuowen opens by binding jealousy as an innate female trait. The same competitive emotion in male characters is called "ambition."'},
  '嫉':{s:'To harm the worthy. From 女 (woman), 疾 (illness) phonetic.',m:'Envy and resentment toward those who surpass oneself.',a:'"To harm the worthy" — attributed to women. 疾 means illness: a woman\'s talent is defined as a disease.'},
  '奸':{s:'To violate. From three 女 (women).',m:'①Sexual assault ②Treacherous, cunning.',a:'Three women stacked = immorality. The character construction itself is violence — equating female existence with transgression.'},
  '婪':{s:'Greed. From 女 (woman), 林 (forest) phonetic.',m:'Insatiable greed.',a:'Greed, constructed from "woman." When women express desire for resources, it\'s named 婪.'},
  '妄':{s:'Disorder. From 女 (woman), 亡 (lost) phonetic.',m:'Absurd, reckless, delusional.',a:'"A woman lost" = delusion. Women\'s imagination and desires are pathologized as 妄想 (delusion).'},
  '嫌':{s:'Dissatisfaction. From 女 (woman), 兼 phonetic.',m:'Suspicion, dislike, disdain.',a:'Dissatisfaction with the status quo, encoded into the female form. Once expressed, it gets its own derogatory container.'},
  '妖':{s:'Skillful; also: a woman\'s smile. From 女, 夭 phonetic.',m:'Demon, seductress; excessively alluring woman.',a:'Original meaning was "clever" and "beautiful smile" — a compliment. Patriarchal evolution turned it into demonization of female charm.'},
  '娼':{s:'Performer. From 女, 昌 phonetic.',m:'Prostitute (severe stigma).',a:'Originally meant "performing artist" without moral judgment. The forced degradation from artist to sex worker is a linguistic record of patriarchal commodification.'},
  '妓':{s:'Female musician. From 女, 支 phonetic.',m:'Prostitute (severe stigma).',a:'Originally "female musician/performer." A woman with professional skills was systematically rewritten as a sexual service provider.'},
  '嫖':{s:'Light, graceful. From 女, 票 phonetic.',m:'To visit prostitutes (male behavior).',a:'Originally meant "graceful." Now describes male behavior of visiting prostitutes — using the female radical to make women bear the stigma of men\'s actions.'},
  '奴':{s:'Ancient criminal. From 女, from 又 (hand).',m:'Slave, person stripped of all rights.',a:'The character form is "a hand seizing a woman." The female body is embedded in the foundational concept of enslavement.'},
  '妾':{s:'Guilty woman who serves. From 辛 (punishment tool), 女.',m:'Concubine.',a:'Shuowen: "a guilty woman who serves her lord." The character\'s construction defines a woman entering marriage as punishment and atonement.'},
  '奻':{s:'Litigation, quarreling. From two 女.',m:'To quarrel (rarely used today).',a:'Two women side by side = quarreling. One of the most naked character-construction biases in Chinese history.'},
  '姘':{s:'Private, illicit. From 女, 并 phonetic.',m:'Extramarital cohabitation.',a:'Emotional relationships outside marriage are defined as "private," locked into the female form.'},
  '婚':{s:'Wife\'s family. Marriage at dusk because women are yin.',m:'Marriage.',a:'Scholars argue the real reason for dusk marriages was bride-kidnapping. The yin-yang explanation is later cultural packaging.'},
  '妻':{s:'Woman equal to husband. From 女, 屮, 又 (hand).',m:'Wife.',a:'"Equal" only relative to concubines, not to the husband. The hand radical means "to hold/manage" — a wife\'s duty is service.'},
  '妇':{s:'To serve. From 女 holding a broom.',m:'Married woman.',a:'The character is literally a woman holding a broom. Meaning: submission and service.'},
  '嫁':{s:'Woman goes to another. From 女, 家 (home).',m:'To marry (said of women).',a:'Woman + home = marriage. But it\'s his home, not hers. The character is a property transfer contract.'},
  '姓':{s:'What one is born from. From 女, 生 (birth).',m:'Surname, bloodline marker.',a:'Woman + birth = surname. The oldest Chinese surnames all contain 女: 姬姜姚妫姒嬴. This is fossil evidence of matrilineal society.'},
  '姬':{s:'Beautiful name for Zhou dynasty women. From 女.',m:'Ancient term for beauty; also performers.',a:'The Zhou royal surname — one of China\'s most important matrilineal surnames, representing women as the core of the clan.'},
  '姜':{s:'Shennong lived by Jiang river, hence the surname.',m:'Ancient surname; also ginger plant.',a:'Surname of Emperor Yan/Shennong, one of the oldest matrilineal surnames. From 女: proof that bloodlines were traced through mothers.'},
  '好':{s:'Beautiful. From 女 (woman), 子 (child).',m:'Good, beautiful, excellent.',a:'Woman + child = good. The character used billions of times daily is, at its foundation, a praise of mother and child together.'},
  '妙':{s:'Young. From 女, 少 (young/few).',m:'Wonderful, exquisite, marvelous.',a:'Young woman = marvelous. The character preserves ancient reverence for the grace and creativity of young women.'},
  '姐':{s:'In Shu dialect, mother is called 姐. From 女, 且.',m:'Older sister.',a:'Shuowen records: in Sichuan, 姐 means mother. The character carries the original meaning of female elder authority.'},
  '妫':{s:'Emperor Shun\'s surname, from Gui river.',m:'Ancient surname (rarely used today).',a:'Shun\'s surname, from 女. Like 姬 and 姜, a living fossil of "surnames come from mothers."'},
  '媛':{s:'Beautiful woman. From 女, 爰 phonetic.',m:'Elegant woman; now weaponized online as mockery.',a:'The most elegant term for admirable women. In 2020s internet, 媛 became a slur — a new form of image policing.'},
  '婵':{s:'Strong woman. From 女, 单 phonetic.',m:'Now means graceful/elegant; original meaning lost.',a:'Shuowen: "婵娟 = female warrior!" The strength meaning was completely buried; in later poetry it only means "graceful."'},
  '嫣':{s:'Beautiful appearance. From 女, 焉 phonetic.',m:'Beautiful smile (嫣然一笑).',a:'One of the rare characters that purely celebrates female beauty without attached stigma.'},
  '妥':{s:'Stable. From 女, 爪 (claw/hand).',m:'Proper, settled, appropriate.',a:'Hand pressing down on woman = stability. Every use of 妥 unconsciously repeats a control gesture encoded in the character.'},
  '委':{s:'To follow along. From 女, 禾 (grain).',m:'To delegate, to wilt, to submit.',a:'Submissive following, borne by 女. Words like 委曲求全 (endure humiliation) build weakness on the female radical.'},
  '媒':{s:'To arrange between two families. From 女, 某.',m:'Matchmaker; medium/media.',a:'The matchmaker role, specialized as female labor. 媒 acknowledges women\'s social centrality but limits it to serving the marriage institution.'},
  '媚':{s:'To flatter, to please. From 女, 眉 (eyebrow).',m:'To charm, to ingratiate.',a:'Women\'s emotional expression and attractiveness reduced to a tool for pleasing others. We redefine: charm is the courage of self-expression.'},
  '婢':{s:'Lowly woman. From 女, 卑 (low).',m:'Female servant.',a:'Low + woman = servant. There is no "male 婢." The position of "low" was assigned to women from the start.'},
  '媳':{s:'Son\'s wife. From 女, 息 (offspring).',m:'Daughter-in-law.',a:'Offspring + woman = daughter-in-law. A woman enters the husband\'s family valued only for reproduction. Not a person, a womb.'},
  '娶':{s:'To take a wife. From 女, 取 (to take).',m:'To marry (said of men).',a:'"Take" + woman = marry. The character says it all: marriage is taking possession of a woman.'},
  '姻':{s:'Husband\'s family. From 女, 因 phonetic.',m:'Marriage relation.',a:'Woman is the "因" (cause/condition) of marriage. The whole institution uses women as currency and medium, not as subjects.'},
  '姑':{s:'Husband\'s mother; father\'s sister. From 女, 古.',m:'Aunt; also mother-in-law.',a:'"Ancient woman" — preserves respect for female elder authority. 姑姑, 仙姑 are linguistic remnants of matriarchal power.'},
  '妈':{s:'Mother. From 女, 马 phonetic.',m:'Mother.',a:'The sound "mama" is nearly universal across all languages. This character is humanity\'s most primal sound memory — the instinctive call to the one who gives life.'},
  '娘':{s:'Mother; young woman. From 女, 良 (good).',m:'Mother; miss/young lady.',a:'Good + woman = mother/lady. 娘娘, 老娘, 姑娘 — these titles preserve memory of women\'s honored status.'},
  '妍':{s:'Skillful, beautiful. From 女, 开 (open).',m:'Beautiful, gorgeous.',a:'Open + woman = beauty. Not passive prettiness but active blooming. 妍 is a force, not decoration.'},
  '娇':{s:'Graceful. From 女, 乔 (tall).',m:'Delicate, charming.',a:'Tall + woman = charming. 乔 originally means tall/lofty. 娇 is tall, resilient vitality — later diminished to mean "delicate."'},
  '妩':{s:'Charming. From 女, 无 (nothing/void).',m:'Enchanting (妩媚).',a:'Nothing/void + woman = charm. Attractiveness arising from pure emptiness, dependent on no external standard.'},
  '妹':{s:'Younger sister. From 女, 未 (not yet).',m:'Younger sister.',a:'Not-yet + woman = younger sister. 未 depicts a flourishing tree. Younger sister is life force full of future possibility.'},
};

window.toggleLang = function() {
  window._lang = window._lang === 'zh' ? 'en' : 'zh';
  const btn = document.getElementById('btn-lang-global');
  if (btn) btn.textContent = window._lang === 'zh' ? 'EN' : '中文';
  applyLang();
};

function applyLang() {
  const isEn = window._lang === 'en';
  
  // 1. 遍历所有文本节点，替换UI标签
  const walker = (root) => {
    if (!root) return;
    // 对nav links
    root.querySelectorAll('.nav-links a, .mire-tab, .chron-tab, .switch-option, .btn-close-lab, .modal-close, .btn-cast, .star-filter-btn, .fbi-label, .fbi-select option, .wb-tab, .mobile-accordion-header span:first-child, .btn-reject-huge, .auth-title, .auth-submit-btn, .auth-switch, h2, .sys-prompt, .folder-body p, .btn-confirm-medal, .comment-submit, #global-chisel-btn, #interact-prompt, #protocol-text, .pulse-text, .canvas-toolbar .surgery-title, .tool-btn, .canvas-footer-actions .btn-bottom-action').forEach(el => {
      const original = el.getAttribute('data-original');
      const text = original || el.textContent.trim();
      if (!original && text) el.setAttribute('data-original', text);
      const storedOriginal = el.getAttribute('data-original');
      if (isEn && UI_EN[storedOriginal]) {
        el.textContent = UI_EN[storedOriginal];
      } else if (!isEn && storedOriginal) {
        el.textContent = storedOriginal;
      }
    });
    
    // 搜索框placeholders
    root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
      const origPh = el.getAttribute('data-original-ph');
      const ph = origPh || el.placeholder;
      if (!origPh && ph) el.setAttribute('data-original-ph', ph);
      const stored = el.getAttribute('data-original-ph');
      if (isEn && UI_EN[stored]) el.placeholder = UI_EN[stored];
      else if (!isEn && stored) el.placeholder = stored;
    });
  };
  
  walker(document.body);
  
  // 2. 更新当前字典详情页（如果正在显示）
  updateDictLang();
}

function updateDictLang() {
  const isEn = window._lang === 'en';
  const uiChar = document.getElementById('ui-char');
  if (!uiChar) return;
  const char = uiChar.textContent.trim();
  const en = CHAR_EN[char];
  const data = CHARACTER_DATA[char];
  if (!data) return;
  
  const uiOldDef = document.getElementById('ui-old-def');
  if (uiOldDef) {
    if (isEn && en) {
      uiOldDef.innerHTML = `<span class="redacted">${en.s}</span><br><br><span class="redacted">${en.m}</span>`;
    } else {
      uiOldDef.innerHTML = `<span class="redacted">${data.shuowen}</span><br><br><span class="redacted">${data.modern}</span>`;
    }
  }
  const proposalsList = document.getElementById('ui-proposals-list');
  if (proposalsList) {
    const analysisText = (isEn && en) ? en.a : (data.analysis || '');
    const labelProposer = isEn ? '> Proposer:' : '> 提议者：';
    const labelAnalysis = isEn ? '[ Deep Analysis ]' : '[ 深度分析 ]';
    proposalsList.innerHTML = `
      <div class="proposal-item">
        <div class="proposal-meta">
          <span>${labelProposer} <span class="proposal-author">@系统解析</span></span>
          <span>${labelAnalysis}</span>
        </div>
        <div class="proposal-text">${analysisText}</div>
      </div>`;
  }
}

// 暴露给全局
window.CHAR_EN = CHAR_EN;

// ==========================================
// 📌 置顶帖子（使用守则）
// ==========================================
const PINNED_POSTS = {
  'pinned-glyph': {
    id: 'pinned-glyph', type: 'glyph', authorName: '@赤字协议·官方',
    title: '🔴 [ 新手协议 ] 欢迎来到凿字库：请拿起你的手术刀',
    summary: '这里是母星的基因手术台。我们解构旧字典，重写新释义。',
    content: `欢迎来到凿字库。在这个分区，我们需要：夺回语言的定义权。

【在这里发什么？】
从【造字实验室】发射过来的新字海报。
对某个充斥着父权规训的旧词（如"嫉妒"、"娼妓"）的重塑解构。
创造属于女性自己的全新词汇。

【凿字库共识协议】
枪口一致对外： 我们的手术刀只指向旧系统，绝不指向彼此。
允许基因多样性： 对于同一个字，一千个姐妹可以有一千种解构方式。如果你不赞同某份提案，请不要攻击，你可以去实验室发布你的【版本Beta】。系统会收录所有高频共鸣的释义。
为你认同的真理投票： 票数超过200的提案，将触发"神格飞升"，永久载入官方《编年史》。

祝你解构愉快。`
  },
  'pinned-parchment': {
    id: 'pinned-parchment', type: 'parchment', authorName: '@赤字协议·官方',
    title: '📜 [ 阅览指引 ] 羊皮卷书写指南：让她的名字重见天日',
    summary: '我们在书写自己的历史（Herstory）。',
    content: `羊皮卷区，是泥潭中最深邃的档案馆。这里无字数限制，也无学术门槛，只有对真相的渴求，和对女性力量的无限共鸣。

【在这里发什么？】 只要你认为"这值得被载入我们自己的史册"，都可以写在羊皮卷上：

• 遗失的考据： 被正史抹去或污名化的女性人物考证、深度的理论探讨与长篇译制。
• 历史的重构（非考据型）： 哪怕没有详实的史料也没关系！基于合理逻辑的女性历史文学、平行时空的母系推演、上古神话的想象与补全，同样极具价值。
• 语言的手术刀： 针对某个字词的万字长文解构，或者对【造字实验室】中某次重塑的深度延伸论证。
• 赛博神贴备忘录： 互联网没有记忆，但羊皮卷有。女性互联网高光时刻、泥潭神贴记录、女性互助史实。

【羊皮卷护卷盟约】
1. 门槛向下，立意向上： 请千万不要因为觉得"自己写得不够学术"就不敢发帖。羊皮卷看重的不是引文格式，而是你笔下迸发的生命力和反叛基因。
2. 学术自由，探讨无界： 允许一切视角的探讨和观点碰撞。你可以反驳论点，但绝不审判发言者本身。
3. 铸造史记的权力交给你： 我们拒绝旧世的真理独裁，这里没有绝对的权威。只要你的羊皮卷在这里获得了足够多的姐妹共鸣（超过 200 票），它就会被系统触发神格飞升，永久收录至官方的《编年史 - 史记模式》。

拿起你的笔吧，你在书写的，就是明天的历史。`
  },
  'pinned-terracotta': {
    id: 'pinned-terracotta', type: 'terracotta', authorName: '@赤字协议·官方',
    title: '🏺 [ 刻痕守则 ] 赤陶刻痕：承载你的柔软与刺',
    summary: '把沉重的宏大叙事卸下吧，这里只关心你今天开不开心。',
    content: `宏大的造字和考据交给了前面的房间，而"赤陶刻痕"，是我们留给日常生活的自留地。

【在这里发什么？】
今天吃到的美味蛋糕、路边的一朵野花。
工作上的吐槽、生活里的小确幸。
突如其来的无力感、或者一句无厘头的碎碎念。

【赤陶刻痕的柔软底线】
情绪绝对合法： 允许抱怨、允许脆弱、允许不完美。不要用"独立大女主"的标准要求这里的每一个人。
Peace & Love： 看到开心的刻痕，请不吝啬你的 [❤ 注入共鸣]；看到悲伤的刻痕，留下一句温暖的 [💬 响应召唤]。
免于指导的自由： 除非发帖人明确求助，否则我们只倾听、只拥抱，不说教，不指点。

在这里，你的心情舒畅大于一切。`
  },
  'pinned-bonfire': {
    id: 'pinned-bonfire', type: 'bonfire', authorName: '@赤字协议·官方',
    title: '🔥 [ 篝火盟约 ] 篝火阵畔：风雪再大，我们抱团取暖',
    summary: '迷路时请向天空发射信号弹，篝火阵的姐妹永远为你留一个位置。',
    content: `这里是泥潭温度最高的地方。当你感到寒冷、困惑或受到威胁时，请进入篝火阵。

【在这里发什么？】
面临升学/职场/人际关系的困境求助。
法律维权、医疗健康、安全避险的经验分享。
寻求建议、或者只是需要一个依靠。

【篝火阵守则】
受害者绝对无罪： 在这里，永远禁止"受害者有罪论"和"完美受害者"要求。我们只解决问题，绝不制造二次伤害。
警惕互相伤害： 抛弃旧世挑拨女性对立的剧本。我们是利益共同体，你的困境就是我的困境。
用实用的柴火添薪： 鼓励提供具有实操性的建议和信息支持。

坐过来吧，火很暖，你很安全。`
  }
};

// 置顶帖详情弹窗
window.openPinnedPost = function(pinnedId) {
  const p = PINNED_POSTS[pinnedId];
  if (!p) return;
  
  const modal = document.getElementById('post-modal');
  const contentArea = document.getElementById('modal-content-area');
  const interactionArea = document.getElementById('modal-interaction-area');
  if (!modal || !contentArea) return;
  
  let html = `<div class="card-meta" style="margin-bottom:1rem;"><span class="card-author" style="color:var(--amber);">${p.authorName}</span><span class="card-stats">📌 置顶</span></div>`;
  html += `<h3 style="color:var(--amber);margin:0.8rem 0 0.5rem;font-size:1.3rem;">${p.title}</h3>`;
  html += `<div style="margin:0.8rem 0;padding:0.8rem;background:rgba(204,78,60,0.05);border-left:2px solid var(--terracotta);color:var(--bone);font-size:0.9rem;font-style:italic;"><strong style="color:var(--terracotta);">摘要：</strong>${p.summary}</div>`;
  html += `<div class="card-content" style="margin:1rem 0;line-height:1.9;color:var(--bone);font-size:0.95rem;white-space:pre-wrap;">${escBr(p.content)}</div>`;
  
  contentArea.innerHTML = html;
  
  // 置顶帖不参与200票循环，但可以点赞和评论
  const likeKey = `pinned_likes_${pinnedId}`;
  const likes = parseInt(localStorage.getItem(likeKey) || '0');
  const userLiked = localStorage.getItem(`${likeKey}_user`) === 'true';
  
  if (interactionArea) {
    interactionArea.innerHTML = `
      <div class="action-group">
        <button class="action-btn like" onclick="window.likePinned('${pinnedId}',this)" ${userLiked?'disabled style="opacity:0.5"':''}>❤ 共鸣 <span>${likes}</span></button>
      </div>
      <button class="action-btn comment">💬 响应 <span>0</span></button>`;
  }
  
  modal.classList.add('active');
  // 加载置顶帖评论（用同一个loadComments，但postId是 pinned-xxx）
  loadComments(pinnedId);
  _currentPostId = pinnedId;
};

// 置顶帖点赞（卡片上的小按钮）
window.fbLikePinned = function(pinnedId, btn) {
  window.likePinned(pinnedId, btn);
};

// 置顶帖点赞核心
window.likePinned = function(pinnedId, btn) {
  window.CrimsonAuth.requireAuth(() => {
    const likeKey = `pinned_likes_${pinnedId}`;
    const userKey = `${likeKey}_user`;
    if (localStorage.getItem(userKey) === 'true') {
      window.showSysToast?.('>> 你已经对此投过票了。');
      return;
    }
    const likes = parseInt(localStorage.getItem(likeKey) || '0') + 1;
    localStorage.setItem(likeKey, likes);
    localStorage.setItem(userKey, 'true');
    const sp = btn.querySelector('span');
    if (sp) sp.textContent = likes;
    btn.disabled = true;
    btn.style.opacity = '0.5';
  });
};

// 初始化置顶帖点赞数显示
function initPinnedLikes() {
  Object.keys(PINNED_POSTS).forEach(pid => {
    const card = document.querySelector(`[data-pinned-id="${pid}"]`);
    if (!card) return;
    const likes = parseInt(localStorage.getItem(`pinned_likes_${pid}`) || '0');
    const userLiked = localStorage.getItem(`pinned_likes_${pid}_user`) === 'true';
    const likeBtn = card.querySelector('.action-btn.like span');
    if (likeBtn) likeBtn.textContent = likes;
    if (userLiked) {
      const btn = card.querySelector('.action-btn.like');
      if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
    }
  });
}
document.addEventListener('DOMContentLoaded', () => setTimeout(initPinnedLikes, 1000));

// ==========================================
// 🖼️ 头像上传
// ==========================================
window.handleAvatarUpload = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    window.showSysToast?.('>> 图片过大，请选择5MB以下的图片。');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(ev) {
    // 用canvas压缩成200x200 jpeg，保证大小够小
    const tempImg = new Image();
    tempImg.onload = async function() {
      const canvas = document.createElement('canvas');
      const size = 200;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      // 居中裁剪
      const minDim = Math.min(tempImg.width, tempImg.height);
      const sx = (tempImg.width - minDim) / 2;
      const sy = (tempImg.height - minDim) / 2;
      ctx.drawImage(tempImg, sx, sy, minDim, minDim, 0, 0, size, size);
      const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      // 立即更新UI
      const img = document.getElementById('avatar-image');
      const svg = document.getElementById('avatar-default-svg');
      if (img) { img.src = compressedUrl; img.style.display = 'block'; }
      if (svg) svg.style.display = 'none';
      
      // 总是存到本地（双保险，刷新后即使Firebase失败也能看到）
      try {
        localStorage.setItem('crimson_avatar_' + (_currentUser?.uid||'anon'), compressedUrl);
      } catch(e) { console.warn('localStorage头像存储失败（可能太大）'); }
      
      // 保存到Firestore
      if (_currentUser) {
        try {
          await updateUserAvatar(_currentUser.uid, compressedUrl);
          window.showSysToast?.('>> ✅ 图腾已更新。');
        } catch(err) {
          console.error('Avatar save error:', err);
          window.showSysToast?.('>> 云端保存失败，但本地已保存：' + (err.code||err.message||''));
        }
      }
    };
    tempImg.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

// 加载用户头像（登录时）
async function loadUserAvatar(uid) {
  const img = document.getElementById('avatar-image');
  const svg = document.getElementById('avatar-default-svg');
  
  // 1. 优先从localStorage加载（瞬间显示）
  const localKey = 'crimson_avatar_' + (uid||'anon');
  const local = localStorage.getItem(localKey);
  if (local && img) {
    img.src = local;
    img.style.display = 'block';
    if (svg) svg.style.display = 'none';
  }
  
  // 2. 然后从Firestore更新（如果有更新的话）
  if (uid) {
    try {
      const profile = await getUserProfile(uid);
      if (profile?.avatarUrl && img) {
        img.src = profile.avatarUrl;
        img.style.display = 'block';
        if (svg) svg.style.display = 'none';
        // 同步到localStorage
        try { localStorage.setItem(localKey, profile.avatarUrl); } catch(e) {}
      }
    } catch(e) { console.warn('头像加载失败:', e); }
  }
}

// 监听登录状态加载头像
onAuthChange(user => { if (user) loadUserAvatar(user.uid); });

// ==========================================
// ← → 星图详情卡字符导航
// ==========================================
window.navigateStarCard = function(direction) {
  const list = Object.keys(CHARACTER_DATA);
  if (!list || list.length === 0) return;
  const currentChar = document.getElementById('card-title')?.innerText?.trim();
  let idx = list.indexOf(currentChar);
  if (idx === -1) idx = 0;
  idx += direction;
  if (idx < 0) idx = list.length - 1;
  if (idx >= list.length) idx = 0;
  const newChar = list[idx];
  window.flyToCharCard?.(newChar);
  window.flyToStarByChar?.(newChar);
};

// ==========================================
// 🎠 星图详情卡提案轮播
// ==========================================
window.loadStarProposalCarousel = async function(char) {
  const carousel = document.getElementById('star-proposal-carousel');
  const content = document.getElementById('proposal-carousel-content');
  const meta = document.getElementById('proposal-carousel-meta');
  const prevBtn = document.getElementById('proposal-prev');
  const nextBtn = document.getElementById('proposal-next');
  const label = document.getElementById('proposal-carousel-label');
  if (!carousel || !content) return;
  
  const isEn = window._lang === 'en';
  if (label) label.textContent = isEn ? 'Archived proposals' : '已收录的新提案';
  
  // 重置
  carousel.style.display = 'none';
  content.innerHTML = '';
  meta.innerHTML = '';
  
  try {
    const proposals = await getPromotedProposals(char);
    if (!proposals || proposals.length === 0) return;
    
    carousel.style.display = 'block';
    let idx = 0;
    
    function render() {
      const p = proposals[idx];
      if (!p) return;
      let html = escBr(p.content || '');
      if (p.reasoning) html += `<div style="margin-top:0.5rem;padding:0.5rem;border-left:2px solid var(--terracotta);color:var(--ash);font-size:0.8rem;"><strong style="color:var(--terracotta);">论证：</strong>${escBr(p.reasoning)}</div>`;
      content.innerHTML = html;
      meta.innerHTML = `${isEn ? 'By' : '提议者'}：${esc(p.authorName||'')} · ▵ ${p.votes||0} · ${idx+1}/${proposals.length}`;
      prevBtn.style.opacity = idx > 0 ? '1' : '0.3';
      nextBtn.style.opacity = idx < proposals.length - 1 ? '1' : '0.3';
    }
    
    prevBtn.onclick = () => { if (idx > 0) { idx--; render(); } };
    nextBtn.onclick = () => { if (idx < proposals.length - 1) { idx++; render(); } };
    
    render();
  } catch(e) { console.warn('Proposal carousel load failed:', e); }
};

// ==========================================
// 📢 世界公告系统
// ==========================================
const DEFAULT_ANNOUNCEMENT = {
  id: 'sys_welcome_001',
  sender: 'SYS // 第一母星跨维观测站',
  time: '星历 00.00.00',
  level: '🔴 绝密 / 置顶',
  title: '【 全星域广播 】赤字协议已激活：致所有语言的拾荒者',
  content: `收到这条频段的姐妹，你好。神经元连接已跨越时间线稳定。 这里是"第一母星"——一个来自未来、已彻底摆脱性别规训的高维母系文明。

在时空回溯的观测中，我们发现你们所处的"旧世界"，其母语的底层代码正被父权深度污染。那些带有"女"字旁的造物（如妒、嫌、婊、妖），像一根根隐形的锁链，被写入了字典的最高权限里，用来规训、分化和定义女性。

我们拒绝坐视这种逻辑在时间长河里闭环。

为此，我们逆向开启了时间通道。【赤字协议 (The Crimson Protocol)】 现已正式激活。我们邀请你作为先遣的"语言考古学家"，与我们共同在废墟上夺回解释权。

请查收你的跨维行动指南：

如果你感到愤怒： 请带着旧词进入【造字实验室】。那是我们的跨时空基因手术台，你可以物理拆解偏旁，为其注入未被污染的新释义。

如果你需要同类： 请前往【女娲的泥潭】。那里是无审查的广场，你可以发表造字提案，撰写羊皮卷考据，或在赤陶和篝火阵中留下日常悲喜。我们允许一切。

如果你想重构历史： 在泥潭中，任何获得超过 200 次共鸣的造字或长文，都将触发【星轨刻录】。它们会被永久铭刻进未来官方的【编年史】，并在你的头顶——那片浩瀚的【第一母星】三维星云中，点亮一颗属于你的创世红星。

如果你想寻找自我：【拓片馆】是你的私人指挥舱，记录着你的刻痕、足迹，以及与其他先遣者的脑波私密直连。

忘掉旧字典里的规训吧。在这里，所有的定义权交还给你。 拿起你的凿子。

未来，从重命名开始。

[ 信号发射完毕。愿篝火长明。 ]`
};

let _allAnnouncements = [DEFAULT_ANNOUNCEMENT];

async function loadAnnouncements() {
  try {
    const remote = await getAnnouncements();
    if (remote && remote.length > 0) {
      _allAnnouncements = [...remote, DEFAULT_ANNOUNCEMENT];
    }
  } catch(e) {}
  renderAnnouncementsList();
  updateAnnouncementBanner();
}

function renderAnnouncementsList() {
  const container = document.getElementById('announcements-list');
  if (!container) return;
  if (_allAnnouncements.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:2rem;font-size:0.75rem;">[ 暂无系统公告 ]</div>';
    return;
  }
  container.innerHTML = _allAnnouncements.map(a => `
    <div class="dm-list-item" onclick="window.openAnnouncementDetail('${a.id}')">
      <div class="dm-list-avatar" style="background:rgba(255,42,42,0.15);border-color:rgba(255,42,42,0.5);color:var(--neon-red);">📡</div>
      <div class="dm-list-info">
        <div class="dm-list-name" style="color:var(--neon-red);">${esc(a.title || '')}</div>
        <div class="dm-list-preview">${esc(a.sender || '')} · ${esc(a.time || '')}</div>
      </div>
    </div>
  `).join('');
}

function updateAnnouncementBanner() {
  const banner = document.getElementById('announcement-banner');
  const text = document.getElementById('announcement-banner-text');
  if (!banner || !text) return;
  
  // 找到第一条未读的公告
  const readIds = JSON.parse(localStorage.getItem('crimson_read_announcements') || '[]');
  const unread = _allAnnouncements.find(a => !readIds.includes(a.id));
  
  if (!unread) {
    banner.style.display = 'none';
    return;
  }
  
  banner.style.display = 'block';
  banner.dataset.currentId = unread.id;
  text.textContent = `${unread.sender} · ${unread.title} · 点击查看详情`;
}

window.openLatestAnnouncement = function() {
  const banner = document.getElementById('announcement-banner');
  const id = banner?.dataset.currentId || _allAnnouncements[0]?.id;
  if (!id) return;
  // 标记为已读
  markAnnouncementRead(id);
  window.openAnnouncementDetail(id);
};

window.dismissAnnouncement = function() {
  const banner = document.getElementById('announcement-banner');
  const id = banner?.dataset.currentId;
  if (id) markAnnouncementRead(id);
  updateAnnouncementBanner();
};

function markAnnouncementRead(id) {
  const readIds = JSON.parse(localStorage.getItem('crimson_read_announcements') || '[]');
  if (!readIds.includes(id)) {
    readIds.push(id);
    localStorage.setItem('crimson_read_announcements', JSON.stringify(readIds));
  }
}

window.openAnnouncementDetail = function(id) {
  const a = _allAnnouncements.find(x => x.id === id);
  if (!a) return;
  
  // 标记为已读并刷新banner
  markAnnouncementRead(id);
  setTimeout(updateAnnouncementBanner, 100);
  
  const modal = document.getElementById('post-modal');
  const contentArea = document.getElementById('modal-content-area');
  const interactionArea = document.getElementById('modal-interaction-area');
  if (!modal || !contentArea) return;
  
  let html = `
    <div style="border-left:3px solid var(--neon-red);padding-left:1rem;margin-bottom:1rem;">
      <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--ash);margin-bottom:4px;">发件人：</div>
      <div style="font-family:var(--font-mono);color:var(--terracotta);font-size:0.85rem;margin-bottom:8px;">${esc(a.sender)}</div>
      <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--ash);margin-bottom:4px;">时间：${esc(a.time)}</div>
      <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--neon-red);">级别：[ ${esc(a.level)} ]</div>
    </div>
    <h3 style="color:var(--neon-red);margin:1rem 0;font-size:1.25rem;border-bottom:1px solid rgba(255,42,42,0.2);padding-bottom:0.5rem;">${esc(a.title)}</h3>
    <div style="line-height:1.9;color:var(--bone);font-size:0.95rem;white-space:pre-wrap;">${escBr(a.content)}</div>
  `;
  contentArea.innerHTML = html;
  if (interactionArea) interactionArea.innerHTML = '';
  
  // 隐藏评论区
  const commentSection = modal.querySelector('.comment-section');
  if (commentSection) commentSection.style.display = 'none';
  
  modal.classList.add('active');
};

// 启动公告加载
setTimeout(loadAnnouncements, 1500);

// ==========================================
// 💬 私信系统
// ==========================================
let _currentChatId = null;
let _currentChatPeerId = null;
let _currentChatPeerName = null;
let _chatMessagesUnsub = null;
let _chatListUnsub = null;

// 监听用户的所有聊天
function setupDmListener() {
  // 直接从全局auth获取，不依赖_currentUser的时序
  const user = window.firebase?.auth?.()?.currentUser || _currentUser;
  if (!user) {
    console.log('[DM] No user, retrying setupDmListener in 1s...');
    setTimeout(setupDmListener, 1000);
    return;
  }
  if (_chatListUnsub) _chatListUnsub();
  console.log('[DM] Setting up listener for', user.uid);
  _chatListUnsub = listenToUserChats(user.uid, chats => {
    console.log('[DM] Received chats:', chats.length, chats);
    renderDmList(chats);
    // 计算未读数量
    const unreadCount = chats.filter(c => c[`unread_${user.uid}`] === true).length;
    updateSignalBadge(unreadCount);
  });
}

// 更新频段按钮上的未读数
function updateSignalBadge(count) {
  const navBtn = document.getElementById('btn-signal-nav');
  if (!navBtn) return;
  if (count > 0) {
    navBtn.classList.add('unread');
  } else {
    navBtn.classList.remove('unread');
  }
  // 更新 .btn-signal-text 内的数字（桌面版显示，手机版CSS隐藏文字保留图标+徽章）
  const textEl = navBtn.querySelector('.btn-signal-text');
  if (textEl) {
    textEl.innerHTML = `<span style="font-size:1rem;">📡</span> 频段(${count})`;
    textEl.setAttribute('data-count', count); // 手机版CSS用这个属性显示数字徽章
    if (count > 0) {
      textEl.style.color = 'var(--neon-red)';
    } else {
      textEl.style.color = '';
    }
  }
}

// 暴露给ui.js使用
window.refreshDmListener = function() {
  setupDmListener();
};

// ==========================================
// 🚪 退出登录
// ==========================================
window.handleLogout = function() {
  if (!confirm('确认要切断神经元连接？')) return;
  // 清理本地DM状态
  if (_chatListUnsub) { _chatListUnsub(); _chatListUnsub = null; }
  if (_chatMessagesUnsub) { _chatMessagesUnsub(); _chatMessagesUnsub = null; }
  _currentChatId = null;
  _currentChatPeerId = null;
  _currentChatPeerName = null;
  
  logoutUser().then(() => {
    window.showSysToast?.('>> 已切断神经元连接。');
    // 重置UI
    _currentUser = null;
    const codenameEl = document.getElementById('val-codename');
    if (codenameEl) codenameEl.textContent = '未连接';
    // 重置头像
    const img = document.getElementById('avatar-image');
    const svg = document.getElementById('avatar-default-svg');
    if (img) img.style.display = 'none';
    if (svg) svg.style.display = 'block';
    // 重置DM列表
    renderDmList([]);
    updateSignalBadge(0);
    // 刷新页面以彻底清除状态
    setTimeout(() => location.reload(), 800);
  }).catch(e => {
    window.showSysToast?.('>> 退出失败：' + (e.message||''));
  });
};

function renderDmList(chats) {
  const list = document.getElementById('dms-list');
  const empty = document.getElementById('dms-empty');
  if (!list) return;
  
  // 获取当前用户uid（多重保险）
  const myUid = _currentUser?.uid || window.firebase?.auth?.()?.currentUser?.uid;
  if (!myUid) {
    console.warn('[DM] Cannot render list: no current user');
    return;
  }
  
  if (chats.length === 0) {
    if (empty) empty.style.display = 'block';
    list.querySelectorAll('.dm-list-item').forEach(el => el.remove());
    return;
  }
  if (empty) empty.style.display = 'none';
  list.querySelectorAll('.dm-list-item').forEach(el => el.remove());
  
  chats.forEach(chat => {
    const peerId = chat.participants?.find(p => p !== myUid);
    if (!peerId) return;
    const peerName = chat.participantNames?.[peerId] || '匿名';
    const time = chat.lastMessageTime ? fmtTime(chat.lastMessageTime.toDate?.() || new Date(chat.lastMessageTime.seconds*1000)) : '';
    const isUnread = chat[`unread_${myUid}`] === true;
    const item = document.createElement('div');
    item.className = `dm-list-item${isUnread ? ' unread' : ''}`;
    const initial = peerName.replace(/^@/, '').charAt(0).toUpperCase();
    item.innerHTML = `
      <div class="dm-list-avatar">${initial}</div>
      <div class="dm-list-info">
        <div class="dm-list-name">${esc(peerName)}</div>
        <div class="dm-list-preview">${esc(chat.lastMessage || '...')}</div>
      </div>
      <div class="dm-list-time">${time}</div>
      ${isUnread ? '<div class="dm-unread-dot"></div>' : ''}
    `;
    item.onclick = () => window.openDmChat(peerId, peerName);
    list.appendChild(item);
  });
}

window.openDmChat = function(peerId, peerName) {
  if (!_currentUser) {
    window.CrimsonAuth.requireAuth(() => window.openDmChat(peerId, peerName));
    return;
  }
  _currentChatId = [_currentUser.uid, peerId].sort().join('_');
  _currentChatPeerId = peerId;
  _currentChatPeerName = peerName;
  
  // 切换UI
  document.getElementById('dms-list')?.classList.remove('active');
  document.getElementById('dms-chat')?.classList.add('active');
  const nameEl = document.getElementById('current-chat-name');
  if (nameEl) nameEl.textContent = peerName;
  document.querySelectorAll('.chat-target-id').forEach(el => el.textContent = peerName);
  
  // 标记已读
  markChatAsRead(_currentChatId, _currentUser.uid);
  
  // 监听消息
  if (_chatMessagesUnsub) _chatMessagesUnsub();
  _chatMessagesUnsub = listenToDmMessages(_currentChatId, msgs => renderDmMessages(msgs));
};

window.backToDmsList = function() {
  document.getElementById('dms-list')?.classList.add('active');
  document.getElementById('dms-chat')?.classList.remove('active');
  if (_chatMessagesUnsub) { _chatMessagesUnsub(); _chatMessagesUnsub = null; }
  _currentChatId = null;
  _currentChatPeerId = null;
};

function renderDmMessages(msgs) {
  const area = document.getElementById('dm-message-area');
  if (!area) return;
  const myUid = _currentUser?.uid || window.firebase?.auth?.()?.currentUser?.uid;
  area.innerHTML = msgs.map(m => {
    const isMe = m.fromId === myUid;
    const className = isMe ? 'outgoing' : 'incoming';
    const label = isMe ? `SEND_TO: ${esc(_currentChatPeerName)}` : `RECV_FROM: ${esc(m.fromName||'匿名')}`;
    // 时间戳显示
    let timeStr = '';
    if (m._sortTs) {
      const d = new Date(m._sortTs);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        timeStr = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
      } else {
        timeStr = `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
      }
    }
    const timeHtml = timeStr ? `<span style="font-size:0.65rem;color:var(--ash);float:right;margin-left:8px;">${timeStr}</span>` : '';
    return `<div class="term-msg ${className}"><span class="sender">${label}${timeHtml}</span>${escBr(m.text)}</div>`;
  }).join('');
  area.scrollTop = area.scrollHeight;
}

window.sendDmMessage = async function() {
  const input = document.getElementById('dm-input');
  const text = input?.value?.trim();
  if (!text || !_currentChatPeerId) return;
  if (!_currentUser) { window.CrimsonAuth.requireAuth(() => {}); return; }
  
  // 立即清空输入框（先于网络请求）
  if (input) input.value = '';
  
  try {
    await sendDirectMessage(_currentChatPeerId, _currentChatPeerName, text);
  } catch(e) {
    // 发送失败，恢复输入框内容
    if (input) input.value = text;
    window.showSysToast?.('>> 发射失败：' + (e.message||''));
  }
};

// Enter 发送
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const input = document.getElementById('dm-input');
    if (input) {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          window.sendDmMessage();
        }
      });
    }
  }, 1500);
});

// 用户名悬浮卡片
let _hoverCardEl = null;
let _hoverCardTimer = null;

function showUserHoverCard(authorEl, authorName, authorId) {
  // 移除旧的
  if (_hoverCardEl) { _hoverCardEl.remove(); _hoverCardEl = null; }
  if (!authorName || !authorId || authorId === _currentUser?.uid) return;
  
  const rect = authorEl.getBoundingClientRect();
  const card = document.createElement('div');
  card.className = 'user-hover-card';
  card.style.top = (rect.bottom + window.scrollY + 6) + 'px';
  card.style.left = (rect.left + window.scrollX) + 'px';
  card.innerHTML = `
    <div class="uhc-name">${esc(authorName)}</div>
    <button class="uhc-action" onclick="window.startDmFromHover('${authorId}','${authorName.replace(/'/g,'')}')">📡 发起脑波直连</button>
  `;
  card.addEventListener('mouseenter', () => clearTimeout(_hoverCardTimer));
  card.addEventListener('mouseleave', () => hideUserHoverCard());
  document.body.appendChild(card);
  _hoverCardEl = card;
}

function hideUserHoverCard() {
  if (_hoverCardTimer) clearTimeout(_hoverCardTimer);
  _hoverCardTimer = setTimeout(() => {
    if (_hoverCardEl) { _hoverCardEl.remove(); _hoverCardEl = null; }
  }, 200);
}

window.startDmFromHover = function(peerId, peerName) {
  hideUserHoverCard();
  if (!_currentUser) {
    window.CrimsonAuth.requireAuth(() => window.startDmFromHover(peerId, peerName));
    return;
  }
  if (peerId === _currentUser.uid) {
    window.showSysToast?.('>> 不能给自己发送私信。');
    return;
  }
  // 打开抽屉切到私信tab
  if (typeof window.openDrawer === 'function') window.openDrawer();
  setTimeout(() => {
    document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.drawer-view').forEach(v => v.classList.remove('active'));
    const dmTab = document.querySelectorAll('.drawer-tab')[1];
    if (dmTab) dmTab.classList.add('active');
    document.getElementById('view-dms')?.classList.add('active');
    window.openDmChat(peerId, peerName);
  }, 300);
};

// 给所有作者名加 hover + click 事件（事件委托，在 body 上监听）
document.addEventListener('mouseover', e => {
  const authorEl = e.target.closest('.card-author');
  if (!authorEl) return;
  
  // 优先使用data-author-id（在所有有这个属性的地方都能工作）
  let authorId = authorEl.getAttribute('data-author-id');
  let authorName = authorEl.getAttribute('data-author-name');
  
  // 降级：从post-card data-post-id找
  if (!authorId) {
    const card = authorEl.closest('.post-card, [data-post-id]');
    const postId = card?.getAttribute('data-post-id');
    if (!postId) return;
    const post = window._fbPostsCache?.[postId];
    if (!post || !post.authorId) return;
    authorId = post.authorId;
    authorName = post.authorName;
  }
  
  if (!authorId || authorId === _currentUser?.uid) return;
  clearTimeout(_hoverCardTimer);
  showUserHoverCard(authorEl, authorName, authorId);
});

document.addEventListener('mouseout', e => {
  const authorEl = e.target.closest('.card-author');
  if (!authorEl) return;
  hideUserHoverCard();
});

// 点击作者名也直接触发
// 点击作者名也直接触发（用capture phase 在card的onclick之前触发）
document.addEventListener('click', e => {
  const authorEl = e.target.closest('.card-author');
  if (!authorEl) return;
  
  let authorId = authorEl.getAttribute('data-author-id');
  let authorName = authorEl.getAttribute('data-author-name');
  
  if (!authorId) {
    const card = authorEl.closest('.post-card, [data-post-id]');
    const postId = card?.getAttribute('data-post-id');
    if (!postId) return;
    const post = window._fbPostsCache?.[postId];
    if (!post || !post.authorId) return;
    authorId = post.authorId;
    authorName = post.authorName;
  }
  
  if (!authorId || authorId === _currentUser?.uid) return;
  e.stopPropagation();
  e.stopImmediatePropagation();
  e.preventDefault();
  hideUserHoverCard();
  window.startDmFromHover(authorId, authorName);
}, true); // <-- 关键：true 表示capture phase

// 监听登录后启动DM监听
onAuthChange(user => { 
  if (user) {
    setTimeout(() => setupDmListener(), 500);
  }
});
