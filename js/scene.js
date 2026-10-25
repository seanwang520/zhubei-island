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
  youth: { x: -8, z: -7, r: 4.1 },       // 新月沙灣（西側海岸）
  market: { x: 1, z: -9, r: 4.0 },
  resilience: { x: 10, z: -9, r: 3.9 },  // 頭前溪河濱
  digital: { x: 19, z: -6, r: 4.0 },     // 東側科技區
  space: { x: -6, z: 2, r: 4.0 },        // 濱海公園
  care: { x: 3, z: 0, r: 4.2 },          // 舊城住宅
  service: { x: 12, z: 0.5, r: 3.9 },
  traffic: { x: 21, z: 3.5, r: 4.4 },    // 高鐵站一帶
  culture: { x: -1, z: 10, r: 4.0 },     // 新瓦屋
  edu: { x: 8.5, z: 9.5, r: 4.1 },
};
const HOME_TARGET = new THREE.Vector3(2, 0, 1.5);
const HOME_AZIMUTH = -0.55; // 從西南方望向東北
const HOME_POLAR = 0.92;
const HOME_DIST = 82;
const FOCUS_DIST = 30;
const TOP = 0.32; // 島面高度（島嶼本地座標）
// 手機順暢模式：觸控裝置或小螢幕降低解析度、陰影與人數，並限 30fps
const LITE = typeof window !== "undefined" && (window.matchMedia?.("(pointer: coarse)").matches || Math.min(screen.width, screen.height) < 768);

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

