"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Page, TopBar } from "@/components/layout";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
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
                <h1 className="page-heading">삐뚜루 로그인</h1>
                <p className="page-subtitle">
                  이메일 주소를 입력하면 로그인 링크를 보내드려요.
                  <br />
                  비밀번호가 필요 없어요!
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
                onClick={() => router.back()}
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
