"use client";

import Link from "next/link";
import {
  FileText,
  Info,
  LockKeyhole,
  Mail,
  X,
} from "lucide-react";

const links = [
  {
    href: "/about",
    label: "삐뚜루 소개",
    icon: Info,
    tone: "drawer-tone-green",
  },
  {
    href: "/terms",
    label: "이용약관",
    icon: FileText,
    tone: "drawer-tone-purple",
  },
  {
    href: "/privacy",
    label: "개인정보 처리방침",
    icon: LockKeyhole,
    tone: "drawer-tone-mint",
  },
  {
    href: "/contact",
    label: "관리자 문의",
    icon: Mail,
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
