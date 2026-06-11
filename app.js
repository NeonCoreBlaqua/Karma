const views = Array.from(document.querySelectorAll(".view"));
const routeButtons = Array.from(document.querySelectorAll("[data-target]"));
const profileForm = document.querySelector("#profileForm");
const profileAvatar = document.querySelector("#profileAvatar img");
const profileSummary = document.querySelector("#profileSummary");
const editProfileButton = document.querySelector("#editProfileButton");
const profileSyncStatus = document.querySelector("#profileSyncStatus");
const profileHealthStatus = document.querySelector("#profileHealthStatus");
const useSlProfileButton = document.querySelector("#useSlProfile");
const profileViewAvatar = document.querySelector("#profileViewAvatar");
const profileViewTitle = document.querySelector("#profileViewTitle");
const profileViewName = document.querySelector("#profileViewName");
const profileViewAge = document.querySelector("#profileViewAge");
const profileViewSex = document.querySelector("#profileViewSex");
const profileViewLocation = document.querySelector("#profileViewLocation");
const profileViewHealth = document.querySelector("#profileViewHealth");
const profileViewBio = document.querySelector("#profileViewBio");
const PROFILE_STORAGE_KEY = "neuroLinkProfile";
const PROFILE_PENDING_SYNC_KEY = "neuroLinkProfilePendingSync";
const HEALTH_STATUS_KEY = "neuroLinkHealthStatus";
const PROFILE_ENDPOINT_KEY = "neuroLinkProfileEndpoint";
const DEFAULT_PROFILE_IMAGE = "images/neuro logo.png";

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

for (const button of routeButtons) {
  button.addEventListener("click", () => showView(button.dataset.target));
}

window.addEventListener("hashchange", () => {
  showView(location.hash.replace("#", "") || "home");
});

showView(location.hash.replace("#", "") || "home");

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
  delete data.profileImage;
  data.healthStatus = getHealthStatus();
  data.profileImage = profileAvatar?.getAttribute("src") || DEFAULT_PROFILE_IMAGE;
  data.updatedAt = new Date().toISOString();
  return data;
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

  profile.profileImage = localStorage.getItem(`${PROFILE_STORAGE_KEY}:image`) || DEFAULT_PROFILE_IMAGE;
  profile.updatedAt = urlParams.get("updatedAt") || new Date().toISOString();
  return profile;
}

function applyProfileData(profile) {
  if (!profileForm || !profile) return;

  for (const [key, value] of Object.entries(profile)) {
    const field = profileForm.elements[key];
    if (field && key !== "profileImage") field.value = value;
  }

  if (profile.profileImage && profileAvatar) profileAvatar.src = profile.profileImage;
  renderHealthStatus();
  renderProfileSummary(profile);
}

function renderProfileSummary(profile = getProfileFormData()) {
  const fallback = "Not set";
  const health = getHealthStatus();

  if (profileViewAvatar) profileViewAvatar.src = profile.profileImage || DEFAULT_PROFILE_IMAGE;
  if (profileViewTitle) profileViewTitle.textContent = profile.title || "Resident";
  if (profileViewName) profileViewName.textContent = profile.displayName || fallback;
  if (profileViewAge) profileViewAge.textContent = profile.age || fallback;
  if (profileViewSex) profileViewSex.textContent = profile.sex || fallback;
  if (profileViewLocation) profileViewLocation.textContent = profile.location || "Eden Palms";
  if (profileViewHealth) profileViewHealth.textContent = health;
  if (profileViewBio) profileViewBio.textContent = profile.bio || "No bio set.";
}

function getHealthStatus() {
  const health = window.NeuroLinkHealth || {};
  return health.status || localStorage.getItem(HEALTH_STATUS_KEY) || "Not synced";
}

function renderHealthStatus() {
  if (profileHealthStatus) profileHealthStatus.value = getHealthStatus();
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
      const profile = JSON.parse(saved);
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

function syncProfileToSlBridge(profile) {
  const payload = new URLSearchParams();
  payload.set("op", "save");
  payload.set("displayName", profile.displayName || "");
  payload.set("age", profile.age || "");
  payload.set("sex", profile.sex || "");
  payload.set("location", profile.location || "");
  payload.set("title", profile.title || "");
  payload.set("bio", profile.bio || "");
  payload.set("healthStatus", getHealthStatus());
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

async function saveProfile() {
  const profile = getProfileFormData();
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

  profileForm.elements.profileImage?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file || !profileAvatar) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      profileAvatar.src = reader.result;
      localStorage.setItem(`${PROFILE_STORAGE_KEY}:image`, reader.result);
      setProfileStatus("Profile image ready");
    });
    reader.readAsDataURL(file);
  });
}

useSlProfileButton?.addEventListener("click", () => {
  if (profileAvatar) profileAvatar.src = DEFAULT_PROFILE_IMAGE;
  localStorage.removeItem(`${PROFILE_STORAGE_KEY}:image`);
  setProfileStatus("Using SL default profile image");
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
  syncProfileToServer,
  setHealthStatus(status) {
    localStorage.setItem(HEALTH_STATUS_KEY, status || "Not synced");
    renderHealthStatus();
    renderProfileSummary();
  },
  setProfileEndpoint(endpoint) {
    localStorage.setItem(PROFILE_ENDPOINT_KEY, endpoint || "");
  }
};
