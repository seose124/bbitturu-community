"use client";

import Link from "next/link";
import { X } from "lucide-react";

function IconAbout() {
  return (
    <svg viewBox="0 0 20 20" width={19} height={19} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3C7 2.3 3 4.5 2.5 8.5C2 12.5 5 17.7 9.5 17.5C14.5 17.3 18 14 17.5 10C17 6 14 3 10 3Z" />
      <circle cx="10" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
      <path d="M9 9.5Q10 9 10 10V13.5" />
      <path d="M8.5 13.5Q10 13 11.5 13.5" />
    </svg>
  );
}

function IconTerms() {
  return (
    <svg viewBox="0 0 20 20" width={19} height={19} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2.5H12.5L15.5 5.5V17C15.5 17.7 15 18 14 18H6C5 18 4.5 17.5 4.5 17V3C4.5 2.7 4.7 2.5 5 2.5Z" />
      <path d="M12.5 2.5V5H15.5" />
      <path d="M7 7.5Q8.5 7 10 7.5Q11.5 8 12.5 7.5" />
      <path d="M7 10.5Q8.5 10 10 10.5Q11.5 11 12.5 10.5" />
      <path d="M7 13.5Q8 13 9.5 13.5" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 20 20" width={19} height={19} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 9.5C6.5 8.5 6.5 6.5 7 5.5C7.5 4.5 8.5 3.5 10 3.5C11.5 3.5 12.5 4.5 13 5.5C13.5 6.5 13.5 8.5 13 9.5" />
      <path d="M4 9.5C3.5 9.3 3 9.8 3 10.5V16.5C3 17.2 3.5 17.5 4.5 17.5H15.5C16.5 17.5 17 17.2 17 16.5V10.5C17 9.8 16.5 9.5 16 9.5H4Z" />
      <circle cx="10" cy="13" r="1.5" />
      <path d="M10 14.5V15.5" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 20 20" width={19} height={19} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5C2.5 4.3 2.5 4.8 2.5 5.5V15C2.5 15.7 3 16.5 4 16.5H16C17 16.5 17.5 15.7 17.5 15V5.5C17.5 4.8 17.2 4 16 4H4C3.5 4 3 4.2 3 4.5Z" />
      <path d="M3 5.5Q6.5 9.5 9.5 10.5Q12 9.5 17 5.5" />
      <path d="M3 15.5L7.5 11" />
      <path d="M17 15.5L12.5 11" />
    </svg>
  );
}

const links = [
  {
    href: "/about",
    label: "삐뚜루 소개",
    icon: IconAbout,
    tone: "drawer-tone-green",
  },
  {
    href: "/terms",
    label: "이용약관",
    icon: IconTerms,
    tone: "drawer-tone-purple",
  },
  {
    href: "/privacy",
    label: "개인정보 처리방침",
    icon: IconLock,
    tone: "drawer-tone-mint",
  },
  {
    href: "/contact",
    label: "관리자 문의",
    icon: IconMail,
    tone: "drawer-tone-orange",
  },
];

export function HomeDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <button
        className={`drawer-overlay ${open ? "open" : ""}`}
        onClick={onClose}
        aria-label="메뉴 닫기"
      />
      <aside
        className={`drawer ${open ? "open" : ""}`}
        aria-hidden={!open}
      >
        <div className="drawer-header">
          <span className="brand-font">삐뚜루</span>
          <button className="icon-button" onClick={onClose} aria-label="닫기">
            <X size={19} strokeWidth={2.2} />
          </button>
        </div>
        <nav className="drawer-nav">
          {links.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.href}>
                {index === 1 || index === 3 ? (
                  <div className="drawer-divider" />
                ) : null}
                <Link
                  className="drawer-item"
                  href={item.href}
                  onClick={onClose}
                >
                  <span className={`drawer-icon ${item.tone}`}>
                    <Icon size={19} strokeWidth={2} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>
        <footer className="drawer-footer">
          <strong className="brand-font">삐뚜루</strong>
          <span>v1.0.0 Beta · © 2026 Bbiduru</span>
          <span>hello@bbiduru.app</span>
        </footer>
      </aside>
    </>
  );
}
