"use client";

import Link from "next/link";
import { X } from "lucide-react";

const links = [
  {
    href: "/about",
    label: "삐뚜루 소개",
    icon: "/icons/icon-info.svg",
    tone: "drawer-tone-green",
  },
  {
    href: "/terms",
    label: "이용약관",
    icon: "/icons/icon-terms.svg",
    tone: "drawer-tone-purple",
  },
  {
    href: "/privacy",
    label: "개인정보 처리방침",
    icon: "/icons/icon-lock.svg",
    tone: "drawer-tone-mint",
  },
  {
    href: "/contact",
    label: "관리자 문의",
    icon: "/icons/icon-mail.svg",
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
          <div className="drawer-brand">
            <img src="/logo-symbol.png" width={28} height={28} alt="" />
            <span className="brand-font">삐뚜루</span>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="닫기">
            <X size={19} strokeWidth={2.2} />
          </button>
        </div>
        <nav className="drawer-nav">
          {links.map((item, index) => (
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
                  <img src={item.icon} width={19} height={19} alt="" />
                </span>
                <span>{item.label}</span>
              </Link>
            </div>
          ))}
        </nav>
        <footer className="drawer-footer">
          <strong className="brand-font">삐뚜루</strong>
          <span>v1.0.0 Beta · © 2026 bbitturu</span>
        </footer>
      </aside>
    </>
  );
}
