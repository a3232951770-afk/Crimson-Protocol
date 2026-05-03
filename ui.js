/* ==========================================
   🔀 ui.js — 全站交互路由总引擎
   包含：拓片馆交互、造字实验室引擎、
         通讯抽屉、路由连接、统一ESC处理
   ========================================== */

// ==========================================
// 🏛️ 拓片馆 — 档案编辑系统
// ==========================================
let currentEditField = '';

function generateWheelItems(min, max, suffix) {
    let html = '';
    for(let i = min; i <= max; i++) {
        let val = i.toString().padStart(2, '0');
        html += `<div class="wheel-item" data-val="${val}">${val} ${suffix}</div>`;
    }
    return html;
}

function setupWheel(id, initialValue) {
    const col = document.getElementById(id);
    const items = col.querySelectorAll('.wheel-item');
    const itemHeight = 40;
    let targetIndex = Array.from(items).findIndex(item => parseInt(item.dataset.val) === parseInt(initialValue));
    if (targetIndex === -1) targetIndex = 0;
    col.scrollTop = targetIndex * itemHeight;
    updateWheelSelection(col);
    col.addEventListener('scroll', () => {
        if (col.isDragging) return;
        clearTimeout(col.scrollTimeout);
        col.scrollTimeout = setTimeout(() => {
            updateWheelSelection(col);
            if(id === 'wheel-year' || id === 'wheel-month') updateDaysWheel();
        }, 50);
    });
    let isDown = false, startY, scrollTop;
    col.addEventListener('mousedown', (e) => {
        isDown = true; col.isDragging = true;
        startY = e.pageY - col.getBoundingClientRect().top;
        scrollTop = col.scrollTop;
        col.style.scrollSnapType = 'none';
    });
    col.addEventListener('mouseleave', () => { if(!isDown) return; isDown = false; snapWheelToNearest(col); });
    col.addEventListener('mouseup', () => { if(!isDown) return; isDown = false; snapWheelToNearest(col); });
    col.addEventListener('mousemove', (e) => {
        if(!isDown) return; e.preventDefault();
        const y = e.pageY - col.getBoundingClientRect().top;
        const walk = (startY - y) * 1.5;
        col.scrollTop = scrollTop + walk;
        updateWheelSelection(col);
    });
    items.forEach((item, idx) => {
        item.addEventListener('click', () => { col.scrollTo({ top: idx * itemHeight, behavior: 'smooth' }); });
    });
}

function snapWheelToNearest(col) {
    const itemHeight = 40;
    const index = Math.round(col.scrollTop / itemHeight);
    col.style.scrollSnapType = 'y mandatory';
    col.scrollTo({ top: index * itemHeight, behavior: 'smooth' });
    col.isDragging = false;
    setTimeout(() => {
        updateWheelSelection(col);
        if(col.id === 'wheel-year' || col.id === 'wheel-month') updateDaysWheel();
    }, 100);
}

function updateWheelSelection(col) {
    const itemHeight = 40;
    const index = Math.round(col.scrollTop / itemHeight);
    const items = col.querySelectorAll('.wheel-item');
    items.forEach(item => item.classList.remove('selected'));
    if(items[index]) items[index].classList.add('selected');
}

function updateDaysWheel() {
    const yItem = document.querySelector('#wheel-year .selected');
    const mItem = document.querySelector('#wheel-month .selected');
    if(!yItem || !mItem) return;
    const y = parseInt(yItem.dataset.val);
    const m = parseInt(mItem.dataset.val);
    const daysInMonth = new Date(y, m, 0).getDate();
    const dayCol = document.getElementById('wheel-day');
    const currentDayItem = document.querySelector('#wheel-day .selected');
    let currentDay = currentDayItem ? parseInt(currentDayItem.dataset.val) : 1;
    dayCol.innerHTML = generateWheelItems(1, daysInMonth, '日');
    setupWheel('wheel-day', Math.min(currentDay, daysInMonth));
}

