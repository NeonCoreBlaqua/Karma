(function () {
  const profileForm = document.querySelector("#profileForm");
  const resetProfileButton = document.querySelector("#resetProfile");
  const useSlProfileButton = document.querySelector("#useSlProfile");
  const profileAvatar = document.querySelector("#profileAvatar img");
  const profileSyncStatus = document.querySelector("#profileSyncStatus");
  const profileSummary = document.querySelector("#profileSummary");
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
  const DEFAULT_MALE_PROFILE_IMAGE = "images/profile-male.svg";
  const DEFAULT_FEMALE_PROFILE_IMAGE = "images/profile-female.svg";
  const VALID_LOCATIONS = ["Eden Palms", "Chi-Core"];
  const VALID_SEXES = ["Female", "Male", "Non-binary", "Private"];

  const urlParams = new URLSearchParams(location.search);
  const configuredEndpoint = urlParams.get("profileEndpoint") || localStorage.getItem(PROFILE_ENDPOINT_KEY) || "";
  const profileBridge = urlParams.get("profileBridge") || "";

  function setProfileStatus(message) {
    if (profileSyncStatus) profileSyncStatus.textContent = message;
  }

  function defaultProfileImage(sex = "") {
    const normalized = String(sex).toLowerCase();
    if (normalized === "male") return DEFAULT_MALE_PROFILE_IMAGE;
    if (normalized === "female") return DEFAULT_FEMALE_PROFILE_IMAGE;
    return DEFAULT_PROFILE_IMAGE;
  }

  function getHealthStatus() {
    const health = window.NeuroLinkHealth || {};
    return health.status || localStorage.getItem(HEALTH_STATUS_KEY) || "Not synced";
  }

  function cleanLoadedValue(value, placeholder) {
    const clean = String(value || "").trim();
    return clean === placeholder ? "" : clean;
  }

  function normalizeProfile(profile = {}) {
    return {
      title: cleanLoadedValue(profile.title, "Title"),
      displayName: cleanLoadedValue(profile.displayName, "Not set"),
      age: cleanLoadedValue(profile.age, "Not set"),
      sex: VALID_SEXES.includes(profile.sex) ? profile.sex : "",
      location: VALID_LOCATIONS.includes(profile.location) ? profile.location : "",
      bio: cleanLoadedValue(profile.bio, "Tell me about you."),
      healthStatus: cleanLoadedValue(profile.healthStatus, "Not synced") || "Not synced",
      profileImage: defaultProfileImage(profile.sex),
      updatedAt: profile.updatedAt || new Date().toISOString()
    };
  }

  function getProfileFormData() {
    if (!profileForm) return {};
    const data = Object.fromEntries(new FormData(profileForm).entries());
    data.sex = VALID_SEXES.includes(data.sex) ? data.sex : "";
    data.location = VALID_LOCATIONS.includes(data.location) ? data.location : "";
    data.healthStatus = getHealthStatus();
    data.profileImage = defaultProfileImage(data.sex);
    data.updatedAt = new Date().toISOString();
    return data;
  }

  function renderProfile(profile = getProfileFormData()) {
    profile = normalizeProfile(profile);
    const fallback = "Not set";
    const health = getHealthStatus();

    if (profileViewAvatar) profileViewAvatar.src = defaultProfileImage(profile.sex);
    if (profileViewTitle) profileViewTitle.textContent = profile.title || "Title";
    if (profileViewName) profileViewName.textContent = profile.displayName || fallback;
    if (profileViewAge) profileViewAge.textContent = profile.age || fallback;
    if (profileViewSex) profileViewSex.textContent = profile.sex || fallback;
    if (profileViewLocation) profileViewLocation.textContent = profile.location || "Eden Palms";
    if (profileViewHealth) profileViewHealth.textContent = health;
    if (profileViewBio) profileViewBio.textContent = profile.bio || "Tell me about you.";
    if (profileAvatar) profileAvatar.src = defaultProfileImage(profile.sex);
  }

  function showProfileMode(mode) {
    const isView = mode === "view";
    profileSummary?.classList.toggle("hidden", !isView);
    profileForm?.classList.toggle("hidden", isView);
  }

  function syncProfileToSlBridge(profile, op = "save") {
    if (!configuredEndpoint || profileBridge !== "sl") return Promise.resolve({ skipped: true });

    const payload = new URLSearchParams();
    payload.set("op", op);
    payload.set("displayName", profile.displayName || "");
    payload.set("age", profile.age || "");
    payload.set("sex", profile.sex || "");
    payload.set("location", profile.location || "");
    payload.set("title", profile.title || "");
    payload.set("bio", profile.bio || "");
    payload.set("healthStatus", getHealthStatus());
    payload.set("updatedAt", profile.updatedAt || new Date().toISOString());

    const separator = configuredEndpoint.includes("?") ? "&" : "?";
    const ping = new Image();
    ping.alt = "";
    ping.src = `${configuredEndpoint}${separator}${payload.toString()}`;
    window.__neuroLinkProfilePings = window.__neuroLinkProfilePings || [];
    window.__neuroLinkProfilePings.push(ping);
    window.setTimeout(() => window.__neuroLinkProfilePings.shift(), 8000);
    return Promise.resolve({ ok: true });
  }

  function saveProfile(event) {
    event?.preventDefault();
    event?.stopImmediatePropagation();

    const profile = getProfileFormData();
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    localStorage.setItem(PROFILE_PENDING_SYNC_KEY, JSON.stringify(profile));
    renderProfile(profile);
    showProfileMode("view");
    setProfileStatus("Saving to Neuro server...");
    syncProfileToSlBridge(profile, "save").then(() => {
      setProfileStatus("Saved. Reattach test should keep this profile.");
    });
  }

  function resetProfile(event) {
    event?.preventDefault();
    event?.stopImmediatePropagation();

    profileForm?.reset();
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(PROFILE_PENDING_SYNC_KEY);
    renderProfile({});
    showProfileMode("edit");
    setProfileStatus("Resetting server profile...");
    syncProfileToSlBridge({}, "clear").then(() => {
      setProfileStatus("Reset complete. Fill it once and save again.");
    });
  }

  profileForm?.addEventListener("submit", saveProfile, true);
  resetProfileButton?.addEventListener("click", resetProfile, true);
  useSlProfileButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    renderProfile(getProfileFormData());
    setProfileStatus("Using default icon for selected sex.");
  }, true);

  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) renderProfile(JSON.parse(saved));
  } catch (error) {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  }
})();
