const views = Array.from(document.querySelectorAll(".view"));
const routeButtons = Array.from(document.querySelectorAll("[data-target]"));
const profileForm = document.querySelector("#profileForm");
const profileAvatar = document.querySelector("#profileAvatar img");
const profileSyncStatus = document.querySelector("#profileSyncStatus");
const useSlProfileButton = document.querySelector("#useSlProfile");
const PROFILE_STORAGE_KEY = "neuroLinkProfile";
const DEFAULT_PROFILE_IMAGE = "images/neuro logo.png";
const NEURO_LINK_PROFILE_ENDPOINT = "";

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

function getProfileFormData() {
  if (!profileForm) return {};

  const data = Object.fromEntries(new FormData(profileForm).entries());
  delete data.profileImage;
  data.profileImage = profileAvatar?.getAttribute("src") || DEFAULT_PROFILE_IMAGE;
  data.updatedAt = new Date().toISOString();
  return data;
}

function applyProfileData(profile) {
  if (!profileForm || !profile) return;

  for (const [key, value] of Object.entries(profile)) {
    const field = profileForm.elements[key];
    if (field && key !== "profileImage") field.value = value;
  }

  if (profile.profileImage && profileAvatar) profileAvatar.src = profile.profileImage;
}

function loadProfile() {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) {
      applyProfileData(JSON.parse(saved));
      setProfileStatus("Local profile loaded");
    }
  } catch (error) {
    setProfileStatus("Local profile could not load");
  }
}

async function syncProfileToServer(profile) {
  if (!NEURO_LINK_PROFILE_ENDPOINT) return { ok: false, skipped: true };

  const response = await fetch(NEURO_LINK_PROFILE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile)
  });

  return { ok: response.ok, skipped: false };
}

async function saveProfile() {
  const profile = getProfileFormData();
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  setProfileStatus("Saved locally. Server sync pending.");

  try {
    const result = await syncProfileToServer(profile);
    if (result.ok) setProfileStatus("Saved and synced to Neuro-Link");
  } catch (error) {
    setProfileStatus("Saved locally. Server offline.");
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
      setProfileStatus("Profile image ready");
    });
    reader.readAsDataURL(file);
  });
}

useSlProfileButton?.addEventListener("click", () => {
  if (profileAvatar) profileAvatar.src = DEFAULT_PROFILE_IMAGE;
  setProfileStatus("Using SL default profile image");
});

loadProfile();

window.NeuroLink = {
  showView,
  getProfile: getProfileFormData,
  saveProfile,
  syncProfileToServer
};
