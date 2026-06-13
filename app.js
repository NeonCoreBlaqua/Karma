const views = Array.from(document.querySelectorAll(".view"));
const routeButtons = Array.from(document.querySelectorAll("[data-target]"));
const notificationBell = document.querySelector("#notificationBell");
const notificationPopover = document.querySelector("#notificationPopover");
const quickNotificationList = document.querySelector("#quickNotificationList");
const alertHistoryList = document.querySelector("#alertHistoryList");
const clearNotificationsButton = document.querySelector("#clearNotifications");
const bottomHomeButton = document.querySelector(".bottom-home");
const connectBridgeStatus = document.querySelector("#connectBridgeStatus");
const profileForm = document.querySelector("#profileForm");
const profileAvatar = document.querySelector("#profileAvatar img");
const profileSummary = document.querySelector("#profileSummary");
const editProfileButton = document.querySelector("#editProfileButton");
const profileSyncStatus = document.querySelector("#profileSyncStatus");
const profileHealthStatus = document.querySelector("#profileHealthStatus");
const useSlProfileButton = document.querySelector("#useSlProfile");
const resetProfileButton = document.querySelector("#resetProfile");
const homeClock = document.querySelector("#homeClock");
const homeDate = document.querySelector("#homeDate");
const timeModeButtons = Array.from(document.querySelectorAll("[data-time-mode]"));
const wallpaperButtons = Array.from(document.querySelectorAll("[data-wallpaper]"));
const wallpaperTarget = document.querySelector("#wallpaperTarget");
const settingsTabs = Array.from(document.querySelectorAll("[data-settings-section]"));
const settingsPanels = Array.from(document.querySelectorAll("[data-settings-panel]"));
const settingsStatus = document.querySelector("#settingsStatus");
const settingsActionButtons = Array.from(document.querySelectorAll("[data-settings-action]"));
const settingsToggleButtons = Array.from(document.querySelectorAll("[data-settings-toggle]"));
const neuroSectionButtons = Array.from(document.querySelectorAll("[data-neuro-section]"));
const neuroPanels = Array.from(document.querySelectorAll("[data-neuro-panel]"));
const neuroPrimaryChoices = Array.from(document.querySelectorAll("[data-neuro-choice]"));
const neuroFollowupChoices = document.querySelector("#neuroFollowupChoices");
const neuroFollowupPrompt = document.querySelector("#neuroFollowupPrompt");
const neuroLastCheckin = document.querySelector("#neuroLastCheckin");
const neuroSuggestion = document.querySelector("#neuroSuggestion");
const neuroSuggestionFull = document.querySelector("#neuroSuggestionFull");
const neuroGreetingName = document.querySelector("#neuroGreetingName");
const pulseEnergy = document.querySelector("#pulseEnergy");
const pulseMood = document.querySelector("#pulseMood");
const pulseHealth = document.querySelector("#pulseHealth");
const neuroPulseSummary = document.querySelector("#neuroPulseSummary");
const profileViewAvatar = document.querySelector("#profileViewAvatar");
const profileViewTitle = document.querySelector("#profileViewTitle");
const profileViewTitleDetail = document.querySelector("#profileViewTitleDetail");
const profileViewName = document.querySelector("#profileViewName");
const profileViewAge = document.querySelector("#profileViewAge");
const profileViewSex = document.querySelector("#profileViewSex");
const profileViewLocation = document.querySelector("#profileViewLocation");
const profileViewLocationHero = document.querySelector("#profileViewLocationHero");
const profileViewHealth = document.querySelector("#profileViewHealth");
const profileViewBio = document.querySelector("#profileViewBio");
const walletDisplayName = document.querySelector("#walletDisplayName");
const walletTotalBalance = document.querySelector("#walletTotalBalance");
const walletChecking = document.querySelector("#walletChecking");
const walletSavings = document.querySelector("#walletSavings");
const walletSyncStatus = document.querySelector("#walletSyncStatus");
const walletHistoryList = document.querySelector("#walletHistoryList");
const walletActionTitle = document.querySelector("#walletActionTitle");
const walletActionText = document.querySelector("#walletActionText");
const walletActionButtons = Array.from(document.querySelectorAll("[data-wallet-action]"));
const PROFILE_STORAGE_KEY = "neuroLinkProfile";
const PROFILE_PENDING_SYNC_KEY = "neuroLinkProfilePendingSync";
const HEALTH_STATUS_KEY = "neuroLinkHealthStatus";
const PROFILE_ENDPOINT_KEY = "neuroLinkProfileEndpoint";
const PROFILE_LOCATION_KEY = "neuroLinkProfileLocation";
const TIME_MODE_KEY = "neuroLinkTimeMode";
const WALLPAPER_KEY = "neuroLinkWallpaper";
const WALLPAPER_MAP_KEY = "neuroLinkWallpaperMap";
const SETTINGS_STATE_KEY = "neuroLinkSettingsState";
const NOTIFICATION_STATE_KEY = "neuroLinkNotifications";
const NEURO_STATE_KEY = "neuroLinkCareState";
const GCOIN_WALLET_KEY = "neuroLinkGcoinWallet";
const QUICK_NOTIFICATION_TTL_MS = 60 * 60 * 1000;
const DEFAULT_PROFILE_IMAGE = "images/Male Avatar.png";
const DEFAULT_MALE_PROFILE_IMAGE = "images/Male Avatar.png";
const DEFAULT_FEMALE_PROFILE_IMAGE = "images/Female Avatar.png";
const VALID_LOCATIONS = ["Eden Palms", "Chi-Core"];
const VALID_SEXES = ["Female", "Male", "Non-binary", "Private"];
const HEALTH_EMOJIS = ["\uD83D\uDE01", "\uD83D\uDE14", "\uD83D\uDE37", "\uD83D\uDE10", "\uD83D\uDE12", "\uD83D\uDE03"];
const CDF_DAY_MS = 4 * 60 * 60 * 1000;
const WALLPAPERS = {
  "neuro-midnight": "images/wallpapers/neuro-midnight.png",
  "city-signal": "images/wallpapers/city-signal.png",
  "black-gold": "images/wallpapers/black-gold.png",
  "velvet-night": "images/wallpapers/velvet-night.png",
  "burple-tide": "images/wallpapers/burple-tide.png",
  "emerald-horizon": "images/wallpapers/emerald-horizon.png"
};
const WALLPAPER_TARGETS = ["home", "profile", "wallet", "health", "messages", "connect", "settings"];
function defaultNotifications() {
  const now = Date.now();
  return [
    { id: "health-vitamin", icon: "H", title: "Health", message: "Vitamin reminder ready.", createdAt: now - 2 * 60 * 1000, unread: true },
    { id: "wallet-payment", icon: "G", title: "Wallet", message: "GC payment received.", createdAt: now - 8 * 60 * 1000, unread: true },
    { id: "system-profile", icon: "S", title: "System", message: "Profile synced.", createdAt: now - 14 * 60 * 1000, unread: false },
    { id: "alert-wellness", icon: "!", title: "Alert", message: "Low wellness status.", createdAt: now - 22 * 60 * 1000, unread: true }
  ];
}

