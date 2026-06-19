"use client";

import { FormEvent, useState } from "react";
import { useBbiduru } from "@/components/app-provider";
import { Page, TopBar } from "@/components/layout";

const contactTypes = ["버그 신고", "개선 제안", "악필 신고", "기타"];

export default function ContactPage() {
  const { showToast } = useBbiduru();
  const [content, setContent] = useState("");
  const [type, setType] = useState(contactTypes[0]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) {
      showToast("문의 내용을 입력해주세요");
      return;
    }
    const subject = encodeURIComponent(`[삐뚜루 문의] ${type}`);
    const body = encodeURIComponent(content);
    window.location.href = `mailto:omwfos@khu.ac.kr?subject=${subject}&body=${body}`;
    setContent("");
  };

  return (
    <Page>
      <div className="page-column">
        <TopBar title="관리자 문의" backHref="/" />
        <form className="scroll-content contact-content" onSubmit={submit}>
          <div>
            <h1 className="page-heading">무엇이 궁금하세요?</h1>
            <p className="page-subtitle">메일 앱이 열리면서 관리자에게 전달돼요 😊</p>
          </div>
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
          <button className="button button-primary" type="submit">
            <img src="/icons/icon-mail.svg" width={17} height={17} alt="" />
            문의 보내기
          </button>
        </form>
      </div>
    </Page>
  );
}
