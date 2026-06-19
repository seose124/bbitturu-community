"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Page, TopBar } from "@/components/layout";
import { useBbiduru } from "@/components/app-provider";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useBbiduru();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginContext, setLoginContext] = useState({
    reason: null as string | null,
    next: "/profile",
  });
  const { reason, next } = loginContext;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    queueMicrotask(() =>
      setLoginContext({
        reason: params.get("reason"),
        next: params.get("next") || "/profile",
      }),
    );
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: authError } = user?.is_anonymous
      ? await supabase.auth.updateUser(
          { email: email.trim() },
          { emailRedirectTo: callbackUrl },
        )
      : await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: callbackUrl },
        });

    setLoading(false);
    if (authError) {
      setError("이메일 전송에 실패했어요. 다시 시도해주세요.");
    } else {
      setSent(true);
    }
  };

  return (
    <Page className="white-page">
      <div className="page-column">
        <TopBar title="로그인" backHref="/" />
        <div className="scroll-content upload-content">
          {sent ? (
            <div className="login-sent">
              <div className="login-sent-icon">📬</div>
              <h1 className="page-heading">이메일을 확인하세요</h1>
              <p className="page-subtitle">
                <strong>{email}</strong>로 로그인 링크를 보냈어요.
                <br />
                이메일의 링크를 클릭하면 자동으로 로그인돼요.
              </p>
              <button
                className="button button-ghost button-small"
                onClick={() => setSent(false)}
              >
                다른 이메일로 시도하기
              </button>
            </div>
          ) : (
            <>
              <div>
                <span className="badge badge-level login-reason-badge">
                  {reason === "report" ? "첫 리포트 도착" : "기록 보존"}
                </span>
                <h1 className="page-heading">내 기록을 이어둘까요?</h1>
                <p className="page-subtitle">
                  현재 익명 활동은 그대로 유지돼요.
                  <br />
                  이메일 링크로 레벨과 리포트를 안전하게 저장하세요.
                </p>
              </div>
              <form onSubmit={submit}>
                <div className="field">
                  <span>이메일 주소</span>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@example.com"
                    autoFocus
                    required
                  />
                  {error ? <span className="field-error">{error}</span> : null}
                </div>
                <button
                  className="button button-primary upload-submit"
                  type="submit"
                  disabled={!email.trim() || loading}
                >
                  <Mail size={18} />
                  {loading ? "전송 중..." : "로그인 링크 받기"}
                </button>
              </form>
              <button
                className="button button-ghost"
                onClick={() => router.push(next)}
              >
                로그인 없이 계속하기
              </button>
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
