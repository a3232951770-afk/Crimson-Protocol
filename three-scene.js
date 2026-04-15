import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const container = document.getElementById('three-canvas-container');
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x040406); scene.fog = new THREE.FogExp2(0x040406, 0.001);
const bgTexture = new THREE.TextureLoader().load('https://i.postimg.cc/7L7pSxNc/zi-gong-xing-yun-xu-hua-ban.jpg'); bgTexture.colorSpace = THREE.SRGBColorSpace;
const bgSpheres = [];
for (let i = 0; i < 3; i++) {
    const bgMat = new THREE.MeshBasicMaterial({ map: bgTexture, transparent: true, opacity: 0, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 32), bgMat); scene.add(mesh); bgSpheres.push({ mesh: mesh, phase: i / 3.0 });
}
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 3000); camera.position.set(0, 80, 450);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(window.innerWidth, window.innerHeight); container.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.04; controls.autoRotate = true; controls.autoRotateSpeed = 0.5; controls.maxDistance = 800;
const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.8, 0.15)); composer.addPass(new OutputPass());

function createSoftParticleTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128; const ctx = canvas.getContext('2d'); const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)'); gradient.addColorStop(0.1, 'rgba(255,255,255,0.8)'); gradient.addColorStop(0.4, 'rgba(255,255,255,0.2)'); gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(canvas);
}
const particleTexture = createSoftParticleTexture();
const TOTAL_STARS = 400; const starsData = []; const starGroup = new THREE.Group(); scene.add(starGroup);
const motherPos = new THREE.Vector3(0, 0, 0); starsData.push({ id: 0, type: 'mother', nebulaType: 0, pos: motherPos, color: 0xd91a3c, text: '女', active: true });
const allDictWords = ['妒','嫉','奸','婪','妄','嫌','妖','娼','妓','嫖','奴','妾','奻','姘','媚','婢','婚','妻','妇','嫁','姓','姬','姜','妫','好','妙','媛','婵','嫣','姐','妥','委','媒','媳','娶','姻','姑','妈','娘','妍','娇','妩','妹'];

for (let i = 1; i < TOTAL_STARS; i++) {
    const isAmber = Math.random() < 0.25; const type = isAmber ? 'amber' : 'ash'; const color = isAmber ? 0xffaa00 : 0x88bbff; const nebulaType = Math.random() > 0.5 ? 1 : 2;
    const u = Math.random(); const v = Math.random(); const theta = u * 2.0 * Math.PI; const phi = Math.acos(2.0 * v - 1.0); const radius = 80 + Math.pow(Math.random(), 1.5) * 270;
    const x = radius * Math.sin(phi) * Math.cos(theta); const y = radius * Math.sin(phi) * Math.sin(theta) * 0.6; const z = radius * Math.cos(phi);
    const text = allDictWords[(i - 1) % allDictWords.length];
    starsData.push({ id: i, type: type, nebulaType: nebulaType, pos: new THREE.Vector3(x, y, z), color: color, text: text, baseY: y, randomOffset: Math.random() * Math.PI * 2 });
}

const geometry = new THREE.BufferGeometry(); const positions = new Float32Array(TOTAL_STARS * 3); const colors = new Float32Array(TOTAL_STARS * 3); const sizes = new Float32Array(TOTAL_STARS);
starsData.forEach((star, i) => { positions[i*3] = star.pos.x; positions[i*3+1] = star.pos.y; positions[i*3+2] = star.pos.z; const c = new THREE.Color(star.color); colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b; sizes[i] = star.type === 'mother' ? 80 : (star.type === 'amber' ? 45 : 30); });
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
const starMaterial = new THREE.ShaderMaterial({ uniforms: { time: { value: 0 }, textureMap: { value: particleTexture } }, vertexShader: `attribute float size; varying vec3 vColor; void main() { vColor = color; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * (400.0 / -mvPosition.z); gl_Position = projectionMatrix * mvPosition; }`, fragmentShader: `varying vec3 vColor; uniform sampler2D textureMap; uniform float time; void main() { float alpha = 0.45 + sin(time * 2.0 + vColor.r * 100.0) * 0.25; gl_FragColor = vec4(vColor, alpha) * texture2D(textureMap, gl_PointCoord); }`, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, vertexColors: true });
const starPoints = new THREE.Points(geometry, starMaterial); starGroup.add(starPoints);

