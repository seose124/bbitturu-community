const PUBLIC_LAUNCH_RESET_VERSION = "2026-06-20-public-launch-2";
const RESET_VERSION_KEY = "bbiduru-reset-version";

let resetPerformedThisLoad = false;
let resetAuthSessionThisLoad = false;

export function resetClientForPublicLaunch() {
  if (typeof window === "undefined") return false;
  if (resetPerformedThisLoad) return resetAuthSessionThisLoad;
  if (window.localStorage.getItem(RESET_VERSION_KEY) === PUBLIC_LAUNCH_RESET_VERSION) {
    return false;
  }

  const url = new URL(window.location.href);
  const preserveConfirmedAuth = url.searchParams.get("auth") === "confirmed";
  window.localStorage.clear();
  window.sessionStorage.clear();

  if (!preserveConfirmedAuth) {
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=", 1)[0]?.trim();
      if (!name) continue;
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    }
  }

  window.localStorage.setItem(RESET_VERSION_KEY, PUBLIC_LAUNCH_RESET_VERSION);
  resetPerformedThisLoad = true;
  resetAuthSessionThisLoad = !preserveConfirmedAuth;

  if (preserveConfirmedAuth) {
    url.searchParams.delete("auth");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return resetAuthSessionThisLoad;
}