const urlParams = new URLSearchParams(location.search);
const configuredEndpoint = urlParams.get("profileEndpoint") || localStorage.getItem(PROFILE_ENDPOINT_KEY) || "";
const profileBridge = urlParams.get("profileBridge") || "";

if (connectBridgeStatus) {
  connectBridgeStatus.textContent = profileBridge === "sl" ? "SL Bridge Active" : "Web Mode";
}

function showView(name) {
  closeNotifications();
  const viewName = views.some((view) => view.dataset.view === name) ? name : "home";

  for (const view of views) {
    view.classList.toggle("active", view.dataset.view === viewName);
  }

  for (const button of routeButtons) {
    button.classList.toggle("active", button.dataset.target === viewName);
  }

  if (location.hash !== `#${viewName}`) {
    history.replaceState(null, "", `#${viewName}`);
  }

  if (viewName === "wallet") renderWallet();
}

function sendSlBridgeOp(op) {
  if (!configuredEndpoint || profileBridge !== "sl") return false;

  const payload = new URLSearchParams();
  payload.set("op", op);
  payload.set("tick", String(Date.now()));

  const separator = configuredEndpoint.includes("?") ? "&" : "?";
  const ping = new Image();
  ping.alt = "";
  ping.src = `${configuredEndpoint}${separator}${payload.toString()}`;
  window.__neuroLinkBridgePings = window.__neuroLinkBridgePings || [];
  window.__neuroLinkBridgePings.push(ping);
  window.setTimeout(() => window.__neuroLinkBridgePings.shift(), 8000);
  return true;
}

function handleRouteButton(button) {
  const target = button.dataset.target;
  if (target === "health") sendSlBridgeOp("neuro-open");
  showView(target);
}

for (const button of routeButtons) {
  button.addEventListener("click", () => handleRouteButton(button));
}

function readNotifications() {
  try {
    const saved = JSON.parse(localStorage.getItem(NOTIFICATION_STATE_KEY));
    return normalizeNotifications(Array.isArray(saved) ? saved : defaultNotifications());
  } catch (error) {
    return normalizeNotifications(defaultNotifications());
  }
}

function writeNotifications(notifications) {
  localStorage.setItem(NOTIFICATION_STATE_KEY, JSON.stringify(notifications));
}

function normalizeNotifications(notifications) {
  const now = Date.now();
  return notifications.map((item, index) => ({
    id: item.id || `alert-${index}`,
    icon: item.icon || item.title?.charAt(0) || "!",
    title: item.title || "Alert",
    message: item.message || "Notification ready.",
    createdAt: Number(item.createdAt) || now - index * 6 * 60 * 1000,
    unread: item.unread !== false
  })).sort((a, b) => b.createdAt - a.createdAt);
}

function recentBellNotifications() {
  const now = Date.now();
  return readNotifications().filter((item) => item.unread && now - item.createdAt < QUICK_NOTIFICATION_TTL_MS);
}

