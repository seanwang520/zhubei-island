// 竹北政策島 — 3D 場景模組（Three.js 0.160）
// 介面見 CONTRACT.md：createScene(container, themes, { onSelectTheme })
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/* ------------------------------------------------------------------ */
/* 版面：抽象化的竹北。x 向東、z 向南。西邊 x<-14 是台灣海峽，         */
/* 北側 z≈-16 是鳳山溪、南側 z≈16 是頭前溪，東邊接丘陵。               */
/* ------------------------------------------------------------------ */
const LAYOUT = {
  resilience: { x: -8, z: -7, r: 4.1 },  // 沿海防災
  market: { x: 1, z: -9, r: 4.0 },
  youth: { x: 10, z: -9, r: 3.9 },
  digital: { x: 19, z: -6, r: 4.0 },     // 東側科技區
  space: { x: -6, z: 2, r: 4.0 },        // 濱海公園
  care: { x: 3, z: 0, r: 4.2 },          // 舊城住宅
  service: { x: 12, z: 0.5, r: 3.9 },
  traffic: { x: 21, z: 3.5, r: 4.4 },    // 高鐵站一帶
  culture: { x: -1, z: 10, r: 4.0 },
  edu: { x: 8.5, z: 9.5, r: 4.1 },
};
const HOME_TARGET = new THREE.Vector3(2, 0, 1.5);
const HOME_AZIMUTH = -0.55; // 從西南方望向東北
const HOME_POLAR = 0.92;
const HOME_DIST = 82;
const FOCUS_DIST = 30;
const TOP = 0.32; // 島面高度（島嶼本地座標）

/* ----------------------------- 光線預設 ----------------------------- */
const PRESETS = {
  dawn: {
    skyTop: "#9db6e2", skyBottom: "#fcd5bc", fog: "#f3d4c3",
    sun: "#ffc79e", sunI: 1.7, sunPos: [55, 16, 12],
    hemiSky: "#ffe2cf", hemiGround: "#8f9a7c", hemiI: 1.0,
    water: "#8cc4c8", land: "#efe2c6", glow: 0.35, stars: 0.12, waterE: 0.15,
  },
  day: {
    skyTop: "#86cbe6", skyBottom: "#eef7f2", fog: "#e4f1ec",
    sun: "#fff3df", sunI: 2.4, sunPos: [26, 42, 22],
    hemiSky: "#ffffff", hemiGround: "#b7ae95", hemiI: 1.15,
    water: "#9fdad5", land: "#f3e8cf", glow: 0, stars: 0, waterE: 0,
  },
  dusk: {
    skyTop: "#6a6ea9", skyBottom: "#f7a97f", fog: "#e8ab8e",
    sun: "#ffb27a", sunI: 1.9, sunPos: [-45, 22, 10],
    hemiSky: "#ffe3d0", hemiGround: "#8a7a86", hemiI: 1.25,
    water: "#86bccf", land: "#ecd6bb", glow: 0.65, stars: 0.25, waterE: 0.35,
  },
  night: {
    skyTop: "#0b1430", skyBottom: "#2b3b68", fog: "#1e2b4f",
    sun: "#a3b6ff", sunI: 0.55, sunPos: [-22, 40, -22],
    hemiSky: "#5b70aa", hemiGround: "#1a1f2e", hemiI: 0.55,
    water: "#2a4d6e", land: "#c9c3b4", glow: 1, stars: 1, waterE: 0.15,
  },
};

/* ----------------------------- 樣式注入 ----------------------------- */
const STYLE_ID = "zhubei-scene-style";
const STYLE = `
.zb-scene-labels{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.island-label{pointer-events:auto;cursor:pointer;user-select:none;white-space:nowrap;
  display:inline-flex;align-items:center;gap:6px;padding:6px 13px 6px 11px;border-radius:999px;
  background:rgba(255,255,255,.96);color:#3b3a36;font:600 13px/1.1 "Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif;
  letter-spacing:.02em;box-shadow:0 2px 0 rgba(60,50,30,.08),0 6px 16px rgba(40,40,60,.16);
  transition:transform .18s ease,box-shadow .18s ease,opacity .25s ease;transform-origin:50% 100%}
.island-label b{font-weight:800;font-variant-numeric:tabular-nums;font-size:13px}
.island-label::after{content:"";position:absolute;left:50%;bottom:-5px;width:8px;height:8px;margin-left:-4px;
  background:inherit;transform:rotate(45deg);border-radius:0 0 2px 0;box-shadow:2px 2px 3px rgba(40,40,60,.08)}
.island-label:hover,.island-label.is-hover{transform:translateY(-3px) scale(1.06);box-shadow:0 10px 22px rgba(40,40,60,.22)}
.island-label.is-active{transform:translateY(-4px) scale(1.1);box-shadow:0 0 0 2px var(--zb-color,#333),0 10px 24px rgba(40,40,60,.25)}
.island-label.is-dim{opacity:.55}
.zb-geo-label{pointer-events:none;font:500 12px/1 "Noto Sans TC","PingFang TC",system-ui,sans-serif;letter-spacing:.35em;
  color:rgba(40,70,90,.55);text-shadow:0 1px 0 rgba(255,255,255,.5)}
.zb-night .zb-geo-label{color:rgba(210,225,255,.5);text-shadow:none}
.zb-carrier-tag{pointer-events:auto;cursor:pointer;user-select:none;white-space:nowrap;padding:3px 8px;border-radius:999px;
  background:rgba(42,33,28,.84);color:#fff;font:600 11px/1.2 "JetBrains Mono","Noto Sans TC",system-ui,sans-serif;
  box-shadow:0 3px 8px rgba(0,0,0,.18);transition:transform .15s ease,background .15s ease}
.zb-carrier-tag:hover{transform:translateY(-2px)}
.zb-carrier-tag.is-active{background:#d9673f;transform:scale(1.12)}
`;

/* ----------------------------- 人物造型 ----------------------------- */
// 參考 HEART 政策島的角色系統：髮型、臉部配件、衣著、帽子、手持物、同行物可自由組合。
// hair: short | long | bob | side | curly | bun | ponytail | threebuns | bald（省略則隨機）
// outfit: plain | vest | reflective | cardigan | labcoat | apron
// hat: yellowcap | hardhat | helmet | ranger | straw | beanie | driver
// hand: coffee | basket | cane | rake | tablet | flag | book | tube | wrench | torch | balloon | flower
const SKINS = ["#f6d7bf", "#efc6a2", "#e0ac84", "#c68b62", "#9c6a48"];
const HAIRS = ["#2b2220", "#4a3428", "#6b4a32", "#1f1f24", "#8a6a4a"];
const SHIRTS = ["#d9774b", "#4f9da6", "#e1b54a", "#8b6fb0", "#5a8f5a", "#e57d6a", "#7d9be0"];
const ROLES = {
  市民: { outfit: "plain" },
  長者志工: { hair: "short", hairColor: "#d9d6d0", outfit: "cardigan", outfitColor: "#b98a6a", shirt: "#f1e6d4", pants: "#6b6258", hat: "beanie", hatColor: "#c96f5a", hand: "cane", height: 0.92 },
  照服員: { hair: "bun", outfit: "plain", shirt: "#8fc7c0", pants: "#4d6d74", face: "mask", hand: "basket" },
  公園管理員: { hair: "short", outfit: "vest", outfitColor: "#6f9a52", shirt: "#e9e2cf", pants: "#5b5340", hat: "ranger", hand: "rake" },
  公務員: { hair: "side", outfit: "vest", outfitColor: "#3d5a80", shirt: "#f4f1ea", pants: "#3b4252", face: "glasses", hand: "tablet" },
  里長: { hair: "side", hairColor: "#6b6258", outfit: "vest", outfitColor: "#c4553a", shirt: "#f4f1ea", pants: "#3b4252", hand: "flag", flagColor: "#e1b54a" },
  家長: { hair: "ponytail", outfit: "plain", shirt: "#e57d6a", pants: "#2f3e55", companion: "stroller" },
  幼教老師: { hair: "bob", outfit: "apron", outfitColor: "#f2c230", shirt: "#f7efe1", pants: "#5a6f8a", hand: "balloon", balloonColor: "#e57d6a" },
  學童: { hair: "short", outfit: "plain", shirt: "#f7f7f4", pants: "#2f3e55", hat: "yellowcap", height: 0.72, width: 0.9 },
  公車司機: { hair: "short", outfit: "plain", shirt: "#bcd8ea", pants: "#2b3446", hat: "driver" },
  通勤族: { hair: "side", outfit: "plain", shirt: "#f4f1ea", pants: "#5d6470", hand: "coffee" },
  交通志工: { hair: "short", outfit: "reflective", outfitColor: "#c9e04a", shirt: "#f4f1ea", pants: "#3b4252", hat: "yellowcap", hand: "flag", flagColor: "#e8713c" },
  攤商: { hair: "curly", outfit: "apron", outfitColor: "#c4553a", shirt: "#f4e3c8", pants: "#4a4038", hand: "basket" },
  小農: { hair: "short", outfit: "plain", shirt: "#7da3c4", pants: "#5b5340", hat: "straw", hand: "basket", width: 1.05 },
  導覽員: { hair: "bun", outfit: "plain", shirt: "#3f4f7a", pants: "#2b3446", hand: "flag", flagColor: "#d9673f" },
  電工: { hair: "short", outfit: "reflective", outfitColor: "#f08a3c", shirt: "#5d7ea0", pants: "#3b4252", hat: "hardhat", hand: "wrench" },
  防災士: { hair: "short", outfit: "reflective", outfitColor: "#f08a3c", shirt: "#f4f1ea", pants: "#2f3e55", hat: "helmet", hand: "torch" },
  研究員: { hair: "bob", outfit: "labcoat", shirt: "#9fb3c2", pants: "#3b4252", face: "glasses", hand: "tube" },
  工程師: { hair: "curly", outfit: "plain", shirt: "#3a4660", pants: "#2b3446", face: "glasses", hand: "tablet" },
  圖書館員: { hair: "bob", outfit: "cardigan", outfitColor: "#6f9a52", shirt: "#f1e6d4", pants: "#5b5340", face: "glasses", hand: "book", bookColor: "#c48b9f" },
  青年創業者: { hair: "curly", outfit: "plain", shirt: "#ef9a8a", pants: "#3b4252", face: "sunglasses", hand: "coffee" },
  青年店長: { hair: "threebuns", outfit: "apron", outfitColor: "#3f6b4f", shirt: "#f7f7f4", pants: "#4a4038", hand: "flower" },
};
// 島上居民依島嶼主題換上對應的身分
const ISLAND_ROLES = {
  care: ["長者志工", "照服員", "家長", "市民"],
  service: ["公務員", "里長", "市民"],
  edu: ["學童", "幼教老師", "學童", "家長"],
  traffic: ["通勤族", "公車司機", "交通志工"],
  resilience: ["防災士", "電工"],
  digital: ["工程師", "研究員"],
  space: ["長者志工", "公園管理員", "家長", "市民"],
  market: ["攤商", "小農", "市民"],
  culture: ["圖書館員", "學童", "導覽員", "市民"],
  youth: ["青年創業者", "青年店長", "市民"],
};

