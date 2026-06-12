const views = Array.from(document.querySelectorAll(".view"));
const routeButtons = Array.from(document.querySelectorAll("[data-target]"));
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
const PROFILE_STORAGE_KEY = "neuroLinkProfile";
const PROFILE_PENDING_SYNC_KEY = "neuroLinkProfilePendingSync";
const HEALTH_STATUS_KEY = "neuroLinkHealthStatus";
const PROFILE_ENDPOINT_KEY = "neuroLinkProfileEndpoint";
const PROFILE_LOCATION_KEY = "neuroLinkProfileLocation";
const TIME_MODE_KEY = "neuroLinkTimeMode";
const WALLPAPER_KEY = "neuroLinkWallpaper";
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

const urlParams = new URLSearchParams(location.search);
const configuredEndpoint = urlParams.get("profileEndpoint") || localStorage.getItem(PROFILE_ENDPOINT_KEY) || "";
const profileBridge = urlParams.get("profileBridge") || "";

function showView(name) {
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

function applyWallpaper(name = localStorage.getItem(WALLPAPER_KEY) || "neuro-midnight") {
  const wallpaperName = WALLPAPERS[name] ? name : "neuro-midnight";
  document.documentElement.style.setProperty("--app-wallpaper", `url("${WALLPAPERS[wallpaperName]}")`);
  localStorage.setItem(WALLPAPER_KEY, wallpaperName);

  for (const button of wallpaperButtons) {
    button.classList.toggle("active", button.dataset.wallpaper === wallpaperName);
  }
}

for (const button of wallpaperButtons) {
  button.addEventListener("click", () => applyWallpaper(button.dataset.wallpaper));
}

window.addEventListener("hashchange", () => {
  showView(location.hash.replace("#", "") || "home");
});

showView(location.hash.replace("#", "") || "home");
applyWallpaper();
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
  setHealthStatus(status) {
    localStorage.setItem(HEALTH_STATUS_KEY, healthEmoji(status));
    renderHealthStatus();
    renderProfileSummary();
  },
  setProfileEndpoint(endpoint) {
    localStorage.setItem(PROFILE_ENDPOINT_KEY, endpoint || "");
  }
};