function formatNotificationTime(createdAt) {
  const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function unreadNotificationCount() {
  return recentBellNotifications().length;
}

function updateNotificationBadge() {
  if (!notificationBell) return;
  const badge = notificationBell.querySelector("span");
  const count = unreadNotificationCount();
  notificationBell.classList.toggle("has-unread", count > 0);
  if (badge) badge.textContent = count > 0 ? String(count) : "";
}

function renderQuickNotifications() {
  if (!quickNotificationList) return;
  const notifications = recentBellNotifications();
  quickNotificationList.innerHTML = notifications.length ? notifications.map((item) => `
    <button type="button" data-notification-id="${item.id}" class="${item.unread ? "unread" : ""}">
      <i>${item.icon}</i>
      <span>
        <strong>${item.title}</strong>
        <small>${item.message}</small>
      </span>
      <em>${formatNotificationTime(item.createdAt)}</em>
    </button>
  `).join("") : `<p class="empty-notifications">No new alerts.</p>`;

  for (const button of quickNotificationList.querySelectorAll("[data-notification-id]")) {
    button.addEventListener("click", () => {
      const updated = readNotifications().map((item) => (
        item.id === button.dataset.notificationId ? { ...item, unread: false } : item
      ));
      writeNotifications(updated);
      renderQuickNotifications();
      renderAlertHistory();
      updateNotificationBadge();
    });
  }
}

function renderAlertHistory() {
  if (!alertHistoryList) return;
  const notifications = readNotifications();
  alertHistoryList.innerHTML = notifications.map((item) => `
    <button type="button" data-alert-id="${item.id}" class="${item.unread ? "unread" : ""}">
      <span>${item.title}</span>
      <strong>${item.message}</strong>
      <em>${formatNotificationTime(item.createdAt)}</em>
    </button>
  `).join("");

  for (const button of alertHistoryList.querySelectorAll("[data-alert-id]")) {
    button.addEventListener("click", () => {
      const updated = readNotifications().map((item) => (
        item.id === button.dataset.alertId ? { ...item, unread: false } : item
      ));
      writeNotifications(updated);
      renderAlertHistory();
      renderQuickNotifications();
      updateNotificationBadge();
    });
  }
}

function openNotifications() {
  if (!notificationPopover || !notificationBell) return;
  renderQuickNotifications();
  notificationPopover.hidden = false;
  notificationPopover.classList.add("open");
  notificationBell.setAttribute("aria-expanded", "true");
}

function closeNotifications() {
  if (!notificationPopover || !notificationBell) return;
  notificationPopover.classList.remove("open");
  notificationPopover.hidden = true;
  notificationBell.setAttribute("aria-expanded", "false");
}

notificationBell?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (notificationPopover?.classList.contains("open")) {
    closeNotifications();
  } else {
    openNotifications();
  }
});

notificationPopover?.addEventListener("click", (event) => event.stopPropagation());

document.addEventListener("click", () => closeNotifications());

bottomHomeButton?.addEventListener("click", () => closeNotifications());

clearNotificationsButton?.addEventListener("click", () => {
  writeNotifications(readNotifications().map((item) => ({ ...item, unread: false })));
  renderQuickNotifications();
  renderAlertHistory();
  updateNotificationBadge();
});