const lineSegmentsGeo = new THREE.BufferGeometry(); const linePosArray = []; const lineColArray = []; const motherColor = new THREE.Color(0xd91a3c);
starsData.forEach(star => {
    if (star.id === 0) return;
    const midX = (motherPos.x + star.pos.x) * 0.5 + (Math.random() - 0.5) * 30; const midY = (motherPos.y + star.pos.y) * 0.5 - 60 - Math.random() * 40; const midZ = (motherPos.z + star.pos.z) * 0.5 + (Math.random() - 0.5) * 30;
    const curve = new THREE.QuadraticBezierCurve3(motherPos, new THREE.Vector3(midX, midY, midZ), star.pos); const points = curve.getPoints(15); const targetColor = new THREE.Color(star.color);
    for(let i = 0; i < points.length - 1; i++) { linePosArray.push(points[i].x, points[i].y, points[i].z); linePosArray.push(points[i+1].x, points[i+1].y, points[i+1].z); const c1 = motherColor.clone().lerp(targetColor, i / 15); const c2 = motherColor.clone().lerp(targetColor, (i+1) / 15); lineColArray.push(c1.r, c1.g, c1.b); lineColArray.push(c2.r, c2.g, c2.b); }
});
lineSegmentsGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePosArray, 3)); lineSegmentsGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColArray, 3));
scene.add(new THREE.LineSegments(lineSegmentsGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false })));

const raycaster = new THREE.Raycaster(); raycaster.params.Points.threshold = 15; const mouse = new THREE.Vector2(); let hoveredStarId = null; let activeExplosion = null; let interactionsEnabled = false;

window.addEventListener('mousemove', (event) => {
    if (!interactionsEnabled || document.getElementById('page-mother-star').classList.contains('active') === false) return;
    if(event.buttons > 0) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1; mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera); const intersects = raycaster.intersectObject(starPoints);
    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer'; controls.autoRotate = false; const id = intersects[0].index;
        if (hoveredStarId !== id) { hoveredStarId = id; triggerFluidExplosion(starsData[id]); }
    } else { document.body.style.cursor = 'crosshair'; controls.autoRotate = true; if (hoveredStarId !== null) { hoveredStarId = null; clearExplosion(); showAllStars(); } }
});

window.addEventListener('click', (event) => {
    if (!interactionsEnabled || document.getElementById('page-mother-star').classList.contains('active') === false) return;
    if (event.target.classList.contains('close-btn')) { document.getElementById('detail-card').classList.remove('active'); controls.autoRotate = true; return; }
    if (event.target.closest('#detail-card')) return;
    if (hoveredStarId !== null) openCard(starsData[hoveredStarId]);
});