/* ------------------------------ 工具 ------------------------------- */
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function createScene(container, themes = [], { onSelectTheme, onSelectTask, tasks = [] } = {}) {
  /* ---------- 基本設定 ---------- */
  if (!document.getElementById(STYLE_ID)) {
    const st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent = STYLE;
    document.head.appendChild(st);
  }
  if (getComputedStyle(container).position === "static") container.style.position = "relative";

  const width = () => container.clientWidth || window.innerWidth;
  const height = () => container.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width(), height());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.touchAction = "none";
  container.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(width(), height());
  labelRenderer.domElement.className = "zb-scene-labels";
  container.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#e4f1ec", 70, 175);

  const camera = new THREE.PerspectiveCamera(30, width() / height(), 0.5, 600);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 6; // 可以拉近看清楚人物造型
  controls.maxDistance = 95;
  controls.minPolarAngle = 0.55;
  controls.maxPolarAngle = 1.12;
  controls.minAzimuthAngle = HOME_AZIMUTH - 0.75;
  controls.maxAzimuthAngle = HOME_AZIMUTH + 0.75;
  controls.screenSpacePanning = false;
  controls.rotateSpeed = 0.6;
  // 手機像地圖一樣：單指平移，雙指縮放與旋轉
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
  controls.zoomSpeed = 0.8;

  const sphericalPos = (target, az, pol, dist) =>
    new THREE.Vector3(
      target.x + dist * Math.sin(pol) * Math.sin(az),
      target.y + dist * Math.cos(pol),
      target.z + dist * Math.sin(pol) * Math.cos(az)
    );
  camera.position.copy(sphericalPos(HOME_TARGET, HOME_AZIMUTH, HOME_POLAR, HOME_DIST));
  controls.target.copy(HOME_TARGET);
  controls.update();

  /* ---------- 材質快取 ---------- */
  const disposables = new Set();
  const track = (o) => (disposables.add(o), o);
  const matCache = new Map();
  function mat(color, opts = {}) {
    const key = color + JSON.stringify(opts);
    if (!matCache.has(key)) {
      matCache.set(key, track(new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, flatShading: true, ...opts })));
    }
    return matCache.get(key);
  }
  const windowMat = track(new THREE.MeshStandardMaterial({ color: "#dfe7ea", roughness: 0.4, emissive: "#ffc867", emissiveIntensity: 0 }));
  const landMat = track(new THREE.MeshStandardMaterial({ color: "#f3e8cf", roughness: 0.9, flatShading: true }));
  const lampMat = track(new THREE.MeshStandardMaterial({ color: "#fff4d6", emissive: "#ffd27a", emissiveIntensity: 0.1 }));
  const neonMat = track(new THREE.MeshStandardMaterial({ color: "#7ff3ff", emissive: "#38e6ff", emissiveIntensity: 0.8, roughness: 0.3 }));
  const neonMat2 = track(new THREE.MeshStandardMaterial({ color: "#c6a8ff", emissive: "#8f6bff", emissiveIntensity: 0.8, roughness: 0.3 }));

  /* ---------- 天空、光、霧 ---------- */
  const skyUniforms = { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } };
  const sky = new THREE.Mesh(
    track(new THREE.SphereGeometry(400, 32, 16)),
    track(new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyUniforms,
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: "uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.12,0.0,1.0); gl_FragColor = vec4(mix(bottom, top, pow(h,0.8)),1.0);\n#include <colorspace_fragment>\n}",
    }))
  );
  scene.add(sky);

  const starGeo = track(new THREE.BufferGeometry());
  {
    const rnd = seeded(7), pts = [];
    for (let i = 0; i < 420; i++) {
      const th = rnd() * Math.PI * 2, ph = Math.acos(lerp(0.12, 1, rnd()));
      pts.push(300 * Math.sin(ph) * Math.cos(th), 300 * Math.cos(ph), 300 * Math.sin(ph) * Math.sin(th));
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  }
  const starMat = track(new THREE.PointsMaterial({ color: "#ffffff", size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  const hemi = new THREE.HemisphereLight("#ffffff", "#b7ae95", 1.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff3df", 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -42; sc.right = 42; sc.top = 32; sc.bottom = -32; sc.near = 1; sc.far = 160;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  sun.target.position.copy(HOME_TARGET);
  scene.add(sun, sun.target);

  /* ---------- 海面（低多邊形微波） ---------- */
  const waterGeo = track(new THREE.PlaneGeometry(420, 420, 90, 90));
  waterGeo.rotateX(-Math.PI / 2);
  const waterBase = Float32Array.from(waterGeo.attributes.position.array);
  const waterMat = track(new THREE.MeshStandardMaterial({ color: "#9fdad5", roughness: 0.35, metalness: 0.05, flatShading: true, transparent: true, opacity: 0.96 }));
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = -0.25;
  water.receiveShadow = true;
  scene.add(water);
  function updateWater(t) {
    const p = waterGeo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      const x = waterBase[i], z = waterBase[i + 2];
      p[i + 1] = Math.sin(x * 0.22 + t * 1.1) * 0.09 + Math.cos(z * 0.27 + t * 0.8) * 0.08 + Math.sin((x + z) * 0.11 + t * 0.5) * 0.06;
    }
    waterGeo.attributes.position.needsUpdate = true;
    waterGeo.computeVertexNormals();
  }
  updateWater(0);

  /* ---------- 共用造型 ---------- */
  function mesh(geo, material, x = 0, y = 0, z = 0, cast = true) {
    track(geo);
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = true;
    return m;
  }
  const rbox = (w, h, d, color, r = 0.07) => new THREE.Mesh(track(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2))), mat(color));
  function box(parent, w, h, d, color, x, y, z, opts) {
    const m = mesh(new THREE.BoxGeometry(w, h, d), typeof color === "string" ? mat(color, opts) : color, x, y + h / 2, z);
    parent.add(m);
    return m;
  }
  function roundedHexShape(r, cr) {
    const verts = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (i * Math.PI) / 3;
      verts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
    }
    const s = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const v = verts[i], p = verts[(i + 5) % 6], n = verts[(i + 1) % 6];
      const a = v.clone().add(p.clone().sub(v).setLength(cr));
      const b = v.clone().add(n.clone().sub(v).setLength(cr));
      if (i === 0) s.moveTo(a.x, a.y); else s.lineTo(a.x, a.y);
      s.quadraticCurveTo(v.x, v.y, b.x, b.y);
    }
    s.closePath();
    return s;
  }
  function slab(r, depth, bevel, color) {
    const g = new THREE.ExtrudeGeometry(roundedHexShape(r, r * 0.28), {
      depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 5,
    });
    g.rotateX(-Math.PI / 2);
    return mesh(g, mat(color), 0, 0, 0, false);
  }

  // 建築：圓角方塊 + 四面窗戶（窗戶最後合併成一個 mesh，夜晚發光）
  function building(parent, { w, h, d, color, x = 0, z = 0, rot = 0, roof = null, roofColor = "#c9705a", floorH = 0.42, win = true }) {
    const g = new THREE.Group();
    const body = rbox(w, h, d, color);
    body.position.y = h / 2;
    body.castShadow = body.receiveShadow = true;
    g.add(body);
    if (win) {
      const floors = Math.max(1, Math.floor((h - 0.2) / floorH));
      const addFace = (len, depthHalf, rotY) => {
        const cols = Math.max(1, Math.floor(len / 0.36));
        for (let f = 0; f < floors; f++) {
          for (let c = 0; c < cols; c++) {
            const wm = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.2), windowMat);
            const u = -len / 2 + ((c + 0.5) * len) / cols;
            const y = 0.28 + f * floorH;
            if (y > h - 0.12) continue;
            const off = depthHalf + 0.012;
            if (rotY === 0) wm.position.set(u, y, off);
            else if (rotY === Math.PI) wm.position.set(u, y, -off);
            else if (rotY > 0) wm.position.set(off, y, u);
            else wm.position.set(-off, y, u);
            wm.rotation.y = rotY;
            wm.userData.isWindow = true;
            g.add(wm);
          }
        }
      };
      addFace(w, d / 2, 0);
      addFace(w, d / 2, Math.PI);
      addFace(d, w / 2, Math.PI / 2);
      addFace(d, w / 2, -Math.PI / 2);
    }
    if (roof === "gable") {
      const rh = Math.min(w, d) * 0.45;
      const s = new THREE.Shape();
      s.moveTo(-w / 2 - 0.08, 0); s.lineTo(w / 2 + 0.08, 0); s.lineTo(0, rh); s.closePath();
      const rg = new THREE.ExtrudeGeometry(s, { depth: d + 0.14, bevelEnabled: false });
      rg.translate(0, 0, -(d + 0.14) / 2);
      g.add(mesh(rg, mat(roofColor), 0, h - 0.02, 0));
    } else if (roof === "flat") {
      box(g, w + 0.08, 0.08, d + 0.08, roofColor, 0, h - 0.02, 0);
    }
    g.position.set(x, TOP, z);
    g.rotation.y = rot;
    parent.add(g);
    return g;
  }
  function tree(parent, x, z, s = 1, color = "#7fb069", kind = 0) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.05 * s, 0.07 * s, 0.35 * s, 5), mat("#9a7652"), 0, 0.17 * s, 0));
    let crown;
    if (kind === 1) crown = mesh(new THREE.ConeGeometry(0.32 * s, 0.85 * s, 6), mat(color), 0, 0.72 * s, 0);
    else crown = mesh(new THREE.IcosahedronGeometry(0.34 * s, 0), mat(color), 0, 0.58 * s, 0);
    crown.rotation.y = x * 3.1 + z;
    g.add(crown);
    g.position.set(x, TOP, z);
    parent.add(g);
    return g;
  }
  /* ---------- 人物 ---------- */
  const charGeos = new Map();
  const cg = (key, make) => {
    if (!charGeos.has(key)) charGeos.set(key, track(make()));
    return charGeos.get(key);
  };
  function part(parent, geo, color, x, y, z, cast = false) {
    const m = new THREE.Mesh(geo, typeof color === "string" ? mat(color) : color);
    m.position.set(x, y, z);
    m.castShadow = cast;
    parent.add(m);
    return m;
  }
  const capGeo = (k, th, r = 0.118) => cg(`cap${k}${r}`, () => new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, th));

  // 回傳的 group 原點在腳底、面向 +z；userData.step(t, moving) 擺動四肢，userData.body 可掛東西
  function makeCharacter(role = ROLES.市民, seed = 0, fallbackShirt) {
    const rnd = seeded(seed * 97 + 13);
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    const skin = role.skin || pick(SKINS);
    const hairC = role.hairColor || pick(HAIRS);
    const shirt = role.shirt || fallbackShirt || pick(SHIRTS);
    const pants = role.pants || pick(["#3b4252", "#5b5340", "#2f3e55", "#6b6258"]);
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);

    const legs = [-1, 1].map((s) => {
      const p = new THREE.Group();
      p.position.set(s * 0.045, 0.2, 0);
      body.add(p);
      part(p, cg("leg", () => new THREE.BoxGeometry(0.07, 0.17, 0.08)), pants, 0, -0.085, 0);
      part(p, cg("shoe", () => new THREE.BoxGeometry(0.075, 0.035, 0.11)), "#3a3330", 0, -0.182, 0.012);
      return p;
    });

    // 身體與衣著
    part(body, cg("torso", () => new RoundedBoxGeometry(0.2, 0.23, 0.13, 2, 0.04)), shirt, 0, 0.31, 0, true);
    const outfit = role.outfit || "plain";
    if (outfit === "vest" || outfit === "reflective") {
      part(body, cg("vest", () => new THREE.BoxGeometry(0.21, 0.19, 0.14)), role.outfitColor, 0, 0.325, 0);
      if (outfit === "reflective") [0.29, 0.36].forEach((y) => part(body, cg("stripe", () => new THREE.BoxGeometry(0.214, 0.022, 0.144)), "#eef2f3", 0, y, 0));
    } else if (outfit === "cardigan") {
      part(body, cg("cardigan", () => new THREE.BoxGeometry(0.21, 0.225, 0.14)), role.outfitColor, 0, 0.31, 0);
      part(body, cg("placket", () => new THREE.BoxGeometry(0.045, 0.2, 0.01)), shirt, 0, 0.32, 0.07);
    } else if (outfit === "labcoat") {
      part(body, cg("coat", () => new THREE.BoxGeometry(0.214, 0.32, 0.144)), "#f7f7f4", 0, 0.27, 0);
      part(body, cg("placket", () => new THREE.BoxGeometry(0.045, 0.2, 0.01)), shirt, 0, 0.32, 0.072);
    } else if (outfit === "apron") {
      part(body, cg("apron", () => new THREE.BoxGeometry(0.16, 0.25, 0.012)), role.outfitColor, 0, 0.27, 0.07);
    }
    const sleeve = outfit === "labcoat" ? "#f7f7f4" : outfit === "cardigan" ? role.outfitColor : shirt;

    const arms = [-1, 1].map((s) => {
      const p = new THREE.Group();
      p.position.set(s * 0.128, 0.41, 0);
      body.add(p);
      part(p, cg("arm", () => new THREE.BoxGeometry(0.055, 0.17, 0.06)), sleeve, 0, -0.085, 0);
      part(p, cg("hand", () => new THREE.SphereGeometry(0.03, 6, 5)), skin, 0, -0.185, 0);
      return p;
    });

    // 頭、臉
    const head = new THREE.Group();
    head.position.y = 0.535;
    body.add(head);
    part(head, cg("head", () => new THREE.SphereGeometry(0.11, 12, 10)), skin, 0, 0, 0, true);
    [-1, 1].forEach((s) => part(head, cg("eye", () => new THREE.SphereGeometry(0.014, 6, 4)), "#2a211c", s * 0.038, 0.01, 0.1));

    // 髮型
    const hair = role.hair || pick(["short", "long", "bob", "side", "curly", "bun", "ponytail", "threebuns"]);
    if (hair !== "bald") {
      const big = hair === "bob" || hair === "long";
      const cap = part(head, capGeo(big ? "b" : "a", Math.PI * (big ? 0.6 : 0.42)), hairC, 0, 0.005, -0.008);
      cap.rotation.x = big ? -0.55 : -0.25;
      const ball = (r, x, y, z) => part(head, cg(`ball${r}`, () => new THREE.SphereGeometry(r, 8, 6)), hairC, x, y, z);
      if (hair === "long") part(head, cg("longhair", () => new THREE.BoxGeometry(0.2, 0.2, 0.06)), hairC, 0, -0.07, -0.08);
      if (hair === "side") part(head, cg("tuft", () => new THREE.BoxGeometry(0.12, 0.035, 0.06)), hairC, -0.03, 0.085, 0.07).rotation.z = 0.25;
      if (hair === "curly") [[0.07, 0.07, 0.03], [-0.07, 0.07, 0.03], [0, 0.1, 0.04], [0.08, 0.02, -0.05], [-0.08, 0.02, -0.05], [0, 0.06, -0.09]].forEach(([x, y, z]) => ball(0.045, x, y, z));
      if (hair === "bun") ball(0.05, 0, 0.1, -0.07);
      if (hair === "threebuns") [[-0.07, 0.09, -0.02], [0, 0.12, -0.03], [0.07, 0.09, -0.02]].forEach(([x, y, z]) => ball(0.038, x, y, z));
      if (hair === "ponytail") {
        const tail = part(head, cg("tail", () => new THREE.CylinderGeometry(0.03, 0.018, 0.15, 6)), hairC, 0, -0.03, -0.12);
        tail.rotation.x = 0.45;
      }
    }

    // 臉部配件
    if (role.face === "glasses" || role.face === "sunglasses") {
      const dark = role.face === "sunglasses";
      [-1, 1].forEach((s) => part(head,
        dark ? cg("shade", () => new THREE.BoxGeometry(0.05, 0.035, 0.012)) : cg("lens", () => new THREE.TorusGeometry(0.024, 0.006, 4, 10)),
        dark ? "#1d1d22" : "#2a211c", s * 0.04, 0.012, 0.106));
      part(head, cg("glassbridge", () => new THREE.BoxGeometry(0.032, 0.007, 0.007)), "#2a211c", 0, 0.016, 0.11);
    } else if (role.face === "mask") {
      part(head, cg("mask", () => new THREE.BoxGeometry(0.11, 0.06, 0.03)), "#eef4f6", 0, -0.04, 0.096);
    }

    // 帽子
    const hatC = role.hatColor;
    if (role.hat === "yellowcap") {
      part(head, capGeo("y", Math.PI * 0.45, 0.122), "#f2c230", 0, 0.012, 0).rotation.x = -0.15;
      part(head, cg("visor", () => new THREE.BoxGeometry(0.14, 0.012, 0.07)), "#f2c230", 0, 0.045, 0.12);
    } else if (role.hat === "hardhat" || role.hat === "helmet") {
      const c = role.hat === "hardhat" ? hatC || "#f2c230" : hatC || "#f7f7f4";
      part(head, capGeo("h", Math.PI / 2, 0.13), c, 0, 0.03, 0, true);
      part(head, cg("hhbrim", () => new THREE.CylinderGeometry(0.155, 0.155, 0.012, 14)), c, 0, 0.035, 0.012);
      if (role.hat === "helmet") part(head, cg("hband", () => new THREE.CylinderGeometry(0.132, 0.132, 0.026, 14)), "#e8713c", 0, 0.06, 0);
    } else if (role.hat === "ranger") {
      part(head, cg("rbrim", () => new THREE.CylinderGeometry(0.175, 0.175, 0.014, 14)), "#b9a274", 0, 0.07, 0, true);
      part(head, cg("rcrown", () => new THREE.CylinderGeometry(0.095, 0.11, 0.08, 12)), "#b9a274", 0, 0.11, 0);
      part(head, cg("rband", () => new THREE.CylinderGeometry(0.112, 0.112, 0.02, 12)), "#5b5340", 0, 0.085, 0);
    } else if (role.hat === "straw") {
      part(head, cg("straw", () => new THREE.ConeGeometry(0.23, 0.12, 14)), "#d8b46a", 0, 0.13, 0, true);
    } else if (role.hat === "beanie") {
      part(head, capGeo("w", Math.PI * 0.45, 0.124), hatC || "#c96f5a", 0, 0.015, -0.005).rotation.x = -0.2;
      part(head, cg("pompom", () => new THREE.SphereGeometry(0.032, 6, 5)), "#f7f2e8", 0, 0.135, -0.02);
    } else if (role.hat === "driver") {
      part(head, cg("dbase", () => new THREE.CylinderGeometry(0.118, 0.118, 0.05, 14)), "#2b3446", 0, 0.085, 0);
      part(head, cg("dtop", () => new THREE.CylinderGeometry(0.135, 0.12, 0.03, 14)), "#2b3446", 0, 0.12, 0, true);
      part(head, cg("dvisor", () => new THREE.BoxGeometry(0.13, 0.012, 0.06)), "#1d1d22", 0, 0.07, 0.12);
      part(head, cg("dbadge", () => new THREE.BoxGeometry(0.03, 0.025, 0.01)), "#e1b54a", 0, 0.1, 0.118);
    }

    // 右手的手持物
    const hand = arms[1];
    const h = role.hand;
    if (h === "coffee") {
      part(hand, cg("cup", () => new THREE.CylinderGeometry(0.026, 0.02, 0.07, 8)), "#f4efe6", 0, -0.2, 0.035);
      part(hand, cg("lid", () => new THREE.CylinderGeometry(0.028, 0.028, 0.012, 8)), "#6b4a32", 0, -0.16, 0.035);
    } else if (h === "basket") {
      part(hand, cg("basket", () => new THREE.BoxGeometry(0.12, 0.07, 0.08)), "#c99a5b", 0, -0.26, 0.02);
      part(hand, cg("bhandle", () => new THREE.TorusGeometry(0.045, 0.007, 4, 10, Math.PI)), "#9a7652", 0, -0.225, 0.02);
      part(hand, cg("veg", () => new THREE.SphereGeometry(0.025, 6, 5)), "#8bc34a", 0.02, -0.215, 0.02);
    } else if (h === "cane") {
      part(hand, cg("cane", () => new THREE.CylinderGeometry(0.012, 0.012, 0.25, 6)), "#7a5a3c", 0, -0.3, 0.03);
    } else if (h === "rake") {
      part(hand, cg("pole", () => new THREE.CylinderGeometry(0.011, 0.011, 0.55, 6)), "#9a7652", 0, -0.2, 0.04);
      part(hand, cg("rakehead", () => new THREE.BoxGeometry(0.15, 0.025, 0.025)), "#7b7f88", 0, -0.47, 0.04);
    } else if (h === "tablet") {
      part(hand, cg("tablet", () => new THREE.BoxGeometry(0.1, 0.13, 0.012)), "#2b3446", 0, -0.21, 0.05).rotation.x = -0.5;
    } else if (h === "flag") {
      part(hand, cg("stick", () => new THREE.CylinderGeometry(0.008, 0.008, 0.38, 5)), "#d8d0bf", 0, -0.08, 0.03);
      part(hand, cg("flagcloth", () => new THREE.BoxGeometry(0.006, 0.08, 0.13)), role.flagColor || "#d9673f", 0, 0.06, 0.1);
    } else if (h === "book") {
      part(hand, cg("book", () => new THREE.BoxGeometry(0.09, 0.12, 0.03)), role.bookColor || "#4f9da6", 0, -0.21, 0.04);
    } else if (h === "tube") {
      part(hand, cg("tube", () => new THREE.CylinderGeometry(0.014, 0.014, 0.09, 6)), mat("#d6eef4", { transparent: true, opacity: 0.7 }), 0, -0.19, 0.04);
      part(hand, cg("liquid", () => new THREE.CylinderGeometry(0.012, 0.012, 0.045, 6)), mat("#5fe08a", { emissive: "#3fd070", emissiveIntensity: 0.4 }), 0, -0.21, 0.04);
    } else if (h === "wrench") {
      part(hand, cg("wrench", () => new THREE.BoxGeometry(0.022, 0.14, 0.015)), "#9aa3ad", 0, -0.24, 0.035);
      part(hand, cg("wrenchhead", () => new THREE.TorusGeometry(0.025, 0.009, 4, 8, Math.PI * 1.5)), "#9aa3ad", 0, -0.32, 0.035);
    } else if (h === "torch") {
      const t = part(hand, cg("torch", () => new THREE.CylinderGeometry(0.02, 0.016, 0.1, 8)), "#e8713c", 0, -0.2, 0.06);
      t.rotation.x = Math.PI / 2;
      part(hand, cg("torchlight", () => new THREE.SphereGeometry(0.018, 6, 5)), lampMat, 0, -0.2, 0.11);
    } else if (h === "balloon") {
      part(hand, cg("string", () => new THREE.CylinderGeometry(0.003, 0.003, 0.5, 4)), "#f7f7f4", 0, 0.06, 0.03);
      part(hand, cg("balloon", () => new THREE.SphereGeometry(0.07, 10, 8)), role.balloonColor || "#e57d6a", 0, 0.35, 0.03, true).scale.y = 1.15;
    } else if (h === "flower") {
      part(hand, cg("stem", () => new THREE.CylinderGeometry(0.006, 0.006, 0.12, 4)), "#5a8f5a", 0, -0.15, 0.04);
      part(hand, cg("bloom", () => new THREE.SphereGeometry(0.035, 8, 6)), "#ef9a8a", 0, -0.08, 0.04);
    }

    // 同行物：推嬰兒車時雙手向前
    if (role.companion === "stroller") {
      const st = new THREE.Group();
      st.position.set(0, 0, 0.36);
      body.add(st);
      part(st, cg("pram", () => new RoundedBoxGeometry(0.16, 0.12, 0.22, 2, 0.04)), "#7d9be0", 0, 0.16, 0, true);
      part(st, capGeo("pramhood", Math.PI / 2, 0.09), "#5a7bc0", 0, 0.2, -0.06).rotation.x = -0.5;
      [[-0.07, -0.08], [0.07, -0.08], [-0.07, 0.08], [0.07, 0.08]].forEach(([x, z]) => {
        const w = part(st, cg("pramwheel", () => new THREE.TorusGeometry(0.035, 0.01, 4, 10)), "#333840", x, 0.04, z);
        w.rotation.y = Math.PI / 2;
      });
      part(st, cg("pramhandle", () => new THREE.CylinderGeometry(0.008, 0.008, 0.2, 5)), "#333840", 0, 0.24, -0.15).rotation.z = Math.PI / 2;
      arms.forEach((p) => (p.rotation.x = -1.0));
    }

    g.scale.set(role.width || 1, role.height || 1, role.width || 1);
    const swing = !role.companion;
    g.userData.body = body;
    g.userData.step = (t, moving) => {
      const a = moving ? Math.sin(t) * 0.55 : 0;
      legs[0].rotation.x = a;
      legs[1].rotation.x = -a;
      if (swing) {
        arms[0].rotation.x = -a * 0.8;
        arms[1].rotation.x = h ? a * 0.25 : a * 0.8; // 拿東西的手擺幅小
      }
      body.position.y = moving ? Math.abs(Math.cos(t)) * 0.018 : 0;
    };
    return g;
  }

  let roleCtx = null; // 建島時設為主題 id，讓島上居民穿上符合該島的造型
  let personCount = 0;
  function person(parent, x, z, color) {
    const pool = ISLAND_ROLES[roleCtx] || ["市民"];
    const n = personCount++;
    const g = makeCharacter(ROLES[pool[n % pool.length]] || ROLES.市民, n, color);
    g.position.set(x, TOP, z);
    parent.add(g);
    return g;
  }
  function lamp(parent, x, z) {
    box(parent, 0.04, 0.6, 0.04, "#5d6470", x, TOP, z);
    parent.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), lampMat, x, TOP + 0.64, z, false));
  }
  function bench(parent, x, z, rot = 0) {
    const b = box(parent, 0.4, 0.06, 0.14, "#b9875c", x, TOP + 0.08, z);
    b.rotation.y = rot;
  }

  /* ---------- 動畫登錄 ---------- */
  const anims = []; // (t, dt) => void，暫停時不執行

  function walker(parent, a, b, color, speed = 0.5, phase = 0) {
    const p = person(parent, a[0], a[1], color);
    anims.push((t) => {
      const k = (Math.sin(t * speed + phase) + 1) / 2;
      p.position.x = lerp(a[0], b[0], k);
      p.position.z = lerp(a[1], b[1], k);
      p.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]) + (Math.cos(t * speed + phase) < 0 ? Math.PI : 0);
      p.userData.step(t * 8 + phase, true);
    });
    return p;
  }

  /* ---------- 主題造型 ---------- */
  const BUILDERS = {
    care(g, c) {
      const houses = [[-1.7, -0.6, "#f4e3c8", "#c9705a"], [0.3, -1.9, "#f2d4b9", "#7fa1b6"], [1.9, -0.3, "#efe6d2", c], [-0.4, 1.0, "#f6e9d6", "#c9705a"], [1.4, 1.8, "#f1dcc4", "#8aa86d"]];
      houses.forEach(([x, z, col, roofC], i) => building(g, { w: 1.05, h: 0.75 + (i % 2) * 0.35, d: 0.95, color: col, x, z, rot: (i * 0.7) % 0.6, roof: "gable", roofColor: roofC }));
      tree(g, -2.4, 1.2, 1.0); tree(g, -0.9, -2.2, 0.9, "#93bf72"); tree(g, 2.6, 1.0, 0.8); tree(g, 0.2, 2.6, 0.9, "#6fa361", 1);
      bench(g, -1.4, 2.2); lamp(g, -2.2, -1.9); lamp(g, 2.4, -1.6);
      walker(g, [-1.8, 1.8], [0.8, 0.2], "#d9774b", 0.6);
      walker(g, [0.6, -0.6], [2.4, -1.4], "#4f9da6", 0.45, 1);
      person(g, -1.1, 2.3, "#8b6fb0"); person(g, -1.25, 2.35, "#e1b54a");
    },
    service(g, c) {
      building(g, { w: 2.3, h: 1.1, d: 1.5, color: "#f6f2ea", x: 0, z: -0.7, roof: "flat", roofColor: c });
      box(g, 2.5, 0.08, 0.7, c, 0, TOP + 0.85, 0.35); // 雨遮
      box(g, 0.06, 0.85, 0.06, "#7b7f88", -1.1, TOP, 0.65); box(g, 0.06, 0.85, 0.06, "#7b7f88", 1.1, TOP, 0.65);
      // 服務站招牌
      box(g, 0.07, 1.6, 0.07, "#6a6f78", -1.8, TOP, 1.2);
      const sign = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 18), mat(c), -1.8, TOP + 1.75, 1.2);
      sign.rotation.x = Math.PI / 2; g.add(sign);
      box(g, 0.07, 0.24, 0.1, "#ffffff", -1.8, TOP + 1.61, 1.22); box(g, 0.07, 0.07, 0.1, "#ffffff", -1.8, TOP + 1.9, 1.22);
      // 小貨車
      const van = rbox(0.9, 0.45, 0.45, "#ffffff", 0.1); van.position.set(1.4, TOP + 0.3, 1.6); van.castShadow = true; g.add(van);
      box(g, 0.92, 0.08, 0.47, c, 1.4, TOP + 0.26, 1.6);
      [[1.1, 1.38], [1.7, 1.38], [1.1, 1.82], [1.7, 1.82]].forEach(([x, z]) => {
        const w = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 10), mat("#333840"), x, TOP + 0.09, z); w.rotation.x = Math.PI / 2; g.add(w);
      });
      // 小攤亭
      building(g, { w: 0.7, h: 0.7, d: 0.7, color: "#f3e3c3", x: 1.9, z: -1.4, roof: "gable", roofColor: c });
      tree(g, -2.3, -1.2); tree(g, 2.5, 0.2, 0.8, "#93bf72"); tree(g, 0.3, 2.5, 0.9, "#6fa361", 1);
      for (let i = 0; i < 4; i++) person(g, -0.6 + i * 0.32, 1.0, ["#d9774b", "#4f9da6", "#e1b54a", "#8b6fb0"][i]);
      walker(g, [-2.0, 0.4], [-0.6, 2.2], "#5a8f5a", 0.5);
      lamp(g, 1.0, 2.6);
    },
    edu(g, c) {
      building(g, { w: 3.4, h: 1.2, d: 0.95, color: "#f2e4c6", x: 0, z: -1.4, roof: "flat", roofColor: "#c9705a" });
      building(g, { w: 0.95, h: 1.2, d: 1.6, color: "#f2e4c6", x: -1.75, z: -0.15, roof: "flat", roofColor: "#c9705a" });
      const tower = building(g, { w: 0.75, h: 2.1, d: 0.75, color: "#f7eedb", x: 0.2, z: -1.4, roof: "gable", roofColor: c, win: false });
      const clock = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), mat("#ffffff"), 0, 1.65, 0.39);
      clock.rotation.x = Math.PI / 2; tower.add(clock);
      box(tower, 0.02, 0.15, 0.02, "#333", 0, 1.62, 0.42);
      // 操場跑道
      const track = mesh(new THREE.RingGeometry(0.75, 1.15, 28), mat("#d4805f", { side: THREE.DoubleSide }), 0.7, TOP + 0.015, 1.25, false);
      track.rotation.x = -Math.PI / 2; track.scale.set(1.45, 1, 1); g.add(track);
      const field = mesh(new THREE.CircleGeometry(0.75, 28), mat("#8cc06e"), 0.7, TOP + 0.012, 1.25, false);
      field.rotation.x = -Math.PI / 2; field.scale.set(1.45, 1, 1); g.add(field);
      // 旗桿
      box(g, 0.04, 1.6, 0.04, "#d0d0d0", -1.0, TOP, 0.6);
      box(g, 0.02, 0.24, 0.4, c, -1.0, TOP + 1.32, 0.8);
      tree(g, 2.4, -0.4, 0.9); tree(g, -2.5, 1.4, 0.9, "#93bf72", 1); tree(g, 2.3, -2.0, 0.8, "#6fa361");
      walker(g, [-0.5, 1.25], [1.9, 1.25], "#e1b54a", 1.4);
      walker(g, [1.9, 0.6], [-0.4, 1.9], "#d9774b", 1.2, 2);
      person(g, -1.2, 1.4, "#4f9da6");
    },
    traffic(g, c) {
      const road = "#6b6f77";
      box(g, 6.6, 0.03, 0.95, road, 0, TOP, 0.3);
      box(g, 0.95, 0.03, 6.4, road, -0.6, TOP, 0);
      for (let i = -3; i <= 3; i++) {
        if (Math.abs(i * 0.9 + 0.6) < 0.6) continue;
        box(g, 0.4, 0.035, 0.06, "#ffffff", i * 0.9, TOP, 0.3);
      }
      for (let i = -3; i <= 3; i++) if (Math.abs(i * 0.9 - 0.3) > 0.6) box(g, 0.06, 0.035, 0.4, "#ffffff", -0.6, TOP, i * 0.9);
      // 自行車道（綠）
      box(g, 6.0, 0.035, 0.32, "#5fae6e", 0, TOP, 1.15);
      // 斑馬線
      for (let i = 0; i < 5; i++) box(g, 0.1, 0.04, 0.5, "#ffffff", -1.35 + i * 0.18 + 1.5, TOP, 0.3);
      // 公車
      const bus = new THREE.Group();
      const bb = rbox(1.35, 0.5, 0.5, c, 0.1); bb.position.y = 0.33; bb.castShadow = true; bus.add(bb);
      box(bus, 1.2, 0.14, 0.52, "#e9f4f7", 0.04, 0.37, 0, undefined).material = windowMat;
      [[-0.4, 0.22], [0.4, 0.22], [-0.4, -0.22], [0.4, -0.22]].forEach(([x, z]) => {
        const w = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 10), mat("#2e3238"), x, 0.1, z); w.rotation.x = Math.PI / 2; bus.add(w);
      });
      bus.position.set(-2.6, TOP, 0.12);
      g.add(bus);
      anims.push((t) => {
        const k = (Math.sin(t * 0.35) + 1) / 2;
        bus.position.x = lerp(-2.7, 2.7, k);
        bus.position.z = Math.cos(t * 0.35) > 0 ? 0.08 : 0.52;
        bus.rotation.y = Math.cos(t * 0.35) > 0 ? 0 : Math.PI;
      });
      // 自行車
      const makeBike = (color) => {
        const b = new THREE.Group();
        [-0.12, 0.12].forEach((x) => b.add(mesh(new THREE.TorusGeometry(0.08, 0.015, 5, 12), mat("#333"), x, 0.09, 0)));
        box(b, 0.26, 0.02, 0.02, color, 0, 0.13, 0);
        const rider = person(b, 0, 0, color); rider.position.y = 0.0; rider.rotation.y = Math.PI / 2; rider.scale.multiplyScalar(0.8);
        return b;
      };
      const bikes = [makeBike("#e1b54a"), makeBike("#4f9da6")];
      bikes.forEach((b, i) => {
        b.position.set(0, TOP, 1.15); g.add(b);
        anims.push((t) => {
          const k = ((t * 0.12 + i * 0.5) % 1);
          b.position.x = lerp(-2.8, 2.8, k);
        });
      });
      // 公車亭
      box(g, 0.9, 0.05, 0.4, c, 1.6, TOP + 0.6, -0.5);
      box(g, 0.04, 0.6, 0.04, "#888", 1.2, TOP, -0.6); box(g, 0.04, 0.6, 0.04, "#888", 2.0, TOP, -0.6);
      box(g, 0.8, 0.45, 0.03, "#cfe6ee", 1.6, TOP + 0.1, -0.68, { transparent: true, opacity: 0.6 });
      // 紅綠燈
      box(g, 0.05, 0.9, 0.05, "#555b63", 0.2, TOP, -0.45);
      box(g, 0.12, 0.3, 0.1, "#2e3238", 0.2, TOP + 0.9, -0.45);
      g.add(mesh(new THREE.SphereGeometry(0.035, 6, 5), mat("#5fe08a", { emissive: "#3fd070", emissiveIntensity: 0.8 }), 0.2, TOP + 1.0, -0.39, false));
      // 高鐵站意象 + 辦公樓
      building(g, { w: 1.9, h: 0.75, d: 1.2, color: "#eef1f3", x: 1.7, z: -2.0, roof: "flat", roofColor: "#9fb3c2" });
      const arch = mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.9, 12, 1, true, 0, Math.PI), mat("#cfdbe4", { side: THREE.DoubleSide }), 1.7, TOP + 0.75, -2.0);
      arch.rotation.z = Math.PI / 2; arch.scale.set(1, 1, 0.55); g.add(arch);
      building(g, { w: 0.9, h: 1.7, d: 0.9, color: "#e7e1d3", x: -2.0, z: -1.6, roof: "flat", roofColor: "#b9b2a2" });
      building(g, { w: 0.9, h: 1.1, d: 0.8, color: "#f2dcc0", x: -2.2, z: 2.3, roof: "gable", roofColor: "#c9705a" });
      tree(g, 1.2, 2.3, 0.85); tree(g, 2.4, 2.0, 0.8, "#93bf72"); tree(g, -1.5, -2.8, 0.7, "#6fa361", 1);
      lamp(g, 0.6, -0.4); lamp(g, -1.6, 0.9);
    },
    resilience(g, c) {
      building(g, { w: 2.2, h: 0.95, d: 1.7, color: "#f3ebdc", x: -0.6, z: -0.8, roof: "flat", roofColor: "#d8d0bf" });
      // 屋頂太陽能板
      const panel = (x, y, z, rot = 0) => {
        const p = mesh(new THREE.BoxGeometry(0.6, 0.04, 0.42), mat("#2f4f7f", { roughness: 0.3, metalness: 0.3 }), x, y, z);
        p.rotation.x = -0.4; p.rotation.y = rot; g.add(p);
        return p;
      };
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) panel(-1.3 + i * 0.68, TOP + 1.12, -1.2 + j * 0.62);
      // 地面太陽能陣列
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
        box(g, 0.05, 0.25, 0.05, "#888", 0.8 + i * 0.68, TOP, 1.1 + j * 0.62);
        panel(0.8 + i * 0.68, TOP + 0.33, 1.1 + j * 0.62);
      }
      // 儲能電池櫃
      for (let i = 0; i < 2; i++) {
        box(g, 0.7, 0.55, 0.42, "#f4f6f5", 1.7, TOP, -1.0 + i * 0.55);
        box(g, 0.72, 0.1, 0.44, c, 1.7, TOP + 0.38, -1.0 + i * 0.55);
      }
      // 風機
      box(g, 0.07, 2.4, 0.07, "#f2f2f2", -2.1, TOP, 1.2);
      const rotor = new THREE.Group();
      rotor.position.set(-2.1, TOP + 2.4, 1.26);
      for (let i = 0; i < 3; i++) {
        const blade = mesh(new THREE.BoxGeometry(0.07, 0.75, 0.02), mat("#ffffff"), 0, 0.37, 0);
        const holder = new THREE.Group(); holder.rotation.z = (i * Math.PI * 2) / 3; holder.add(blade); rotor.add(holder);
      }
      rotor.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(c)));
      g.add(rotor);
      anims.push((t, dt) => (rotor.rotation.z -= dt * 1.8));
      // 防災旗
      box(g, 0.04, 1.2, 0.04, "#cfcfcf", 0.3, TOP, 0.4);
      box(g, 0.02, 0.22, 0.36, c, 0.3, TOP + 0.95, 0.58);
      tree(g, -2.4, -1.2, 0.8, "#6fa361", 1); tree(g, -1.0, 2.4, 0.9);
      walker(g, [-1.6, 0.6], [0.2, 0.9], "#e1b54a", 0.5);
      lamp(g, -0.2, 0.8);
    },
    digital(g, c) {
      // 發光資料塔
      const tw = new THREE.Group();
      g.add(tw);
      const levels = [[1.2, 0.9], [1.0, 0.9], [0.82, 0.9], [0.62, 0.9]];
      let y = TOP;
      levels.forEach(([s, h], i) => {
        const b = rbox(s, h, s, i % 2 ? "#2c3654" : "#344166", 0.06);
        b.position.set(0, y + h / 2, 0); b.castShadow = true; tw.add(b);
        // 發光橫帶
        const band = mesh(new THREE.BoxGeometry(s + 0.03, 0.06, s + 0.03), i % 2 ? neonMat2 : neonMat, 0, y + h - 0.12, 0, false);
        tw.add(band);
        for (let k = 0; k < 4; k++) {
          const a = (k * Math.PI) / 2;
          const strip = mesh(new THREE.BoxGeometry(0.04, h * 0.7, 0.04), neonMat, Math.cos(a + Math.PI / 4) * s * 0.7, y + h / 2, Math.sin(a + Math.PI / 4) * s * 0.7, false);
          tw.add(strip);
        }
        y += h;
      });
      box(tw, 0.04, 0.8, 0.04, "#c9d2e0", 0, y, 0);
      const beacon = mesh(new THREE.SphereGeometry(0.12, 10, 8), neonMat, 0, y + 0.85, 0, false);
      tw.add(beacon);
      const rings = [];
      [1.3, 2.4].forEach((ry, i) => {
        const r = mesh(new THREE.TorusGeometry(0.95 - i * 0.2, 0.03, 6, 36), i ? neonMat2 : neonMat, 0, TOP + ry, 0, false);
        r.rotation.x = Math.PI / 2; tw.add(r); rings.push(r);
      });
      // 漂浮資料方塊
      const cubes = [];
      for (let i = 0; i < 7; i++) {
        const cb = mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), i % 2 ? neonMat2 : neonMat, 0, 0, 0, false);
        g.add(cb); cubes.push(cb);
      }
      anims.push((t) => {
        rings[0].rotation.z = t * 0.6; rings[1].rotation.z = -t * 0.9;
        rings[0].position.y = TOP + 1.3 + Math.sin(t * 1.2) * 0.12;
        rings[1].position.y = TOP + 2.4 + Math.sin(t * 1.2 + 1) * 0.12;
        cubes.forEach((cb, i) => {
          const a = t * 0.5 + (i * Math.PI * 2) / cubes.length;
          cb.position.set(Math.cos(a) * 1.6, TOP + 1.2 + Math.sin(t * 1.3 + i) * 0.35 + (i % 3) * 0.4, Math.sin(a) * 1.6);
          cb.rotation.set(t + i, t * 0.7, 0);
        });
        beacon.scale.setScalar(1 + Math.sin(t * 3) * 0.15);
      });
      // 伺服器機櫃
      for (let i = 0; i < 3; i++) {
        box(g, 0.42, 0.7, 0.42, "#3a4562", -2.0 + i * 0.5, TOP, 1.6);
        box(g, 0.3, 0.04, 0.43, neonMat, -2.0 + i * 0.5, TOP + 0.45, 1.6);
      }
      building(g, { w: 1.2, h: 1.3, d: 1.0, color: "#e6ebf2", x: 2.0, z: -1.3, roof: "flat", roofColor: c });
      building(g, { w: 1.0, h: 0.9, d: 1.0, color: "#edf0f4", x: 1.9, z: 1.5, roof: "flat", roofColor: "#9fb3c2" });
      tree(g, -2.2, -1.4, 0.8, "#6fa361", 1); tree(g, 0.6, 2.6, 0.75);
      walker(g, [-1.9, 0.5], [-0.9, 2.4], "#4f9da6", 0.5);
    },
    space(g, c) {
      const pond = mesh(new THREE.CircleGeometry(1.0, 20), mat("#7cc6cf", { roughness: 0.2 }), 0.6, TOP + 0.015, 0.7, false);
      pond.rotation.x = -Math.PI / 2; pond.scale.set(1.3, 1, 1); g.add(pond);
      // 步道
      const path = mesh(new THREE.RingGeometry(1.6, 1.95, 32), mat("#e6d3ad", { side: THREE.DoubleSide }), 0.3, TOP + 0.01, 0.3, false);
      path.rotation.x = -Math.PI / 2; g.add(path);
      // 涼亭
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        box(g, 0.05, 0.6, 0.05, "#f5efe2", -1.4 + Math.cos(a) * 0.38, TOP, -1.3 + Math.sin(a) * 0.38);
      }
      g.add(mesh(new THREE.ConeGeometry(0.62, 0.42, 6), mat(c), -1.4, TOP + 0.8, -1.3));
      // 樹叢
      const rnd = seeded(11);
      const spots = [[-2.6, 0.4], [-2.2, 1.6], [-1.0, 2.5], [2.6, -0.8], [2.2, -2.0], [0.6, -2.6], [-0.4, -2.2], [2.7, 1.2], [1.6, 2.4], [-2.6, -0.8]];
      spots.forEach(([x, z], i) => tree(g, x, z, 0.75 + rnd() * 0.45, ["#7fb069", "#93bf72", "#6fa361", "#a5c97f"][i % 4], i % 3 === 0 ? 1 : 0));
      // 鴨子
      const duck = mesh(new THREE.SphereGeometry(0.08, 6, 5), mat("#ffffff"), 0, TOP + 0.06, 0);
      g.add(duck);
      anims.push((t) => duck.position.set(0.6 + Math.cos(t * 0.4) * 0.8, TOP + 0.06, 0.7 + Math.sin(t * 0.4) * 0.5));
      bench(g, 0.4, -1.0); bench(g, -0.6, 1.6, 1);
      walker(g, [-1.4, 0.0], [1.6, -1.2], "#d9774b", 0.35);
      walker(g, [0.0, 2.0], [2.0, 1.0], "#8b6fb0", 0.4, 2);
      lamp(g, -0.6, -0.5); lamp(g, 1.8, 0.0);
    },
    market(g, c) {
      building(g, { w: 2.6, h: 0.9, d: 1.1, color: "#f1e2c4", x: 0, z: -1.7, roof: "gable", roofColor: "#c58a5a" });
      const stripes = [c, "#f2b04c", "#5aa6a0", c, "#e57d6a", "#7d9be0"];
      let k = 0;
      for (let row = 0; row < 2; row++) for (let i = 0; i < 3; i++) {
        const x = -1.5 + i * 1.3, z = 0.0 + row * 1.35;
        box(g, 0.9, 0.3, 0.5, "#c69a6b", x, TOP, z);            // 攤桌
        [[-0.42, -0.25], [0.42, -0.25], [-0.42, 0.25], [0.42, 0.25]].forEach(([dx, dz]) => box(g, 0.035, 0.75, 0.035, "#8b8f96", x + dx, TOP, z + dz));
        const col = stripes[k++ % stripes.length];
        // 條紋棚頂
        for (let s = 0; s < 4; s++) {
          const st = box(g, 0.25, 0.06, 0.66, s % 2 ? "#ffffff" : col, x - 0.375 + s * 0.25, TOP + 0.75, z);
          st.rotation.x = 0.12;
        }
        // 農產品
        const fruits = ["#e65a4f", "#f2a93b", "#8bc34a", "#f4d35e"];
        for (let f = 0; f < 4; f++) g.add(mesh(new THREE.SphereGeometry(0.07, 6, 5), mat(fruits[(f + i) % 4]), x - 0.3 + f * 0.2, TOP + 0.36, z));
      }
      walker(g, [-2.2, 0.7], [2.0, 0.7], "#4f9da6", 0.35);
      walker(g, [1.8, 2.3], [-1.8, 2.2], "#e1b54a", 0.3, 1.5);
      person(g, -1.5, 0.45, "#d9774b"); person(g, 1.1, 1.8, "#8b6fb0");
      tree(g, 2.6, -0.8, 0.8); tree(g, -2.6, -0.4, 0.8, "#93bf72", 1);
      lamp(g, 0.0, 2.6);
    },
    culture(g, c) {
      // 圖書館（列柱）
      building(g, { w: 2.0, h: 1.05, d: 1.3, color: "#f4ecdc", x: -0.9, z: -1.2, roof: "flat", roofColor: c });
      for (let i = 0; i < 5; i++) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.95, 8), mat("#ffffff"), -1.7 + i * 0.4, TOP + 0.475, -0.42));
      box(g, 2.1, 0.1, 0.4, "#ffffff", -0.9, TOP + 0.95, -0.4);
      // 書本意象
      const books = ["#d9774b", "#4f9da6", "#e1b54a", c];
      books.forEach((col, i) => {
        const b = box(g, 0.14, 0.5, 0.36, col, 1.1 + i * 0.16, TOP, -1.8);
        b.rotation.z = i === 3 ? -0.25 : 0;
      });
      // 運動場
      box(g, 2.6, 0.03, 1.6, "#7cbf63", 0.6, TOP, 1.2);
      box(g, 0.03, 0.035, 1.5, "#ffffff", 0.6, TOP, 1.2);
      const cc = mesh(new THREE.RingGeometry(0.28, 0.32, 20), mat("#ffffff", { side: THREE.DoubleSide }), 0.6, TOP + 0.04, 1.2, false);
      cc.rotation.x = -Math.PI / 2; g.add(cc);
      [-0.65, 1.85].forEach((x) => {
        box(g, 0.04, 0.3, 0.04, "#ffffff", x, TOP, 0.95); box(g, 0.04, 0.3, 0.04, "#ffffff", x, TOP, 1.45);
        box(g, 0.04, 0.04, 0.54, "#ffffff", x, TOP + 0.3, 1.2);
      });
      const ball = mesh(new THREE.IcosahedronGeometry(0.06, 0), mat("#ffffff"), 0.6, TOP + 0.08, 1.2);
      g.add(ball);
      anims.push((t) => ball.position.set(0.6 + Math.sin(t * 0.9) * 1.0, TOP + 0.08 + Math.abs(Math.sin(t * 2.7)) * 0.15, 1.2 + Math.sin(t * 1.7) * 0.4));
      walker(g, [-0.3, 0.8], [1.5, 1.6], "#d9774b", 0.9);
      walker(g, [1.5, 0.7], [-0.2, 1.6], "#4f9da6", 0.8, 1);
      person(g, -0.8, -0.1, "#8b6fb0");
      tree(g, -2.4, 0.6, 0.85); tree(g, 2.5, -0.8, 0.8, "#6fa361", 1); tree(g, -1.8, 2.3, 0.75, "#93bf72");
      lamp(g, 2.2, 0.2);
    },
    youth(g, c) {
      // 貨櫃工作室
      const cols = ["#e8a33d", "#4f9da6", c, "#e57d6a", "#7d9be0"];
      const cont = [[-1.2, 0, -1.2, 0], [-1.2, 0, -0.55, 1], [-1.2, 1, -0.9, 2], [0.4, 0, -1.6, 3], [0.4, 1, -1.6, 4]];
      cont.forEach(([x, lvl, z, ci]) => {
        const m = rbox(1.4, 0.55, 0.6, cols[ci], 0.04);
        m.position.set(x, TOP + 0.275 + lvl * 0.57, z); m.castShadow = m.receiveShadow = true; g.add(m);
        for (let r = 0; r < 6; r++) box(g, 0.03, 0.47, 0.62, cols[ci], x - 0.6 + r * 0.24, TOP + 0.04 + lvl * 0.57, z);
        const wm = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.26), windowMat);
        wm.position.set(x + 0.2, TOP + 0.3 + lvl * 0.57, z + 0.31); wm.userData.isWindow = true; g.add(wm);
      });
      // 玻璃共享辦公室
      const glass = rbox(1.2, 1.0, 1.0, "#bfe3ee", 0.05);
      glass.material = mat("#bfe3ee", { transparent: true, opacity: 0.55, roughness: 0.1 });
      glass.position.set(1.6, TOP + 0.5, 0.5); g.add(glass);
      box(g, 1.26, 0.06, 1.06, "#ffffff", 1.6, TOP + 1.0, 0.5);
      box(g, 0.5, 0.28, 0.3, "#f2f2f2", 1.6, TOP, 0.5);
      // 霓虹燈泡
      const bulb = mesh(new THREE.IcosahedronGeometry(0.22, 1), neonMat2, 1.6, TOP + 1.45, 0.5, false);
      g.add(bulb);
      anims.push((t) => (bulb.rotation.y = t * 0.8));
      // 塗鴉牆
      const wall = box(g, 1.6, 0.6, 0.08, "#f6efe3", -1.0, TOP, 1.4);
      ["#e57d6a", "#4f9da6", "#e1b54a", c].forEach((col, i) => box(g, 0.3, 0.3, 0.02, col, -1.55 + i * 0.37, TOP + 0.15, 1.45));
      // 小舞台 + 人
      box(g, 0.9, 0.12, 0.7, "#c69a6b", 0.5, TOP, 1.8);
      person(g, 0.5, 1.8, "#e1b54a").position.y = TOP + 0.12;
      walker(g, [-2.0, 0.4], [0.8, 0.4], "#8b6fb0", 0.6);
      walker(g, [2.2, -1.2], [0.8, -0.4], "#d9774b", 0.5, 2);
      tree(g, 2.5, -1.6, 0.8, "#93bf72"); tree(g, -2.6, 0.8, 0.8, "#6fa361", 1);
      lamp(g, -0.2, 0.2);
    },
  };
  function genericBuilder(g, c) {
    building(g, { w: 1.4, h: 1.2, d: 1.2, color: "#f1e6d0", x: 0, z: 0, roof: "flat", roofColor: c });
    tree(g, -1.8, 1, 0.9); tree(g, 1.8, -1, 0.9);
  }

  /* ---------- 建立島嶼 ---------- */
  const islandsRoot = new THREE.Group();
  scene.add(islandsRoot);
  const islands = new Map(); // id -> { group, theme, label, band, liftTarget }
  const extraIds = [];
  themes.forEach((theme) => {
    let L = LAYOUT[theme.id];
    if (!L) {
      const i = extraIds.push(theme.id) - 1;
      L = { x: 30 + (i % 2) * 9, z: -14 + i * 7, r: 3.6 };
    }
    const color = theme.color || "#888888";
    const g = new THREE.Group();
    // 基座：沙色 → 主題色帶 → 奶油色島面
    const base = slab(L.r + 0.25, 0.75, 0.18, "#e5d3ae");
    base.position.y = -1.05; base.receiveShadow = true; g.add(base);
    const bandMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, flatShading: true, emissive: color, emissiveIntensity: 0 });
    track(bandMat);
    const band = slab(L.r + 0.12, 0.12, 0.04, color);
    band.material = bandMat;
    band.position.y = -0.1; g.add(band);
    const top = slab(L.r, 0.2, 0.08, "#f3e8cf");
    top.material = landMat;
    top.position.y = 0.04; top.receiveShadow = true; g.add(top);
    // 主題造型
    roleCtx = theme.id;
    (BUILDERS[theme.id] || genericBuilder)(g, color);
    roleCtx = null;
    // 合併窗戶
    g.updateMatrixWorld(true);
    const winGeos = [], toRemove = [];
    g.traverse((o) => {
      if (o.userData.isWindow) {
        const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
        winGeos.push(geo);
        toRemove.push(o);
      }
    });
    toRemove.forEach((o) => { o.geometry.dispose(); o.parent.remove(o); });
    if (winGeos.length) {
      const merged = track(mergeGeometries(winGeos));
      winGeos.forEach((w) => w.dispose());
      g.add(new THREE.Mesh(merged, windowMat));
    }
    // 標籤
    const bbox = new THREE.Box3().setFromObject(g);
    const el = document.createElement("div");
    el.className = "island-label";
    el.style.setProperty("--zb-color", color);
    const no = String(theme.no ?? "").padStart(2, "0");
    const b = document.createElement("b");
    b.style.color = color;
    b.textContent = no;
    el.append(b, document.createTextNode(" " + (theme.title || theme.id)));
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.dataset.themeId = theme.id;
    el.addEventListener("click", (e) => { e.stopPropagation(); select(theme.id); });
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(theme.id); } });
    el.addEventListener("pointerenter", () => setHover(theme.id));
    el.addEventListener("pointerleave", () => setHover(null));
    const label = new CSS2DObject(el);
    label.position.set(0, Math.max(bbox.max.y + 0.7, 2.6), 0);
    label.center.set(0.5, 1);
    g.add(label);

    g.traverse((o) => { if (o.isMesh) o.userData.themeId = theme.id; });
    g.position.set(L.x, 0, L.z);
    g.userData.themeId = theme.id;
    islandsRoot.add(g);
    islands.set(theme.id, { group: g, theme, label, el, band, bandMat, r: L.r, lift: 0, liftTarget: 0, anchorY: label.position.y });
  });

  /* ---------- 地景：海岸、河流、丘陵、風機 ---------- */
  function buildLandscape() {
    const land = new THREE.Group();
    scene.add(land);
    const plate = (x0, x1, z0, z1, color = "#d6e3b5") => {
      const w = x1 - x0, d = z1 - z0;
      const m = rbox(w, 0.9, d, color, 0.35);
      m.material = mat(color);
      m.position.set((x0 + x1) / 2, -0.25, (z0 + z1) / 2);
      m.receiveShadow = true;
      land.add(m);
      return m;
    };
    // 北岸（鳳山溪以北）、南岸（頭前溪以南）、東側丘陵地（被兩條河切開）
    plate(-10, 30, -46, -18.5);
    plate(1, 30, 18.5, 46);
    plate(29, 80, -46, -17.6);
    plate(29, 80, -14.6, 14.6);
    plate(29, 80, 17.6, 46);
    // 沙灘
    plate(-13, -9, -46, -18.5, "#efdfb9").position.y = -0.4;
    plate(-2, 2, 18.5, 46, "#efdfb9").position.y = -0.4;
    // 丘陵
    const rnd = seeded(42);
    const greens = ["#9cc27a", "#8bb86c", "#a9cc85", "#7eaa63", "#b3d18f"];
    const hill = (x, z, s) => {
      const h = mesh(new THREE.IcosahedronGeometry(1, 1), mat(greens[Math.floor(rnd() * greens.length)]), x, -0.2, z);
      h.scale.set(s * (1 + rnd() * 0.6), s * (0.45 + rnd() * 0.35), s * (1 + rnd() * 0.5));
      h.rotation.y = rnd() * 3;
      h.receiveShadow = true;
      land.add(h);
    };
    for (let i = 0; i < 26; i++) {
      const z = lerp(-44, 44, rnd());
      if (Math.abs(Math.abs(z) - 16) < 3.5) continue; // 留出河道
      hill(lerp(36, 78, rnd()), z, lerp(3, 8, rnd()));
    }
    for (let i = 0; i < 10; i++) hill(lerp(-6, 28, rnd()), -lerp(26, 44, rnd()), lerp(2.5, 5, rnd()));
    for (let i = 0; i < 10; i++) hill(lerp(6, 28, rnd()), lerp(26, 44, rnd()), lerp(2.5, 5, rnd()));
    // 河岸樹與小屋
    for (let i = 0; i < 40; i++) {
      const side = i % 2 ? 1 : -1;
      const x = lerp(-7, 76, rnd()), z = side * lerp(20, 25, rnd());
      if (x > 29 && Math.abs(z) < 18) continue;
      if (side > 0 && x < 3) continue;
      const t = tree(land, x, z, lerp(1.0, 1.7, rnd()), greens[i % 5], i % 3 === 0 ? 1 : 0);
      t.position.y = 0.2;
    }
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1;
      const b = building(land, { w: 1.1, h: lerp(0.7, 1.6, rnd()), d: 1.0, color: ["#f4e3c8", "#efe6d2", "#f2d4b9"][i % 3], x: lerp(i % 2 ? 4 : -5, 26, rnd()), z: side * lerp(21, 24, rnd()), roof: "gable", roofColor: i % 2 ? "#c9705a" : "#7fa1b6", rot: rnd() });
      b.position.y = 0.2;
      b.scale.setScalar(1.4);
    }
    // 東側丘陵上的小樹與房子
    for (let i = 0; i < 18; i++) {
      const z = lerp(-12, 12, rnd());
      const t = tree(land, lerp(31, 36, rnd()), z, lerp(1.1, 1.6, rnd()), greens[i % 5], i % 2);
      t.position.y = 0.2;
    }
    // 海岸風機（新竹的風）
    const turbines = [];
    [[-8, -30], [-8, -24], [3, 26], [3, 33]].forEach(([x, z]) => {
      box(land, 0.18, 6, 0.18, "#f4f4f4", x, 0.2, z);
      const r = new THREE.Group();
      r.position.set(x - 0.15, 6.2, z);
      for (let i = 0; i < 3; i++) {
        const h = new THREE.Group();
        h.rotation.x = (i * Math.PI * 2) / 3;
        h.add(mesh(new THREE.BoxGeometry(0.05, 2.0, 0.16), mat("#ffffff"), 0, 1.0, 0));
        r.add(h);
      }
      r.add(mesh(new THREE.SphereGeometry(0.18, 8, 6), mat("#e9e9e9")));
      land.add(r);
      turbines.push(r);
    });
    anims.push((t, dt) => turbines.forEach((r, i) => (r.rotation.x += dt * (0.9 + i * 0.1))));

    // 地名標示
    const geo = (text, x, z) => {
      const d = document.createElement("div");
      d.className = "zb-geo-label";
      d.textContent = text;
      const o = new CSS2DObject(d);
      o.position.set(x, 0.3, z);
      scene.add(o);
    };
    geo("台 灣 海 峽", -22, 8);
    geo("鳳山溪", 40, -16);
    geo("頭前溪", 40, 16);
  }

  /* ---------- 雲、船 ---------- */
  const clouds = [];
  function buildClouds() {
    const rnd = seeded(5);
    const cm = mat("#ffffff", { roughness: 1 });
    for (let i = 0; i < 11; i++) {
      const c = new THREE.Group();
      const n = 3 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++) {
        const s = lerp(0.9, 1.8, rnd());
        const p = mesh(new THREE.IcosahedronGeometry(s, 1), cm, k * 1.6 - n * 0.8, rnd() * 0.6, (rnd() - 0.5) * 1.6, true);
        p.scale.y = 0.65;
        c.add(p);
      }
      c.position.set(lerp(-80, 90, rnd()), lerp(17, 24, rnd()), lerp(-40, 40, rnd()));
      c.userData.speed = lerp(0.6, 1.4, rnd());
      scene.add(c);
      clouds.push(c);
    }
  }
  const boats = [];
  function buildBoats() {
    const make = (color) => {
      const b = new THREE.Group();
      const hull = rbox(1.6, 0.4, 0.6, "#ffffff", 0.12);
      hull.position.y = 0.1; hull.castShadow = true; b.add(hull);
      box(b, 1.62, 0.1, 0.62, color, 0, -0.05, 0);
      box(b, 0.6, 0.35, 0.45, "#f3ede0", -0.2, 0.3, 0);
      box(b, 0.04, 1.0, 0.04, "#9a7652", 0.3, 0.3, 0);
      const sail = mesh(new THREE.ConeGeometry(0.4, 0.9, 3), mat("#fffaf0"), 0.48, 0.85, 0);
      sail.scale.z = 0.12; b.add(sail);
      scene.add(b);
      return b;
    };
    const specs = [
      { color: "#d9774b", cx: -20, cz: -4, rx: 4, rz: 8, sp: 0.07 },
      { color: "#4f9da6", cx: -24, cz: 13, rx: 7, rz: 5, sp: -0.05 },
      { color: "#e1b54a", cx: -10, cz: 24, rx: 5, rz: 3, sp: 0.09 },
    ];
    specs.forEach((s, i) => {
      const b = make(s.color);
      b.userData = { ...s, phase: i * 2.1 };
      boats.push(b);
    });
    // 河上小船（沿頭前溪往返）
    const rb = make("#8b6fb0");
    rb.scale.setScalar(0.7);
    rb.userData = { river: true, phase: 0 };
    boats.push(rb);
  }
  function updateBoats(t) {
    boats.forEach((b) => {
      const u = b.userData;
      if (u.river) {
        const k = (Math.sin(t * 0.08) + 1) / 2;
        const x = lerp(-10, 40, k);
        b.position.set(x, -0.15 + Math.sin(t * 1.5) * 0.05, 16 + Math.sin(x * 0.2) * 0.4);
        b.rotation.y = Math.cos(t * 0.08) > 0 ? 0 : Math.PI;
        return;
      }
      const a = t * u.sp + u.phase;
      b.position.set(u.cx + Math.cos(a) * u.rx, -0.12 + Math.sin(t * 1.3 + u.phase) * 0.07, u.cz + Math.sin(a) * u.rz);
      const dx = -Math.sin(a) * u.rx * Math.sign(u.sp), dz = Math.cos(a) * u.rz * Math.sign(u.sp);
      b.rotation.y = Math.atan2(-dz, dx);
      b.rotation.z = Math.sin(t * 1.1 + u.phase) * 0.05;
    });
  }

  /* ---------- 協作路線：沿著小人實際走的地面與木棧道 ---------- */
  const linksGroup = new THREE.Group();
  scene.add(linksGroup);
  let linksOn = false;
  const pulses = []; // { pts:[[x,z]...], dot, phase, line, a, b }
  {
    const seen = new Set();
    const dotGeo = track(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 10));
    themes.forEach((th) => {
      (th.links || []).forEach((to) => {
        if (!islands.has(to) || to === th.id) return;
        const key = [th.id, to].sort().join("|");
        if (seen.has(key)) return;
        seen.add(key);
        const a = islands.get(th.id).group.position, b = islands.get(to).group.position;
        // 兩島中心間的直線，與木棧道同一條；高度每幀依地面決定
        const n = Math.max(8, Math.round(Math.hypot(b.x - a.x, b.z - a.z) / 0.6));
        const pts = [];
        for (let i = 0; i <= n; i++) pts.push([lerp(a.x, b.x, i / n), lerp(a.z, b.z, i / n)]);
        const lm = track(new THREE.MeshBasicMaterial({ color: th.color || "#555", transparent: true, opacity: 0.9 }));
        const line = new THREE.InstancedMesh(dotGeo, lm, pts.length);
        line.userData = { a: th.id, b: to, isLink: true };
        line.frustumCulled = false;
        line.visible = false;
        linksGroup.add(line);
        const dot = mesh(new THREE.SphereGeometry(0.16, 10, 8), track(new THREE.MeshBasicMaterial({ color: th.color || "#555" })), 0, 0, 0, false);
        dot.visible = false;
        linksGroup.add(dot);
        pulses.push({ pts, dot, phase: Math.random(), line, a: th.id, b: to });
      });
    });
  }
  // 路線所在的地面高度：島上貼著島面，海上貼著木棧道
  const groundY = (x, z) => {
    const isl = islandAt(x, z);
    return isl ? TOP + isl.group.position.y + 0.025 : DECK_Y + 0.06;
  };
  const linkM4 = new THREE.Matrix4();
  function updateLinks(t) {
    pulses.forEach((p) => {
      if (!p.line.visible) return;
      p.pts.forEach(([x, z], i) => {
        linkM4.makeTranslation(x, groundY(x, z), z);
        p.line.setMatrixAt(i, linkM4);
      });
      p.line.instanceMatrix.needsUpdate = true;
      const f = ((t * 0.12 + p.phase) % 1) * (p.pts.length - 1);
      const i = Math.floor(f), k = f - i;
      const [x0, z0] = p.pts[i], [x1, z1] = p.pts[Math.min(i + 1, p.pts.length - 1)];
      const x = lerp(x0, x1, k), z = lerp(z0, z1, k);
      p.dot.position.set(x, groundY(x, z) + 0.14, z);
    });
  }
  // 協作線打開時全部顯示；沒打開時只顯示目前選取任務的路線
  function refreshLinks() {
    const task = activeTaskId && tasks.find((k) => k.id === activeTaskId);
    const pair = task ? [task.from, task.to].sort().join("|") : null;
    pulses.forEach((p) => {
      const isActive = pair === [p.a, p.b].sort().join("|");
      p.line.visible = p.dot.visible = linksOn || isActive;
    });
  }

  /* ---------- 搬運小人：沿木棧道在協作島之間來回 ---------- */
  const carriersGroup = new THREE.Group();
  scene.add(carriersGroup);
  const carriers = []; // { task, w, tag, len, mid }
  let carriersOn = true, namesOn = false, activeTaskId = null;
  const DECK_Y = 0.06;
  const hitMat = track(new THREE.MeshBasicMaterial({ visible: false }));
  const islandAt = (x, z) => {
    for (const isl of islands.values()) {
      const p = isl.group.position;
      if (Math.hypot(x - p.x, z - p.z) < isl.r - 0.15) return isl;
    }
    return null;
  };
  {
    const built = new Set();
    tasks.forEach((task, ti) => {
      const A = islands.get(task.from), B = islands.get(task.to);
      if (!A || !B || A === B) return;
      const pa = A.group.position, pb = B.group.position;
      const dir = new THREE.Vector3(pb.x - pa.x, 0, pb.z - pa.z);
      const len = dir.length();
      dir.normalize();

      // 木棧道（島上的部分會被島面蓋住，只露出海上那段）
      const key = [task.from, task.to].sort().join("|");
      if (!built.has(key)) {
        built.add(key);
        const bridge = new THREE.Group();
        bridge.position.set((pa.x + pb.x) / 2, 0, (pa.z + pb.z) / 2);
        bridge.rotation.y = Math.atan2(-dir.z, dir.x);
        box(bridge, len, 0.08, 0.8, "#c9a47c", 0, DECK_Y - 0.04, 0);
        box(bridge, len, 0.04, 0.05, "#a9825c", 0, DECK_Y + 0.16, 0.38);
        box(bridge, len, 0.04, 0.05, "#a9825c", 0, DECK_Y + 0.16, -0.38);
        for (let s = -len / 2 + 0.6; s < len / 2; s += 1.4) {
          box(bridge, 0.05, 0.18, 0.05, "#a9825c", s, DECK_Y, 0.38);
          box(bridge, 0.05, 0.18, 0.05, "#a9825c", s, DECK_Y, -0.38);
          box(bridge, 0.12, 0.7, 0.12, "#8a6a4c", s, -0.65, 0);
        }
        scene.add(bridge);
      }

      const start = new THREE.Vector3(pa.x + dir.x * A.r * 0.45, 0, pa.z + dir.z * A.r * 0.45);
      const end = new THREE.Vector3(pb.x - dir.x * B.r * 0.45, 0, pb.z - dir.z * B.r * 0.45);
      const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(0.17); // 去程靠右、回程靠左
      const walkT = start.distanceTo(end) / 1.1, restT = 1.4, cycle = 2 * (walkT + restT);
      const cargoA = mat(A.theme.color || "#888"), cargoB = mat(B.theme.color || "#888");

      for (let k = 0; k < 2; k++) {
        const w = new THREE.Group();
        const role = ROLES[(task.crew || [])[k]] || ROLES.市民;
        const ch = makeCharacter(role, 500 + ti * 2 + k);
        ch.scale.multiplyScalar(1.15);
        w.add(ch);
        // 背上的搬運箱：去程裝 A 島的資源、回程換成 B 島的
        const cargo = new THREE.Mesh(cg("crate", () => new RoundedBoxGeometry(0.2, 0.2, 0.13, 2, 0.03)), mat(A.theme.color || "#888"));
        cargo.position.set(0, 0.36, -0.14);
        cargo.castShadow = true;
        ch.userData.body.add(cargo);
        const strap = part(ch.userData.body, cg("strap", () => new THREE.BoxGeometry(0.212, 0.025, 0.142)), "#5b5340", 0, 0.4, 0);
        strap.castShadow = false;
        const hit = new THREE.Mesh(track(new THREE.CylinderGeometry(0.38, 0.38, 1.0, 8)), hitMat);
        hit.position.y = 0.45;
        w.add(hit);
        w.traverse((o) => { o.userData.taskId = task.id; });
        carriersGroup.add(w);

        // 名牌：顯示這位人物的身份
        const el = document.createElement("div");
        el.className = "zb-carrier-tag";
        el.textContent = (task.crew || [])[k] || "市民";
        el.title = task.title || task.id;
        el.addEventListener("click", (e) => { e.stopPropagation(); selectTask(task.id); });
        const tag = new CSS2DObject(el);
        tag.position.set(0, 1.05, 0);
        tag.visible = false;
        w.add(tag);
        carriers.push({ task, w, tag, len, mid: new THREE.Vector3((pa.x + pb.x) / 2, 0.6, (pa.z + pb.z) / 2) });

        const phase = (k * cycle) / 2 + ti * 0.9;
        anims.push((t) => {
          const u = (t + phase) % cycle;
          let p, forward, moving = true;
          if (u < walkT) { p = u / walkT; forward = true; }
          else if (u < walkT + restT) { p = 1; forward = true; moving = false; }
          else if (u < 2 * walkT + restT) { p = 1 - (u - walkT - restT) / walkT; forward = false; }
          else { p = 0; forward = false; moving = false; }
          const sgn = forward ? 1 : -1;
          const x = lerp(start.x, end.x, p) + side.x * sgn;
          const z = lerp(start.z, end.z, p) + side.z * sgn;
          const isl = islandAt(x, z);
          const gy = isl ? TOP + isl.group.position.y : DECK_Y + 0.04;
          w.position.x = x;
          w.position.z = z;
          w.position.y += (gy - w.position.y) * 0.3;
          ch.userData.step(t * 9 + phase, moving);
          w.rotation.y = Math.atan2(dir.x * sgn, dir.z * sgn);
          // 到站換貨：去程搬 A 的資源，回程帶 B 的資源
          cargo.material = (forward && p < 1) || (!forward && p === 0) ? cargoA : cargoB;
        });
      }
    });
  }
  function refreshCarrierTags() {
    refreshLinks();
    carriers.forEach((c) => {
      const on = c.task.id === activeTaskId;
      c.w.scale.setScalar(on ? 1.35 : 1);
      if (c.tag) {
        c.tag.element.classList.toggle("is-active", on);
        c.tag.visible = carriersOn && (namesOn || on);
      }
    });
  }

  /* ---------- 時間（光線過場） ---------- */
  const COLOR_KEYS = ["skyTop", "skyBottom", "fog", "sun", "hemiSky", "hemiGround", "water", "land"];
  const NUM_KEYS = ["sunI", "hemiI", "glow", "stars", "waterE"];
  const toState = (p) => {
    const s = {};
    COLOR_KEYS.forEach((k) => (s[k] = new THREE.Color(p[k])));
    NUM_KEYS.forEach((k) => (s[k] = p[k]));
    s.sunPos = new THREE.Vector3(...p.sunPos);
    return s;
  };
  let cur = toState(PRESETS.day);
  let todFrom = null, todTo = null, todT = 1;
  let timeOfDay = "day";
  function applyLighting(s) {
    skyUniforms.top.value.copy(s.skyTop);
    skyUniforms.bottom.value.copy(s.skyBottom);
    scene.fog.color.copy(s.fog);
    sun.color.copy(s.sun); sun.intensity = s.sunI;
    sun.position.copy(HOME_TARGET).add(s.sunPos);
    hemi.color.copy(s.hemiSky); hemi.groundColor.copy(s.hemiGround); hemi.intensity = s.hemiI;
    waterMat.color.copy(s.water);
    waterMat.emissive.copy(s.water).multiplyScalar(s.waterE);
    landMat.color.copy(s.land);
    windowMat.emissiveIntensity = s.glow * 1.6;
    windowMat.color.setRGB(lerp(0.87, 1, s.glow), lerp(0.9, 0.85, s.glow), lerp(0.92, 0.55, s.glow));
    lampMat.emissiveIntensity = 0.1 + s.glow * 2.2;
    neonMat.emissiveIntensity = neonMat2.emissiveIntensity = 0.7 + s.glow * 1.4;
    starMat.opacity = s.stars;
    stars.visible = s.stars > 0.01;
    renderer.setClearColor(s.fog);
  }

  /* ---------- 互動 ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hoverId = null, selectedId = null;
  let downPos = null;

  function pick(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(islandsRoot.children, true).find((h) => h.object.userData.themeId);
    return hit ? hit.object.userData.themeId : null;
  }
  // 沿用 pick() 剛設定的射線
  function pickTask() {
    if (!carriersOn) return null;
    const hit = raycaster.intersectObjects(carriersGroup.children, true).find((h) => h.object.userData.taskId);
    return hit ? hit.object.userData.taskId : null;
  }
  function setHover(id) {
    if (hoverId === id) return;
    hoverId = id;
    islands.forEach((isl, k) => isl.el.classList.toggle("is-hover", k === id));
    renderer.domElement.style.cursor = id ? "pointer" : "";
  }
  function select(id) {
    if (typeof onSelectTheme === "function") onSelectTheme(id);
  }
  function selectTask(id) {
    if (typeof onSelectTask === "function") onSelectTask(id);
  }
  const onPointerMove = (ev) => {
    if (ev.pointerType === "touch") return;
    if (ev.buttons) { setHover(null); return; }
    const themeId = pick(ev);
    if (pickTask()) { setHover(null); renderer.domElement.style.cursor = "pointer"; return; }
    setHover(themeId);
  };
  const onPointerDown = (ev) => { downPos = [ev.clientX, ev.clientY]; cancelTween(); };
  const onPointerUp = (ev) => {
    if (!downPos) return;
    const moved = Math.hypot(ev.clientX - downPos[0], ev.clientY - downPos[1]);
    downPos = null;
    if (moved > 6) return;
    const id = pick(ev);
    const taskId = pickTask();
    if (taskId) selectTask(taskId);
    else if (id) select(id);
  };
  const onPointerLeave = () => setHover(null);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointerleave", onPointerLeave);

  /* ---------- 鏡頭補間 ---------- */
  let tween = null;
  function flyTo(pos, target, dur = 1.3) {
    tween = { fromP: camera.position.clone(), fromT: controls.target.clone(), toP: pos, toT: target, t: 0, dur };
  }
  function cancelTween() { tween = null; }

  /* ---------- 建構剩餘場景 ---------- */
  buildLandscape();
  buildClouds();
  buildBoats();
  applyLighting(cur);

  /* ---------- 主迴圈 ---------- */
  const clock = new THREE.Clock();
  let paused = false;
  let inset = 0, insetTarget = 0;
  let animTime = 0;
  let raf = 0;
  const tmpV = new THREE.Vector3();
  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const realT = clock.elapsedTime;

    if (!paused) {
      animTime += dt;
      updateWater(animTime);
      clouds.forEach((c) => {
        c.position.x += dt * c.userData.speed;
        if (c.position.x > 95) c.position.x = -95;
      });
      updateBoats(animTime);
      for (const fn of anims) fn(animTime, dt);
    }
    updateLinks(animTime);

    // 時間過場
    if (todT < 1) {
      todT = Math.min(1, todT + dt / 1.2);
      const k = easeInOutCubic(todT);
      COLOR_KEYS.forEach((key) => cur[key].copy(todFrom[key]).lerp(todTo[key], k));
      NUM_KEYS.forEach((key) => (cur[key] = lerp(todFrom[key], todTo[key], k)));
      cur.sunPos.copy(todFrom.sunPos).lerp(todTo.sunPos, k);
      applyLighting(cur);
    }

    // 島嶼抬升與高亮
    islands.forEach((isl, id) => {
      isl.liftTarget = id === selectedId ? 0.45 : id === hoverId ? 0.3 : 0;
      isl.lift = lerp(isl.lift, isl.liftTarget, 1 - Math.pow(0.001, dt));
      isl.group.position.y = isl.lift;
      isl.bandMat.emissiveIntensity = id === selectedId ? 0.45 + Math.sin(realT * 3) * 0.2 : id === hoverId ? 0.25 : 0;
    });

    // 鏡頭補間
    if (tween) {
      tween.t = Math.min(1, tween.t + dt / tween.dur);
      const k = easeInOutCubic(tween.t);
      camera.position.lerpVectors(tween.fromP, tween.toP, k);
      controls.target.lerpVectors(tween.fromT, tween.toT, k);
      if (tween.t >= 1) tween = null;
    }
    // 平移範圍限制
    controls.target.x = THREE.MathUtils.clamp(controls.target.x, -12, 26);
    controls.target.z = THREE.MathUtils.clamp(controls.target.z, -14, 14);
    controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0, 2);
    controls.update();

    // 底部卡片遮住畫面時，把畫面中心往上移到露出的區域
    if (Math.abs(inset - insetTarget) > 0.5) {
      inset = lerp(inset, insetTarget, 1 - Math.pow(0.002, dt));
      const w = width(), h = height();
      if (inset > 0.5) camera.setViewOffset(w, h, 0, inset / 2, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }

    // 霧距離跟著鏡頭距離調整，近看更清楚
    const dist = camera.position.distanceTo(controls.target);
    scene.fog.near = dist + 10;
    scene.fog.far = dist + 115;

    sky.position.copy(camera.position);
    stars.position.copy(camera.position);
    tmpV.copy(controls.target);
    sun.target.position.copy(tmpV);
    sun.position.copy(tmpV).add(cur.sunPos);

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
  frame();

  /* ---------- resize ---------- */
  function onResize() {
    const w = width(), h = height();
    if (!w || !h) return;
    camera.aspect = w / h;
    // 窄螢幕時拉遠一點，維持全島可見
    camera.fov = w / h < 0.8 ? 42 : 30;
    if (inset > 0.5) camera.setViewOffset(w, h, 0, inset / 2, w, h);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
  }
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
  if (ro) ro.observe(container);
  window.addEventListener("resize", onResize);
  onResize();

  /* ---------- 公開 API ---------- */
  function focusTheme(id) {
    const isl = islands.get(id);
    if (!isl) return;
    selectedId = id;
    activeTaskId = null;
    refreshCarrierTags();
    islands.forEach((o, k) => {
      o.el.classList.toggle("is-active", k === id);
      o.el.classList.toggle("is-dim", k !== id);
    });
    linksGroup.children.forEach((l) => {
      if (l.userData.isLink) l.material.opacity = l.userData.a === id || l.userData.b === id ? 1 : 0.3;
    });
    const target = new THREE.Vector3(isl.group.position.x, 0.6, isl.group.position.z);
    // 保留目前方位角，拉近並固定俯角
    const off = camera.position.clone().sub(controls.target);
    let az = Math.atan2(off.x, off.z);
    az = THREE.MathUtils.clamp(az, controls.minAzimuthAngle, controls.maxAzimuthAngle);
    flyTo(sphericalPos(target, az, 0.86, FOCUS_DIST), target);
  }
  function focusTask(id) {
    const c = carriers.find((o) => o.task.id === id);
    if (!c) return;
    const { from, to } = c.task;
    selectedId = null;
    activeTaskId = id;
    refreshCarrierTags();
    islands.forEach((o, k) => {
      const on = k === from || k === to;
      o.el.classList.toggle("is-active", on);
      o.el.classList.toggle("is-dim", !on);
    });
    linksGroup.children.forEach((l) => {
      if (l.userData.isLink) l.material.opacity = [l.userData.a, l.userData.b].sort().join() === [from, to].sort().join() ? 1 : 0.3;
    });
    const off = camera.position.clone().sub(controls.target);
    const az = THREE.MathUtils.clamp(Math.atan2(off.x, off.z), controls.minAzimuthAngle, controls.maxAzimuthAngle);
    const target = c.mid.clone();
    flyTo(sphericalPos(target, az, 0.86, THREE.MathUtils.clamp(c.len * 1.6, 24, 50)), target);
  }
  function resetView() {
    selectedId = null;
    activeTaskId = null;
    refreshCarrierTags();
    islands.forEach((o) => o.el.classList.remove("is-active", "is-dim"));
    linksGroup.children.forEach((l) => { if (l.userData.isLink) l.material.opacity = 0.9; });
    flyTo(sphericalPos(HOME_TARGET, HOME_AZIMUTH, HOME_POLAR, HOME_DIST), HOME_TARGET.clone());
  }
  function setTimeOfDay(t) {
    if (!PRESETS[t]) return;
    timeOfDay = t;
    todFrom = {};
    COLOR_KEYS.forEach((k) => (todFrom[k] = cur[k].clone()));
    NUM_KEYS.forEach((k) => (todFrom[k] = cur[k]));
    todFrom.sunPos = cur.sunPos.clone();
    todTo = toState(PRESETS[t]);
    todT = 0;
    container.classList.toggle("zb-night", t === "night");
  }
  function setPaused(p) { paused = !!p; }
  // px：畫面底部被 UI 蓋住的高度
  function setBottomInset(px) { insetTarget = Math.max(0, Math.min(px || 0, height() * 0.7)); }
  function showLinks(v) { linksOn = !!v; refreshLinks(); }
  function showCarriers(v) { carriersOn = !!v; carriersGroup.visible = carriersOn; refreshCarrierTags(); }
  function showNames(v) { namesOn = !!v; refreshCarrierTags(); }
  function dispose() {
    cancelAnimationFrame(raf);
    if (ro) ro.disconnect();
    window.removeEventListener("resize", onResize);
    renderer.domElement.removeEventListener("pointermove", onPointerMove);
    renderer.domElement.removeEventListener("pointerdown", onPointerDown);
    renderer.domElement.removeEventListener("pointerup", onPointerUp);
    renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
    controls.dispose();
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
    disposables.forEach((d) => d.dispose && d.dispose());
    renderer.dispose();
    renderer.domElement.remove();
    labelRenderer.domElement.remove();
    container.classList.remove("zb-night");
  }

  return { focusTheme, focusTask, resetView, setBottomInset, setTimeOfDay, setPaused, showLinks, showCarriers, showNames, dispose,
    // 非契約、方便除錯
    get timeOfDay() { return timeOfDay; } };
}
