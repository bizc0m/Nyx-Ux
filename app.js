const state = {
  fixtures: null,
  activeTab: "today",
  focusedPane: null,
  zoomedPane: null,
  closedPanes: new Set(),
  collapsedPanes: new Set(),
  sidebarOpen: true,
  themeOpen: true,
  theme: {},
  dragPaneId: null
};

const els = {
  workspace: document.querySelector(".workspace"),
  sidebar: document.querySelector("#sidebar"),
  tabbar: document.querySelector("#tabbar"),
  paneStage: document.querySelector("#paneStage"),
  paneTemplate: document.querySelector("#paneTemplate"),
  bladeList: document.querySelector("#section-blades"),
  notes: document.querySelector("#section-notes"),
  search: document.querySelector("#searchInput"),
  themeForm: document.querySelector("#themeForm"),
  cssOutput: document.querySelector("#cssOutput")
};

const defaultTheme = {
  "--accent": "#48c7c2",
  "--accent-soft": "rgba(72, 199, 194, 0.14)",
  "--ink-0": "#07080b",
  "--ink-1": "#101116",
  "--ink-2": "#171923",
  "--ink-3": "#20232e",
  "--ink-4": "#303543",
  "--bone-0": "#f3f5f7",
  "--bone-1": "#c1c5cb",
  "--bone-2": "#8d939c",
  "--bone-3": "#59606b",
  "--danger": "#ff5a52",
  "--warning": "#f5a524",
  "--info": "#60a5fa",
  "--radius": "8px",
  "--sidebar-w": "260px",
  density: "1"
};

const presets = {
  nyx: defaultTheme,
  graphite: {
    "--accent": "#7dd3fc",
    "--accent-soft": "rgba(125, 211, 252, 0.14)",
    "--ink-0": "#0a0a0a",
    "--ink-1": "#151515",
    "--ink-2": "#1d1d1d",
    "--ink-3": "#282828",
    "--ink-4": "#3a3a3a",
    "--bone-0": "#f4f4f5",
    "--bone-1": "#c8c8cc",
    "--bone-2": "#92929a",
    "--bone-3": "#64646b",
    "--danger": "#fb7185",
    "--warning": "#fbbf24",
    "--info": "#7dd3fc",
    "--radius": "4px",
    "--sidebar-w": "280px",
    density: "2"
  },
  daylight: {
    "--accent": "#2563eb",
    "--accent-soft": "rgba(37, 99, 235, 0.11)",
    "--ink-0": "#e9edf2",
    "--ink-1": "#f8fafc",
    "--ink-2": "#eef2f7",
    "--ink-3": "#dce3ed",
    "--ink-4": "#c7d0dd",
    "--bone-0": "#111827",
    "--bone-1": "#334155",
    "--bone-2": "#64748b",
    "--bone-3": "#94a3b8",
    "--danger": "#dc2626",
    "--warning": "#d97706",
    "--info": "#2563eb",
    "--radius": "10px",
    "--sidebar-w": "250px",
    density: "1"
  }
};

async function boot() {
  const response = await fetch("./fixtures.json");
  state.fixtures = await response.json();
  state.theme = loadTheme();
  applyTheme();
  render();
  bindChrome();
}

function bindChrome() {
  document.querySelector("#sidebarToggle").addEventListener("click", () => {
    state.sidebarOpen = !state.sidebarOpen;
    renderWorkspaceShell();
  });

  document.querySelector("#splitVertical").addEventListener("click", () => addScratchPane("vertical"));
  document.querySelector("#splitHorizontal").addEventListener("click", () => addScratchPane("horizontal"));
  document.querySelector("#themeToggle").addEventListener("click", () => {
    state.themeOpen = !state.themeOpen;
    renderWorkspaceShell();
  });
  document.querySelector("#copyCss").addEventListener("click", copyCss);
  document.querySelector("#downloadCss").addEventListener("click", downloadCss);
  document.querySelector("#resetTheme").addEventListener("click", resetTheme);

  document.querySelectorAll(".section-title").forEach((button) => {
    button.addEventListener("click", () => {
      const body = document.querySelector(`#section-${button.dataset.toggle}`);
      body.classList.toggle("is-collapsed");
    });
  });

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      state.zoomedPane = null;
      render();
    });
  });

  els.search.addEventListener("input", () => renderPanes());
  els.themeForm.addEventListener("input", onThemeInput);
  document.querySelectorAll(".preset").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  });
}

function render() {
  renderWorkspaceShell();
  renderTabs();
  renderBlades();
  renderNotes();
  renderPanes();
}

