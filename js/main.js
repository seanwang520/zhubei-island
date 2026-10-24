import data from "../data/policies.js";
import { createScene } from "./scene.js";
import { createUI } from "./ui.js";

let scene;
let ui;

const selectTheme = (id) => {
  ui.openTheme(id);
  scene.focusTheme(id);
};

const selectTask = (id) => {
  ui.openTask(id);
  scene.focusTask(id);
};

scene = createScene(document.getElementById("scene"), data.themes, {
  onSelectTheme: selectTheme,
  onSelectTask: selectTask,
  tasks: data.tasks,
});

ui = createUI(document.getElementById("ui"), data, {
  onSelectTheme: selectTheme,
  onSelectTask: selectTask,
  onCarriersToggle: (on) => scene.showCarriers(on),
  onNamesToggle: (on) => scene.showNames(on),
  onDetailToggle: (open, coveredPx) => scene.setBottomInset(coveredPx),
  onReset: () => {
    ui.closeDetail();
    scene.resetView();
  },
  onTimeChange: (t) => scene.setTimeOfDay(t),
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
window.addEventListener("hashchange", openFromHash);
