"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

const navItems: Array<{
  href: string;
  label: string;
  icon: string;
  match: (pathname: string) => boolean;
}> = [
  {
    href: "/challenges",
    label: "탐색",
    icon: "/icons/icon-explore.svg",
    match: (pathname) => pathname.startsWith("/challenges"),
  },
  {
    href: "/",
    label: "홈",
    icon: "/icons/icon-home.svg",
    match: (pathname) => pathname === "/",
  },
  {
    href: "/profile",
    label: "마이",
    icon: "/icons/icon-user.svg",
    match: (pathname) => pathname.startsWith("/profile"),
  },
];

function UploadTopBtn() {
  const pathname = usePathname();
  const hidden =
    pathname.startsWith("/upload") ||
    /^\/challenges\/\d+/.test(pathname) ||
    /^\/profile\/uploads\/[^/]+/.test(pathname) ||
    ["/about", "/privacy", "/terms", "/contact"].includes(pathname);
  if (hidden) return null;
  return (
    <Link href="/upload" className="desktop-upload-btn">
      <Plus size={15} strokeWidth={2.5} />
      내 글씨 올리기
    </Link>
  );
}

export function Page({
  children,
  dark = false,
  className = "",
}: {
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <main className={`page ${dark ? "page-dark" : ""} ${className}`}>
      {children}
    </main>
  );
}

export function TopBar({
  title,
  logo,
  backHref,
  right,
  dark = false,
}: {
  title?: string;
  logo?: ReactNode;
  backHref?: string;
  right?: ReactNode;
  dark?: boolean;
}) {
  const router = useRouter();

  return (
    <header className={`topbar ${dark ? "topbar-dark" : ""}`}>
      {backHref ? (
        <button
          className="icon-button"
          onClick={() =>
            window.history.length > 1 ? router.back() : router.push(backHref)
          }
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={21} strokeWidth={2.2} />
        </button>
      ) : (
        <div className="topbar-logo">{logo}</div>
      )}
      {title ? <h1 className="topbar-title">{title}</h1> : null}
      <div className="topbar-action">
        <UploadTopBtn />
        {right}
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {navItems.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            className={`nav-item ${active ? "active" : ""}`}
            href={item.href}
            key={item.href}
          >
            <img src={item.icon} width={24} height={24} alt="" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function FloatingUpload() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    queueMicrotask(() => setVisible(true));
    const el = document.querySelector(".scroll-content") as HTMLElement | null;
    if (!el) return;
    let last = 0;
    const onScroll = () => {
      const y = el.scrollTop;
      setVisible(y <= 40 || y < last);
      last = y;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const hidden =
    pathname.startsWith("/upload") ||
    /^\/challenges\/\d+/.test(pathname) ||
    /^\/profile\/uploads\/[^/]+/.test(pathname) ||
    ["/about", "/privacy", "/terms", "/contact"].includes(pathname);

  if (hidden) return null;

  return (
    <Link
      className={`floating-upload${visible ? "" : " floating-upload-hidden"}`}
      href="/upload"
      aria-label="악필 업로드"
    >
      <Plus size={22} strokeWidth={2.5} />
      <span>업로드</span>
    </Link>
  );
}

export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <div className="app-frame">
      {children}
      <FloatingUpload />
    </div>
  );
}