function triggerFluidExplosion(star) {
    clearExplosion(); hideStar(star.id); showGlitchText(star);
    const particleCount = star.type === 'mother' ? 45000 : 30000;
    const geo = new THREE.BufferGeometry(); const posArray = new Float32Array(particleCount * 3); const targetArray = new Float32Array(particleCount * 3); const velArray = []; const colorArray = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++) {
        let tx, ty, tz; let mixedColor;
        if (star.nebulaType === 0) {
            const rand = Math.random(); const scale = 2.4;
            if (rand < 0.45) { const u = Math.random() * Math.PI * 2; const h = (Math.random() - 0.5) * 30; const r = Math.sqrt(Math.random()) * Math.max(2, 15 + h * 0.6); tx = star.pos.x + r * Math.cos(u) * scale; ty = star.pos.y + h * scale; tz = star.pos.z + r * Math.sin(u) * 0.6 * scale; mixedColor = new THREE.Color(0xff69b4).lerp(new THREE.Color(0xb3001b), Math.random()); }
            else if (rand < 0.60) { const h = -15 - Math.random() * 25; const r = Math.sqrt(Math.random()) * Math.max(1, 4 + Math.abs(h + 15) * 0.2); const u = Math.random() * Math.PI * 2; tx = star.pos.x + r * Math.cos(u) * scale; ty = star.pos.y + h * scale; tz = star.pos.z + r * Math.sin(u) * 0.6 * scale; mixedColor = new THREE.Color(0xb3001b).lerp(new THREE.Color(0x330000), Math.random()); }
            else if (rand < 0.85) { const side = Math.random() > 0.5 ? 1 : -1; const t = Math.random(); const angle = Math.random() * Math.PI * 2; const thickness = (1.5 + (1-t) * 2.0) * Math.random(); tx = star.pos.x + ((15 + t * 35) * side + Math.cos(angle) * thickness) * scale; ty = star.pos.y + (10 + Math.sin(t * Math.PI) * 12 - t * 15) * scale + Math.sin(angle) * thickness; tz = star.pos.z + (Math.random() - 0.5) * 8 * scale; mixedColor = new THREE.Color(0xff69b4).lerp(new THREE.Color(0xffaa00), t); }
            else { const side = Math.random() > 0.5 ? 1 : -1; const u = Math.random() * Math.PI * 2; const v = Math.acos(2 * Math.random() - 1); const r = Math.pow(Math.random(), 0.5) * 8; tx = star.pos.x + (50 * side + r * Math.cos(u) * Math.sin(v)) * scale; ty = star.pos.y + (-5 + r * Math.cos(v)) * scale; tz = star.pos.z + (r * Math.sin(u) * Math.sin(v)) * scale; mixedColor = new THREE.Color(0xffea00).lerp(new THREE.Color(0xffaa00), Math.random()); }
        } else if (star.nebulaType === 1) {
            const zoneRand = Math.random(); let radius, yFlatten;
            if (zoneRand < 0.10) { radius = Math.pow(Math.random(), 3) * 8; yFlatten = 0.9; mixedColor = new THREE.Color(0xffffff).lerp(new THREE.Color(0xffea00), Math.random()); }
            else if (zoneRand < 0.40) { radius = 12 + Math.pow(Math.random(), 0.5) * 13; yFlatten = 0.6; mixedColor = new THREE.Color(0x00ffff).lerp(new THREE.Color(0x0055ff), Math.random()); }
            else { radius = 25 + Math.pow(Math.random(), 0.5) * 25; yFlatten = 0.4; mixedColor = new THREE.Color(0xaa0011).lerp(new THREE.Color(0x550000), Math.random()); if (Math.random() > 0.85) mixedColor.lerp(new THREE.Color(0x0055ff), 0.5); }
            const u = Math.random() * Math.PI * 2; const v = Math.acos(2 * Math.random() - 1); tx = star.pos.x + radius * Math.sin(v) * Math.cos(u) + (Math.random() - 0.5) * 5; ty = star.pos.y + radius * Math.cos(v) * yFlatten + (Math.random() - 0.5) * 8; tz = star.pos.z + radius * Math.sin(v) * Math.sin(u) + (Math.random() - 0.5) * 5;
        } else {
            const rand = Math.random(); const scale = 1.6;
            if (rand < 0.1) { const t = Math.random(); const r = Math.random() * 4 * scale; const u = Math.random() * Math.PI * 2; tx = star.pos.x + r * Math.cos(u); tz = star.pos.z + r * Math.sin(u); ty = star.pos.y - t * 40 * scale; mixedColor = new THREE.Color(0x0b2211).lerp(new THREE.Color(0x228b22), 1-t); }
            else if (rand < 0.25) { const t = Math.random(); const r = t * 6 * scale; const u = Math.random() * Math.PI * 2; tx = star.pos.x + r * Math.cos(u) + (Math.random() - 0.5) * 4; tz = star.pos.z + r * Math.sin(u) + (Math.random() - 0.5) * 4; ty = star.pos.y + t * 25 * scale; mixedColor = new THREE.Color(0xffffff).lerp(new THREE.Color(0xffea00), t); }
            else { const t = Math.pow(Math.random(), 0.7); const spread = (Math.random() - 0.5) * 0.8 * (t + 0.2); const angle = (Math.PI * 2 / 6) * Math.floor(Math.random() * 6) + spread; tx = star.pos.x + (t * 45 * scale) * Math.cos(angle); tz = star.pos.z + (t * 45 * scale) * Math.sin(angle); ty = star.pos.y + Math.sin(t * Math.PI) * 20 * scale - Math.pow(t, 3) * 15 * scale; mixedColor = new THREE.Color(0x1e90ff).lerp(new THREE.Color(0xff69b4), t); if (Math.abs(spread) > 0.3) mixedColor.lerp(new THREE.Color(0xffffff), 0.3); }
        }
        targetArray[i*3] = tx; targetArray[i*3+1] = ty; targetArray[i*3+2] = tz; posArray[i*3] = star.pos.x; posArray[i*3+1] = star.pos.y; posArray[i*3+2] = star.pos.z;
        const speed = 0.05 + Math.random() * 0.05; velArray.push(new THREE.Vector3((tx - star.pos.x) * speed, (ty - star.pos.y) * speed, (tz - star.pos.z) * speed));
        if (Math.random() > 0.99) mixedColor.setHex(0xffffff); colorArray[i*3] = mixedColor.r; colorArray[i*3+1] = mixedColor.g; colorArray[i*3+2] = mixedColor.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3)); geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3)); geo.setAttribute('targetPos', new THREE.BufferAttribute(targetArray, 3));
    const mat = new THREE.PointsMaterial({ size: star.type === 'mother' ? 3.0 : 2.0, vertexColors: true, map: particleTexture, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.75, depthWrite: false });
    activeExplosion = { system: new THREE.Points(geo, mat), velocities: velArray, life: 1.0, isMother: star.type === 'mother' }; scene.add(activeExplosion.system);
}

