import mixpanel from "mixpanel-browser";

let ready = false;

export function initAnalytics(userId: string | undefined) {
  if (ready || typeof window === "undefined") return;
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return;

  mixpanel.init(token, {
    debug: process.env.NODE_ENV === "development",
    track_pageview: false,
    persistence: "localStorage",
  });

  mixpanel.register({
    platform: "web",
    app_version: "1.0.0-beta",
  });

  if (userId) {
    mixpanel.identify(userId);
  }

  ready = true;
}

export function identifyUser(userId: string) {
  if (!ready) return;
  mixpanel.identify(userId);
}

function track(event: string, props?: Record<string, unknown>) {
  try {
    if (!ready) return;
    mixpanel.track(event, props);
  } catch {
    // never break the app
  }
}

// ─── 업로더 퍼널 ────────────────────────────────────────────────

export function trackUploadPageViewed(entryPoint: string) {
  track("upload_page_viewed", { entry_point: entryPoint });
}

export function trackPhotoAttached(fileSizeKb: number) {
  track("photo_attached", { attach_method: "file_upload", file_size_kb: fileSizeKb });
}

export function trackAnswerInputStarted() {
  track("answer_input_started");
}

export function trackAnswerInputCompleted(answerLength: number, timeToCompleteSec: number) {
  track("answer_input_completed", {
    answer_length: answerLength,
    time_to_complete_sec: timeToCompleteSec,
  });
}

export function trackUploadCompleted(postId: number, hasHint: boolean, answerLength: number) {
  track("upload_completed", {
    post_id: String(postId),
    has_hint: hasHint,
    answer_word_count: answerLength,
  });
}

export function trackUploadFailed(errorType: string, step: string) {
  track("upload_failed", { error_type: errorType, step });
}

export function trackShareLinkCopied(postId: number) {
  track("share_link_copied", { post_id: String(postId) });
}

// ─── 뷰어 퍼널 ──────────────────────────────────────────────────

export function trackChallengeClicked(postId: number, entrySource: string) {
  track("challenge_clicked", { post_id: String(postId), entry_source: entrySource });
}

export function trackChallengeSubmitted(postId: number, answerLength: number, timeSpentSec: number) {
  track("challenge_submitted", {
    post_id: String(postId),
    answer_length: answerLength,
    time_spent_sec: timeSpentSec,
  });
}

export function trackChallengePassed(postId: number, timeSpentSec: number, hadInput: boolean) {
  track("challenge_passed", {
    post_id: String(postId),
    time_spent_sec: timeSpentSec,
    had_input: hadInput,
  });
}

// ─── 결과 / 공유 ─────────────────────────────────────────────────

export function trackAnswerRevealed(postId: number, isCorrect: boolean, similarityScore: number) {
  track("answer_revealed", {
    post_id: String(postId),
    is_correct: isCorrect,
    similarity_score: similarityScore,
  });
}

export function trackResultShared(postId: number, platform: string, isCorrect: boolean) {
  track("result_shared", {
    post_id: String(postId),
    platform,
    is_correct: isCorrect,
  });
}

export function trackCrowdInterestClicked(postId: number) {
  track("crowd_interest_clicked", { post_id: String(postId) });
}
