const params = new URLSearchParams(window.location.search);
const bridgeMode = params.get("profileBridge") || "";
const endpoint = params.get("profileEndpoint") || "";

function cleanStoredText(value) {
  const text = String(value || "");
  return text.includes("+") && !text.includes(" ") ? text.replace(/\+/g, " ") : text;
}

const profile = {
  uuid: params.get("uuid") || "",
  agentName: cleanStoredText(params.get("agentName")) || "Loading",
  displayName: cleanStoredText(params.get("displayName")),
  title: cleanStoredText(params.get("title")) || "Resident",
  location: cleanStoredText(params.get("location")) || "Camden Falls",
  avatarUrl: params.get("avatarUrl") || "images/neuro logo.png",
  bio: cleanStoredText(params.get("bio")),
  setup: params.get("setup") === "1"
};

const els = {
  clock: document.querySelector("#clock"),
  syncStatus: document.querySelector("#syncStatus"),
  view: document.querySelector("#profileView"),
  form: document.querySelector("#profileForm"),
  avatarImage: document.querySelector("#avatarImage"),
  avatarFallback: document.querySelector("#avatarFallback"),
  displayName: document.querySelector("#displayName"),
  agentName: document.querySelector("#agentName"),
  titleText: document.querySelector("#titleText"),
  locationText: document.querySelector("#locationText"),
  statusText: document.querySelector("#statusText"),
  bioText: document.querySelector("#bioText")
};

function tickClock() {
  const now = new Date();
  if (els.clock) {
    els.clock.textContent = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }
}

function setStatus(text) {
  if (els.syncStatus) els.syncStatus.textContent = text;
}

function safeProfileValue(value, fallback) {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function initialsFromName(name) {
  const parts = safeProfileValue(name, "NL").split(/\s+/).filter(Boolean);
  if (!parts.length) return "NL";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function showAvatarFallback(show) {
  els.avatarImage?.classList.toggle("is-hidden", show);
  els.avatarFallback?.classList.toggle("is-hidden", !show);
}

function renderProfile() {
  const hasSetup = profile.setup || !!profile.displayName;
  const avatar = String(profile.avatarUrl || "").trim();

  if (els.avatarFallback) els.avatarFallback.textContent = initialsFromName(profile.displayName || profile.agentName);
  if (els.avatarImage) {
    if (avatar) {
      els.avatarImage.src = avatar;
      showAvatarFallback(false);
    } else {
      els.avatarImage.removeAttribute("src");
      showAvatarFallback(true);
    }
  }
  if (els.displayName) els.displayName.textContent = hasSetup ? profile.displayName : "First Time Setup";
  if (els.agentName) els.agentName.textContent = safeProfileValue(profile.agentName, "Loading");
  if (els.titleText) els.titleText.textContent = safeProfileValue(profile.title, "Resident");
  if (els.locationText) els.locationText.textContent = safeProfileValue(profile.location, "Camden Falls");
  if (els.statusText) els.statusText.textContent = hasSetup ? "Synced to SL" : "Setup needed";
  if (els.bioText) els.bioText.textContent = hasSetup ? safeProfileValue(profile.bio, "No bio set.") : "Open setup to create this profile.";

  if (els.form) {
    els.form.elements.displayName.value = profile.displayName || "";
    els.form.elements.title.value = profile.title || "";
    els.form.elements.location.value = profile.location || "";
    els.form.elements.avatarUrl.value = profile.avatarUrl && profile.avatarUrl !== "images/neuro logo.png" ? profile.avatarUrl : "";
    els.form.elements.bio.value = profile.bio || "";
  }

  setStatus(bridgeMode === "sl" ? "SL profile bridge active" : "Web preview mode");
  if (!hasSetup) showEditor();
}

function showEditor() {
  els.view?.classList.add("hidden");
  els.form?.classList.remove("hidden");
}

function showViewer() {
  els.form?.classList.add("hidden");
  els.view?.classList.remove("hidden");
}

function sendProfileCommand(op, data = {}) {
  const payload = new URLSearchParams();
  payload.set("op", op);
  payload.set("tick", String(Date.now()));
  for (const [key, value] of Object.entries(data)) {
    payload.set(key, String(value ?? ""));
  }

  if (window.parent && window.parent !== window) {
    window.parent.postMessage(`NL_PROFILE|${payload.toString()}`, "*");
    return true;
  }

  if (endpoint && endpoint !== "parent") {
    const separator = endpoint.includes("?") ? "&" : "?";
    const ping = new Image();
    ping.alt = "";
    ping.src = `${endpoint}${separator}${payload.toString()}`;
    window.__profilePings = window.__profilePings || [];
    window.__profilePings.push(ping);
    window.setTimeout(() => window.__profilePings.shift(), 8000);
    return true;
  }

  return false;
}

function collectFormProfile() {
  const form = els.form;
  return {
    displayName: form.elements.displayName.value.trim(),
    title: form.elements.title.value.trim(),
    location: form.elements.location.value.trim(),
    avatarUrl: form.elements.avatarUrl.value.trim(),
    bio: form.elements.bio.value.trim()
  };
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-profile-action]");
  if (!button) return;

  const action = button.dataset.profileAction;
  if (action === "edit") {
    showEditor();
    return;
  }

  if (action === "refresh") {
    setStatus(sendProfileCommand("profile.refresh") ? "Refresh requested" : "Refresh unavailable");
    showViewer();
    return;
  }

  if (action === "reset") {
    setStatus(sendProfileCommand("profile.reset") ? "Reset requested" : "Reset unavailable");
    return;
  }

  if (action === "close") {
    setStatus(sendProfileCommand("profile.close") ? "Close requested" : "Close unavailable");
  }
});

els.avatarImage?.addEventListener("error", () => {
  showAvatarFallback(true);
});

els.form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = collectFormProfile();
  if (!data.displayName) {
    setStatus("Display name is required");
    return;
  }

  Object.assign(profile, data, { setup: true });
  renderProfile();
  showViewer();
  setStatus(sendProfileCommand("profile.save", data) ? "Save sent to SL" : "Save unavailable");
});

window.addEventListener("message", (event) => {
  const raw = String(event.data || "");
  if (!raw.startsWith("NL_PROFILE_STATE|")) return;

  const state = new URLSearchParams(raw.substring("NL_PROFILE_STATE|".length));
  for (const key of ["uuid", "agentName", "displayName", "title", "location", "avatarUrl", "bio"]) {
    if (state.has(key)) profile[key] = key === "avatarUrl" || key === "uuid" ? state.get(key) || "" : cleanStoredText(state.get(key));
  }
  profile.setup = state.get("setup") === "1" || !!profile.displayName;
  renderProfile();
  showViewer();
});

tickClock();
window.setInterval(tickClock, 1000);
renderProfile();
