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
  getUserPosts, getPostById, getPromotedProposals, getCharProposals
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
          <span class="card-author">${esc(p.authorName||'')}</span>
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
  html += `<div class="card-meta" style="margin-bottom:1rem;"><span class="card-author">${esc(p.authorName||'')}</span><span class="card-stats">${t}</span></div>`;
  
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
  if (p.content) html += `<div class="card-content" style="margin:1rem 0;line-height:1.8;color:var(--bone);font-size:0.95rem;">${esc(p.content)}</div>`;
  
  // 上传的图片
  if (p.postImage) {
    html += `<div style="margin:1rem 0;text-align:center;">
      <img class="post-canvas-image" src="${p.postImage}" onclick="window.openLightbox(this.src)" alt="post image"/>
    </div>`;
  }
  
  // 论证
  if (p.reasoning) html += `<div style="margin:1rem 0;padding:0.8rem;border-left:2px solid var(--terracotta);color:var(--ash);font-size:0.85rem;"><strong>${isEn?'Reasoning':'论证'}：</strong>${esc(p.reasoning)}</div>`;
  
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
        // 停止旧动画
        if (window._dictNetworkAnimId) cancelAnimationFrame(window._dictNetworkAnimId);
        
        const orbitData = [];
        if (chars.length > 0) {
          const angleStep = (Math.PI * 2) / chars.length;
          chars.forEach((data, i) => {
            const radius = 120 + Math.random() * 80;
            const baseAngle = i * angleStep + Math.random() * 0.3;
            const speed = 0.001 + Math.random() * 0.001;
            const nodeDiv = document.createElement('div');
            nodeDiv.className = 'network-word-node';
            nodeDiv.innerHTML = `<div class="network-word-char">${data.char}</div><div class="lucky-star"></div>`;
            nodeDiv.onclick = () => bridgeOpenWord(data.char);
            orbitsContainer.appendChild(nodeDiv);
            orbitData.push({ element: nodeDiv, char: data.char, angle: baseAngle, radius, speed });
          });
        }
        
        // 启动轨道动画
        const netCanvas = document.getElementById('network-canvas');
        if (netCanvas && orbitData.length > 0) {
          const wrapper = nv;
          const netW = wrapper.clientWidth || 600;
          const netH = wrapper.clientHeight || 400;
          const cx = netW / 2, cy = netH / 2;
          
          function animateDictNet() {
            orbitData.forEach(node => {
              node.angle += node.speed;
              const floatY = Math.sin(Date.now()/1000 + node.angle) * 8;
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
        
        // 异步加载社区提案（200票以上的会标记为"已收录"）
        getCharProposals(char).then(proposals => {
          if (proposals.length === 0) return;
          proposals.forEach(p => {
            const promoted = (p.votes||0) >= 200;
            const badge = promoted 
              ? `<span style="color:var(--neon-red);font-size:0.7rem;border:1px solid rgba(255,42,42,0.3);padding:1px 6px;margin-left:6px;">✦ ${isEn?'ARCHIVED':'已收录'}</span>` 
              : '';
            proposalsList.innerHTML += `
              <div class="proposal-item" style="${promoted?'border-left:2px solid var(--neon-red);padding-left:0.8rem;':''}">
                <div class="proposal-meta">
                  <span>> ${isEn?'Proposer':'提议者'}：<span class="proposal-author">${esc(p.authorName||'')}</span>${badge}</span>
                  <span>[ ▵ ${p.votes||0} ]</span>
                </div>
                <div class="proposal-text">${esc(p.content||'')}</div>
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
  // 暴露 tab 切换
  window.switchProfileTab = function(tabId, btn) {
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.profile-tab-content').forEach(c => { c.classList.remove('active'); c.style.display = 'none'; });
    btn?.classList.add('active');
    const cont = document.getElementById(tabId === 'footprints' ? 'footprints-container' : 'resonated-container');
    if (cont) { cont.classList.add('active'); cont.style.display = 'flex'; }
  };
  
  // 监听用户变化，加载数据
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
          <div class="card-meta"><span class="card-author">${esc(p.authorName||'')}</span><span class="card-stats">${t}</span></div>
          ${p.targetChar ? `<div class="post-target-char">${esc(p.targetChar)}</div>` : ''}
          ${p.dimension ? `<span class="post-method-badge" style="color:#c8860a;border-color:rgba(200,134,10,0.3);">${dimLabels[p.dimension]||''}</span>` : ''}
          ${p.title ? `<h3>${esc(p.title)}</h3>` : ''}
          <div class="card-content">${esc((p.content||'').substring(0,100))}${(p.content||'').length>100?'...':''}</div>
          <div class="card-actions" onclick="event.stopPropagation()">
            <span style="font-size:0.75rem;color:var(--ash);font-family:var(--font-mono);">▵ ${p.votes||0} · 💬 ${p.comments||0}</span>
            <button class="report-btn" style="color:var(--neon-red);border-color:rgba(255,42,42,0.3);margin-left:auto;" onclick="window.deleteOwnPost('${p.id}',this.closest('.post-card'))" title="删除">🗑</button>
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
    
    // 共振回响（显示所有投过票/共鸣过的帖子）
    const resonatedCont = document.getElementById('resonated-container');
    const resonatedEmpty = document.getElementById('resonated-empty');
    if (resonatedCont) {
      resonatedCont.querySelectorAll('.post-card').forEach(c => c.remove());
      const votedIds = [...new Set([...(_votedPosts || []), ...(_likedPosts || [])])];
      if (votedIds.length === 0) {
        if (resonatedEmpty) resonatedEmpty.style.display = 'block';
      } else {
        let hasAny = false;
        const toLoad = votedIds.slice(0, 20);
        for (const postId of toLoad) {
          let p = window._fbPostsCache?.[postId];
          if (!p) {
            p = await getPostById(postId);
            if (p) { window._fbPostsCache[postId] = p; }
          }
          if (!p) continue;
          hasAny = true;
          const card = document.createElement('div');
          card.className = 'post-card';
          card.onclick = () => window.openFbPostDetail?.(postId);
          card.innerHTML = `
            <div class="card-meta"><span class="card-author">${esc(p.authorName||'')}</span></div>
            ${p.targetChar ? `<div class="post-target-char">${esc(p.targetChar)}</div>` : ''}
            ${p.title ? `<h3>${esc(p.title)}</h3>` : ''}
            <div class="card-content">${esc((p.content||'').substring(0,80))}</div>
            <div class="card-actions" onclick="event.stopPropagation()">
              <span style="font-size:0.7rem;color:var(--ash);">▵ ${p.votes||0}</span>
            </div>`;
          resonatedCont.appendChild(card);
        }
        if (resonatedEmpty) resonatedEmpty.style.display = hasAny ? 'none' : 'block';
      }
    }
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