function clearExplosion() { if (activeExplosion) { scene.remove(activeExplosion.system); activeExplosion.system.geometry.dispose(); activeExplosion.system.material.dispose(); activeExplosion = null; } document.getElementById('glitch-text-container').style.opacity = '0'; }
function showGlitchText(star) { const gt = document.getElementById('glitch-text-container'); gt.innerText = star.text; if (star.type === 'mother') { gt.style.fontSize = '3.5rem'; gt.style.textShadow = '0 0 30px rgba(217, 26, 60, 1), 0 0 10px rgba(255, 170, 0, 0.8)'; gt.style.opacity = '0.85'; } else { gt.style.fontSize = '1.4rem'; gt.style.textShadow = '0 0 20px rgba(0, 212, 255, 0.6), 0 0 8px rgba(155, 77, 255, 0.6)'; gt.style.opacity = '0.6'; } const vector = star.pos.clone().project(camera); gt.style.left = `${(vector.x * .5 + .5) * window.innerWidth}px`; gt.style.top = `${(vector.y * -.5 + .5) * window.innerHeight}px`; }
function hideStar(id) { const sizes = starPoints.geometry.attributes.size.array; sizes[id] = 0; starPoints.geometry.attributes.size.needsUpdate = true; }
function showAllStars() { const sizes = starPoints.geometry.attributes.size.array; starsData.forEach((s, i) => { sizes[i] = s.type === 'mother' ? 50 : (s.type === 'amber' ? 15 : 10); }); starPoints.geometry.attributes.size.needsUpdate = true; }