function formatTwelveHour(hours, minutes) {
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

function currentCdfTime(now = new Date()) {
  const localMidnight = new Date(now);
  localMidnight.setHours(0, 0, 0, 0);
  const elapsedToday = (now - localMidnight) % CDF_DAY_MS;
  const cdfMinutes = Math.floor((elapsedToday / CDF_DAY_MS) * 24 * 60) % (24 * 60);
  return {
    hours: Math.floor(cdfMinutes / 60),
    minutes: cdfMinutes % 60
  };
}

function updateClock() {
  if (!homeClock || !homeDate) return;

  const mode = localStorage.getItem(TIME_MODE_KEY) === "cdf" ? "cdf" : "rl";
  const now = new Date();

  if (mode === "cdf") {
    const cdf = currentCdfTime(now);
    homeClock.textContent = formatTwelveHour(cdf.hours, cdf.minutes);
    homeDate.textContent = "Camden Falls Time";
  } else {
    homeClock.textContent = formatTwelveHour(now.getHours(), now.getMinutes());
    homeDate.textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric"
    });
  }

  for (const button of timeModeButtons) {
    const active = button.dataset.timeMode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

for (const button of timeModeButtons) {
  button.addEventListener("click", () => {
    localStorage.setItem(TIME_MODE_KEY, button.dataset.timeMode);
    updateClock();
  });
}

function readWallpaperMap() {
  try {
    return JSON.parse(localStorage.getItem(WALLPAPER_MAP_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function writeWallpaperMap(map) {
  localStorage.setItem(WALLPAPER_MAP_KEY, JSON.stringify(map));
}

function wallpaperForTarget(target, map = readWallpaperMap()) {
  return WALLPAPERS[map[target]] ? map[target] : localStorage.getItem(WALLPAPER_KEY) || "neuro-midnight";
}

function paintViewWallpaper(viewName, wallpaperName) {
  const view = document.querySelector(`[data-view="${viewName}"]`);
  if (view && WALLPAPERS[wallpaperName]) {
    view.style.setProperty("--view-wallpaper", `url("${WALLPAPERS[wallpaperName]}")`);
  }
}

function refreshWallpaperButtons() {
  const target = wallpaperTarget?.value || "all";
  const activeWallpaper = target === "all" ? localStorage.getItem(WALLPAPER_KEY) || "neuro-midnight" : wallpaperForTarget(target);

  for (const button of wallpaperButtons) {
    button.classList.toggle("active", button.dataset.wallpaper === activeWallpaper);
  }
}

function applyWallpaper(name = localStorage.getItem(WALLPAPER_KEY) || "neuro-midnight", target = wallpaperTarget?.value || "all") {
  const wallpaperName = WALLPAPERS[name] ? name : "neuro-midnight";
  const map = readWallpaperMap();

  if (target === "all") {
    localStorage.setItem(WALLPAPER_KEY, wallpaperName);
    for (const viewName of WALLPAPER_TARGETS) {
      map[viewName] = wallpaperName;
      paintViewWallpaper(viewName, wallpaperName);
    }
  } else {
    map[target] = wallpaperName;
    paintViewWallpaper(target, wallpaperName);
  }

  writeWallpaperMap(map);
  refreshWallpaperButtons();
  setSettingsStatus(`${wallpaperName.replace(/-/g, " ")} applied to ${target === "all" ? "all screens" : target}.`);
}

function loadWallpapers() {
  const map = readWallpaperMap();
  const fallback = localStorage.getItem(WALLPAPER_KEY) || "neuro-midnight";

  for (const viewName of WALLPAPER_TARGETS) {
    const wallpaperName = WALLPAPERS[map[viewName]] ? map[viewName] : fallback;
    map[viewName] = wallpaperName;
    paintViewWallpaper(viewName, wallpaperName);
  }

  writeWallpaperMap(map);
  refreshWallpaperButtons();
}

for (const button of wallpaperButtons) {
  button.addEventListener("click", () => applyWallpaper(button.dataset.wallpaper));
}

wallpaperTarget?.addEventListener("change", refreshWallpaperButtons);

function setSettingsStatus(message) {
  if (settingsStatus) settingsStatus.textContent = message;
}

for (const tab of settingsTabs) {
  tab.addEventListener("click", () => {
    const section = tab.dataset.settingsSection;
    for (const button of settingsTabs) button.classList.toggle("active", button === tab);
    for (const panel of settingsPanels) panel.classList.toggle("active", panel.dataset.settingsPanel === section);
    setSettingsStatus(`${section} settings open.`);
  });
}

function readSettingsState() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_STATE_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function writeSettingsState(state) {
  localStorage.setItem(SETTINGS_STATE_KEY, JSON.stringify(state));
}

function refreshToggleButtons() {
  const state = readSettingsState();
  for (const button of settingsToggleButtons) {
    const enabled = !!state[button.dataset.settingsToggle];
    button.classList.toggle("active", enabled);
    button.dataset.state = enabled ? "On" : "Off";
  }
}

for (const button of settingsToggleButtons) {
  button.addEventListener("click", () => {
    const state = readSettingsState();
    const key = button.dataset.settingsToggle;
    state[key] = !state[key];
    writeSettingsState(state);
    refreshToggleButtons();
    setSettingsStatus(`${button.querySelector("strong")?.textContent || "Setting"} ${state[key] ? "enabled" : "disabled"}.`);
  });
}

async function runSettingsAction(action) {
  if (action === "refresh-sync") {
    renderHealthStatus();
    renderProfileSummary();
    setSettingsStatus("Sync refreshed.");
    return;
  }

  if (action === "export-data") {
    const data = {
      profile: localStorage.getItem(PROFILE_STORAGE_KEY),
      wallpaperMap: readWallpaperMap(),
      settings: readSettingsState(),
      exportedAt: new Date().toISOString()
    };
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    link.download = "neuro-link-backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
    setSettingsStatus("Backup exported.");
    return;
  }

  if (action === "diagnostics") {
    setSettingsStatus(`Diagnostics OK. Bridge: ${profileBridge === "sl" ? "SL media" : "local/web"}.`);
    return;
  }

  if (action === "clear-cache") {
    localStorage.removeItem(PROFILE_PENDING_SYNC_KEY);
    setSettingsStatus("Temporary cache cleared.");
    return;
  }

  if (action === "reset-neuro") {
    localStorage.removeItem(WALLPAPER_KEY);
    localStorage.removeItem(WALLPAPER_MAP_KEY);
    localStorage.removeItem(TIME_MODE_KEY);
    loadWallpapers();
    updateClock();
    setSettingsStatus("Display settings reset.");
    return;
  }

  if (action === "refresh-media") {
    setSettingsStatus("Refreshing media...");
    location.reload();
    return;
  }

  if (action === "bridge-status") {
    setSettingsStatus(profileBridge === "sl" ? "SL bridge mode is active." : "SL bridge mode is not active.");
  }
}

for (const button of settingsActionButtons) {
  button.addEventListener("click", () => runSettingsAction(button.dataset.settingsAction));
}

const DEFAULT_WALLET_STATE = {
  displayName: "",
  agentName: "",
  accountId: "",
  checking: 0,
  savings: 0,
  updatedAt: "",
  history: []
};

function parseGcAmount(value) {
  const clean = String(value ?? "")
    .replace(/gc/gi, "")
    .replace(/g\$/gi, "")
    .replace(/,/g, "")
    .trim();
  const amount = Number(clean);
  return Number.isFinite(amount) ? amount : 0;
}

function formatGc(value) {
  const amount = parseGcAmount(value);
  return `GC ${Math.round(amount).toLocaleString()}`;
}

function walletProfileName() {
  try {
    const profile = normalizeProfile(JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || "{}"));
    return profile.displayName || "";
  } catch (error) {
    return "";
  }
}

function readWalletState() {
  try {
    return { ...DEFAULT_WALLET_STATE, ...JSON.parse(localStorage.getItem(GCOIN_WALLET_KEY)) };
  } catch (error) {
    return { ...DEFAULT_WALLET_STATE };
  }
}

function writeWalletState(state) {
  localStorage.setItem(GCOIN_WALLET_KEY, JSON.stringify(state));
}

function walletStateFromUrl() {
  const checking = urlParams.get("gcChecking") || urlParams.get("checking") || urlParams.get("gcoinChecking");
  const savings = urlParams.get("gcSavings") || urlParams.get("savings") || urlParams.get("gcoinSavings");
  const total = urlParams.get("gcBalance") || urlParams.get("gcoinBalance");
  const displayName = urlParams.get("gcDisplayName") || urlParams.get("walletDisplayName") || urlParams.get("displayName") || "";
  const accountId = urlParams.get("gcAccount") || urlParams.get("accountId") || urlParams.get("uuid") || "";
  const hasWalletData = checking !== null || savings !== null || total !== null || displayName !== "" || accountId !== "";

  if (!hasWalletData) return null;

  const existing = readWalletState();
  const next = {
    ...existing,
    displayName: displayName || existing.displayName,
    accountId: accountId || existing.accountId,
    checking: checking !== null ? parseGcAmount(checking) : (total !== null ? parseGcAmount(total) : existing.checking),
    savings: savings !== null ? parseGcAmount(savings) : existing.savings,
    updatedAt: new Date().toISOString()
  };

  return next;
}

function normalizeWalletHistory(history = []) {
  return history.slice(0, 8).map((item, index) => ({
    id: item.id || `wallet-${index}`,
    type: item.type || "Server",
    title: item.title || "G-Coin update",
    detail: item.detail || "Balance synced from server.",
    amount: item.amount || "",
    createdAt: item.createdAt || new Date().toISOString()
  }));
}

function appendWalletHistory(entry) {
  const state = readWalletState();
  state.history = normalizeWalletHistory([entry, ...(state.history || [])]);
  writeWalletState(state);
}

function currentWalletState() {
  const fromUrl = walletStateFromUrl();
  if (fromUrl) {
    fromUrl.history = normalizeWalletHistory(fromUrl.history);
    if (!fromUrl.history.length) {
      fromUrl.history = normalizeWalletHistory([{
        type: "Sync",
        title: "Balance synced",
        detail: "G-Coin Server balance received.",
        amount: formatGc((fromUrl.checking || 0) + (fromUrl.savings || 0)),
        createdAt: fromUrl.updatedAt
      }]);
    }
    writeWalletState(fromUrl);
    return fromUrl;
  }

  const saved = readWalletState();
  return { ...saved, history: normalizeWalletHistory(saved.history) };
}

function renderWallet() {
  const state = currentWalletState();
  const displayName = state.displayName || walletProfileName() || "Waiting for server";
  const checking = parseGcAmount(state.checking);
  const savings = parseGcAmount(state.savings);
  const total = checking + savings;

  if (walletDisplayName) walletDisplayName.textContent = displayName;
  if (walletChecking) walletChecking.textContent = formatGc(checking);
  if (walletSavings) walletSavings.textContent = formatGc(savings);
  if (walletTotalBalance) walletTotalBalance.textContent = formatGc(total);
  if (walletSyncStatus) {
    walletSyncStatus.textContent = state.updatedAt
      ? `Synced ${new Date(state.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. UUID stays internal.`
      : "Waiting for G-Coin Server sync.";
  }

  if (walletHistoryList) {
    walletHistoryList.innerHTML = state.history.length ? state.history.map((item) => `
      <article>
        <span>${item.type}</span>
        <strong>${item.title}</strong>
        <em>${item.amount || ""}</em>
        <small>${item.detail}</small>
      </article>
    `).join("") : `
      <article>
        <span>Server</span>
        <strong>No activity loaded</strong>
        <em></em>
        <small>Recent G-Coin transactions will appear here after the bridge sends them.</small>
      </article>
    `;
  }
}

function setWalletAction(title, text) {
  if (walletActionTitle) walletActionTitle.textContent = title;
  if (walletActionText) walletActionText.textContent = text;
}

function handleWalletAction(action) {
  if (action === "refresh") {
    const sent = sendSlBridgeOp("gcoin-balance");
    renderWallet();
    setWalletAction("Refresh Balance", sent ? "Balance refresh requested from the SL bridge." : "Refresh ready. Waiting for SL bridge connection.");
    return;
  }

  if (action === "send") {
    const sent = sendSlBridgeOp("gcoin-send");
    setWalletAction("Send Money", sent ? "Opening server-backed Send Money flow." : "Send Money needs the SL G-Coin bridge before it can move funds.");
    return;
  }

  if (action === "request") {
    const sent = sendSlBridgeOp("gcoin-request");
    setWalletAction("Request Money", sent ? "Opening server-backed Request Money flow." : "Request Money is waiting for the new server-backed request flow.");
    return;
  }

  if (action === "history") {
    const sent = sendSlBridgeOp("gcoin-history");
    setWalletAction("History", sent ? "Transaction history requested from the server." : "History will show server logs once the bridge sends them.");
  }
}

for (const button of walletActionButtons) {
  button.addEventListener("click", () => handleWalletAction(button.dataset.walletAction));
}

const NEURO_DEFAULT_STATE = {
  energy: "Normal",
  mood: "Chill",
  health: "Normal",
  food: "Not checked",
  water: "Not checked",
  rest: "Not checked",
  rent: "Stable",
  social: "Quiet",
  stress: "Low",
  lastCheckIn: ""
};

const NEURO_FOLLOWUPS = {
  Focused: { prompt: "What are we focusing on first?", choices: ["Work", "Errands", "Creative", "Reset"] },
  Tired: { prompt: "Need rest, water, or a slower pace?", choices: ["Rest", "Water", "Slow pace", "Not now"] },
  Hungry: { prompt: "Need breakfast, coffee, or water first?", choices: ["Breakfast", "Coffee", "Water", "Not now"] },
  Stressed: { prompt: "What would help lower the pressure?", choices: ["Breathe", "Quiet", "Talk", "Break"] },
  Social: { prompt: "How social are we feeling?", choices: ["Active", "Low-key", "DMs", "Solo"] },
  Skip: { prompt: "No check-in saved yet.", choices: ["Not now"] }
};

function readNeuroState() {
  try {
    return { ...NEURO_DEFAULT_STATE, ...JSON.parse(localStorage.getItem(NEURO_STATE_KEY)) };
  } catch (error) {
    return { ...NEURO_DEFAULT_STATE };
  }
}

function writeNeuroState(state) {
  localStorage.setItem(NEURO_STATE_KEY, JSON.stringify(state));
}

function showNeuroPanel(name = "home") {
  const panelName = neuroPanels.some((panel) => panel.dataset.neuroPanel === name) ? name : "home";
  for (const button of neuroSectionButtons) {
    button.classList.toggle("active", button.dataset.neuroSection === panelName);
  }
  for (const panel of neuroPanels) {
    panel.classList.toggle("active", panel.dataset.neuroPanel === panelName);
  }
}

function neuroSuggestionFor(state) {
  if (state.food === "Hungry" || state.food === "Breakfast") return "You marked food as a priority. A real meal and some water could help your energy stabilize.";
  if (state.energy === "Low" || state.rest === "Needed") return "Your energy is low. A short rest, water, and a slower pace would be a good next move.";
  if (state.stress === "High") return "Stress is running high. Try a quiet reset before taking on the next task.";
  if (state.social === "Active") return "You are open socially. Check Camden Falls Online or send a DM when you are ready.";
  if (state.mood === "Focused") return "You are focused. Pick one task and keep the next step small.";
  return "Your pulse looks steady. Keep food, water, and rest balanced today.";
}

function renderNeuro() {
  const state = readNeuroState();
  let profile = {};
  try {
    profile = normalizeProfile(JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || "{}"));
  } catch (error) {
    profile = normalizeProfile({});
  }
  if (neuroGreetingName) neuroGreetingName.textContent = `${profile.displayName || "Xavion"}.`;
  if (pulseEnergy) pulseEnergy.textContent = state.energy;
  if (pulseMood) pulseMood.textContent = state.mood;
  if (pulseHealth) pulseHealth.textContent = state.health;
  if (neuroLastCheckin) {
    neuroLastCheckin.textContent = state.lastCheckIn ? `Last check-in: ${new Date(state.lastCheckIn).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Last check-in: Not yet";
  }
  const suggestion = neuroSuggestionFor(state);
  if (neuroSuggestion) neuroSuggestion.textContent = suggestion;
  if (neuroSuggestionFull) neuroSuggestionFull.textContent = suggestion;
  if (neuroPulseSummary) {
    neuroPulseSummary.innerHTML = Object.entries(state).map(([key, value]) => `<div><span>${key}</span><strong>${value || "Not checked"}</strong></div>`).join("");
  }
}

function saveNeuroChoice(primary, followup = "") {
  const state = readNeuroState();
  state.lastCheckIn = new Date().toISOString();

  if (primary === "Focused") {
    state.energy = "Good";
    state.mood = "Focused";
  } else if (primary === "Tired") {
    state.energy = "Low";
    state.rest = "Needed";
  } else if (primary === "Hungry") {
    state.food = followup || "Hungry";
    if (followup === "Water") state.water = "Needed";
  } else if (primary === "Stressed") {
    state.stress = "High";
    state.mood = "Stressed";
  } else if (primary === "Social") {
    state.social = followup || "Active";
    state.mood = "Social";
  }

  if (followup === "Water") state.water = "Needed";
  if (followup === "Rest") state.rest = "Needed";
  if (followup === "Break" || followup === "Breathe" || followup === "Quiet") state.stress = "Moderate";

  writeNeuroState(state);
  renderNeuro();
}

for (const button of neuroSectionButtons) {
  button.addEventListener("click", () => showNeuroPanel(button.dataset.neuroSection));
}

for (const button of neuroPrimaryChoices) {
  button.addEventListener("click", () => {
    const choice = button.dataset.neuroChoice;
    const followup = NEURO_FOLLOWUPS[choice] || NEURO_FOLLOWUPS.Skip;
    if (neuroFollowupPrompt) neuroFollowupPrompt.textContent = followup.prompt;
    if (neuroFollowupChoices) {
      neuroFollowupChoices.innerHTML = followup.choices.map((item) => `<button type="button" data-followup="${item}">${item}</button>`).join("");
      for (const followupButton of neuroFollowupChoices.querySelectorAll("[data-followup]")) {
        followupButton.addEventListener("click", () => saveNeuroChoice(choice, followupButton.dataset.followup));
      }
    }
    if (choice === "Skip") saveNeuroChoice(choice, "Not now");
  });
}

for (const button of document.querySelectorAll("[data-neuro-care]")) {
  button.addEventListener("click", () => {
    const state = readNeuroState();
    const key = button.dataset.neuroCare;
    if (key in NEURO_DEFAULT_STATE) {
      state[key] = "Checked";
    } else if (key === "meds" || key === "hygiene") {
      state.health = "Checked";
    } else if (key === "selfCare") {
      state.mood = "Supported";
    }
    state.lastCheckIn = new Date().toISOString();
    writeNeuroState(state);
    renderNeuro();
  });
}

for (const list of document.querySelectorAll("[data-neuro-list]")) {
  const type = list.dataset.neuroList;
  const items = {
    health: ["Status: Normal", "Sickness: None", "Medication: None", "Pain / Discomfort: None"],
    care: ["Food", "Water", "Rest", "Meds", "Hygiene", "Self-Care"],
    lifestyle: ["Rent: Stable", "Social Life: Quiet", "Stress Level: Low", "Sleep Schedule: Normal"]
  }[type] || [];
  list.innerHTML = items.map((item) => `<button type="button">${item}</button>`).join("");
}

window.addEventListener("hashchange", () => {
  showView(location.hash.replace("#", "") || "home");
});

showView(location.hash.replace("#", "") || "home");
loadWallpapers();
refreshToggleButtons();
renderAlertHistory();
updateNotificationBadge();
renderWallet();
renderNeuro();
updateClock();
window.setInterval(updateClock, 10000);

function setProfileStatus(message) {
  if (profileSyncStatus) profileSyncStatus.textContent = message;
}

function showProfileMode(mode) {
  const isView = mode === "view";
  profileSummary?.classList.toggle("hidden", !isView);
  profileForm?.classList.toggle("hidden", isView);
}

function getProfileFormData() {
  if (!profileForm) return {};

  const data = Object.fromEntries(new FormData(profileForm).entries());
  data.location = canonicalLocation(data.location) || localStorage.getItem(PROFILE_LOCATION_KEY) || "Eden Palms";
  data.sex = VALID_SEXES.includes(data.sex) ? data.sex : "";
  data.healthStatus = getHealthStatus();
  data.profileImage = defaultProfileImage(data.sex);
  data.updatedAt = new Date().toISOString();
  return data;
}

function normalizeProfile(profile = {}) {
  const location = canonicalLocation(profile.location) || localStorage.getItem(PROFILE_LOCATION_KEY) || "Eden Palms";

  return {
    title: cleanLoadedValue(profile.title, "Resident"),
    displayName: cleanLoadedValue(profile.displayName, "Not set"),
    age: cleanLoadedValue(profile.age, "Not set"),
    sex: VALID_SEXES.includes(profile.sex) ? profile.sex : "",
    location,
    bio: cleanLoadedValue(profile.bio, "No bio set."),
    healthStatus: healthEmoji(profile.healthStatus),
    profileImage: defaultProfileImage(profile.sex),
    updatedAt: profile.updatedAt || new Date().toISOString()
  };
}

function cleanLoadedValue(value, placeholder) {
  const clean = String(value || "").trim();
  return clean === placeholder ? "" : clean;
}

function canonicalLocation(value = "") {
  const clean = String(value || "")
    .replace(/\+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const compact = clean.toLowerCase().replace(/[^a-z]/g, "");

  if (compact.includes("chicore") || compact.includes("chico") || compact === "chi") return "Chi-Core";
  if (compact.includes("edenpalms")) return "Eden Palms";
  return "";
}

function healthEmoji(value = "") {
  const clean = String(value || "").trim();
  if (HEALTH_EMOJIS.includes(clean)) return clean;

  const lowered = clean.toLowerCase();
  if (lowered.includes("happy") || lowered.includes("good") || lowered.includes("great")) return "\uD83D\uDE03";
  if (lowered.includes("sad") || lowered.includes("low")) return "\uD83D\uDE14";
  if (lowered.includes("sick") || lowered.includes("ill")) return "\uD83D\uDE37";
  if (lowered.includes("annoy") || lowered.includes("mad")) return "\uD83D\uDE12";
  if (lowered.includes("not") || lowered.includes("sync")) return "\uD83D\uDE10";
  return "\uD83D\uDE10";
}

function defaultProfileImage(sex = "") {
  const normalized = String(sex).toLowerCase();
  if (normalized === "male") return DEFAULT_MALE_PROFILE_IMAGE;
  if (normalized === "female") return DEFAULT_FEMALE_PROFILE_IMAGE;
  return DEFAULT_PROFILE_IMAGE;
}

function getProfileFromUrl() {
  const identityKeys = ["title", "displayName", "age", "sex", "location", "bio"];
  const keys = [...identityKeys, "healthStatus"];
  const profile = {};

  for (const key of keys) {
    const value = urlParams.get(key);
    if (value !== null && value !== "") profile[key] = value;
  }

  const hasIdentity = identityKeys.some((key) => profile[key] && profile[key] !== "Not set" && profile[key] !== "No bio set.");
  if (!hasIdentity) {
    if (profile.healthStatus) localStorage.setItem(HEALTH_STATUS_KEY, profile.healthStatus);
    return null;
  }

  profile.updatedAt = urlParams.get("updatedAt") || new Date().toISOString();
  return normalizeProfile(profile);
}

function applyProfileData(profile) {
  if (!profileForm || !profile) return;
  const normalized = normalizeProfile(profile);
  localStorage.setItem(PROFILE_LOCATION_KEY, normalized.location);

  for (const [key, value] of Object.entries(normalized)) {
    const field = profileForm.elements[key];
    if (field && key !== "profileImage") field.value = value;
  }

  if (profileAvatar) profileAvatar.src = defaultProfileImage(normalized.sex);
  renderHealthStatus();
  renderProfileSummary(normalized);
}

function renderProfileSummary(profile = getProfileFormData()) {
  profile = normalizeProfile(profile);
  const fallback = "Not set";
  const health = getHealthStatus();

  if (profileViewAvatar) profileViewAvatar.src = defaultProfileImage(profile.sex);
  if (profileViewTitle) profileViewTitle.textContent = profile.title || "Resident";
  if (profileViewTitleDetail) profileViewTitleDetail.textContent = profile.title || "Resident";
  if (profileViewName) profileViewName.textContent = profile.displayName || fallback;
  if (profileViewAge) profileViewAge.textContent = profile.age || fallback;
  if (profileViewSex) profileViewSex.textContent = profile.sex || fallback;
  if (profileViewLocation) profileViewLocation.textContent = profile.location || "Eden Palms";
  if (profileViewLocationHero) profileViewLocationHero.textContent = profile.location || "Eden Palms";
  if (profileViewHealth) profileViewHealth.textContent = healthEmoji(health);
  if (profileViewBio) profileViewBio.textContent = profile.bio || "No bio set.";
  renderNeuro();
}

function getHealthStatus() {
  const health = window.NeuroLinkHealth || {};
  return healthEmoji(health.status || localStorage.getItem(HEALTH_STATUS_KEY) || "\uD83D\uDE10");
}

function renderHealthStatus() {
  if (profileHealthStatus) profileHealthStatus.textContent = getHealthStatus();
  if (profileViewHealth) profileViewHealth.textContent = getHealthStatus();
}

function loadProfile() {
  try {
    const urlProfile = getProfileFromUrl();
    if (urlProfile) {
      if (urlProfile.healthStatus) localStorage.setItem(HEALTH_STATUS_KEY, urlProfile.healthStatus);
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(urlProfile));
      applyProfileData(urlProfile);
      showProfileMode("view");
      setProfileStatus("Loaded from Neuro server");
      return;
    }

    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) {
      const profile = normalizeProfile(JSON.parse(saved));
      applyProfileData(profile);
      showProfileMode("view");
      setProfileStatus("Local profile loaded");
    } else {
      showProfileMode("edit");
    }
  } catch (error) {
    showProfileMode("edit");
    setProfileStatus("Local profile could not load");
  }
}

async function syncProfileToServer(profile) {
  if (!configuredEndpoint) return { ok: false, skipped: true };

  if (profileBridge === "sl") {
    return syncProfileToSlBridge(profile);
  }

  const response = await fetch(configuredEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile)
  });

  return { ok: response.ok, skipped: false };
}

function syncProfileToSlBridge(profile, op = "save") {
  const payload = new URLSearchParams();
  payload.set("op", op);
  payload.set("displayName", profile.displayName || "");
  payload.set("age", profile.age || "");
  payload.set("sex", profile.sex || "");
  payload.set("location", profile.location || "");
  payload.set("title", profile.title || "");
  payload.set("bio", profile.bio || "");
  payload.set("healthStatus", healthEmoji(getHealthStatus()));
  payload.set("updatedAt", profile.updatedAt || new Date().toISOString());

  const separator = configuredEndpoint.includes("?") ? "&" : "?";
  const url = `${configuredEndpoint}${separator}${payload.toString()}`;
  const ping = new Image();
  ping.alt = "";
  ping.src = url;
  window.__neuroLinkProfilePings = window.__neuroLinkProfilePings || [];
  window.__neuroLinkProfilePings.push(ping);
  window.setTimeout(() => window.__neuroLinkProfilePings.shift(), 8000);

  return Promise.resolve({ ok: true, skipped: false, beacon: true });
}

function clearProfileForm() {
  if (profileForm) profileForm.reset();
  localStorage.removeItem(PROFILE_STORAGE_KEY);
  localStorage.removeItem(PROFILE_PENDING_SYNC_KEY);
  if (profileAvatar) profileAvatar.src = DEFAULT_PROFILE_IMAGE;
  renderHealthStatus();
  renderProfileSummary({});
  showProfileMode("edit");
}

async function resetProfile() {
  clearProfileForm();
  setProfileStatus("Profile reset locally. Clearing Neuro server...");

  try {
    if (configuredEndpoint && profileBridge === "sl") {
      await syncProfileToSlBridge({}, "clear");
      setProfileStatus("Profile reset. Save again to rebuild server profile.");
    } else {
      setProfileStatus("Profile reset locally.");
    }
  } catch (error) {
    setProfileStatus("Profile reset locally. Server clear failed.");
  }
}

async function saveProfile() {
  const profile = getProfileFormData();
  localStorage.setItem(PROFILE_LOCATION_KEY, profile.location);
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  localStorage.setItem(PROFILE_PENDING_SYNC_KEY, JSON.stringify(profile));
  renderProfileSummary(profile);
  showProfileMode("view");
  setProfileStatus("Saved locally. Neuro server sync pending.");

  try {
    const result = await syncProfileToServer(profile);
    if (result.ok) {
      if (!result.beacon) localStorage.removeItem(PROFILE_PENDING_SYNC_KEY);
      setProfileStatus(result.beacon ? "Sent to SL Neuro server" : "Saved in Neuro server");
    } else if (result.skipped) {
      setProfileStatus("Saved locally. Connect Neuro server to sync.");
    }
  } catch (error) {
    setProfileStatus("Saved locally. Neuro server offline.");
  }
}

if (profileForm) {
  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveProfile();
  });

  profileForm.elements.sex?.addEventListener("change", () => {
    const profile = getProfileFormData();
    if (profileAvatar) profileAvatar.src = defaultProfileImage(profile.sex);
    renderProfileSummary(profile);
  });
}

useSlProfileButton?.addEventListener("click", () => {
  const profile = getProfileFormData();
  if (profileAvatar) profileAvatar.src = defaultProfileImage(profile.sex);
  renderProfileSummary(profile);
  setProfileStatus("Using default profile icon");
});

resetProfileButton?.addEventListener("click", () => {
  resetProfile();
});

editProfileButton?.addEventListener("click", () => {
  showProfileMode("edit");
});

loadProfile();
renderHealthStatus();

window.NeuroLink = {
  showView,
  getProfile: getProfileFormData,
  saveProfile,
  resetProfile,
  syncProfileToServer,
  setGcoinWallet(wallet) {
    const existing = readWalletState();
    const next = {
      ...existing,
      ...wallet,
      checking: parseGcAmount(wallet?.checking ?? existing.checking),
      savings: parseGcAmount(wallet?.savings ?? existing.savings),
      updatedAt: wallet?.updatedAt || new Date().toISOString(),
      history: normalizeWalletHistory(wallet?.history || existing.history)
    };
    writeWalletState(next);
    renderWallet();
  },
  addGcoinHistory(entry) {
    appendWalletHistory(entry);
    renderWallet();
  },
  setHealthStatus(status) {
    localStorage.setItem(HEALTH_STATUS_KEY, healthEmoji(status));
    renderHealthStatus();
    renderProfileSummary();
  },
  setProfileEndpoint(endpoint) {
    localStorage.setItem(PROFILE_ENDPOINT_KEY, endpoint || "");
  }
};