function renderWorkspaceShell() {
  els.workspace.classList.toggle("sidebar-closed", !state.sidebarOpen);
  els.workspace.classList.toggle("theme-closed", !state.themeOpen);
  document.querySelector("#themeToggle").textContent = state.themeOpen ? "›" : "‹";
}

function renderTabs() {
  els.tabbar.replaceChildren();
  state.fixtures.tabs.forEach((tab) => {
    const button = document.createElement("button");
    button.className = `tab${tab.id === state.activeTab ? " active" : ""}`;
    button.textContent = tab.label;
    button.draggable = true;
    button.addEventListener("click", () => {
      state.activeTab = tab.id;
      state.zoomedPane = null;
      render();
    });
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", tab.id);
    });
    button.addEventListener("dragover", (event) => event.preventDefault());
    button.addEventListener("drop", (event) => {
      event.preventDefault();
      reorderById(state.fixtures.tabs, event.dataTransfer.getData("text/plain"), tab.id);
      renderTabs();
    });
    els.tabbar.append(button);
  });
}

function renderBlades() {
  els.bladeList.replaceChildren();
  state.fixtures.blades.forEach((blade) => {
    const row = document.createElement("button");
    row.className = `blade-row${blade.id === state.activeTab ? " active" : ""}`;
    row.draggable = true;
    row.innerHTML = `<span>${blade.label}</span><span class="row-meta">${blade.count || blade.kind}</span>`;
    row.addEventListener("click", () => {
      const tab = state.fixtures.tabs.find((item) => item.id === blade.id);
      state.activeTab = tab ? tab.id : "today";
      state.zoomedPane = null;
      render();
    });
    row.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", blade.id));
    row.addEventListener("dragover", (event) => event.preventDefault());
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      reorderById(state.fixtures.blades, event.dataTransfer.getData("text/plain"), blade.id);
      renderBlades();
    });
    els.bladeList.append(row);
  });
}

function renderNotes() {
  els.notes.replaceChildren();
  state.fixtures.notes.forEach((folder) => {
    const folderEl = document.createElement("div");
    folderEl.className = "note-folder";
    folderEl.textContent = folder.name;
    els.notes.append(folderEl);
    folder.files.forEach((file) => {
      const fileEl = document.createElement("div");
      fileEl.className = "note-file";
      fileEl.textContent = file;
      els.notes.append(fileEl);
    });
  });
}

function renderPanes() {
  const active = state.fixtures.tabs.find((tab) => tab.id === state.activeTab) || state.fixtures.tabs[0];
  const query = els.search.value.trim().toLowerCase();
  const paneIds = active.panes.filter((id) => !state.closedPanes.has(`${active.id}:${id}`));
  const visibleIds = state.zoomedPane ? paneIds.filter((id) => id === state.zoomedPane) : paneIds;

  els.paneStage.replaceChildren();
  els.paneStage.classList.toggle("is-zoomed", Boolean(state.zoomedPane));
  els.paneStage.style.setProperty("--pane-count", String(Math.max(1, visibleIds.length)));

  if (!visibleIds.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Aucun pane actif.";
    els.paneStage.append(empty);
    return;
  }

  visibleIds.forEach((paneId) => {
    const pane = state.fixtures.panes[paneId] || makeScratchPane(paneId);
    const node = els.paneTemplate.content.firstElementChild.cloneNode(true);
    const key = `${active.id}:${paneId}`;
    node.dataset.paneId = paneId;
    node.classList.toggle("is-focused", state.focusedPane === paneId);
    node.classList.toggle("is-collapsed", state.collapsedPanes.has(key));
    node.querySelector(".pane-title").textContent = pane.title;
    node.querySelector(".pane-source").textContent = pane.source;
    const mode = node.querySelector(".pane-mode");
    mode.classList.toggle("fixture", pane.mode === "fixture");
    mode.title = pane.mode;

    const content = node.querySelector(".pane-content");
    pane.items
      .filter((item) => !query || item.text.toLowerCase().includes(query) || pane.title.toLowerCase().includes(query))
      .forEach((item) => content.append(renderItem(item)));

    if (!content.childElementCount) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Aucun résultat.";
      content.append(empty);
    }

    node.addEventListener("click", () => {
      state.focusedPane = paneId;
      renderPanes();
    });
    node.addEventListener("dragstart", (event) => {
      state.dragPaneId = paneId;
      event.dataTransfer.setData("text/plain", paneId);
    });
    node.addEventListener("dragover", (event) => event.preventDefault());
    node.addEventListener("drop", (event) => {
      event.preventDefault();
      swapPane(active.panes, state.dragPaneId, paneId);
      state.dragPaneId = null;
      renderPanes();
    });
    node.querySelector(".pane-collapse").addEventListener("click", (event) => {
      event.stopPropagation();
      toggleSet(state.collapsedPanes, key);
      renderPanes();
    });
    node.querySelector(".pane-zoom").addEventListener("click", (event) => {
      event.stopPropagation();
      state.zoomedPane = state.zoomedPane === paneId ? null : paneId;
      renderPanes();
    });
    node.querySelector(".pane-close").addEventListener("click", (event) => {
      event.stopPropagation();
      state.closedPanes.add(key);
      renderPanes();
    });
    els.paneStage.append(node);
  });
}