function openCard(star) {
    if (window._blockThreeJsClick) return;
    const card = document.getElementById('detail-card');
    const titleEl = document.getElementById('card-title');
    const typeEl = document.getElementById('card-type');
    const desc = document.getElementById('card-desc');
    titleEl.innerText = star.text; desc.classList.remove('revealed');
    const cd = window.CHARACTER_DATA_CACHE?.[star.text];
    const isEn = window._lang === 'en';
    const en = window.CHAR_EN?.[star.text];
    if(star.type === 'mother') {
        titleEl.style.color = 'var(--neon-red)';
        typeEl.innerText = isEn ? 'Mother Star · Root Protocol' : '母神星 · 根级协议';
        desc.innerText = isEn ? "女 (woman). Pictographic. Used as the root radical for derogatory and subordinate terms in patriarchal dictionaries. Root-level protocol overwrite in progress." : "女，妇人也。象形。父权字典中常作为附属、柔弱或贬义词汇的词根。正在进行根级协议覆写。";
    } else if (cd) {
        const CL = isEn ? {stigma:'Derogatory',institution:'Institutional',matrilineal:'Matrilineal',reclaim:'Reclaimed',neutral:'Neutral'} : {stigma:'贬义字',institution:'制度字',matrilineal:'母系遗存',reclaim:'褒义字',neutral:'中性字'};
        const CC = {stigma:'#ff6b6b',institution:'var(--terracotta)',matrilineal:'var(--amber)',reclaim:'#5a9e6f',neutral:'var(--bone)'};
        titleEl.style.color = CC[cd.category]||'var(--terracotta)';
        typeEl.innerText = `${CL[cd.category]||''} · ${isEn?'Pollution':'污染等级'} ${cd.pollutionLevel}/5`;
        const sw = (isEn && en) ? en.s : (cd.shuowen||'');
        const md = (isEn && en) ? en.m : (cd.modern||'');
        desc.innerText = `${sw}\n${md}`;
    } else {
        titleEl.style.color = star.type==='amber'?'var(--amber)':'var(--terracotta)';
        typeEl.innerText = isEn ? 'Legacy Definition' : '旧世字典释义';
        desc.innerText = isEn ? `${star.text}, from 女. A language anchor in the star map.` : `${star.text}，从女。语言星图中的锚点。`;
    }
    card.classList.add('active'); clearExplosion(); controls.autoRotate = false;
}

window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight); });

const clock = new THREE.Clock(); let animationRunning = false;
function animate() {
    if(!animationRunning) return;
    requestAnimationFrame(animate); const delta = Math.min(clock.getDelta(), 0.1); const time = clock.getElapsedTime();
    controls.update(); starMaterial.uniforms.time.value = time;
    bgSpheres.forEach(bg => { bg.phase += delta * 0.035; if (bg.phase > 1.0) bg.phase -= 1.0; bg.mesh.scale.setScalar(1.0 + bg.phase * 2.0); const maxOpacity = 0.35; let op = 0; if (bg.phase < 0.2) op = (bg.phase / 0.2) * maxOpacity; else if (bg.phase < 0.8) op = maxOpacity; else op = ((1.0 - bg.phase) / 0.2) * maxOpacity; bg.mesh.material.opacity = op; bg.mesh.rotation.y += delta * 0.01; bg.mesh.rotation.x += delta * 0.005; });
    const posAttr = starPoints.geometry.attributes.position; starsData.forEach((star, i) => { if (star.type === 'amber' || star.type === 'ash') { posAttr.array[i*3+1] = star.baseY + Math.sin(time * 1.5 + star.randomOffset) * 6; } }); posAttr.needsUpdate = true;
    if (activeExplosion) { const positions = activeExplosion.system.geometry.attributes.position.array; const targets = activeExplosion.system.geometry.attributes.targetPos.array; const vels = activeExplosion.velocities; const speedFactor = delta * 60; const damping = 0.88; for(let i=0; i<vels.length; i++) { const idx = i * 3; let dx = targets[idx] - positions[idx]; let dy = targets[idx+1] - positions[idx+1]; let dz = targets[idx+2] - positions[idx+2]; vels[i].x += dx * 0.005 * speedFactor; vels[i].y += dy * 0.005 * speedFactor; vels[i].z += dz * 0.005 * speedFactor; vels[i].x += -dz * 0.01 * speedFactor; vels[i].z += dx * 0.01 * speedFactor; vels[i].multiplyScalar(damping); positions[idx] += vels[i].x * speedFactor; positions[idx+1] += vels[i].y * speedFactor; positions[idx+2] += vels[i].z * speedFactor; } activeExplosion.system.geometry.attributes.position.needsUpdate = true; activeExplosion.system.rotation.y += 0.2 * delta; activeExplosion.life -= 0.25 * delta; activeExplosion.system.material.opacity = 0.45 * Math.pow(Math.max(0, activeExplosion.life), 1.2); if(activeExplosion.life <= 0) { clearExplosion(); if(!document.getElementById('detail-card').classList.contains('active')) { showAllStars(); } } }
    composer.render();
}

window.resumeThreeJS = function() { if (animationRunning) return; clock.start(); animationRunning = true; animate(); setTimeout(() => { interactionsEnabled = true; }, 2000); };
window.pauseThreeJS = function() { animationRunning = false; interactionsEnabled = false; };