export function createScene(container, themes = [], { onSelectTheme, onSelectTask, tasks = [], homeDist = HOME_DIST } = {}) {
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

  const renderer = new THREE.WebGLRenderer({ antialias: !LITE, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LITE ? 1.5 : 2));
  renderer.setSize(width(), height());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = LITE ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
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
  camera.position.copy(sphericalPos(HOME_TARGET, HOME_AZIMUTH, HOME_POLAR, homeDist));
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
  // 夜晚會亮起來的材質：[材質, 白天發光強度, 夜晚發光強度]
  const glowMats = [];
  const glowing = (m, night) => {
    if (!glowMats.some((g) => g[0] === m)) glowMats.push([m, m.emissiveIntensity, night]);
    return m;
  };
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
  sun.shadow.mapSize.setScalar(LITE ? 1024 : 2048);
  const sc = sun.shadow.camera;
  sc.left = -42; sc.right = 42; sc.top = 32; sc.bottom = -32; sc.near = 1; sc.far = 160;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  sun.target.position.copy(HOME_TARGET);
  scene.add(sun, sun.target);

  /* ---------- 海面（低多邊形微波） ---------- */
  const waterGeo = track(new THREE.PlaneGeometry(420, 420, LITE ? 48 : 90, LITE ? 48 : 90));
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
    if (LITE && n % 2) { // 手機上島民減半：回傳不加進場景的空殼
      const ghost = new THREE.Group();
      ghost.userData.step = () => {};
      return ghost;
    }
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

  /* ---------- 地標造型小工具 ---------- */
  function wheels(parent, pts, r = 0.09) {
    pts.forEach(([x, z]) => {
      const w = mesh(new THREE.CylinderGeometry(r, r, 0.06, 10), mat("#2e3238"), x, r, z);
      w.rotation.x = Math.PI / 2; parent.add(w);
    });
  }
  // 貼地平面（水面、廣場、道路）
  function decal(parent, geo, color, x, z, lift = 0.012, opts = {}) {
    const m = mesh(geo, mat(color, { side: THREE.DoubleSide, ...opts }), x, TOP + lift, z, false);
    m.rotation.x = -Math.PI / 2;
    parent.add(m);
    return m;
  }
  // 人字屋頂：屋脊沿 z 方向，rot 轉向
  function gableRoof(parent, span, len, rh, color, x, y, z, rot = 0) {
    const s = new THREE.Shape();
    s.moveTo(-span / 2, 0); s.lineTo(span / 2, 0); s.lineTo(0, rh); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
    geo.translate(0, 0, -len / 2);
    const m = mesh(geo, mat(color), x, y, z);
    m.rotation.y = rot;
    parent.add(m);
    return m;
  }
  function starShape(ro, ri) {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? ri : ro, a = Math.PI / 2 + (i * Math.PI) / 5;
      if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    s.closePath();
    return s;
  }
  const glassMat = () => mat("#cfe7ee", { transparent: true, opacity: 0.5, roughness: 0.1 });

  /* ---------- 主題造型：每座島是一個竹北地標 ---------- */
  const BUILDERS = {
    // 台大醫院新竹分院生醫醫院（竹北院區）
    care(g, c) {
      building(g, { w: 2.6, h: 2.5, d: 1.1, color: "#f7f6f2", x: -0.3, z: -1.5, roof: "flat", roofColor: "#d9dde0" });
      building(g, { w: 1.3, h: 1.0, d: 1.5, color: "#eef2f1", x: 1.75, z: -1.0, roof: "flat", roofColor: "#9fc7c0" });
      // 立面紅十字
      box(g, 0.42, 0.12, 0.04, "#d6453d", -0.3, TOP + 2.0, -0.92);
      box(g, 0.12, 0.42, 0.04, "#d6453d", -0.3, TOP + 1.85, -0.92);
      // 屋頂停機坪
      g.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 20), mat("#5d6470"), -0.3, TOP + 2.58, -1.5));
      box(g, 0.06, 0.02, 0.34, "#ffffff", -0.42, TOP + 2.6, -1.5);
      box(g, 0.06, 0.02, 0.34, "#ffffff", -0.18, TOP + 2.6, -1.5);
      box(g, 0.24, 0.02, 0.06, "#ffffff", -0.3, TOP + 2.6, -1.5);
      // 入口雨遮
      box(g, 1.3, 0.06, 0.6, c, -0.3, TOP + 0.72, -0.65);
      box(g, 0.05, 0.72, 0.05, "#cfd4d8", -0.9, TOP, -0.4); box(g, 0.05, 0.72, 0.05, "#cfd4d8", 0.3, TOP, -0.4);
      // 迴車道與中央花圃
      decal(g, new THREE.RingGeometry(0.5, 0.85, 24), "#d6cdbb", -0.3, 0.55);
      decal(g, new THREE.CircleGeometry(0.5, 24), "#9cc97a", -0.3, 0.55, 0.016);
      tree(g, -0.3, 0.55, 0.7, "#93bf72");
      // 救護車（警示燈閃爍）
      const amb = new THREE.Group();
      const ab = rbox(0.85, 0.42, 0.42, "#ffffff", 0.08); ab.position.y = 0.3; ab.castShadow = true; amb.add(ab);
      box(amb, 0.87, 0.07, 0.44, "#d6453d", 0, 0.24, 0);
      const sirenMat = track(new THREE.MeshStandardMaterial({ color: "#ff6b5e", emissive: "#ff3b2e", emissiveIntensity: 0.6 }));
      amb.add(mesh(new THREE.BoxGeometry(0.16, 0.06, 0.12), sirenMat, 0.18, 0.54, 0, false));
      wheels(amb, [[-0.27, 0.2], [0.27, 0.2], [-0.27, -0.2], [0.27, -0.2]]);
      amb.position.set(1.7, TOP, 0.6); amb.rotation.y = -0.4; g.add(amb);
      anims.push((t) => (sirenMat.emissiveIntensity = Math.sin(t * 6) > 0 ? 1.2 : 0.2));
      // 院區花園
      tree(g, -2.5, 0.2, 0.9); tree(g, -2.2, 1.6, 0.85, "#6fa361", 1); tree(g, 0.9, 2.3, 0.8, "#93bf72"); tree(g, 2.6, -0.2, 0.75);
      bench(g, -1.6, 1.9); bench(g, -0.6, 2.4, 0.5); lamp(g, -1.4, 0.2); lamp(g, 0.9, 1.4);
      walker(g, [-2.0, 2.3], [-0.6, 1.6], "#d9774b", 0.35);
      walker(g, [-1.0, -0.2], [0.6, 1.6], "#4f9da6", 0.45, 1);
      person(g, -1.75, 2.05, "#8b6fb0"); person(g, -1.45, 2.05, "#e1b54a"); person(g, 1.1, 0.0, "#5a8f5a");
    },
    // 竹北市公所
    service(g, c) {
      building(g, { w: 3.2, h: 1.75, d: 1.2, color: "#f1ece2", x: 0, z: -1.4, roof: "flat", roofColor: "#c9c1b0" });
      building(g, { w: 1.0, h: 2.3, d: 1.3, color: "#e6ddcc", x: 0, z: -1.35, roof: "flat", roofColor: c, win: false });
      box(g, 0.62, 1.7, 0.03, windowMat, 0, TOP + 0.5, -0.69);
      // 入口門廊與台階
      box(g, 1.4, 0.08, 0.7, "#f6f2ea", 0, TOP + 0.62, -0.45);
      [-0.6, -0.2, 0.2, 0.6].forEach((x) => g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.62, 8), mat("#ffffff"), x, TOP + 0.31, -0.18)));
      box(g, 1.6, 0.05, 0.3, "#d9d2c3", 0, TOP, 0.05); box(g, 1.6, 0.05, 0.2, "#d9d2c3", 0, TOP + 0.05, -0.05);
      // 廣場噴水池
      decal(g, new THREE.CircleGeometry(1.6, 6), "#e8dfcd", 0, 1.3);
      g.add(mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.12, 20), mat("#cfc8b8"), 0, TOP + 0.06, 1.3));
      decal(g, new THREE.CircleGeometry(0.48, 20), "#8fd3d6", 0, 1.3, 0.125);
      const jet = mesh(new THREE.ConeGeometry(0.1, 0.5, 8), mat("#c8eef0", { transparent: true, opacity: 0.75 }), 0, TOP + 0.37, 1.3, false);
      g.add(jet);
      anims.push((t) => (jet.scale.y = 0.8 + Math.sin(t * 3) * 0.2));
      // 旗桿
      [-1.2, -1.45, -1.7].forEach((x, i) => {
        box(g, 0.035, 1.5, 0.035, "#d0d0d0", x, TOP, 0.1);
        box(g, 0.02, 0.2, 0.32, [c, "#e1b54a", "#4f9da6"][i], x, TOP + 1.25, 0.27);
      });
      // 31 里服務車
      const van = rbox(0.9, 0.45, 0.45, "#ffffff", 0.1); van.position.set(1.9, TOP + 0.3, 1.5); van.castShadow = true; g.add(van);
      box(g, 0.92, 0.08, 0.47, c, 1.9, TOP + 0.26, 1.5);
      wheels(g, [[1.6, 1.28], [2.2, 1.28], [1.6, 1.72], [2.2, 1.72]]);
      tree(g, -2.5, -0.6, 0.85); tree(g, 2.5, -0.4, 0.8, "#93bf72"); tree(g, -2.2, 1.9, 0.85, "#6fa361", 1); tree(g, 0.6, 2.8, 0.7);
      for (let i = 0; i < 4; i++) person(g, -0.45 + i * 0.3, 0.35, ["#d9774b", "#4f9da6", "#e1b54a", "#8b6fb0"][i]);
      walker(g, [-2.0, 1.0], [-0.8, 2.4], "#5a8f5a", 0.5);
      walker(g, [1.0, 2.3], [1.3, 0.4], "#e57d6a", 0.4, 2);
      lamp(g, 1.2, 0.5); lamp(g, -1.2, 2.3);
    },
    // 竹北市立圖書館福德分館：舊建物翻新，一樓落地窗面向福德廣場，以星空為主題
    edu(g, c) {
      building(g, { w: 3.0, h: 1.5, d: 1.3, color: "#f4efe6", x: 0, z: -1.4, roof: "flat", roofColor: "#d8cdb8", win: false });
      box(g, 2.6, 0.3, 0.03, windowMat, 0, TOP + 1.0, -0.73);
      // 書架（隔著落地窗看得到）
      const spines = ["#d9774b", "#4f9da6", "#e1b54a", "#8b6fb0", "#5a8f5a", c];
      for (let i = 0; i < 6; i++) {
        box(g, 0.36, 0.6, 0.12, "#b9875c", -1.15 + i * 0.46, TOP, -1.0);
        for (let k = 0; k < 4; k++) box(g, 0.07, 0.2, 0.1, spines[(i + k) % spines.length], -1.27 + i * 0.46 + k * 0.08, TOP + 0.36, -0.96);
      }
      // 一樓落地窗 + 窗框
      box(g, 2.9, 0.78, 0.03, glassMat(), 0, TOP + 0.02, -0.73);
      for (let i = 0; i <= 7; i++) box(g, 0.03, 0.78, 0.05, "#3e4a52", -1.45 + i * (2.9 / 7), TOP + 0.02, -0.72);
      box(g, 3.1, 0.06, 0.45, "#3e4a52", 0, TOP + 0.8, -0.55);
      // 屋頂的太陽、月亮、星星
      const sunMat = glowing(mat("#f2b84b", { emissive: "#f2a33b", emissiveIntensity: 0.35 }), 1.4);
      const sunBall = mesh(new THREE.IcosahedronGeometry(0.26, 1), sunMat, -1.0, TOP + 1.95, -1.4);
      g.add(sunBall);
      const moon = mesh(new THREE.TorusGeometry(0.22, 0.07, 6, 18, Math.PI * 1.25), glowing(mat("#f4e7b0", { emissive: "#f0d77a", emissiveIntensity: 0.3 }), 1.4), 0.1, TOP + 1.95, -1.4);
      moon.rotation.z = 1.2; g.add(moon);
      const starGeoE = new THREE.ExtrudeGeometry(starShape(0.16, 0.07), { depth: 0.05, bevelEnabled: false });
      const starsE = [[0.75, 1.85], [1.1, 2.15], [1.0, 1.7]].map(([x, y], i) => {
        const s = mesh(i ? starGeoE.clone() : starGeoE, glowing(mat("#ffd86b", { emissive: "#ffc93b", emissiveIntensity: 0.5 }), 1.8), x, TOP + y, -1.4);
        s.scale.setScalar(i === 1 ? 0.8 : 1); g.add(s); return s;
      });
      anims.push((t) => {
        sunBall.rotation.y = t * 0.4;
        starsE.forEach((s, i) => (s.rotation.y = t * 0.8 + i));
      });
      // 福德廣場（地磚）
      decal(g, new THREE.PlaneGeometry(4.2, 2.0), "#eadfca", 0, 0.75);
      for (let i = 0; i < 6; i++) decal(g, new THREE.PlaneGeometry(0.03, 2.0), "#d6c7ab", -1.75 + i * 0.7, 0.75, 0.014);
      // 戶外閱讀座
      [[-1.4, 0.6], [1.3, 0.5]].forEach(([x, z]) => {
        g.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.18, 16), mat("#c69a6b"), x, TOP + 0.09, z));
        tree(g, x, z, 0.7, "#93bf72");
      });
      tree(g, -2.5, -0.4, 0.85, "#6fa361", 1); tree(g, 2.5, -0.5, 0.8); tree(g, -2.1, 2.2, 0.8, "#93bf72"); tree(g, 2.2, 2.1, 0.8, "#6fa361");
      person(g, -0.9, 0.9, "#4f9da6"); person(g, -0.6, 1.0, "#e1b54a"); person(g, 0.8, 0.4, "#d9774b");
      walker(g, [-1.6, 2.3], [0.4, 0.3], "#e1b54a", 0.6);
      walker(g, [1.8, 1.6], [0.0, 2.4], "#8b6fb0", 0.5, 2);
      lamp(g, -0.3, 1.9); lamp(g, 1.6, 1.4);
    },
    // 高鐵新竹站（弧形大屋頂 + 高架軌道）與光明地下道
    traffic(g, c) {
      // 高架橋
      const deckY = TOP + 1.2;
      [-3.0, -1.0, 0.0, 1.0, 2.0, 3.0].forEach((x) => box(g, 0.22, 1.2, 0.3, "#d7d3cb", x, TOP, -1.3));
      box(g, 6.8, 0.14, 0.72, "#e4e0d8", 0, deckY, -1.3);
      box(g, 6.8, 0.1, 0.04, "#c9c4ba", 0, deckY + 0.14, -1.64); box(g, 6.8, 0.1, 0.04, "#c9c4ba", 0, deckY + 0.14, -0.96);
      // 高鐵列車（兩端車頭）
      const train = new THREE.Group();
      const carMat = "#f6f6f4";
      for (let i = 0; i < 3; i++) {
        const car = rbox(0.9, 0.32, 0.34, carMat, 0.1); car.position.set(-0.94 + i * 0.94, 0.2, 0); car.castShadow = true; train.add(car);
        box(train, 0.86, 0.05, 0.35, "#e8713c", -0.94 + i * 0.94, 0.13, 0);
        box(train, 0.7, 0.07, 0.35, windowMat, -0.94 + i * 0.94, 0.24, 0);
      }
      [-1, 1].forEach((sgn) => {
        const nose = mesh(new THREE.ConeGeometry(0.17, 0.55, 10), mat(carMat), sgn * 1.65, 0.2, 0);
        nose.rotation.z = -sgn * Math.PI / 2; nose.scale.set(1, 1, 0.95); train.add(nose);
      });
      train.position.set(0, deckY + 0.14, -1.3);
      g.add(train);
      anims.push((t) => (train.position.x = Math.sin(t * 0.25) * 1.3));
      // 車站弧形屋頂
      const shell = mesh(new THREE.CylinderGeometry(1.25, 1.25, 2.6, 18, 1, true, 0, Math.PI), mat("#dbe7ee", { side: THREE.DoubleSide, transparent: true, opacity: 0.78 }), 1.0, TOP + 0.5, -1.3);
      shell.rotation.z = Math.PI / 2; g.add(shell);
      [-1.2, -0.4, 0.4, 1.2].forEach((dx) => {
        const rib = mesh(new THREE.TorusGeometry(1.25, 0.035, 5, 18, Math.PI), mat(c), 1.0 + dx, TOP + 0.5, -1.3);
        rib.rotation.y = Math.PI / 2; g.add(rib);
      });
      box(g, 2.5, 0.5, 2.3, "#eef1f3", 1.0, TOP, -1.3);
      box(g, 2.3, 0.3, 0.03, windowMat, 1.0, TOP + 0.1, -0.14);
      // 光明地下道：道路下坡穿過高架橋
      decal(g, new THREE.PlaneGeometry(0.9, 2.5), "#6b6f77", -2.0, 1.55);
      decal(g, new THREE.PlaneGeometry(0.9, 0.9), "#4a4e55", -2.0, -0.15);
      box(g, 0.08, 0.3, 1.0, "#cfc8b8", -2.48, TOP, -0.15); box(g, 0.08, 0.3, 1.0, "#cfc8b8", -1.52, TOP, -0.15);
      box(g, 1.1, 0.42, 0.3, "#cfc8b8", -2.0, TOP, -0.75);
      box(g, 0.8, 0.3, 0.02, "#2b2f35", -2.0, TOP, -0.59);
      box(g, 1.14, 0.06, 0.34, c, -2.0, TOP + 0.42, -0.75);
      // 平面道路、公車、自行車道
      const road = "#6b6f77";
      box(g, 6.6, 0.03, 0.9, road, 0, TOP, 0.95);
      for (let i = -3; i <= 3; i++) if (Math.abs(i * 0.9 + 2.0) > 0.6) box(g, 0.4, 0.035, 0.06, "#ffffff", i * 0.9, TOP, 0.95);
      for (let i = 0; i < 5; i++) box(g, 0.1, 0.04, 0.5, "#ffffff", -1.2 + i * 0.18, TOP, 0.95);
      box(g, 6.2, 0.035, 0.32, "#5fae6e", 0, TOP, 1.75);
      const bus = new THREE.Group();
      const bb = rbox(1.35, 0.5, 0.5, c, 0.1); bb.position.y = 0.33; bb.castShadow = true; bus.add(bb);
      box(bus, 1.2, 0.14, 0.52, windowMat, 0.04, 0.37, 0);
      wheels(bus, [[-0.4, 0.22], [0.4, 0.22], [-0.4, -0.22], [0.4, -0.22]], 0.1);
      g.add(bus);
      anims.push((t) => {
        const k = (Math.sin(t * 0.35) + 1) / 2;
        bus.position.set(lerp(-2.6, 2.6, k), TOP, Math.cos(t * 0.35) > 0 ? 0.75 : 1.15);
        bus.rotation.y = Math.cos(t * 0.35) > 0 ? 0 : Math.PI;
      });
      const makeBike = (color) => {
        const b = new THREE.Group();
        [-0.12, 0.12].forEach((x) => b.add(mesh(new THREE.TorusGeometry(0.08, 0.015, 5, 12), mat("#333"), x, 0.09, 0)));
        box(b, 0.26, 0.02, 0.02, color, 0, 0.13, 0);
        const rider = person(b, 0, 0, color); rider.position.y = 0; rider.rotation.y = Math.PI / 2; rider.scale.multiplyScalar(0.8);
        return b;
      };
      [makeBike("#e1b54a"), makeBike("#4f9da6")].forEach((b, i) => {
        b.position.set(0, TOP, 1.75); g.add(b);
        anims.push((t) => (b.position.x = lerp(-2.8, 2.8, (t * 0.12 + i * 0.5) % 1)));
      });
      // 公車亭、紅綠燈
      box(g, 0.9, 0.05, 0.4, c, 2.6, TOP + 0.6, 0.25);
      box(g, 0.04, 0.6, 0.04, "#888", 2.2, TOP, 0.15); box(g, 0.04, 0.6, 0.04, "#888", 3.0, TOP, 0.15);
      box(g, 0.05, 0.9, 0.05, "#555b63", -1.4, TOP, 0.4);
      box(g, 0.12, 0.3, 0.1, "#2e3238", -1.4, TOP + 0.9, 0.4);
      g.add(mesh(new THREE.SphereGeometry(0.035, 6, 5), mat("#5fe08a", { emissive: "#3fd070", emissiveIntensity: 0.8 }), -1.4, TOP + 1.0, 0.46, false));
      tree(g, 0.2, 2.5, 0.8); tree(g, 1.6, 2.4, 0.8, "#93bf72"); tree(g, -1.0, 2.6, 0.7, "#6fa361", 1); tree(g, -3.0, 0.2, 0.7);
      walker(g, [0.2, 0.2], [2.4, 0.4], "#5d6470", 0.5);
      lamp(g, -0.4, 0.3); lamp(g, -2.6, 2.4);
    },
    // 頭前溪河濱：堤防、自行車道、抽水站、不斷電活動中心
    resilience(g, c) {
      const rz = 0.7;
      decal(g, new THREE.PlaneGeometry(6.8, 1.3), "#7cc6cf", 0, rz, 0.01, { roughness: 0.2 });
      // 堤防（斜坡 + 堤頂自行車道）
      const leveeShape = new THREE.Shape();
      leveeShape.moveTo(-0.3, 0); leveeShape.lineTo(0.3, 0); leveeShape.lineTo(0.13, 0.3); leveeShape.lineTo(-0.13, 0.3); leveeShape.closePath();
      [-1, 1].forEach((s) => {
        const geo = new THREE.ExtrudeGeometry(leveeShape, { depth: 6.4, bevelEnabled: false });
        geo.translate(0, 0, -3.2);
        const levee = mesh(geo, mat("#a9c48a"), 0, TOP, rz + s * 0.92);
        levee.rotation.y = Math.PI / 2; g.add(levee);
        box(g, 6.4, 0.02, 0.22, "#d9a066", 0, TOP + 0.3, rz + s * 0.92);
      });
      // 水流
      const foam = [];
      for (let i = 0; i < 6; i++) {
        const f = mesh(new THREE.BoxGeometry(0.4, 0.02, 0.05), mat("#ffffff", { transparent: true, opacity: 0.7 }), 0, TOP + 0.03, rz - 0.4 + (i % 3) * 0.4, false);
        g.add(f); foam.push(f);
      }
      anims.push((t) => foam.forEach((f, i) => (f.position.x = -3.2 + ((t * 0.35 + i * 1.1) % 6.4))));
      // 跨溪橋
      box(g, 0.7, 0.1, 2.4, "#c9c4ba", 1.7, TOP + 0.3, rz);
      box(g, 0.04, 0.16, 2.4, c, 1.37, TOP + 0.4, rz); box(g, 0.04, 0.16, 2.4, c, 2.03, TOP + 0.4, rz);
      // 水位標尺
      for (let i = 0; i < 5; i++) box(g, 0.07, 0.15, 0.07, i % 2 ? "#ffffff" : "#d6453d", -0.6, TOP + i * 0.15, rz + 0.3);
      // 抽水站（北岸）
      building(g, { w: 1.3, h: 1.0, d: 0.9, color: "#e9e4d8", x: -1.7, z: -1.3, roof: "flat", roofColor: "#7f8a95" });
      [-2.0, -1.5].forEach((x) => {
        const pipe = mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), mat("#5d7ea0"), x, TOP + 0.22, -0.35);
        pipe.rotation.x = Math.PI / 2; g.add(pipe);
      });
      // 不斷電活動中心（屋頂太陽能 + 儲能櫃）
      building(g, { w: 1.6, h: 0.85, d: 1.0, color: "#f3ebdc", x: 0.9, z: -1.5, roof: "flat", roofColor: "#d8d0bf" });
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const p = mesh(new THREE.BoxGeometry(0.6, 0.04, 0.4), mat("#2f4f7f", { roughness: 0.3, metalness: 0.3 }), 0.55 + i * 0.68, TOP + 1.0, -1.75 + j * 0.48);
        p.rotation.x = -0.4; g.add(p);
      }
      for (let i = 0; i < 2; i++) {
        box(g, 0.42, 0.5, 0.4, "#f4f6f5", 2.2 + i * 0.48, TOP, -1.4);
        box(g, 0.44, 0.08, 0.42, c, 2.2 + i * 0.48, TOP + 0.36, -1.4);
      }
      // 南岸：風機、防災旗
      box(g, 0.07, 2.4, 0.07, "#f2f2f2", -2.4, TOP, 2.3);
      const rotor = new THREE.Group();
      rotor.position.set(-2.4, TOP + 2.4, 2.36);
      for (let i = 0; i < 3; i++) {
        const holder = new THREE.Group(); holder.rotation.z = (i * Math.PI * 2) / 3;
        holder.add(mesh(new THREE.BoxGeometry(0.07, 0.75, 0.02), mat("#ffffff"), 0, 0.37, 0)); rotor.add(holder);
      }
      rotor.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(c)));
      g.add(rotor);
      anims.push((t, dt) => (rotor.rotation.z -= dt * 1.8));
      box(g, 0.04, 1.2, 0.04, "#cfcfcf", 0.4, TOP, 2.2);
      box(g, 0.02, 0.22, 0.36, c, 0.4, TOP + 0.95, 2.38);
      tree(g, 1.6, 2.6, 0.8, "#6fa361", 1); tree(g, -0.8, 2.6, 0.75); tree(g, 2.7, -0.3, 0.7, "#93bf72");
      walker(g, [-2.8, rz - 0.9], [1.0, rz - 0.9], "#e1b54a", 0.35);
      walker(g, [2.6, rz + 0.9], [-1.6, rz + 0.9], "#d9774b", 0.3, 1.5);
      lamp(g, -0.6, -0.5);
    },
    // 台元科技園區：玻璃帷幕大樓群
    digital(g, c) {
      const tower = (x, z, w, d, h, tint) => {
        const b = rbox(w, h, d, tint, 0.05);
        b.material = mat(tint, { roughness: 0.25, metalness: 0.35 });
        b.position.set(x, TOP + h / 2, z); b.castShadow = b.receiveShadow = true; g.add(b);
        for (let y = 0.3; y < h - 0.1; y += 0.3) box(g, w + 0.02, 0.025, d + 0.02, "#f2f5f8", x, TOP + y, z);
        box(g, w * 0.7, 0.12, d * 0.7, "#e3e8ee", x, TOP + h, z);
        return TOP + h + 0.12;
      };
      const topY = tower(-0.6, -1.3, 1.2, 1.1, 3.0, "#8fb6cf");
      tower(1.0, -1.7, 1.0, 0.9, 2.1, "#a7c7d6");
      tower(2.0, -0.4, 0.9, 1.0, 1.5, "#9dbfd2");
      tower(-2.2, -0.1, 0.9, 0.9, 1.2, "#b3cfdc");
      // 頂樓智慧城市光環
      const tw = new THREE.Group(); tw.position.set(-0.6, 0, -1.3); g.add(tw);
      box(tw, 0.04, 0.6, 0.04, "#c9d2e0", 0, topY, 0);
      const beacon = mesh(new THREE.SphereGeometry(0.11, 10, 8), neonMat, 0, topY + 0.65, 0, false);
      tw.add(beacon);
      const rings = [0.25, 0.55].map((ry, i) => {
        const r = mesh(new THREE.TorusGeometry(0.85 - i * 0.2, 0.03, 6, 36), i ? neonMat2 : neonMat, 0, topY + ry, 0, false);
        r.rotation.x = Math.PI / 2; tw.add(r); return r;
      });
      const cubes = [];
      for (let i = 0; i < 6; i++) {
        const cb = mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), i % 2 ? neonMat2 : neonMat, 0, 0, 0, false);
        g.add(cb); cubes.push(cb);
      }
      anims.push((t) => {
        rings[0].rotation.z = t * 0.6; rings[1].rotation.z = -t * 0.9;
        beacon.scale.setScalar(1 + Math.sin(t * 3) * 0.15);
        cubes.forEach((cb, i) => {
          const a = t * 0.5 + (i * Math.PI * 2) / cubes.length;
          cb.position.set(0.3 + Math.cos(a) * 1.9, TOP + 1.6 + Math.sin(t * 1.3 + i) * 0.3 + (i % 3) * 0.35, 0.2 + Math.sin(a) * 1.6);
          cb.rotation.set(t + i, t * 0.7, 0);
        });
      });
      // 園區廣場與智慧燈柱
      decal(g, new THREE.CircleGeometry(1.3, 24), "#dfe5e8", 0.4, 1.3);
      decal(g, new THREE.RingGeometry(0.5, 0.58, 24), "#9fb3c2", 0.4, 1.3, 0.016);
      [[-0.8, 1.0], [1.6, 1.0], [0.4, 2.5], [-0.6, 2.2], [1.4, 2.2]].forEach(([x, z]) => {
        box(g, 0.04, 0.7, 0.04, "#5d6470", x, TOP, z);
        g.add(mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), neonMat, x, TOP + 0.74, z, false));
      });
      // 低層研發棟（綠屋頂）
      building(g, { w: 1.3, h: 0.6, d: 0.9, color: "#eef1f4", x: -2.0, z: 1.6, roof: "flat", roofColor: "#8cc06e" });
      tree(g, 2.6, 1.2, 0.75, "#6fa361", 1); tree(g, -2.8, -1.4, 0.7); tree(g, 2.4, -2.0, 0.7, "#93bf72");
      walker(g, [-1.2, 0.5], [1.8, 1.8], "#4f9da6", 0.4);
      walker(g, [0.0, 2.6], [1.2, 0.2], "#3a4660", 0.5, 2);
      person(g, 0.1, 1.2, "#e1b54a");
    },
    // 竹北水圳森林公園：生態水池、水圳、整治中的木棧道
    space(g, c) {
      const pond = decal(g, new THREE.CircleGeometry(1.0, 20), "#7cc6cf", 0.6, 0.6, 0.015, { roughness: 0.2 });
      pond.scale.set(1.35, 1, 1);
      // 水圳：從島邊引水入池
      decal(g, new THREE.PlaneGeometry(0.32, 2.4), "#7cc6cf", 2.2, -1.0, 0.014, { roughness: 0.2 });
      box(g, 0.06, 0.08, 2.4, "#b8b2a4", 2.0, TOP, -1.0); box(g, 0.06, 0.08, 2.4, "#b8b2a4", 2.4, TOP, -1.0);
      // 環池步道
      decal(g, new THREE.RingGeometry(1.6, 1.9, 32), "#e6d3ad", 0.4, 0.4);
      // 木棧道：一段完工、一段施工中
      box(g, 1.6, 0.06, 0.38, "#b9875c", -0.9, TOP + 0.12, 0.6);
      for (let i = 0; i < 4; i++) box(g, 0.05, 0.12, 0.05, "#8a6a4a", -1.6 + i * 0.45, TOP, 0.45);
      box(g, 0.7, 0.06, 0.38, "#d8c3a2", 0.6, TOP + 0.12, -0.55);
      [[0.15, -0.8], [1.05, -0.8], [0.15, -0.3], [1.05, -0.3]].forEach(([x, z]) => {
        g.add(mesh(new THREE.ConeGeometry(0.07, 0.22, 8), mat("#f08a3c"), x, TOP + 0.11, z));
      });
      box(g, 0.9, 0.12, 0.03, "#f2c230", 0.6, TOP + 0.25, -0.85);
      // 涼亭
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        box(g, 0.05, 0.6, 0.05, "#f5efe2", -1.5 + Math.cos(a) * 0.38, TOP, -1.4 + Math.sin(a) * 0.38);
      }
      g.add(mesh(new THREE.ConeGeometry(0.62, 0.42, 6), mat(c), -1.5, TOP + 0.8, -1.4));
      // 森林
      const rnd = seeded(11);
      const spots = [[-2.7, 0.3], [-2.4, 1.5], [-1.4, 2.4], [-0.2, 2.7], [1.2, 2.5], [2.5, 1.5], [2.8, 0.3], [-2.6, -0.9], [-0.4, -2.3], [0.8, -2.5], [1.5, -1.8], [-2.0, -2.2], [2.9, -1.0]];
      spots.forEach(([x, z], i) => tree(g, x, z, 0.7 + rnd() * 0.5, ["#7fb069", "#93bf72", "#6fa361", "#a5c97f"][i % 4], i % 3 === 0 ? 1 : 0));
      // 水鳥
      const duck = mesh(new THREE.SphereGeometry(0.08, 6, 5), mat("#ffffff"), 0, TOP + 0.06, 0);
      g.add(duck);
      anims.push((t) => duck.position.set(0.6 + Math.cos(t * 0.4) * 0.8, TOP + 0.06, 0.6 + Math.sin(t * 0.4) * 0.5));
      bench(g, -0.4, 1.9); bench(g, 1.9, 0.9, 1);
      walker(g, [-1.4, 1.5], [1.6, 2.0], "#d9774b", 0.35);
      walker(g, [-2.0, -0.4], [-0.4, -1.4], "#8b6fb0", 0.4, 2);
      person(g, 0.6, -0.1, "#5a8f5a");
      lamp(g, -0.6, -0.6); lamp(g, 1.9, 2.2);
    },
    // 竹北傳統市場：大棚市場、紅燈籠、街屋招牌
    market(g, c) {
      // 市場大棚
      [[-1.9, -0.5], [1.9, -0.5], [-1.9, 1.3], [1.9, 1.3], [0, -0.5], [0, 1.3]].forEach(([x, z]) => box(g, 0.08, 1.0, 0.08, "#8b8f96", x, TOP, z));
      gableRoof(g, 2.2, 4.2, 0.55, "#c58a5a", 0, TOP + 1.0, 0.4, Math.PI / 2);
      box(g, 4.2, 0.06, 2.2, "#a8724a", 0, TOP + 0.96, 0.4);
      // 棚下攤位
      const fruits = ["#e65a4f", "#f2a93b", "#8bc34a", "#f4d35e"];
      for (let i = 0; i < 3; i++) for (let row = 0; row < 2; row++) {
        const x = -1.3 + i * 1.3, z = -0.05 + row * 0.9;
        box(g, 0.9, 0.3, 0.45, "#c69a6b", x, TOP, z);
        for (let f = 0; f < 4; f++) g.add(mesh(new THREE.SphereGeometry(0.07, 6, 5), mat(fruits[(f + i + row) % 4]), x - 0.3 + f * 0.2, TOP + 0.36, z));
      }
      // 紅燈籠
      const lanternMat = glowing(mat("#d6453d", { emissive: "#e0402f", emissiveIntensity: 0.25 }), 2.0);
      const lanterns = [];
      for (let i = 0; i < 6; i++) {
        const lg = new THREE.Group(); lg.position.set(-1.75 + i * 0.7, TOP + 0.93, 1.45);
        box(lg, 0.01, 0.12, 0.01, "#333", 0, -0.12, 0);
        const l = mesh(new THREE.SphereGeometry(0.1, 10, 8), lanternMat, 0, -0.2, 0, false); l.scale.y = 1.2; lg.add(l);
        g.add(lg); lanterns.push(lg);
      }
      anims.push((t) => lanterns.forEach((l, i) => (l.rotation.z = Math.sin(t * 1.5 + i) * 0.12)));
      // 街屋與直立招牌
      const shops = [[-2.1, "#f1dcc4", "#d6453d"], [-1.15, "#e8eef0", "#3f6b9a"], [-0.2, "#f4e3c8", "#e1b54a"], [0.75, "#efe2d6", "#5a8f5a"]];
      shops.forEach(([x, col, sign], i) => {
        building(g, { w: 0.9, h: 1.2 + (i % 2) * 0.35, d: 0.8, color: col, x, z: -2.2, roof: "flat", roofColor: "#b9b2a2" });
        box(g, 0.12, 0.7, 0.05, glowing(mat(sign, { emissive: sign, emissiveIntensity: 0 }), 0.9), x + 0.35, TOP + 0.5, -1.75);
        box(g, 0.92, 0.06, 0.3, sign, x, TOP + 0.45, -1.7);
      });
      // 停放的機車
      for (let i = 0; i < 4; i++) {
        const m = new THREE.Group();
        box(m, 0.32, 0.12, 0.1, ["#e57d6a", "#ffffff", "#7d9be0", "#e1b54a"][i], 0, 0.08, 0);
        wheels(m, [[-0.12, 0], [0.12, 0]], 0.06);
        m.position.set(1.5 + i * 0.25, TOP, -1.6); m.rotation.y = Math.PI / 2; g.add(m);
      }
      walker(g, [-2.2, 1.9], [2.0, 1.9], "#4f9da6", 0.35);
      walker(g, [1.6, -1.2], [-1.6, -1.1], "#e1b54a", 0.3, 1.5);
      person(g, -1.3, 0.3, "#d9774b"); person(g, 1.3, 1.15, "#8b6fb0");
      tree(g, 2.7, 0.6, 0.8); tree(g, -2.8, 0.7, 0.75, "#93bf72", 1); tree(g, 1.0, 2.6, 0.7);
      lamp(g, 2.4, -0.8);
    },
    // 新瓦屋客家文化保存區：忠孝堂夥房、禾埕、半月池、水稻田、木棧舞台
    culture(g, c) {
      const wall = "#f5efe4", tile = "#b5523b";
      // 正身（忠孝堂）與左右護龍
      building(g, { w: 0.95, h: 0.8, d: 2.4, color: wall, x: 0, z: -1.5, rot: Math.PI / 2, roof: "gable", roofColor: tile, win: false });
      box(g, 0.5, 0.55, 0.03, "#8a4b32", 0, TOP, -1.01);
      [-1.35, 1.35].forEach((x) => {
        building(g, { w: 0.75, h: 0.6, d: 2.0, color: wall, x, z: -0.3, roof: "gable", roofColor: tile, win: false });
        for (let i = 0; i < 3; i++) box(g, 0.03, 0.18, 0.16, "#5a4a3a", x - Math.sign(x) * 0.39, TOP + 0.25, -0.9 + i * 0.6);
      });
      // 禾埕與半月池
      decal(g, new THREE.PlaneGeometry(2.0, 1.7), "#e3d2b0", 0, -0.2);
      decal(g, new THREE.CircleGeometry(0.85, 20, 0, Math.PI), "#7cc6cf", 0, 1.35, 0.014, { roughness: 0.2 });
      // 屋後風水林
      [[-1.6, -2.4], [-0.6, -2.7], [0.5, -2.7], [1.5, -2.4]].forEach(([x, z], i) => tree(g, x, z, 0.85, i % 2 ? "#6fa361" : "#7fb069", i % 2));
      // 水稻田
      [[-2.5, 1.1], [-2.5, 2.0]].forEach(([x, z]) => {
        decal(g, new THREE.PlaneGeometry(1.1, 0.8), "#9ccf6a", x, z);
        for (let k = 0; k < 5; k++) decal(g, new THREE.PlaneGeometry(0.03, 0.8), "#7fb055", x - 0.44 + k * 0.22, z, 0.014);
      });
      // 木棧舞台
      box(g, 1.2, 0.14, 0.8, "#b9875c", 2.2, TOP, 1.4);
      box(g, 0.05, 0.8, 0.05, "#8a6a4a", 1.65, TOP, 1.05); box(g, 0.05, 0.8, 0.05, "#8a6a4a", 2.75, TOP, 1.05);
      box(g, 1.2, 0.12, 0.05, c, 2.2, TOP + 0.8, 1.05);
      person(g, 2.2, 1.4, "#e1b54a").position.y = TOP + 0.14;
      // 書車（巡迴閱讀）
      box(g, 0.5, 0.35, 0.3, "#b9875c", -0.9, TOP + 0.1, 2.3);
      ["#d9774b", "#4f9da6", "#e1b54a", c].forEach((col, i) => box(g, 0.08, 0.2, 0.22, col, -1.05 + i * 0.1, TOP + 0.45, 2.3));
      wheels(g, [[-1.05, 2.45], [-0.75, 2.45]], 0.07);
      walker(g, [-0.6, 0.5], [0.8, -0.6], "#3f4f7a", 0.4);
      walker(g, [0.8, 2.4], [1.6, 0.4], "#d9774b", 0.45, 1);
      person(g, -0.4, 2.1, "#4f9da6"); person(g, 2.6, 2.1, "#8b6fb0");
      lamp(g, 0.9, 0.6); lamp(g, -0.9, 0.6);
    },
    // 新月沙灣：新月形海灣、沙灘、週末市集
    youth(g, c) {
      // 沙灘（島的西半部）與新月形海灣
      decal(g, new THREE.CircleGeometry(3.25, 28, Math.PI / 2, Math.PI), "#efd9a7", 0.3, 0);
      const bay = new THREE.Shape();
      bay.absellipse(0, 0, 3.25, 3.25, Math.PI / 2, Math.PI * 1.5, false);
      bay.absellipse(0, 0, 1.9, 3.25, Math.PI * 1.5, Math.PI / 2, true);
      decal(g, new THREE.ShapeGeometry(bay, 24), "#8fd3d6", 0.3, 0, 0.016, { roughness: 0.2 });
      // 浪花
      const waves = [0, 1, 2].map((i) => {
        const w = mesh(new THREE.TorusGeometry(2.0 + i * 0.35, 0.02, 4, 24, Math.PI * 0.7), track(new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.8 })), 0.3, TOP + 0.03, 0, false);
        w.rotation.set(-Math.PI / 2, 0, Math.PI * 0.65); g.add(w); return w;
      });
      anims.push((t) => waves.forEach((w, i) => (w.material.opacity = 0.35 + 0.35 * Math.sin(t * 1.2 + i * 2))));
      // 海邊風機
      [[-2.6, -1.6], [-2.8, 1.4]].forEach(([x, z], k) => {
        box(g, 0.07, 2.2, 0.07, "#f2f2f2", x, TOP, z);
        const rotor = new THREE.Group(); rotor.position.set(x + 0.06, TOP + 2.2, z); rotor.rotation.y = Math.PI / 2;
        for (let i = 0; i < 3; i++) {
          const holder = new THREE.Group(); holder.rotation.z = (i * Math.PI * 2) / 3;
          holder.add(mesh(new THREE.BoxGeometry(0.07, 0.7, 0.02), mat("#ffffff"), 0, 0.35, 0)); rotor.add(holder);
        }
        g.add(rotor);
        anims.push((t, dt) => (rotor.rotation.z -= dt * (1.5 + k * 0.4)));
      });
      // 海灘陽傘、衝浪板、救生員台
      [[-1.0, -1.2, c], [-0.8, 0.9, "#4f9da6"], [-1.3, 2.0, "#e1b54a"]].forEach(([x, z, col]) => {
        box(g, 0.03, 0.7, 0.03, "#ffffff", x, TOP, z);
        g.add(mesh(new THREE.ConeGeometry(0.42, 0.22, 8), mat(col), x, TOP + 0.78, z));
      });
      [["#e57d6a", -0.2], ["#7d9be0", 0.1]].forEach(([col, dx]) => {
        const b = mesh(new THREE.CapsuleGeometry(0.07, 0.5, 3, 8), mat(col), -0.4 + dx, TOP + 0.33, -0.3);
        b.rotation.x = 0.2; b.scale.z = 0.4; g.add(b);
      });
      [[-0.15, -2.45], [0.35, -2.45], [-0.15, -1.95], [0.35, -1.95]].forEach(([x, z]) => box(g, 0.04, 0.7, 0.04, "#ffffff", x, TOP, z));
      box(g, 0.6, 0.06, 0.6, "#ffffff", 0.1, TOP + 0.7, -2.2);
      box(g, 0.6, 0.06, 0.6, "#d6453d", 0.1, TOP + 1.12, -2.2);
      box(g, 0.03, 0.36, 0.03, "#ffffff", -0.15, TOP + 0.76, -2.45); box(g, 0.03, 0.36, 0.03, "#ffffff", 0.35, TOP + 0.76, -1.95);
      // 濱海木平台
      box(g, 1.3, 0.1, 1.0, "#c69a6b", 1.9, TOP, -1.2);
      building(g, { w: 0.9, h: 0.7, d: 0.6, color: "#f6f2ea", x: 2.0, z: -1.45, roof: "flat", roofColor: c });
      // 週末市集帳篷
      [[1.1, 0.5], [2.0, 0.5], [1.55, 1.5], [2.45, 1.5]].forEach(([x, z], i) => {
        [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].forEach(([dx, dz]) => box(g, 0.03, 0.45, 0.03, "#d0d0d0", x + dx, TOP, z + dz));
        const roof = mesh(new THREE.ConeGeometry(0.42, 0.3, 4), mat(i % 2 ? "#ffffff" : "#f6efe3"), x, TOP + 0.6, z);
        roof.rotation.y = Math.PI / 4; g.add(roof);
        box(g, 0.45, 0.22, 0.25, ["#e57d6a", "#4f9da6", "#e1b54a", "#8b6fb0"][i], x, TOP, z);
      });
      walker(g, [0.8, 2.2], [2.6, 0.0], "#8b6fb0", 0.4);
      walker(g, [-1.5, -0.6], [-0.6, 1.6], "#d9774b", 0.35, 2);
      person(g, 1.3, 1.0, "#e1b54a"); person(g, 1.8, -0.9, "#5a8f5a");
      tree(g, 2.7, -0.3, 0.75, "#6fa361", 1); tree(g, 1.0, 2.6, 0.7, "#93bf72");
      lamp(g, 0.6, -0.6);
    },
  };
  function genericBuilder(g, c) {
    building(g, { w: 1.4, h: 1.2, d: 1.2, color: "#f1e6d0", x: 0, z: 0, roof: "flat", roofColor: c });
    tree(g, -1.8, 1, 0.9); tree(g, 1.8, -1, 0.9);
  }

  /* ---------- 外環道路與入口 ---------- */
  const CONTENT_SCALE = 0.84; // 島上造型縮進外環道路內側
  const RING_OUT = 0.93, RING_IN = 0.79, RING_N = 192;
  const ENTRY_ANGLE = Math.atan2(0.85, -0.52); // 入口朝西南，正對預設鏡頭
  // 圓角六角形輪廓上的點（島嶼本地座標 [x, z]）
  const hexPts = (R, n = RING_N) => roundedHexShape(R, R * 0.28).getSpacedPoints(n).slice(0, n).map((v) => [v.x, -v.y]);
  // 輪廓上最接近某個方位角的點
  const angIdx = (pts, cx, cz, ang) => {
    let best = 0, bd = Infinity;
    pts.forEach(([x, z], i) => {
      let d = Math.abs(Math.atan2(z - cz, x - cx) - ang);
      d = Math.min(d, Math.PI * 2 - d);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };
  const dashMat = mat("#ffffff");
  function buildRingRoad(g, r, color) {
    const outer = roundedHexShape(r * RING_OUT, r * RING_OUT * 0.28);
    outer.holes.push(new THREE.Path(roundedHexShape(r * RING_IN, r * RING_IN * 0.28).getPoints(8)));
    decal(g, new THREE.ShapeGeometry(outer, 8), "#a7a299", 0, 0, 0.014);
    // 中線虛線
    const mid = hexPts(r * (RING_OUT + RING_IN) / 2);
    const n = RING_N / 4;
    const dashes = new THREE.InstancedMesh(track(new THREE.BoxGeometry(0.2, 0.01, 0.035)), dashMat, n);
    const d = new THREE.Object3D();
    for (let k = 0; k < n; k++) {
      const [x, z] = mid[k * 4], [x2, z2] = mid[k * 4 + 1];
      d.position.set(x, TOP + 0.022, z);
      d.rotation.y = -Math.atan2(z2 - z, x2 - x);
      d.updateMatrix();
      dashes.setMatrixAt(k, d.matrix);
    }
    dashes.receiveShadow = true;
    g.add(dashes);
    // 入口：外環道路內側的門
    const entry = angIdx(mid, 0, 0, ENTRY_ANGLE);
    const [ex, ez] = mid[entry], [nx, nz] = mid[(entry + 1) % RING_N];
    const k = (RING_IN - 0.01) / ((RING_OUT + RING_IN) / 2);
    const gate = new THREE.Group();
    gate.position.set(ex * k, TOP, ez * k);
    gate.rotation.y = -Math.atan2(nz - ez, nx - ex);
    box(gate, 0.07, 0.75, 0.07, color, -0.38, 0, 0); box(gate, 0.07, 0.75, 0.07, color, 0.38, 0, 0);
    box(gate, 0.9, 0.12, 0.1, color, 0, 0.72, 0);
    box(gate, 0.5, 0.05, 0.11, lampMat, 0, 0.755, 0);
    g.add(gate);
    return { mid, entry };
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
    const content = new THREE.Group();
    content.scale.setScalar(CONTENT_SCALE);
    content.position.y = TOP * (1 - CONTENT_SCALE);
    g.add(content);
    roleCtx = theme.id;
    (BUILDERS[theme.id] || genericBuilder)(content, color);
    roleCtx = null;
    const ring = buildRingRoad(g, L.r, color);
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
    islands.set(theme.id, {
      group: g, theme, label, el, band, bandMat, r: L.r, lift: 0, liftTarget: 0, anchorY: label.position.y,
      ring: ring.mid.map(([x, z]) => [x + L.x, z + L.z]), entry: ring.entry, edge: hexPts(L.r),
    });
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
      // 雲只放在島群北側（鏡頭的遠方），不擋住島
      c.position.set(lerp(-80, 90, rnd()), lerp(17, 24, rnd()), lerp(-60, -20, rnd()));
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

  /* ---------- 木棧道：只連相鄰的島，一對島一座橋，彼此不交錯 ---------- */
  const BRIDGES = [
    ["youth", "market"], ["market", "resilience"], ["resilience", "digital"],
    ["space", "care"], ["care", "service"], ["service", "traffic"], ["culture", "edu"],
    ["youth", "space"], ["market", "care"], ["digital", "traffic"],
    ["space", "culture"], ["care", "edu"], ["service", "edu"],
  ];
  const BRIDGE_Y = TOP - 0.01; // 橋面與島面同高
  const adj = new Map(); // id -> [{ to, head, a, b }]：head 是外環上的橋頭，a→b 是橋面兩端
  {
    const pairs = BRIDGES.filter(([a, b]) => islands.has(a) && islands.has(b));
    // 不在版面表裡的島，接到最近的島
    islands.forEach((isl, id) => {
      if (pairs.some((p) => p.includes(id))) return;
      let near = null, nd = Infinity;
      islands.forEach((o, k) => {
        const d = o.group.position.distanceTo(isl.group.position);
        if (k !== id && d < nd) { nd = d; near = k; }
      });
      if (near) pairs.push([id, near]);
    });
    const worldEdge = (isl) => isl.edge.map(([x, z]) => [x + isl.group.position.x, z + isl.group.position.z]);
    // 兩島岸線上距離最短的一對點；平行岸邊等距時取最靠近兩島中心連線的那對
    const closestPair = (A, B) => {
      const ea = worldEdge(A), eb = worldEdge(B);
      const pa = A.group.position, pb = B.group.position;
      const ux = pb.x - pa.x, uz = pb.z - pa.z, ul = Math.hypot(ux, uz);
      const off = ([x, z]) => Math.abs((x - pa.x) * uz - (z - pa.z) * ux) / ul;
      let best = null, bs = Infinity;
      ea.forEach((p) => eb.forEach((q) => {
        const sc = Math.hypot(q[0] - p[0], q[1] - p[1]) + 0.04 * (off(p) + off(q));
        if (sc < bs) { bs = sc; best = [p, q]; }
      }));
      return best;
    };
    const nearestIdx = (pts, [x, z]) => {
      let bi = 0, bd = Infinity;
      pts.forEach(([px, pz], i) => { const d = Math.hypot(px - x, pz - z); if (d < bd) { bd = d; bi = i; } });
      return bi;
    };
    pairs.forEach(([a, b]) => {
      const A = islands.get(a), B = islands.get(b);
      const pa = A.group.position, pb = B.group.position;
      const [ea, eb] = closestPair(A, B);
      if (!adj.has(a)) adj.set(a, []);
      if (!adj.has(b)) adj.set(b, []);
      // 橋頭接在外環道路上離橋端最近的點
      adj.get(a).push({ to: b, head: nearestIdx(A.ring, ea), a: ea, b: eb, w: pa.distanceTo(pb) });
      adj.get(b).push({ to: a, head: nearestIdx(B.ring, eb), a: eb, b: ea, w: pa.distanceTo(pb) });
      // 橋面兩端各伸進島緣下方一點，欄杆只蓋在水面那段
      const dx = eb[0] - ea[0], dz = eb[1] - ea[1];
      const len = Math.hypot(dx, dz);
      const bridge = new THREE.Group();
      bridge.position.set((ea[0] + eb[0]) / 2, 0, (ea[1] + eb[1]) / 2);
      bridge.rotation.y = -Math.atan2(dz, dx);
      box(bridge, len + 0.6, 0.08, 0.8, "#c9a47c", 0, BRIDGE_Y - 0.08, 0);
      box(bridge, len, 0.04, 0.05, "#a9825c", 0, BRIDGE_Y + 0.16, 0.38);
      box(bridge, len, 0.04, 0.05, "#a9825c", 0, BRIDGE_Y + 0.16, -0.38);
      const posts = Math.max(2, Math.round(len / 0.7) + 1);
      for (let i = 0; i < posts; i++) {
        const sx = -len / 2 + (i * len) / (posts - 1);
        box(bridge, 0.05, 0.18, 0.05, "#a9825c", sx, BRIDGE_Y, 0.38);
        box(bridge, 0.05, 0.18, 0.05, "#a9825c", sx, BRIDGE_Y, -0.38);
      }
      for (let i = 1; i < posts - 1; i += 2) box(bridge, 0.12, BRIDGE_Y + 0.17, 0.12, "#8a6a4c", -len / 2 + (i * len) / (posts - 1), -0.25, 0);
      scene.add(bridge);
    });
  }
  // 外環上 i0 → i1 走較短的方向
  function ringArc(isl, i0, i1) {
    const fwd = (i1 - i0 + RING_N) % RING_N;
    const step = fwd <= RING_N / 2 ? 1 : -1, n = step > 0 ? fwd : RING_N - fwd;
    const out = [];
    for (let k = 0; k <= n; k++) out.push(isl.ring[(i0 + step * k + RING_N) % RING_N]);
    return out;
  }
  // 從 A 島入口走到 B 島入口：外環道路 → 橋 → 外環道路…，不穿過島中央
  function walkRoute(fromId, toId) {
    const dist = new Map([[fromId, 0]]), prev = new Map(), todo = new Set(islands.keys());
    while (todo.size) {
      let u = null;
      todo.forEach((k) => { if (dist.has(k) && (u === null || dist.get(k) < dist.get(u))) u = k; });
      if (u === null || u === toId) break;
      todo.delete(u);
      (adj.get(u) || []).forEach((e) => {
        const d = dist.get(u) + e.w;
        if (!dist.has(e.to) || d < dist.get(e.to)) { dist.set(e.to, d); prev.set(e.to, { from: u, e }); }
      });
    }
    if (!dist.has(toId)) return null;
    const hops = [];
    for (let k = toId; k !== fromId; k = prev.get(k).from) hops.unshift(prev.get(k));
    let isl = islands.get(fromId), cur = isl.entry;
    const pts = [];
    hops.forEach(({ from, e }) => {
      pts.push(...ringArc(isl, cur, e.head), e.a, e.b);
      isl = islands.get(e.to);
      cur = adj.get(e.to).find((r) => r.to === from).head;
    });
    pts.push(...ringArc(isl, cur, isl.entry));
    // 去掉重複點，算累積長度
    const P = [pts[0]], cum = [0];
    for (let i = 1; i < pts.length; i++) {
      const [x0, z0] = P[P.length - 1], [x1, z1] = pts[i];
      const d = Math.hypot(x1 - x0, z1 - z0);
      if (d < 1e-4) continue;
      P.push(pts[i]); cum.push(cum[cum.length - 1] + d);
    }
    return { pts: P, cum, len: cum[cum.length - 1] };
  }
  // 路線上距離 s 的位置與前進方向
  function routeAt(R, s, out = {}) {
    s = Math.max(0, Math.min(R.len, s));
    let lo = 0, hi = R.cum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (R.cum[m] <= s) lo = m; else hi = m; }
    const [x0, z0] = R.pts[lo], [x1, z1] = R.pts[hi];
    const seg = R.cum[hi] - R.cum[lo] || 1, k = (s - R.cum[lo]) / seg;
    out.x = lerp(x0, x1, k); out.z = lerp(z0, z1, k);
    out.dx = (x1 - x0) / seg; out.dz = (z1 - z0) / seg;
    return out;
  }

  /* ---------- 協作路線：沿著小人實際走的外環道路與木棧道 ---------- */
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
        const R = walkRoute(th.id, to);
        if (!R) return;
        // 沿步行路線取點；高度每幀依地面決定
        const n = Math.max(8, Math.round(R.len / 0.6));
        const pts = [];
        for (let i = 0; i <= n; i++) { const p = routeAt(R, (R.len * i) / n); pts.push([p.x, p.z]); }
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
    return isl ? TOP + isl.group.position.y + 0.035 : BRIDGE_Y + 0.035;
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
  const hitMat = track(new THREE.MeshBasicMaterial({ visible: false }));
  const islandAt = (x, z) => {
    for (const isl of islands.values()) {
      const p = isl.group.position;
      if (Math.hypot(x - p.x, z - p.z) < isl.r - 0.15) return isl;
    }
    return null;
  };
  tasks.forEach((task, ti) => {
    const A = islands.get(task.from), B = islands.get(task.to);
    if (!A || !B || A === B) return;
    const route = walkRoute(task.from, task.to);
    if (!route) return;
    const walkT = route.len / 1.3, restT = 1.4, cycle = 2 * (walkT + restT);
    const cargoA = mat(A.theme.color || "#888"), cargoB = mat(B.theme.color || "#888");
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    route.pts.forEach(([x, z]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); });
    const mid = new THREE.Vector3((x0 + x1) / 2, 0.6, (z0 + z1) / 2), span = Math.hypot(x1 - x0, z1 - z0);

    for (let k = 0; k < 2; k++) {
      const w = new THREE.Group();
      const role = ROLES[(task.crew || [])[k]] || ROLES.市民;
      const ch = makeCharacter(role, 500 + ti * 2 + k);
      ch.scale.multiplyScalar(1.15);
      w.add(ch);
      // 背上的搬運箱：去程裝 A 島的資源、回程換成 B 島的
      const cargo = new THREE.Mesh(cg("crate", () => new RoundedBoxGeometry(0.2, 0.2, 0.13, 2, 0.03)), cargoA);
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
      carriers.push({ task, w, tag, len: span, mid });

      const phase = (k * cycle) / 2 + ti * 0.9;
      const at = {};
      anims.push((t) => {
        const u = (t + phase) % cycle;
        let p, forward, moving = true;
        if (u < walkT) { p = u / walkT; forward = true; }
        else if (u < walkT + restT) { p = 1; forward = true; moving = false; }
        else if (u < 2 * walkT + restT) { p = 1 - (u - walkT - restT) / walkT; forward = false; }
        else { p = 0; forward = false; moving = false; }
        const sgn = forward ? 1 : -1;
        routeAt(route, p * route.len, at);
        // 去程、回程各走道路的一側
        const x = at.x - at.dz * 0.12 * sgn, z = at.z + at.dx * 0.12 * sgn;
        const isl = islandAt(x, z);
        const gy = isl ? TOP + isl.group.position.y : BRIDGE_Y;
        w.position.x = x;
        w.position.z = z;
        w.position.y += (gy - w.position.y) * 0.3;
        ch.userData.step(t * 9 + phase, moving);
        if (moving) w.rotation.y = Math.atan2(at.dx * sgn, at.dz * sgn);
        // 到站換貨：去程搬 A 的資源，回程帶 B 的資源
        cargo.material = (forward && p < 1) || (!forward && p === 0) ? cargoA : cargoB;
      });
    }
  });
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
    glowMats.forEach(([m, d, n]) => (m.emissiveIntensity = lerp(d, n, s.glow)));
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
  let lastFrame = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    const now = performance.now();
    if (LITE && now - lastFrame < 31) return;
    lastFrame = now;
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
    flyTo(sphericalPos(HOME_TARGET, HOME_AZIMUTH, HOME_POLAR, homeDist), HOME_TARGET.clone());
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
