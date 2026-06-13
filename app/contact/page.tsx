"use client";

import { FormEvent, useState } from "react";
import { Mail, Send } from "lucide-react";
import { useBbiduru } from "@/components/app-provider";
import { Page, TopBar } from "@/components/layout";

const contactTypes = ["버그 신고", "개선 제안", "악필 신고", "기타"];

export default function ContactPage() {
  const { showToast } = useBbiduru();
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState(contactTypes[0]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      showToast("이메일 주소를 입력해주세요");
      return;
    }
    if (!content.trim()) {
      showToast("문의 내용을 입력해주세요");
      return;
    }
    showToast(`${type} 문의가 접수됐어요`);
    setEmail("");
    setContent("");
  };

  return (
    <Page>
      <div className="page-column">
        <TopBar title="관리자 문의" backHref="/" />
        <form className="scroll-content contact-content" onSubmit={submit}>
          <div>
            <h1 className="page-heading">무엇이 궁금하세요?</h1>
            <p className="page-subtitle">빠른 시간 내에 답변드릴게요 😊</p>
          </div>
          <label className="field">
            <span>이메일 주소 *</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="답변받을 이메일을 입력하세요"
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
                onChange={(event) => setContent(event.target.value)}
                placeholder="문의하실 내용을 자유롭게 적어주세요..."
                maxLength={500}
              />
              <small>{content.length}/500</small>
            </div>
          </label>
          <div className="quick-contact">
            <Mail size={18} />
            <div>
              <strong>빠른 문의</strong>
              <span>
                긴급한 사항은 hello@bbiduru.app 으로 직접 연락주세요.
              </span>
            </div>
          </div>
          <button className="button button-primary" type="submit">
            <Send size={17} /> 문의 보내기
          </button>
        </form>
      </div>
    </Page>
  );
}
