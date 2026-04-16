        /* 1. 赛博提示框 */
        function showSysToast(msg) {
            const toast = document.getElementById('sys-toast');
            toast.innerText = msg; toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }

        /* 2. 空间折叠路由引擎 */
        function switchPage(pageId, navElement) {
            document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
            if(navElement) navElement.classList.add('active');

            document.querySelectorAll('.page-section').forEach(page => {
                page.classList.remove('active');
            });

            const target = document.getElementById(pageId);
            if(target) target.classList.add('active');

            if(pageId === 'page-mother-star') {
                if(window.resumeThreeJS) window.resumeThreeJS();
            } else {
                if(window.pauseThreeJS) window.pauseThreeJS();
            }

            if(pageId === 'page-chronicle') {
                if(window.resizeDnaCanvas) setTimeout(window.resizeDnaCanvas, 100);
                // 移动端：确保每次进入编年史字典模式，侧边栏都是展开的状态以展示搜索栏
                document.getElementById('dict-sidebar').classList.remove('collapsed');
            }
        }

        /* 3. 启示录前导动画 (p5.js 逻辑) */
        let p5Instance;
        window.p5_noLoop = function() { if (p5Instance) p5Instance.noLoop(); };

        new p5(function(p) {
            p5Instance = p;
            let particles = []; let targetPoints = []; let phase = 0;
            let mouse = { x: -1000, y: -1000, radius: 180 }; let totalMouseDist = 0;
            let lastMousePos = { x: -1000, y: -1000 }; let autoTriggerTimer; let stageTimers = [];
            const redWords = ['嫉','妒','嫖','婊','媚','娇','媛','妖','姒','妇','奸','娼','奴','娱','妨','妄','姿','嫌','婪','佞','婢','娘','娣','妓'];
            const greyWords = ['嫌','妨','妯','娌','媳','妇','妈','奶','姑','嫂','婶','姐','妹','婆','姻','媒','孕','嫁','娶','委','妥','妄','如','始','姑','姓'];

            let audioCtx; let staticNode; let lastHoverTime = 0; let globalWindVolume = null;

            async function initAudio() {
                if (audioCtx) return;
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const bufferSize = audioCtx.sampleRate * 2; const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const output = buffer.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
                for (let i = 0; i < bufferSize; i++) {
                    let white = Math.random() * 2 - 1;
                    b0 = 0.99886 * b0 + white * 0.0555179; b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520; b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522; b5 = -0.7616 * b5 - white * 0.0168980;
                    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                    output[i] *= 0.11; b6 = white * 0.115926;
                }
                const windNode = audioCtx.createBufferSource(); windNode.buffer = buffer; windNode.loop = true;
                const bandpass = audioCtx.createBiquadFilter(); bandpass.type = 'bandpass'; bandpass.Q.value = 1.5; bandpass.frequency.value = 400;
                const windVolume = audioCtx.createGain(); windVolume.gain.setValueAtTime(0, audioCtx.currentTime); windVolume.gain.linearRampToValueAtTime(1.5, audioCtx.currentTime + 3);
                globalWindVolume = windVolume; windNode.connect(bandpass).connect(windVolume).connect(audioCtx.destination); windNode.start();
            }

            window.fadeOutWind = function() {
                if (audioCtx && globalWindVolume) {
                    const now = audioCtx.currentTime;
                    globalWindVolume.gain.cancelScheduledValues(now);
                    globalWindVolume.gain.setValueAtTime(globalWindVolume.gain.value, now);
                    globalWindVolume.gain.linearRampToValueAtTime(0, now + 3);
                }
            };

            function triggerGlitchAudio() {
                if (!audioCtx) return;
                const bufferSize = audioCtx.sampleRate * 1; const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
                staticNode = audioCtx.createBufferSource(); staticNode.buffer = buffer; staticNode.loop = true;
                const staticGain = audioCtx.createGain(); staticGain.gain.setValueAtTime(0, audioCtx.currentTime); staticGain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 4);
                const bandpass = audioCtx.createBiquadFilter(); bandpass.type = 'bandpass'; bandpass.frequency.value = 1000;
                staticNode.connect(bandpass).connect(staticGain).connect(audioCtx.destination); staticNode.start();
            }
            function stopGlitchAudio() { if (staticNode) staticNode.stop(); }

            function playHeartbeat() {
                if (!audioCtx || audioCtx.state === 'suspended') return;
                let now = audioCtx.currentTime; if (now - lastHoverTime < 0.5) return; lastHoverTime = now;
                let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain();
                osc.type = 'sine'; osc.frequency.setValueAtTime(55, now); osc.frequency.exponentialRampToValueAtTime(25, now + 0.4);
                osc.connect(gain); gain.connect(audioCtx.destination);
                gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(1.2, now + 0.05); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(now); osc.stop(now + 0.4);
            }
            function playTypewriterTick() {
                if (!audioCtx || audioCtx.state === 'suspended') return;
                let now = audioCtx.currentTime; let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain();
                osc.type = 'square'; osc.frequency.setValueAtTime(250 + Math.random() * 50, now);
                osc.connect(gain); gain.connect(audioCtx.destination);
                gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.2, now + 0.005); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc.start(now); osc.stop(now + 0.04);
            }
            function speakSystemVoice() { if ('speechSynthesis' in window) { try { const msg = new SpeechSynthesisUtterance(); msg.text = "正在执行，赤字净化协议"; msg.lang = 'zh-CN'; msg.rate = 0.95; msg.pitch = 1.2; window.speechSynthesis.speak(msg); } catch(e) {} } }

            p.setup = function() { let cnv = p.createCanvas(p.windowWidth, p.windowHeight); cnv.parent('p5-canvas-container'); p.colorMode(p.RGB, 255, 255, 255, 1); p.textFont('"Noto Sans SC", sans-serif'); p.textStyle(p.BOLD); p.textAlign(p.CENTER, p.CENTER); p.noLoop(); };
            p.windowResized = function() { p.resizeCanvas(p.windowWidth, p.windowHeight); targetPoints = generateTargetPoints(); };

            window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
            window.addEventListener('touchmove', (e) => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; });
            window.addEventListener('mouseout', () => { mouse.x = -1000; mouse.y = -1000; });

            function generateTargetPoints() {
                const tempCanvas = document.createElement('canvas'); const tempCtx = tempCanvas.getContext('2d');
                const w = p.width > 0 ? p.width : window.innerWidth; const h = p.height > 0 ? p.height : window.innerHeight;
                if (w === 0 || h === 0) return []; tempCanvas.width = w; tempCanvas.height = h;
                const fontSize = Math.min(w, h) * 0.8; tempCtx.fillStyle = 'white'; tempCtx.font = `bold ${fontSize}px "Noto Sans SC", sans-serif`;
                tempCtx.textAlign = 'center'; tempCtx.textBaseline = 'middle'; tempCtx.fillText('女', w / 2, h / 2);
                try { const imgData = tempCtx.getImageData(0, 0, w, h).data; const points = []; for (let y = 0; y < h; y += 8) { for (let x = 0; x < w; x += 8) { if (imgData[(y * w + x) * 4 + 3] > 128) points.push({ x, y }); } } return points.sort(() => Math.random() - 0.5); } catch(e) { return [{x: w/2, y: h/2}]; }
            }

            class Particle {
                constructor(isRed, targetPoint = null) {
                    this.isRed = isRed; this.char = isRed ? redWords[Math.floor(Math.random() * redWords.length)] : greyWords[Math.floor(Math.random() * greyWords.length)];
                    let w = p.width > 0 ? p.width : window.innerWidth; let h = p.height > 0 ? p.height : window.innerHeight;
                    this.x = Math.random() * w; this.y = -Math.random() * (h * 2.8 + 2500) - 50;
                    this.vx = 0; this.vy = isRed ? p.random(10, 16) : p.random(13, 20);
                    this.originalSize = isRed ? p.random(12, 18) : p.random(10, 20); this.size = this.originalSize;
                    this.target = targetPoint; this.friction = 0.92; this.bounceCount = 0; this.isGrounded = false; this.redAlpha = 1; this.readyToGather = false;
                    this.noiseOffsetX = p.random(10000); this.noiseOffsetY = p.random(10000, 20000);
                }
                update() {
                    let w = p.width > 0 ? p.width : window.innerWidth; let h = p.height > 0 ? p.height : window.innerHeight;
                    if (phase === 1.5 && this.isRed && this.readyToGather) {
                        let dx = this.target.x - this.x; let dy = this.target.y - this.y;
                        this.vx += dx * 0.1; this.vy += dy * 0.1; this.vx *= 0.65; this.vy *= 0.65; this.x += this.vx; this.y += this.vy;
                        let dMouse = Math.sqrt((this.x - mouse.x) ** 2 + (this.y - mouse.y) ** 2);
                        if (dMouse < 15) { this.size = p.lerp(this.size, this.originalSize * 6.0, 0.4); this.x += p.random(-3, 3); this.y += p.random(-3, 3); playHeartbeat(); } else { this.size = p.lerp(this.size, this.originalSize, 0.15); }
                        return;
                    }
                    let dx = this.x - mouse.x; let dy = this.y - mouse.y;
                    if (Math.abs(dx) < mouse.radius && Math.abs(dy) < mouse.radius && phase < 1.5) { let distance = Math.sqrt(dx * dx + dy * dy); if (distance < mouse.radius) { let force = (mouse.radius - distance) / mouse.radius; let pushPower = (this.isRed) ? 5 : 8; this.vx += (dx / distance) * force * pushPower; this.vy += (dy / distance) * force * pushPower; if (this.isGrounded) this.isGrounded = false; } }
                    if (!this.isGrounded && phase < 2) { let timeFlow = p.millis() * 0.002; let windX = Math.sin(this.x * 0.01 + timeFlow + this.noiseOffsetX) * 1.5; let windLift = Math.cos(this.y * 0.01 + timeFlow + this.noiseOffsetY) * 0.2; this.vx += windX * 0.15; this.vy += 0.5 + windLift * 0.15; }
                    if (phase <= 1) {
                        if (!this.isGrounded) { if (this.y > h - 20) { if (this.isRed) { this.vy *= -0.5; this.y = h - 20; this.vx += p.random(-2, 2); this.bounceCount++; if (this.bounceCount > 2) { this.isGrounded = true; this.vx *= 0.1; this.vy = 0; } } else { this.vy *= -0.8; this.y = h - 20; this.vx += p.random(-3, 3); } } }
                        if (!this.isRed && this.y > h + 50) { this.y = -20 - p.random(100); this.x = p.random(w); this.vy = p.random(13, 20); this.vx = 0; }
                    } else if (phase >= 2) {
                        if (this.isRed) { this.redAlpha -= 0.015; this.vx *= 0.98; this.vy *= 0.98; this.x += this.vx; this.y += this.vy; return; } else { this.vy += 0.5; if (this.y > h - 20) { this.vy *= -0.8; this.y = h - 20; } if (this.y > h + 50) { this.y = -20; this.x = p.random(w); this.vy = p.random(13, 20); } }
                    }
                    this.vx *= this.friction; this.vy *= this.friction; this.x += this.vx; this.y += this.vy;
                }
                draw() { p.textSize(this.size); if (this.isRed) { let alpha = phase === 1.5 ? 1 : 0.8; if (phase >= 2) alpha = Math.max(0, this.redAlpha); p.fill(255, 42, 42, alpha); if (phase === 1.5) { p.drawingContext.shadowBlur = 15; p.drawingContext.shadowColor = '#ff2a2a'; } else { p.drawingContext.shadowBlur = 0; } } else { p.fill(74, 74, 74, 0.4); p.drawingContext.shadowBlur = 0; } p.text(this.char, this.x, this.y); }
            }

            p.draw = function() {
                if (phase === 4) { p.background(11, 11, 10, 1); }
                else { p.background(11, 11, 10, 0.4); particles.forEach(pt => { pt.update(); pt.draw(); });
                    if (phase === 3.5) { p.fill(255, 42, 42, 0.8); p.textFont('monospace'); p.textSize(16); p.drawingContext.shadowBlur = 0; const chars = '0123456789ABCDEF!@#$%%^&*()_+-=~`[];,./<>?污释义染警告系统崩'; for (let i = 0; i < 40; i++) p.text(chars[Math.floor(p.random(chars.length))], p.random(p.width * 0.2), p.random(p.height)); for (let i = 0; i < 40; i++) p.text(chars[Math.floor(p.random(chars.length))], p.width * 0.8 + p.random(p.width * 0.2), p.random(p.height)); p.textFont('"Noto Sans SC", sans-serif'); p.textStyle(p.BOLD); }
                    if (phase === 1 && mouse.x > -1000) { if (lastMousePos.x > -1000) { let d = p.dist(mouse.x, mouse.y, lastMousePos.x, lastMousePos.y); totalMouseDist += d; } lastMousePos.x = mouse.x; lastMousePos.y = mouse.y; if (totalMouseDist > 1400) { startGathering(); } } else { lastMousePos.x = -1000; }
                }
            };

            window.skipExperience = function() {
                clearTimeout(autoTriggerTimer); stageTimers.forEach(clearTimeout);
                if (window.fadeOutWind) window.fadeOutWind(); stopGlitchAudio();
                phase = 4; particles = [];
                const elementsToHide = ['start-screen', 'interact-prompt', 'protocol-text', 'p5-canvas-container', 'skip-btn', 'home-terminal'];
                elementsToHide.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
                if (window.enterMotherStar) window.enterMotherStar();
            };

            window.startExperience = function() {
                const startScreen = document.getElementById('start-screen'); startScreen.style.opacity = 0; setTimeout(() => startScreen.remove(), 1000);
                const skipBtn = document.getElementById('skip-btn'); skipBtn.style.opacity = 1; skipBtn.style.pointerEvents = 'auto';
                initAudio(); targetPoints = generateTargetPoints();
                for (let i = 0; i < 800; i++) { particles.push(new Particle(true, targetPoints[i % targetPoints.length])); }
                for (let i = 0; i < 1000; i++) particles.push(new Particle(false));
                p.loop();
                stageTimers.push(setTimeout(() => { if (phase === 0) { phase = 1; triggerGlitchAudio(); document.getElementById('interact-prompt').style.opacity = 1; autoTriggerTimer = setTimeout(() => { if (phase === 1) startGathering(); }, 20000); } }, 7000));
            };

            function startGathering() {
                if (phase !== 1) return; phase = 1.5; clearTimeout(autoTriggerTimer);
                const promptUI = document.getElementById('interact-prompt'); if (promptUI) { promptUI.style.opacity = 0; setTimeout(() => { promptUI.style.display = 'none'; }, 300); }
                particles.forEach(pt => { if (pt.isRed) { pt.isGrounded = false; pt.y -= 5; pt.vy = p.random(-30, -50); pt.vx = p.random(-15, 15); pt.readyToGather = true; } });
                stageTimers.push(setTimeout(() => { phase = 2; stopGlitchAudio(); particles.forEach(pt => { if (pt.isRed) { pt.vx = (Math.random() - 0.5) * 60; pt.vy = (Math.random() - 0.5) * 60; } }); }, 5000));
                stageTimers.push(setTimeout(() => { phase = 3; speakSystemVoice(); const textUI = document.getElementById('protocol-text'); textUI.style.opacity = 1; textUI.classList.add('glitch'); }, 8500));
                stageTimers.push(setTimeout(() => { phase = 3.5; const textUI = document.getElementById('protocol-text'); textUI.classList.remove('glitch'); textUI.classList.add('mega-glitch'); }, 10000));
                stageTimers.push(setTimeout(() => {
                    const textUI = document.getElementById('protocol-text'); if (textUI) { textUI.style.opacity = 0; textUI.classList.remove('mega-glitch'); setTimeout(() => { textUI.style.display = 'none'; }, 500); }
                    const canvasContainer = document.getElementById('p5-canvas-container'); if (canvasContainer) { canvasContainer.style.transition = 'opacity 1.5s ease-in-out'; canvasContainer.style.opacity = 0; }
                    setTimeout(() => { phase = 4; }, 1500);
                }, 12000));
                stageTimers.push(setTimeout(() => { startHomeTerminal(); }, 13500));
            }

            function startHomeTerminal() {
                const skipBtn = document.getElementById('skip-btn'); if(skipBtn) { skipBtn.style.opacity = 0; skipBtn.style.pointerEvents = 'none'; }
                const terminal = document.getElementById('home-terminal'); const content = document.getElementById('typewriter-content'); const cursor = document.getElementById('cursor');
                if (terminal && content && cursor) {
                    terminal.style.opacity = 1; cursor.style.display = 'inline-block';
                    const lines = window._lang === 'en' 
                        ? ["> WARNING: Definition contamination detected.", "> Welcome, language archaeologist.", "> Click the stars to begin purification."]
                        : ["> 警告：检测到释义污染。", "> 欢迎你，语言考古学家。", "> 请点击星辰，执行净化。"];
                    let lineIndex = 0; let charIndex = 0;
                    function typeWriter() {
                        if (lineIndex < lines.length) {
                            if (charIndex < lines[lineIndex].length) {
                                let char = lines[lineIndex].charAt(charIndex); content.innerHTML += char;
                                if (char !== ' ') { playTypewriterTick(); }
                                charIndex++; setTimeout(typeWriter, 120 + Math.random() * 100);
                            } else { content.innerHTML += "<br>"; lineIndex++; charIndex = 0; setTimeout(typeWriter, 400); }
                        } else {
                            setTimeout(() => { terminal.style.transition = "opacity 2s ease"; terminal.style.opacity = 0; setTimeout(() => { if (window.enterMotherStar) window.enterMotherStar(); }, 1500); }, 3000);
                        }
                    }
                    typeWriter();
                }
            }
        });

        // 将控制权移交母星系统
        window.enterMotherStar = function() {
            const p5Container = document.getElementById('p5-container');
            const globalNav = document.getElementById('global-nav');
            const chiselBtn = document.getElementById('global-chisel-btn');

            if (window.fadeOutWind) window.fadeOutWind();
            p5Container.style.opacity = '0';
            setTimeout(() => { p5Container.style.display = 'none'; if (typeof p5_noLoop === 'function') window.p5_noLoop(); }, 2000);

            globalNav.style.opacity = '1'; globalNav.style.pointerEvents = 'auto';
            chiselBtn.style.opacity = '1'; chiselBtn.style.pointerEvents = 'auto';

            // 同步淡入频段接收按钮
            const btnSignalNav = document.getElementById('btn-signal-nav');
            if (btnSignalNav) { btnSignalNav.style.opacity = '1'; btnSignalNav.style.pointerEvents = 'auto'; }

            switchPage('page-mother-star', document.querySelector('.nav-links a.active'));
        };

        /* -------------------------------------------
           4. 编年史字典与史记逻辑
        ------------------------------------------- */
        function handleModeSwitch(mode) {
            const defLayer = document.getElementById('layer-definition');
            const chroLayer = document.getElementById('layer-chronicle');
            const switcher = document.getElementById('mode-switch-wrapper');

            if (mode === 'chro') {
                defLayer.classList.remove('active'); chroLayer.classList.add('active');
                switcher.classList.remove('mode-def'); switcher.classList.add('mode-chro');
                setTimeout(window.resizeDnaCanvas, 50);
            } else {
                chroLayer.classList.remove('active'); defLayer.classList.add('active');
                switcher.classList.remove('mode-chro'); switcher.classList.add('mode-def');
                if (document.getElementById('network-view').style.display !== 'none') setTimeout(window.initNetworkCanvas, 50);
            }
        }

        const lexiconData = {
            '妖': { pinyin: 'yāo', letter: 'Y', meta: 'ARCHIVE.REF_#1A33<br>STATUS: CORRUPTED', old: '怪异、<span class="redacted">反常的事物</span>；多指<span class="redacted">迷人、惑人的女性</span>。', proposals: [{ author: '@星尘_042', votes: 9230, text: '父权对无法掌控的、具有强大生命力或独立智慧的女性的统称。她们不服从规训，因而被污名化为"妖"。我们在此认领这个字，作为女性力量的代名词。' }] },
            '婊': { pinyin: 'biǎo', letter: 'B', meta: 'ARCHIVE.REF_#9A42<br>STATUS: CORRUPTED', old: '本指<span class="redacted">女性从事贱业，以色事人的娼妓</span>。引申为<span class="redacted">行为放荡、道德败坏的女子</span>。', proposals: [{ author: '@打字机_77', votes: 8492, text: '表露欲望者。拒绝被放置于道德神坛或耻辱柱上的主体。当女性的性自主权、攻击性或利益诉求引发系统恐慌时，系统自动分配的警告标签。' }] }
        };

        let currentSelectedLetter = 'B'; let currentSelectedWord = '';
        let networkAnimationId = null; let orbitNodesData = [];

        const azContainer = document.getElementById('az-container');
        for (let i = 65; i <= 90; i++) {
            let letter = String.fromCharCode(i); let div = document.createElement('div');
            div.className = 'pinyin-cell'; div.innerText = letter;
            if (letter === 'B') div.classList.add('active');
            div.onclick = () => loadNetwork(letter); azContainer.appendChild(div);
        }

        function loadNetwork(letter) {
            currentSelectedLetter = letter; currentSelectedWord = '';
            document.querySelectorAll('.pinyin-cell').forEach(el => { el.classList.toggle('active', el.innerText === letter); });
            document.getElementById('network-view').style.display = 'flex'; document.getElementById('detail-view').style.display = 'none';
            const wrapper = document.getElementById('archive-wrapper');
            if(wrapper) { wrapper.classList.remove('bg-detail'); wrapper.classList.add('bg-network'); }

            let words = Object.keys(lexiconData).filter(k => lexiconData[k].letter === letter);
            renderSidebar(words);

            const orbitsContainer = document.getElementById('network-orbit-nodes'); orbitsContainer.innerHTML = ''; orbitNodesData = [];
            if (words.length > 0) {
                const angleStep = (Math.PI * 2) / words.length;
                words.forEach((word, index) => {
                    const radius = 180 + Math.random() * 40; const baseAngle = index * angleStep + Math.random() * 0.5; const speed = 0.0015 + Math.random() * 0.001;
                    const nodeDiv = document.createElement('div'); nodeDiv.className = 'network-word-node';
                    nodeDiv.innerHTML = `<div class="network-word-char">${word}</div><div class="lucky-star"></div>`;
                    nodeDiv.onclick = () => openWord(word); orbitsContainer.appendChild(nodeDiv);
                    orbitNodesData.push({ element: nodeDiv, word: word, angle: baseAngle, radius: radius, speed: speed });
                });
            }
            if(window.startNetworkCanvas) window.startNetworkCanvas();
        }

        function renderSidebar(wordsArray) {
            const sidebarContainer = document.getElementById('word-list-container'); sidebarContainer.innerHTML = '';
            if (wordsArray.length === 0) { sidebarContainer.innerHTML = '<li class="term-item" style="color:var(--ash); justify-content:center; font-size:0.8rem; cursor:default; border:none; background:transparent;">无可用锚点 / NO_NODES</li>'; return; }
            wordsArray.forEach((word) => {
                let li = document.createElement('li'); li.className = `term-item ${word === currentSelectedWord ? 'active' : ''}`;
                li.innerHTML = `<span class="char">${word}</span><span class="meta">[${lexiconData[word].pinyin.toUpperCase()}]</span>`;
                li.onclick = () => openWord(word); sidebarContainer.appendChild(li);
            });
        }
        function backToNetwork() { loadNetwork(currentSelectedLetter); }

        function openWord(wordKey) {
            currentSelectedWord = wordKey; const data = lexiconData[wordKey]; currentSelectedLetter = data.letter;
            if (networkAnimationId) cancelAnimationFrame(networkAnimationId);
            document.getElementById('network-view').style.display = 'none'; document.getElementById('detail-view').style.display = 'flex';
            const wrapper = document.getElementById('archive-wrapper'); if(wrapper) { wrapper.classList.remove('bg-network'); wrapper.classList.add('bg-detail'); }
            document.querySelectorAll('.pinyin-cell').forEach(el => el.classList.toggle('active', el.innerText === data.letter));
            let currentWords = Object.keys(lexiconData).filter(k => lexiconData[k].letter === data.letter); renderSidebar(currentWords);
            document.getElementById('ui-char').innerText = wordKey; document.getElementById('ui-meta').innerHTML = data.meta; document.getElementById('ui-old-def').innerHTML = data.old;
            const sortedProposals = [...data.proposals].sort((a, b) => b.votes - a.votes);
            const proposalsList = document.getElementById('ui-proposals-list'); proposalsList.innerHTML = '';
            sortedProposals.forEach(prop => { proposalsList.innerHTML += `<div class="proposal-item"><div class="proposal-meta"><span>> 提议者：<span class="proposal-author">${prop.author}</span></span><span>[ 共识度: ${prop.votes} ]</span></div><div class="proposal-text">${prop.text}</div></div>`; });
            const btn = document.getElementById('btn-decipher'); btn.innerText = '[ ⚠️ 侦察释义 ]'; btn.classList.remove('mutated'); btn.onclick = revealRedacted;
            document.getElementById('new-def-area').classList.remove('active');
            if (window.innerWidth <= 900) { document.getElementById('dict-sidebar').classList.add('collapsed'); }
        }

        function revealRedacted() {
            document.querySelectorAll('#ui-old-def .redacted').forEach(el => el.classList.add('revealed'));
            const btn = document.getElementById('btn-decipher');
            btn.innerText = '驳回旧叙事，发起新提案 ➔'; btn.classList.add('mutated');
            // 修改：点击后跳转到造字实验室，预填当前词条
            btn.onclick = () => { window.openLabWithWord(currentSelectedWord); };
            document.getElementById('new-def-area').classList.add('active');
        }

        // 星云拓扑Canvas
        const netCanvas = document.getElementById('network-canvas'); const netCtx = netCanvas.getContext('2d');
        let netW, netH, netCx, netCy; let decorativeFibers = []; const dpr = window.devicePixelRatio || 1;

        window.initNetworkCanvas = function() {
            const wrapper = document.getElementById('network-view');
            netW = wrapper.clientWidth; netH = wrapper.clientHeight;
            if(netW === 0) return;
            netCanvas.width = netW * dpr; netCanvas.height = netH * dpr;
            netCtx.setTransform(1, 0, 0, 1, 0, 0); netCtx.scale(dpr, dpr); netCx = netW / 2; netCy = netH / 2;
            decorativeFibers = [];
            for(let i=0; i<120; i++) { decorativeFibers.push({ angle: Math.random() * Math.PI * 2, length: 100 + Math.random() * 250, curvature: (Math.random() - 0.5) * 1.5, speed: 0.0005 + Math.random() * 0.001, hue: Math.random() > 0.6 ? 15 : 210, alpha: 0.05 + Math.random() * 0.25 }); }
        }
        window.startNetworkCanvas = function() { if (networkAnimationId) cancelAnimationFrame(networkAnimationId); window.initNetworkCanvas(); animateNetwork(); }

        function animateNetwork() {
            netCtx.clearRect(0, 0, netW, netH);
            let coreGlow = netCtx.createRadialGradient(netCx, netCy, 5, netCx, netCy, 120); coreGlow.addColorStop(0, 'rgba(255, 42, 10, 0.15)'); coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)'); netCtx.fillStyle = coreGlow; netCtx.fillRect(netCx - 150, netCy - 150, 300, 300);
            netCtx.globalCompositeOperation = 'screen';
            decorativeFibers.forEach(fib => {
                fib.angle += fib.speed; netCtx.beginPath(); netCtx.moveTo(netCx, netCy);
                let cpX = netCx + Math.cos(fib.angle + fib.curvature) * fib.length * 0.6; let cpY = netCy + Math.sin(fib.angle + fib.curvature) * fib.length * 0.6;
                let endX = netCx + Math.cos(fib.angle) * fib.length; let endY = netCy + Math.sin(fib.angle) * fib.length;
                netCtx.quadraticCurveTo(cpX, cpY, endX, endY); netCtx.strokeStyle = `hsla(${fib.hue}, 80%, 60%, ${fib.alpha})`; netCtx.lineWidth = 0.5; netCtx.stroke();
                netCtx.beginPath(); netCtx.arc(endX, endY, 1, 0, Math.PI*2); netCtx.fillStyle = `hsla(${fib.hue}, 100%, 70%, ${fib.alpha + 0.1})`; netCtx.fill();
            });
            orbitNodesData.forEach(node => {
                node.angle += node.speed; let floatOffset = Math.sin(Date.now() / 1000 + node.angle) * 10;
                node.x = netCx + Math.cos(node.angle) * (node.radius + floatOffset); node.y = netCy + Math.sin(node.angle) * (node.radius + floatOffset * 0.5);
                node.element.style.left = `${node.x}px`; node.element.style.top = `${node.y}px`;
                netCtx.beginPath(); netCtx.moveTo(netCx, netCy); let cpX = netCx + Math.cos(node.angle - 0.5) * node.radius * 0.5; let cpY = netCy + Math.sin(node.angle - 0.5) * node.radius * 0.5;
                netCtx.quadraticCurveTo(cpX, cpY, node.x, node.y); let lineGrad = netCtx.createLinearGradient(netCx, netCy, node.x, node.y); lineGrad.addColorStop(0, 'rgba(255, 42, 10, 0.4)'); lineGrad.addColorStop(1, 'rgba(204, 122, 0, 0.05)'); netCtx.strokeStyle = lineGrad; netCtx.lineWidth = 1; netCtx.stroke();
            });
            netCtx.globalCompositeOperation = 'source-over'; networkAnimationId = requestAnimationFrame(animateNetwork);
        }
        setTimeout(() => { loadNetwork('B'); }, 100);

        // 史记时间轴
        const timelineNestedData = {
            huaxia: [
                { era: '上古神话', stories: [ { tag: '🏷️ 凿壁/考据', title: '鲧的性别考证：被篡改的母系起源', summary: '"鲧腹生禹"的隐喻背后，是一段被父权神话粗暴抹去的母系生殖崇拜。', content: '<p>鲧，作为最初掌握治水力量的部落首领，其实是一位伟大的女性...</p>' } ] },
                { era: '夏商周', stories: [ { tag: '🏷️ 图像学', title: '被篡改的伏羲女娲图', summary: '从女娲执规到男左女右，权力的转移在微小的图像篡改中悄然完成。', content: '<p>早期画像砖中，女娲执规，伏羲执矩...</p>' } ] }
            ],
            huanyu: [ { era: '古典时代', stories: [] } ],
            lingjing: [ { era: '童话解构', stories: [] } ]
        };

        function switchDimension(dimKey, btnElement) {
            document.querySelectorAll('.chron-tab').forEach(btn => btn.classList.remove('active')); btnElement.classList.add('active');
            const container = document.getElementById('timeline-scroll-area'); container.style.opacity = 0;
            setTimeout(() => {
                container.innerHTML = '';
                timelineNestedData[dimKey].forEach(node => {
                    let storiesHtml = '';
                    if (node.stories.length > 0) {
                        node.stories.forEach(data => {
                            storiesHtml += `<article class="hist-card" onclick="this.classList.toggle('expanded')"><div class="card-tags"><span class="tag">${data.tag}</span></div><h3>${data.title}</h3><div class="card-summary">${data.summary} <span class="read-more-btn">[ 点击阅览 / READ ]</span></div><div class="card-full-content"><div class="full-article">${data.content}</div></div></article>`;
                        });
                    } else { storiesHtml = `<div class="placeholder-box">[ 暂无档案记录 / AWAITING_RECORDS ]</div>`; }
                    container.innerHTML += `<div class="era-section"><div class="era-header" onclick="this.parentElement.classList.toggle('collapsed')">${node.era}</div><div class="era-content">${storiesHtml}</div></div>`;
                });
                container.style.opacity = 1; container.scrollTop = 0; targetScrollOffset = 0; scrollOffset = 0;
            }, 300);
        }
        switchDimension('huaxia', document.querySelector('.chron-tab.active'));

        // DNA Canvas (修复移动端溢出)
        const dnaCanvasObj = document.getElementById('scroll-dna-canvas'); const dnaCtx = dnaCanvasObj.getContext('2d');
        const scrollArea = document.getElementById('timeline-scroll-area'); const dnaContainer = document.getElementById('dna-sidebar-container');

        let dnaWIDTH, dnaHEIGHT, dnaCENTER_X, NUM_NODES;
        const Y_SPACING = 24;
        let HELIX_RADIUS = 70; // 变为可变量
        const TWIST_SPEED = 0.05; const BASE_ROTATION_SPEED = 0.012;

        window.resizeDnaCanvas = function() {
            const rect = dnaContainer.getBoundingClientRect(); if(rect.width === 0) return;
            dnaWIDTH = rect.width; dnaHEIGHT = rect.height; dnaCanvasObj.width = dnaWIDTH * dpr; dnaCanvasObj.height = dnaHEIGHT * dpr;
            dnaCtx.setTransform(1, 0, 0, 1, 0, 0); dnaCtx.scale(dpr, dpr); dnaCENTER_X = dnaWIDTH / 2; NUM_NODES = Math.ceil(dnaHEIGHT / Y_SPACING) + 6;

            // 动态响应屏幕尺寸，防止移动端截断
            if (dnaWIDTH < 150) {
                HELIX_RADIUS = Math.max(10, (dnaWIDTH / 2) - 15);
            } else {
                HELIX_RADIUS = 70;
            }
        }
        window.addEventListener('resize', window.resizeDnaCanvas);

        let rotationPhase = 0; let isHovered = false; let hoverTransition = 0; let targetScrollOffset = 0; let scrollOffset = 0; function lerp(start, end, t) { return start * (1 - t) + end * t; }
        dnaContainer.addEventListener('mouseenter', () => isHovered = true); dnaContainer.addEventListener('mouseleave', () => isHovered = false);
        scrollArea.addEventListener('scroll', (e) => { targetScrollOffset = scrollArea.scrollTop * 0.6; }, { passive: true });
        dnaCanvasObj.addEventListener('wheel', (e) => { e.preventDefault(); scrollArea.scrollTop += e.deltaY; }, { passive: false });

        function animateScrollDNA() {
            if (!dnaWIDTH) { requestAnimationFrame(animateScrollDNA); return; }
            dnaCtx.clearRect(0, 0, dnaWIDTH, dnaHEIGHT);
            hoverTransition += (isHovered ? 0.08 : -0.05); hoverTransition = Math.max(0, Math.min(1, hoverTransition));
            let currentSpeed = BASE_ROTATION_SPEED; if (hoverTransition > 0) { let now = Date.now() / 1000; let heartbeat = Math.pow(Math.sin(now * 6), 6); currentSpeed = BASE_ROTATION_SPEED * 1.5 + (0.04 * heartbeat * hoverTransition); }
            rotationPhase += currentSpeed; scrollOffset += (targetScrollOffset - scrollOffset) * 0.08;
            let verticalShift = ((scrollOffset % Y_SPACING) + Y_SPACING) % Y_SPACING; let nodeOffset = Math.floor(scrollOffset / Y_SPACING); let globalYOffset = Math.sin(Date.now() / 1500) * 10;
            let renderQueue = [];
            for (let i = -5; i < (NUM_NODES || 40) + 5; i++) {
                let y = i * Y_SPACING + globalYOffset - verticalShift; let effectiveIndex = i + nodeOffset; let angle = effectiveIndex * TWIST_SPEED * Math.PI * 2 + rotationPhase;
                let zA = Math.sin(angle); let xA = dnaCENTER_X + Math.cos(angle) * HELIX_RADIUS; let zB = Math.sin(angle + Math.PI); let xB = dnaCENTER_X + Math.cos(angle + Math.PI) * HELIX_RADIUS;
                renderQueue.push({ type: 'link', x1: xA, y1: y, x2: xB, y2: y, z: (zA + zB) / 2 }); renderQueue.push({ type: 'node', x: xA, y: y, z: zA }); renderQueue.push({ type: 'node', x: xB, y: y, z: zB });
            }
            renderQueue.sort((a, b) => a.z - b.z);
            for (let item of renderQueue) {
                let depthNorm = (item.z + 1) / 2;
                if (item.type === 'link') {
                    dnaCtx.beginPath(); dnaCtx.moveTo(item.x1, item.y1); dnaCtx.lineTo(item.x2, item.y2);
                    let lineAlpha = 0.05 + 0.15 * depthNorm + (0.2 * hoverTransition); let r = lerp(139, 204, hoverTransition); let g = lerp(90, 122, hoverTransition); let b = lerp(43, 0, hoverTransition);
                    dnaCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineAlpha})`; dnaCtx.lineWidth = 1.5 + (1.5 * hoverTransition); dnaCtx.stroke();
                } else if (item.type === 'node') {
                    let baseR = lerp(122, 204, depthNorm); let baseG = lerp(46, 78, depthNorm); let baseB = lerp(34, 60, depthNorm);
                    let finalR = lerp(baseR, 204, hoverTransition); let finalG = lerp(baseG, 122, hoverTransition); let finalB = lerp(baseB, 0, hoverTransition);
                    dnaCtx.fillStyle = `rgb(${finalR}, ${finalG}, ${finalB})`;
                    let baseBlur = 2 + (5 * depthNorm); let hoverBlur = 10 + (15 * depthNorm); dnaCtx.shadowBlur = lerp(baseBlur, hoverBlur, hoverTransition);
                    let shadowR = lerp(204, 255, hoverTransition); let shadowG = lerp(78, 170, hoverTransition); let shadowB = lerp(60, 0, hoverTransition); dnaCtx.shadowColor = `rgba(${shadowR}, ${shadowG}, ${shadowB}, ${0.8 + 0.2*depthNorm})`;
                    let fontSize = 14 + (8 * depthNorm); fontSize += 2 * hoverTransition; dnaCtx.font = `900 ${fontSize}px "Noto Serif SC", serif`; dnaCtx.textAlign = 'center'; dnaCtx.textBaseline = 'middle'; dnaCtx.fillText('女', item.x, item.y); dnaCtx.shadowBlur = 0;
                }
            }
            requestAnimationFrame(animateScrollDNA);
        }
        animateScrollDNA();

        /* -------------------------------------------
           5. 女娲的泥潭 交互逻辑
        ------------------------------------------- */
        let currentActiveCard = null; // 记录当前打开的帖子，用于内外状态同步

        function switchMireTab(tabId, element) {
            document.querySelectorAll('.mire-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('#page-mire .tab-content').forEach(c => c.classList.remove('active'));
            element.classList.add('active'); document.getElementById(tabId).classList.add('active');
        }

        // 点赞/投票的动态反馈与内外双向同步系统
        function toggleActionBtn(btn, type, isFromModal = false) {
            btn.classList.toggle('active');
            let span = btn.querySelector('span');
            if(!span) return;

            let txt = span.innerText;
            let isK = txt.includes('k');
            let num = parseFloat(txt.replace('k', ''));

            if (btn.classList.contains('active')) {
                // 变红发光并加票数
                showSysToast('>> 协议确认：你的意志已刻录至分布式区块。');
                if (!isNaN(num)) span.innerText = (num + (isK ? 0.1 : 1)).toFixed(isK ? 1 : 0) + (isK ? 'k' : '');
            } else {
                // 取消投票
                if (!isNaN(num)) span.innerText = (num - (isK ? 0.1 : 1)).toFixed(isK ? 1 : 0) + (isK ? 'k' : '');
            }

            // 【核心】如果是在弹窗内操作的，立即将状态和数值同步给外面对应的原卡片
            if (isFromModal && currentActiveCard) {
                let outerBtn = currentActiveCard.querySelector(`.action-btn.${type}`);
                if (outerBtn) {
                    if (btn.classList.contains('active')) {
                        outerBtn.classList.add('active');
                    } else {
                        outerBtn.classList.remove('active');
                    }
                    let outerSpan = outerBtn.querySelector('span');
                    if (outerSpan) outerSpan.innerText = span.innerText; // 覆盖数值
                }
            }
        }

        function toggleCardAction(event, btn, type) {
            event.stopPropagation(); // 阻止卡片触发弹窗
            toggleActionBtn(btn, type, false);
        }

        function openPostModal(cardElement) {
            currentActiveCard = cardElement; // 记录引用
            const modal = document.getElementById('post-modal');
            const contentArea = document.getElementById('modal-content-area');
            const interactionArea = document.getElementById('modal-interaction-area');
            const postType = cardElement.getAttribute('data-type');

            contentArea.innerHTML = '';
            Array.from(cardElement.children).forEach(child => {
                if (!child.classList.contains('card-actions')) {
                    contentArea.appendChild(child.cloneNode(true));
                }
            });

            // 完美继承外层卡片的数字数据与高亮状态
            let voteSpan = cardElement.querySelector('.action-btn.vote span');
            let likeSpan = cardElement.querySelector('.action-btn.like span');
            let commentSpan = cardElement.querySelector('.action-btn.comment span');

            let voteCount = voteSpan ? voteSpan.innerText : '';
            let likeCount = likeSpan ? likeSpan.innerText : '';
            let commentCount = commentSpan ? commentSpan.innerText : '';

            let isVoteActive = cardElement.querySelector('.action-btn.vote')?.classList.contains('active') ? 'active' : '';
            let isLikeActive = cardElement.querySelector('.action-btn.like')?.classList.contains('active') ? 'active' : '';

            let interactionHTML = '<div class="action-group">';
            if (postType === 'glyph' || postType === 'parchment') {
                let voteText = postType === 'glyph' ? '▵ 投票' : '▵ 收录';
                // 绑定 isFromModal = true 标识
                interactionHTML += `<button class="action-btn vote ${isVoteActive}" onclick="toggleActionBtn(this, 'vote', true)">${voteText} <span>${voteCount}</span></button>`;
            }
            interactionHTML += `<button class="action-btn like ${isLikeActive}" onclick="toggleActionBtn(this, 'like', true)">❤ 共鸣 <span>${likeCount}</span></button></div>`;
            interactionHTML += `<button class="action-btn comment">💬 响应 <span>${commentCount}</span></button>`;

            interactionArea.innerHTML = interactionHTML;

            modal.classList.add('active');
        }

        function closePostModal(event) {
            if (event) event.stopPropagation();
            document.getElementById('post-modal').classList.remove('active');
        }