function renderItem(item) {
  const row = document.createElement("div");
  row.className = "item";
  row.dataset.tone = item.tone;
  row.innerHTML = `<span class="item-dot"></span><span>${item.text}</span><span class="item-meta">${item.meta || ""}</span>`;
  return row;
}

function addScratchPane(direction) {
  const active = state.fixtures.tabs.find((tab) => tab.id === state.activeTab);
  const id = `scratch-${Date.now().toString(36)}`;
  state.fixtures.panes[id] = {
    title: direction === "vertical" ? "Nouveau pane vertical" : "Nouveau pane horizontal",
    source: "fixture",
    mode: "fixture",
    items: [{ tone: "neutral", text: "Pane vide - assigne un blade ou une note.", meta: "" }]
  };
  active.panes.push(id);
  state.focusedPane = id;
  state.zoomedPane = null;
  renderPanes();
}

function makeScratchPane(id) {
  return {
    title: id,
    source: "fixture",
    mode: "fixture",
    items: [{ tone: "neutral", text: "Pane temporaire.", meta: "" }]
  };
}

function reorderById(list, fromId, toId) {
  const from = list.findIndex((item) => item.id === fromId);
  const to = list.findIndex((item) => item.id === toId);
  if (from < 0 || to < 0 || from === to) return;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
}

function swapPane(list, fromId, toId) {
  const from = list.indexOf(fromId);
  const to = list.indexOf(toId);
  if (from < 0 || to < 0 || from === to) return;
  [list[from], list[to]] = [list[to], list[from]];
}

function toggleSet(set, key) {
  if (set.has(key)) set.delete(key);
  else set.add(key);
}

function onThemeInput(event) {
  const input = event.target;
  if (input.dataset.token) {
    const unit = input.dataset.unit || "";
    state.theme[input.dataset.token] = `${input.value}${unit}`;
  }
  if (input.dataset.density !== undefined) {
    state.theme.density = input.value;
  }
  applyTheme();
  saveTheme();
}

function applyPreset(name) {
  state.theme = { ...presets[name] };
  applyTheme();
  saveTheme();
  document.querySelectorAll(".preset").forEach((button) => {
    button.classList.toggle("active", button.dataset.preset === name);
  });
}

function resetTheme() {
  state.theme = { ...defaultTheme };
  localStorage.removeItem("nyx-theme");
  applyTheme();
  syncThemeInputs();
}

function loadTheme() {
  try {
    return { ...defaultTheme, ...JSON.parse(localStorage.getItem("nyx-theme") || "{}") };
  } catch {
    return { ...defaultTheme };
  }
}

function saveTheme() {
  localStorage.setItem("nyx-theme", JSON.stringify(state.theme));
}

function applyTheme() {
  Object.entries(state.theme).forEach(([token, value]) => {
    if (token.startsWith("--")) document.documentElement.style.setProperty(token, value);
  });
  document.querySelector(".app-shell").dataset.density = state.theme.density;
  syncThemeInputs();
  updateCssOutput();
}

function syncThemeInputs() {
  els.themeForm.querySelectorAll("[data-token]").forEach((input) => {
    const raw = state.theme[input.dataset.token] || defaultTheme[input.dataset.token];
    input.value = input.type === "range" ? parseFloat(raw) : raw;
  });
  const density = els.themeForm.querySelector("[data-density]");
  density.value = state.theme.density || defaultTheme.density;
}

function themeCss() {
  const entries = Object.entries(state.theme)
    .filter(([token]) => token.startsWith("--"))
    .map(([token, value]) => `  ${token}: ${value};`)
    .join("\n");
  return `:root {\n${entries}\n}`;
}

function updateCssOutput() {
  els.cssOutput.value = themeCss();
}

async function copyCss() {
  await navigator.clipboard.writeText(themeCss());
}

function downloadCss() {
  const blob = new Blob([themeCss() + "\n"], { type: "text/css" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "nyx-theme.css";
  link.click();
  URL.revokeObjectURL(url);
}

boot().catch((error) => {
  els.paneStage.innerHTML = `<div class="empty-state">Erreur de chargement: ${error.message}</div>`;
});
