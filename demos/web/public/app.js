(function () {
  const state = {
    lastLoaded: false,
    accessKey: ""
  };

  function $(id) {
    return document.getElementById(id);
  }

  function valueOrFallback(value) {
    return value === null || value === undefined || value === "" ? "Not available" : String(value);
  }

  function isSafeAvatarUrl(value) {
    if (!value) return false;
    try {
      return new URL(value).protocol === "https:";
    } catch (_error) {
      return false;
    }
  }

  function setStatus(message, kind) {
    const status = $("status");
    status.textContent = message;
    status.className = `status ${kind || ""}`.trim();
  }

  function setLoading(loading) {
    $("loadButton").disabled = loading;
    $("refreshButton").disabled = loading || !state.lastLoaded;
  }

  function setText(id, value) {
    $(id).textContent = valueOrFallback(value);
  }

  function renderProfile(profile) {
    $("profileCard").classList.remove("hidden");
    setText("username", profile.username);
    setText("displayName", profile.displayName);
    setText("streak", profile.streak === null ? null : `${profile.streak} days`);
    setText("totalXp", profile.totalXp);
    setText("gems", profile.gems);
    setText("fromLanguage", profile.fromLanguage);
    setText("learningLanguage", profile.learningLanguage);

    const avatar = $("avatar");
    const fallback = $("avatarFallback");
    if (isSafeAvatarUrl(profile.pictureUrl)) {
      avatar.src = profile.pictureUrl;
      avatar.alt = `${profile.username || "Duolingo user"} avatar`;
      avatar.classList.remove("hidden");
      fallback.classList.add("hidden");
    } else {
      avatar.removeAttribute("src");
      avatar.alt = "";
      avatar.classList.add("hidden");
      fallback.classList.remove("hidden");
    }
  }

  async function loadProfile() {
    state.accessKey = $("accessKey").value;
    setLoading(true);
    setStatus("Loading profile...", "loading");
    try {
      const headers = {};
      if (state.accessKey) headers["X-Demo-Access-Key"] = state.accessKey;
      const response = await fetch("/api/me", { headers });
      const data = await response.json();
      if (!response.ok) {
        const message = data && data.error && data.error.message ? data.error.message : "Unable to load the profile.";
        setStatus(message, response.status === 500 ? "config-error" : "error");
        return;
      }
      state.lastLoaded = true;
      renderProfile(data);
      setStatus("Profile loaded.", "connected");
    } catch (_error) {
      setStatus("The profile could not be loaded. Check the deployment and try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  function init() {
    $("loadButton").addEventListener("click", loadProfile);
    $("refreshButton").addEventListener("click", loadProfile);
  }

  window.DuolingoDemo = {
    isSafeAvatarUrl,
    renderProfile,
    valueOrFallback,
    loadProfile
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
