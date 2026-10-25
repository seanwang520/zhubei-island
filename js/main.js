import data from "../data/policies.js";
import { createScene } from "./scene.js";
import { createUI } from "./ui.js";
import { createAmbience } from "./sound.js";

// ?shot：產生分享預覽圖用，隱藏介面、只留場景與標題
const SHOT = new URLSearchParams(location.search).has("shot");
if (SHOT) {
  document.documentElement.classList.add("zb-shot");
  const card = document.createElement("div");
  card.className = "zb-shot-card";
  card.innerHTML = "<strong>竹北政策島</strong><span>曾聖凱竹北市長政見・3D 地圖</span>";
  document.body.append(card);
}

let scene;
let ui;
const ambience = createAmbience();

const selectTheme = (id) => {
  ui.openTheme(id);
  scene.focusTheme(id);
};

const selectTask = (id) => {
  ui.openTask(id);
  scene.focusTask(id);
};

// 自動導覽：依序飛到每座島，停留幾秒；使用者一動手就停
const TOUR_ORDER = data.themes.slice().sort((a, b) => (a.no || 0) - (b.no || 0)).map((t) => t.id);
const TOUR_STAY = 7000;
let tourTimer = null;
let tourStep = -1;
const stopAutoTour = () => {
  if (tourStep < 0) return;
  clearTimeout(tourTimer);
  tourTimer = null;
  tourStep = -1;
  ui.setAutoTour(false);
};
const nextTourStop = () => {
  tourStep++;
  if (tourStep >= TOUR_ORDER.length) {
    stopAutoTour();
    ui.closeDetail();
    scene.resetView();
    return;
  }
  selectTheme(TOUR_ORDER[tourStep]);
  ui.setAutoTour(true, tourStep + 1, TOUR_ORDER.length);
  tourTimer = setTimeout(nextTourStop, TOUR_STAY);
};
const startAutoTour = () => {
  stopAutoTour();
  nextTourStop();
};
// 使用者自己點選時先停掉導覽
const userSelectTheme = (id) => { stopAutoTour(); selectTheme(id); };
const userSelectTask = (id) => { stopAutoTour(); selectTask(id); };

scene = createScene(document.getElementById("scene"), data.themes, {
  onSelectTheme: userSelectTheme,
  onSelectTask: userSelectTask,
  tasks: data.tasks,
  homeDist: SHOT ? 58 : undefined,
});

ui = createUI(document.getElementById("ui"), data, {
  onSelectTheme: userSelectTheme,
  onSelectTask: userSelectTask,
  onAutoTourToggle: (on) => (on ? startAutoTour() : stopAutoTour()),
  onCarriersToggle: (on) => scene.showCarriers(on),
  onNamesToggle: (on) => scene.showNames(on),
  onDetailToggle: (open, coveredPx) => {
    if (!open) stopAutoTour();
    scene.setBottomInset(coveredPx);
  },
  onReset: () => {
    stopAutoTour();
    ui.closeDetail();
    scene.resetView();
  },
  onTimeChange: (t) => {
    scene.setTimeOfDay(t);
    ambience.setTime(t);
  },
  onSoundToggle: (on) => ambience.setOn(on),
  onPauseToggle: (paused) => scene.setPaused(paused),
  onLinksToggle: (on) => scene.showLinks(on),
});

// Deep link: #traffic opens that island
const openFromHash = () => {
  const id = location.hash.slice(1);
  if (data.themes.some((t) => t.id === id)) selectTheme(id);
  else if ((data.tasks || []).some((k) => k.id === id)) selectTask(id);
};
openFromHash();
window.addEventListener("hashchange", () => { stopAutoTour(); openFromHash(); });
// 拖曳、縮放場景也會停掉導覽
["pointerdown", "wheel"].forEach((ev) => document.getElementById("scene").addEventListener(ev, stopAutoTour, { passive: true }));
