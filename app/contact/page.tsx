"use client";

import { FormEvent, useState } from "react";
import { useBbiduru } from "@/components/app-provider";
import { Page, TopBar } from "@/components/layout";

const contactTypes = ["버그 신고", "개선 제안", "기타"];

export default function ContactPage() {
  const { showToast } = useBbiduru();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState(contactTypes[0]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) {
      showToast("문의 내용을 입력해주세요");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, type, content }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setName("");
      setEmail("");
      setContent("");
    } catch {
      showToast("전송에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Page>
        <div className="page-column">
          <TopBar title="관리자 문의" backHref="/" />
          <div className="scroll-content contact-content" style={{ justifyContent: "center", alignItems: "center", textAlign: "center", gap: 12 }}>
            <img src="/icons/icon-mail.svg" width={40} height={40} alt="" style={{ opacity: 0.7 }} />
            <h1 className="page-heading">문의가 접수됐어요!</h1>
            <p className="page-subtitle">답변이 필요한 경우 입력하신 이메일로 연락드릴게요 😊</p>
            <button className="button button-primary" style={{ marginTop: 8 }} onClick={() => setSent(false)}>
              추가 문의하기
            </button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="page-column">
        <TopBar title="관리자 문의" backHref="/" />
        <form className="page-column contact-form" onSubmit={submit}>
          <div className="scroll-content contact-content">
            <div>
              <h1 className="page-heading">관리자에게 문의하기</h1>
              <p className="page-subtitle">
                서비스 의견, 오류 신고, 부적절한 게시물 신고 등 무엇이든 남겨주세요!<br />
                답변이 필요하면 이메일도 함께 적어주세요.
              </p>
            </div>
            <label className="field">
              <span>이름 / 닉네임</span>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="익명의 판독러"
                maxLength={50}
              />
            </label>
            <label className="field">
              <span>이메일 <span style={{ opacity: 0.6, fontWeight: 400 }}>(선택)</span></span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="답변이 필요하면 입력해 주세요"
              />
            </label>
            <fieldset className="field fieldset">
              <legend>문의 유형</legend>
              <div className="difficulty-picker">
                {contactTypes.map((item) => (
                  <button
                    className={`filter-chip ${type === item ? "active" : ""}`}
                    type="button"
                    key={item}
                    onClick={() => setType(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="field">
              <span>문의 내용 *</span>
              <div className="textarea-wrap">
                <textarea
                  className="input textarea contact-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="자유롭게 의견을 남겨주세요"
                  maxLength={2000}
                />
                <small>{content.length}/2000</small>
              </div>
            </label>
          </div>
          <div className="contact-submit-bar">
            <button className="button button-primary" type="submit" disabled={sending}>
              {sending ? "전송 중..." : "문의 보내기"}
            </button>
          </div>
        </form>
      </div>
    </Page>
  );
}