function openEditField(fieldType) {
    currentEditField = fieldType;
    const modal = document.getElementById('edit-modal');
    const title = document.getElementById('edit-modal-title');
    const container = document.getElementById('edit-input-container');
    let currentValue = '';
    if (fieldType === 'codename') {
        title.innerText = '>>> 重塑协议代号 <<<';
        currentValue = document.getElementById('val-codename').innerText.trim();
        container.innerHTML = `<input type="text" id="edit-input-val" class="cyber-input" value="${currentValue}" autocomplete="off">`;
        modal.classList.add('active');
        setTimeout(() => { document.getElementById('edit-input-val').focus(); }, 100);
    } else if (fieldType === 'signature') {
        title.innerText = '>>> 雕刻个性铭文 <<<';
        currentValue = document.getElementById('val-signature').innerText.trim();
        container.innerHTML = `<textarea id="edit-input-val" class="cyber-input" rows="4" style="resize:none;">${currentValue}</textarea>`;
        modal.classList.add('active');
        setTimeout(() => { document.getElementById('edit-input-val').focus(); }, 100);
    } else if (fieldType === 'awakening') {
        title.innerText = '>>> 校准觉醒日 <<<';
        currentValue = document.getElementById('val-awakening').innerText.trim();
        const parts = currentValue.split('.');
        let y = parseInt(parts[0]) || 2023;
        let m = parseInt(parts[1]) || 11;
        let d = parseInt(parts[2]) || 24;
        container.innerHTML = `
            <div class="wheel-picker-container" id="date-wheel-picker">
                <div class="wheel-highlight"></div>
                <div class="wheel-col" id="wheel-year">${generateWheelItems(1900, 2200, '年')}</div>
                <div class="wheel-col" id="wheel-month">${generateWheelItems(1, 12, '月')}</div>
                <div class="wheel-col" id="wheel-day">${generateWheelItems(1, 31, '日')}</div>
            </div>
        `;
        modal.classList.add('active');
        setTimeout(() => {
            setupWheel('wheel-year', y);
            setupWheel('wheel-month', m);
            setupWheel('wheel-day', d);
        }, 50);
    }
}

function saveEditField() {
    if (currentEditField === 'codename') {
        const val = document.getElementById('edit-input-val').value;
        if(val) document.getElementById('val-codename').innerText = val;
    } else if (currentEditField === 'signature') {
        const val = document.getElementById('edit-input-val').value;
        if(val) document.getElementById('val-signature').innerText = val;
    } else if (currentEditField === 'awakening') {
        const yItem = document.querySelector('#wheel-year .selected');
        const mItem = document.querySelector('#wheel-month .selected');
        const dItem = document.querySelector('#wheel-day .selected');
        if(yItem && mItem && dItem) {
            document.getElementById('val-awakening').innerText = `${yItem.dataset.val}.${mItem.dataset.val}.${dItem.dataset.val}`;
        }
    }
    closeEditModal();
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
}

// ==========================================
// 📡 通讯抽屉 (全局组件)
// ==========================================
function openDrawer() {
    document.getElementById('comm-drawer-overlay').classList.add('active');
    document.getElementById('comm-drawer').classList.add('active');
    document.body.classList.add('drawer-open'); // 让CSS隐藏EN按钮
    // 触发DM监听刷新（防止首次打开抽屉时列表为空）
    if (typeof window.refreshDmListener === 'function') {
        window.refreshDmListener();
    }
}

function closeDrawer() {
    document.getElementById('comm-drawer-overlay').classList.remove('active');
    document.getElementById('comm-drawer').classList.remove('active');
    document.body.classList.remove('drawer-open');
}

