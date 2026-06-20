const PUBLIC_LAUNCH_RESET_VERSION = "2026-06-20-public-launch-2";
const RESET_VERSION_KEY = "bbiduru-reset-version";

let resetPerformedThisLoad = false;

export function resetClientForPublicLaunch() {
  if (typeof window === "undefined") return false;
  if (resetPerformedThisLoad) return true;
  if (window.localStorage.getItem(RESET_VERSION_KEY) === PUBLIC_LAUNCH_RESET_VERSION) {
    return false;
  }

  window.localStorage.clear();
  window.sessionStorage.clear();

  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=", 1)[0]?.trim();
    if (!name) continue;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
  }

  window.localStorage.setItem(RESET_VERSION_KEY, PUBLIC_LAUNCH_RESET_VERSION);
  resetPerformedThisLoad = true;
  return true;
}