function switchDrawerTab(viewId, element) {
    document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
    document.querySelectorAll('.drawer-view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function openChat(contactName) {
    document.getElementById('dms-list').classList.remove('active');
    document.getElementById('dms-chat').classList.add('active');
    document.getElementById('current-chat-name').innerText = contactName;
    document.querySelectorAll('.chat-target-id').forEach(el => el.innerText = contactName);
}

function backToDmsList() {
    document.getElementById('dms-chat').classList.remove('active');
    document.getElementById('dms-list').classList.add('active');
    document.querySelectorAll('.dm-contact-name.unread').forEach(el => el.classList.remove('unread'));
}

// ==========================================
// 🏅 勋章特效交互
// ==========================================
function openMedal(type) {
    const modal = document.getElementById('medal-modal');
    const icon = document.getElementById('medal-icon-big');
    const bg = document.getElementById('medal-bg');
    const sys = document.getElementById('medal-sys');
    const text = document.getElementById('medal-text');
    icon.className = 'medal-big-icon';
    bg.className = 'medal-glow-bg';
    sys.className = 'medal-sys-code';
    if (type === 'genesis') {
        icon.innerText = '女';
        icon.classList.add('genesis'); bg.classList.add('genesis'); sys.classList.add('genesis');
        sys.innerText = ">>> 基因重组完成 <<<";
        text.innerHTML = "你已成功解构并重读了 <span style='color:var(--neon-red);font-weight:bold;font-size:1.6rem;'>03</span> 个被污染的远古字符。<br>它们的灵魂已升入第一母星轨道，化为指引后人的永恒星辰。";
    } else if (type === 'chiseler') {
        icon.innerText = '史';
        icon.classList.add('chiseler'); bg.classList.add('chiseler'); sys.classList.add('chiseler');
        sys.innerText = ">>> 历史刻痕确认 <<<";
        text.innerHTML = "你在厚重的历史铁壁上，狠狠凿开了 <span style='color:var(--amber);font-weight:bold;font-size:1.6rem;'>12</span> 道真相的裂缝。<br>《编年史》已永久收录你的考据，我们的历史将不再被掩埋。";
    }
    modal.classList.add('active');
}

function closeMedal() {
    document.getElementById('medal-modal').classList.remove('active');
}

// ==========================================
// 🗂️ 拓片馆帖子弹窗
// ==========================================
let currentActiveRubbingCard = null;

function openFootprint(cardElement) {
    currentActiveRubbingCard = cardElement;
    let contentHTML = "";
    const isGlyph = cardElement.classList.contains('card-glyph');
    const isParchment = cardElement.classList.contains('card-parchment');
    const isBonfire = cardElement.classList.contains('card-bonfire');
    if (isGlyph) {
        const char = cardElement.querySelector('.glyph-display').innerText;
        const def = cardElement.querySelector('.glyph-def').innerText;
        const sub = cardElement.querySelector('.glyph-sub').innerText;
        contentHTML = `<h1 style="color:var(--neon-red);font-size:3rem;">${char}</h1><h3>${def}</h3><p>${sub}</p>`;
    } else if (isParchment || isBonfire) {
        const title = cardElement.querySelector('h3').innerText;
        const body = cardElement.querySelector('.card-content').innerText;
        contentHTML = `<h3 style="color:var(--amber);">${title}</h3><p>${body}</p>`;
    } else {
        contentHTML = `<p>${cardElement.querySelector('.card-content').innerText}</p>`;
    }
    const modalBody = document.getElementById('modal-content-box');
    const btnEdit = document.getElementById('btn-edit');
    modalBody.innerHTML = contentHTML;
    modalBody.contentEditable = false;
    modalBody.classList.remove('editing');
    btnEdit.innerText = "[ ▤ 重塑铭文 ]";
    document.getElementById('fp-modal').classList.add('active');
}

function closeFootprint(event) {
    if (event) event.stopPropagation();
    document.getElementById('fp-modal').classList.remove('active');
    if (document.getElementById('modal-content-box').contentEditable === "true") saveEdit();
}

function toggleEdit() {
    const modalBody = document.getElementById('modal-content-box');
    const btnEdit = document.getElementById('btn-edit');
    const isEditing = modalBody.contentEditable === "true";
    if (!isEditing) {
        modalBody.contentEditable = true;
        modalBody.classList.add('editing');
        modalBody.focus();
        btnEdit.innerText = "[ ✔ 保存铭文 ]";
        btnEdit.style.color = "var(--amber)";
        btnEdit.style.borderColor = "var(--amber)";
    } else {
        saveEdit();
        btnEdit.innerText = "[ ▤ 重塑铭文 ]";
        btnEdit.style.color = "";
        btnEdit.style.borderColor = "";
    }
}

function saveEdit() {
    const modalBody = document.getElementById('modal-content-box');
    modalBody.contentEditable = false;
    modalBody.classList.remove('editing');
}

function destroyRubbing() {
    const modalContainer = document.getElementById('fp-modal-container');
    const overlay = document.getElementById('fp-modal');
    modalContainer.classList.add('burning');
    setTimeout(() => {
        overlay.classList.remove('active');
        modalContainer.classList.remove('burning');
        if (currentActiveRubbingCard) {
            currentActiveRubbingCard.style.transition = "all 0.4s";
            currentActiveRubbingCard.style.opacity = 0;
            currentActiveRubbingCard.style.transform = "scale(0.8)";
            setTimeout(() => {
                currentActiveRubbingCard.remove();
                currentActiveRubbingCard = null;
                const container = document.getElementById('footprints-container');
                if(container && container.children.length === 0) {
                    container.innerHTML = '<div style="color:var(--ash); font-family:var(--font-mono); padding:2rem; text-align:center; width:100%;">// 暂无泥潭足迹</div>';
                }
            }, 400);
        }
    }, 900);
}

// ==========================================
// 🧪 造字实验室引擎
// ==========================================
const radicalData = [
    { title: "核心基因", radicals: "女 男".split(" ") },
    { title: "一至三画", radicals: "丨 亅 丿 乛 一 乙 丶 乚 十 厂 匚 刂 卜 冂 亻 八 人 入 勹 儿 匕 几 亠 冫 丷 冖 讠 凵 卩 阝 刀 力 又 厶 廴 干 艹 屮 彳 巛 川 辶 寸 大 飞 彑 工 弓 廾 广 己 彐 巾 口 马 门 宀 犭 山 彡 尸 饣 士 扌 氵 纟 巳 土 囗 兀 夕 小 忄 幺 弋 尢 夂 子".split(" ") },
    { title: "四画", radicals: "贝 比 灬 长 车 歹 斗 厄 方 风 父 戈 卝 户 火 旡 见 斤 耂 毛 木 牛 牜 爿 片 攴 攵 气 欠 犬 日 氏 礻 手 殳 水 瓦 王 韦 文 无 毋 心 穴 牙 爻 曰 月 爫 支 止 爪".split(" ") },
    { title: "五至六画", radicals: "白 癶 甘 瓜 禾 钅 立 龙 矛 皿 母 目 疒 鸟 皮 生 石 矢 示 罒 田 玄 疋 业 衤 用 玉 臣 虫 而 耳 缶 艮 虍 臼 老 耒 米 糸 齐 肉 色 舌 糹 网 西 覀 行 血 羊 页 衣 羽 聿 至 舟 竹 自".split(" ") },
    { title: "七至九画", radicals: "辰 赤 辵 豆 谷 龟 角 里 卤 麦 身 豕 辛 言 邑 酉 鱼 豸 走 足 采 齿 非 阜 金 隶 黾 青 雨 隹 釒 革 骨 鬼 韭 面 食 飠 首 香 音".split(" ") },
    { title: "十画及以上", radicals: "髟 高 鬲 黄 鹿 麻 鼎 黑 黍 鼓 鼠 裏 鼻 龠".split(" ") }
];

function initRadicalLibrary() {
    const container = document.getElementById('radical-library-container');
    if (!container) return;
    let html = '';
    radicalData.forEach((group, index) => {
        let uniqueRadicals = Array.from(new Set(group.radicals.map(r => r.trim()).filter(r => r !== '')));
        if (index !== 0) uniqueRadicals = uniqueRadicals.filter(r => r !== '女' && r !== '男');
        const isActive = index === 0 ? 'active' : '';
        const icon = index === 0 ? '-' : '+';
        const contentActive = index === 0 ? 'active' : '';
        let radicalsHtml = uniqueRadicals.map(r => `<div class="radical-item" onclick="addRadicalToCanvas('${r}')">${r}</div>`).join('');
        html += `
            <div class="radical-group">
                <div class="radical-acc-header ${isActive}" onclick="toggleRadicalAccordion(${index}, this)">
                    <span>${group.title}</span>
                    <span class="acc-icon">${icon}</span>
                </div>
                <div class="radical-acc-content ${contentActive}" id="rad-content-${index}">
                    ${radicalsHtml}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function toggleRadicalAccordion(index, headerEl) {
    const content = document.getElementById(`rad-content-${index}`);
    const isActive = content.classList.contains('active');
    if(isActive) {
        content.classList.remove('active'); headerEl.classList.remove('active');
        headerEl.querySelector('.acc-icon').innerText = '+';
    } else {
        content.classList.add('active'); headerEl.classList.add('active');
        headerEl.querySelector('.acc-icon').innerText = '-';
    }
}

var currentWord = "";

// 路线2/3/4：打开造字实验室
function openLabModal() {
    document.getElementById('lab-modal-overlay').classList.add('active');
    switchLabView('lab-view-crossroads');
}

// 路线3/4：带预填词条打开
function openLabWithWord(word) {
    currentWord = word || '';
    document.getElementById('lab-modal-overlay').classList.add('active');
    switchLabView('lab-view-terminal');
    setTimeout(() => {
        const input = document.getElementById('term-search-input');
        if (input && currentWord) {
            input.value = currentWord;
            input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', bubbles: true }));
        }
    }, 200);
}

function closeLabModal() {
    document.getElementById('lab-modal-overlay').classList.remove('active');
    const searchInput = document.getElementById('term-search-input');
    const outputArea = document.getElementById('term-output-area');
    const rejectBtn = document.getElementById('btn-reject');
    const manualInput = document.getElementById('manual-old-def-input');
    if (searchInput) searchInput.value = '';
    if (outputArea) outputArea.style.display = 'none';
    if (rejectBtn) rejectBtn.style.display = 'none';
    if (manualInput) manualInput.style.display = 'none';
}

function switchLabView(viewId) {
    document.querySelectorAll('.lab-view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    if(viewId === 'lab-view-terminal') {
        setTimeout(() => {
            const el = document.getElementById('term-search-input');
            if (el) el.focus();
        }, 100);
    }
}

function goToNormalPost(e) { e.stopPropagation(); switchLabView('lab-view-normal-post'); }
function goToTerminal(e) { e.stopPropagation(); switchLabView('lab-view-terminal'); }
function goToWorkbench(e) {
    e.stopPropagation();
    document.querySelectorAll('.target-word-placeholder').forEach(el => el.innerText = currentWord);
    switchLabView('lab-view-workbench');
    setTimeout(resizeDrawCanvas, 100);
}

// 终端打字机搜索
const fakeDict = {
    "嫉": "妇人常怀恶意忌妒也。从女，疾声。",
    "妒": "妇妒夫也。本义：妇女忌妒丈夫。",
    "婊": "后世俗语，指行为放荡、道德败坏的女子。",
    "嫉妒": "妇人常怀恶意忌妒也。资源被掠夺后强行绑定的女性特质。"
};

function initTerminalSearch() {
    const searchInput = document.getElementById('term-search-input');
    const outputArea = document.getElementById('term-output-area');
    const rejectBtn = document.getElementById('btn-reject');
    const manualInput = document.getElementById('manual-old-def-input');
    if (!searchInput) return;

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const val = this.value.trim();
            if (!val) return;
            currentWord = val;
            this.blur();
            outputArea.style.display = 'block';
            outputArea.innerHTML = '';
            outputArea.classList.remove('confidential');
            rejectBtn.style.display = 'none';
            manualInput.style.display = 'none';
            manualInput.value = '';
            let textToType = fakeDict[val];
            let isHit = !!textToType;
            if (!isHit) {
                textToType = "⚠️ WARNING: Archive Incomplete.\n> 检索失败：旧世档案库残缺。\n> 检测到词源含规训基因，请手动录入父权旧义。";
            } else {
                textToType = "THE CRIMSON PROTOCOL\nARCHIVE NO. " + Math.floor(Math.random()*90000+10000) + "\n\n【 卷宗释义 】：\n" + textToType;
            }
            typeWriterLab(textToType, outputArea, 0, () => {
                if (isHit) {
                    outputArea.classList.add('confidential');
                    rejectBtn.innerText = " 拒绝接受！进入重塑台 ➔";
                    setTimeout(() => rejectBtn.style.display = 'block', 500);
                } else {
                    manualInput.style.display = 'block';
                    manualInput.focus();
                    rejectBtn.innerText = " 锁定旧字！进入重塑台 ➔";
                    setTimeout(() => rejectBtn.style.display = 'block', 500);
                }
            });
        }
    });
}

function typeWriterLab(text, element, index, callback) {
    if (index < text.length) {
        let char = text.charAt(index);
        if(char === '\n') element.innerHTML += '<br>';
        else element.innerHTML += char;
        let speed = 25 + Math.random() * 40;
        setTimeout(() => typeWriterLab(text, element, index + 1, callback), speed);
    } else {
        if(callback) callback();
    }
}

// 工作台Tab切换
function switchWbTab(panelId, tabElement) {
    document.querySelectorAll('.wb-tab').forEach(t => t.classList.remove('active'));
    tabElement.classList.add('active');
    document.querySelectorAll('.wb-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(panelId).classList.add('active');
    document.querySelectorAll('.mobile-accordion-header').forEach(h => {
        h.classList.remove('active');
        h.querySelector('.acc-icon').innerText = '+';
    });
    const mobileHeader = document.querySelector(`.mobile-accordion-header[onclick*="${panelId}"]`);
    if (mobileHeader) {
        mobileHeader.classList.add('active');
        mobileHeader.querySelector('.acc-icon').innerText = '-';
    }
    if(panelId === 'tab-radical-surgery') setTimeout(resizeDrawCanvas, 100);
}

function switchMobileAccordion(panelId, headerElement) {
    const panel = document.getElementById(panelId);
    const isActive = panel.classList.contains('active');
    document.querySelectorAll('.mobile-accordion-header').forEach(h => {
        h.classList.remove('active'); h.querySelector('.acc-icon').innerText = '+';
    });
    document.querySelectorAll('.wb-panel').forEach(p => p.classList.remove('active'));
    if (!isActive) {
        panel.classList.add('active'); headerElement.classList.add('active');
        headerElement.querySelector('.acc-icon').innerText = '-';
        document.querySelectorAll('.wb-tab').forEach(t => t.classList.remove('active'));
        const desktopTab = document.querySelector(`.wb-sidebar .wb-tab[onclick*="${panelId}"]`);
        if (desktopTab) desktopTab.classList.add('active');
        if (panelId === 'tab-radical-surgery') setTimeout(resizeDrawCanvas, 300);
    } else {
        document.querySelectorAll('.wb-tab').forEach(t => t.classList.remove('active'));
    }
}

// 偏旁手术台 Canvas
let currentSurgeryTool = 'drag';

function setSurgeryTool(tool, e) {
    if(e) e.stopPropagation();
    currentSurgeryTool = tool;
    document.getElementById('tool-drag').classList.toggle('active', tool === 'drag');
    document.getElementById('tool-draw').classList.toggle('active', tool === 'draw');
    const freehandCanvas = document.getElementById('freehand-canvas');
    if(tool === 'draw') {
        freehandCanvas.style.pointerEvents = 'auto';
        freehandCanvas.style.cursor = 'crosshair';
        clearTransformSelection();
    } else {
        freehandCanvas.style.pointerEvents = 'none';
    }
}

function triggerImageUpload(e) {
    if(e) e.stopPropagation();
    document.getElementById('surgery-img-upload').click();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(event) { addImageToCanvas(event.target.result); };
    reader.readAsDataURL(file);
    e.target.value = '';
}

function handleArchiveImageUpload(e) {
    const file = e.target.files[0];
    const displayInput = document.getElementById('archive-img-display');
    if(file) {
        displayInput.value = "[+] 已加载视觉拓片: " + file.name;
        displayInput.style.color = "var(--bone)";
        displayInput.style.borderColor = "var(--terracotta)";
        // 转base64存到全局
        const reader = new FileReader();
        reader.onload = function(ev) {
            window._pendingPostImage = ev.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        displayInput.value = "";
        displayInput.style.color = "#666";
        displayInput.style.borderColor = "#333";
        window._pendingPostImage = null;
    }
}

function addImageToCanvas(src) {
    const container = document.getElementById("surgery-canvas-container");
    const newRadical = document.createElement("div");
    newRadical.className = "dropped-radical selected-transform";
    newRadical.innerHTML = `
        <img src="${src}" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none; user-select: none;">
        <div class="control-delete" title="删除">×</div>
        <div class="control-handle control-resize-xy" title="等比缩放"></div>
        <div class="control-handle control-resize-x" title="拉伸宽度"></div>
        <div class="control-handle control-resize-y" title="拉伸高度"></div>
    `;
    newRadical.style.width = "180px"; newRadical.style.height = "180px";
    newRadical.style.left = "50%"; newRadical.style.top = "50%";
    newRadical.style.transform = `translate(-50%, -50%) scale(1, 1)`;
    newRadical.dataset.scaleX = 1; newRadical.dataset.scaleY = 1;
    clearTransformSelection(); activeRadical = newRadical;
    container.appendChild(newRadical); bindRadicalEvents(newRadical); setSurgeryTool('drag');
}

let isDrawing = false;
function initDrawCanvas() {
    const drawCanvas = document.getElementById('freehand-canvas');
    if (!drawCanvas) return;
    const dCtx = drawCanvas.getContext('2d');
    drawCanvas.addEventListener('mousedown', (e) => {
        if(currentSurgeryTool !== 'draw') return;
        isDrawing = true; dCtx.beginPath(); dCtx.moveTo(e.offsetX, e.offsetY);
        dCtx.strokeStyle = '#cc4e3c'; dCtx.lineWidth = 14; dCtx.lineCap = 'round'; dCtx.lineJoin = 'round';
    });
    drawCanvas.addEventListener('mousemove', (e) => {
        if(!isDrawing || currentSurgeryTool !== 'draw') return;
        dCtx.lineTo(e.offsetX, e.offsetY); dCtx.stroke();
    });
    drawCanvas.addEventListener('mouseup', () => isDrawing = false);
    drawCanvas.addEventListener('mouseleave', () => isDrawing = false);
}

function resizeDrawCanvas() {
    const drawCanvas = document.getElementById('freehand-canvas');
    const container = document.getElementById('surgery-canvas-container');
    if (!drawCanvas || !container) return;
    const rect = container.getBoundingClientRect();
    if (drawCanvas.width !== rect.width || drawCanvas.height !== rect.height) {
        drawCanvas.width = rect.width; drawCanvas.height = rect.height;
    }
}

let activeRadical = null;
let dState = { mode: null, startX: 0, startY: 0, initLeft: 0, initTop: 0, initScaleX: 1, initScaleY: 1 };

function initSurgeryCanvasEvents() {
    const container = document.getElementById('surgery-canvas-container');
    if (!container) return;
    container.addEventListener('mousedown', (e) => {
        if (e.target.id === 'surgery-canvas-container' || e.target.id === 'freehand-canvas') clearTransformSelection();
    });
    document.addEventListener('mousemove', (e) => {
        if (!activeRadical || !dState.mode) return;
        const dx = e.clientX - dState.startX; const dy = e.clientY - dState.startY;
        if (dState.mode === 'move') {
            activeRadical.style.left = (dState.initLeft + dx) + 'px'; activeRadical.style.top = (dState.initTop + dy) + 'px';
        } else if (dState.mode === 'resize-xy') {
            let scaleDelta = dx * 0.008;
            let newScaleX = Math.max(0.3, dState.initScaleX + scaleDelta);
            let newScaleY = Math.max(0.3, dState.initScaleY + scaleDelta);
            activeRadical.dataset.scaleX = newScaleX; activeRadical.dataset.scaleY = newScaleY;
            activeRadical.style.transform = `translate(-50%, -50%) scale(${newScaleX}, ${newScaleY})`;
        } else if (dState.mode === 'resize-x') {
            let newScaleX = Math.max(0.2, dState.initScaleX + dx * 0.01);
            activeRadical.dataset.scaleX = newScaleX;
            activeRadical.style.transform = `translate(-50%, -50%) scale(${newScaleX}, ${dState.initScaleY})`;
        } else if (dState.mode === 'resize-y') {
            let newScaleY = Math.max(0.2, dState.initScaleY + dy * 0.01);
            activeRadical.dataset.scaleY = newScaleY;
            activeRadical.style.transform = `translate(-50%, -50%) scale(${dState.initScaleX}, ${newScaleY})`;
        }
    });
    document.addEventListener('mouseup', () => { dState.mode = null; });
}

function clearTransformSelection() {
    document.querySelectorAll('.dropped-radical').forEach(el => el.classList.remove('selected-transform'));
    activeRadical = null;
}

function addRadicalToCanvas(text) {
    const container = document.getElementById("surgery-canvas-container");
    const newRadical = document.createElement("div");
    newRadical.className = "dropped-radical selected-transform";
    newRadical.innerHTML = `
        <span class="radical-text" style="font-size: 6rem;">${text}</span>
        <div class="control-delete" title="删除">×</div>
        <div class="control-handle control-resize-xy" title="等比缩放"></div>
        <div class="control-handle control-resize-x" title="拉伸宽度"></div>
        <div class="control-handle control-resize-y" title="拉伸高度"></div>
    `;
    newRadical.style.left = "50%"; newRadical.style.top = "50%";
    newRadical.style.transform = `translate(-50%, -50%) scale(1, 1)`;
    newRadical.dataset.scaleX = 1; newRadical.dataset.scaleY = 1;
    clearTransformSelection(); activeRadical = newRadical;
    container.appendChild(newRadical); bindRadicalEvents(newRadical); setSurgeryTool('drag');
}

function bindRadicalEvents(el) {
    const delBtn = el.querySelector('.control-delete');
    const resXY = el.querySelector('.control-resize-xy');
    const resX = el.querySelector('.control-resize-x');
    const resY = el.querySelector('.control-resize-y');
    el.addEventListener('mousedown', (e) => {
        if(currentSurgeryTool !== 'drag') return;
        e.stopPropagation(); clearTransformSelection(); el.classList.add('selected-transform'); activeRadical = el;
        if (e.target !== delBtn && e.target !== resXY && e.target !== resX && e.target !== resY) {
            dState.mode = 'move'; dState.startX = e.clientX; dState.startY = e.clientY;
            dState.initLeft = el.offsetLeft; dState.initTop = el.offsetTop;
        }
    });
    delBtn.addEventListener('mousedown', (e) => { e.stopPropagation(); el.remove(); activeRadical = null; });
    resXY.addEventListener('mousedown', (e) => { e.stopPropagation(); dState.mode = 'resize-xy'; initResizeState(e, el); });
    resX.addEventListener('mousedown', (e) => { e.stopPropagation(); dState.mode = 'resize-x'; initResizeState(e, el); });
    resY.addEventListener('mousedown', (e) => { e.stopPropagation(); dState.mode = 'resize-y'; initResizeState(e, el); });
}

function initResizeState(e, el) {
    dState.startX = e.clientX; dState.startY = e.clientY;
    dState.initScaleX = parseFloat(el.dataset.scaleX) || 1;
    dState.initScaleY = parseFloat(el.dataset.scaleY) || 1;
}

function clearSurgeryCanvas(e) {
    if(e) e.stopPropagation();
    const container = document.getElementById("surgery-canvas-container");
    if (!container) return;
    container.querySelectorAll('.dropped-radical').forEach(item => item.remove());
    const drawCanvas = document.getElementById('freehand-canvas');
    if (drawCanvas) {
        const dCtx = drawCanvas.getContext('2d');
        dCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    }
    activeRadical = null;
}

// 路线5：造字完成 → 传送到泥潭
function mintPoster() {
    closeLabModal();
    showSysToast('>> 刻录完成！正在传送至【女娲的泥潭】...');
    setTimeout(() => {
        switchPage('page-mire', document.querySelector('.nav-links a[onclick*="page-mire"]'));
    }, 1200);
}

function submitNormalPost() {
    closeLabModal();
    showSysToast('>> 封卷成功！已同步至泥潭。');
    setTimeout(() => {
        switchPage('page-mire', document.querySelector('.nav-links a[onclick*="page-mire"]'));
    }, 1200);
}

// ==========================================
// ⌨️ 统一 ESC 按键监听（整合所有弹窗）
// ==========================================
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        // 图片灯箱
        const lightbox = document.getElementById('image-lightbox');
        if (lightbox && lightbox.classList.contains('active')) { lightbox.classList.remove('active'); return; }
        // 认证弹窗
        const authModal = document.getElementById('auth-modal');
        if (authModal && authModal.classList.contains('active')) { authModal.classList.remove('active'); return; }
        // 造字实验室（最高优先级）
        const labOverlay = document.getElementById('lab-modal-overlay');
        if (labOverlay && labOverlay.classList.contains('active')) { closeLabModal(); return; }
        // 拓片馆帖子弹窗
        const fpModal = document.getElementById('fp-modal');
        if (fpModal && fpModal.classList.contains('active')) { closeFootprint(); return; }
        // 勋章弹窗
        const medalModal = document.getElementById('medal-modal');
        if (medalModal && medalModal.classList.contains('active')) { closeMedal(); return; }
        // 通讯抽屉
        const commDrawer = document.getElementById('comm-drawer');
        if (commDrawer && commDrawer.classList.contains('active')) { closeDrawer(); return; }
        // 档案编辑弹窗
        const editModal = document.getElementById('edit-modal');
        if (editModal && editModal.classList.contains('active')) { closeEditModal(); return; }
        // 母星详情卡
        const detailCard = document.getElementById('detail-card');
        if (detailCard && detailCard.classList.contains('active')) { detailCard.classList.remove('active'); return; }
        // 泥潭帖子弹窗
        const postModal = document.getElementById('post-modal');
        if (postModal && postModal.classList.contains('active')) { closePostModal(null); return; }
    }
});

// ==========================================
// 🚀 DOMContentLoaded 初始化
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initRadicalLibrary();
    setSurgeryTool('drag');
    initDrawCanvas();
    initSurgeryCanvasEvents();
    initTerminalSearch();
});
