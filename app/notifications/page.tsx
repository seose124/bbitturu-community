"use client";

import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { useBbiduru } from "@/components/app-provider";
import { Page, TopBar } from "@/components/layout";

export default function NotificationsPage() {
  const { notifications, markNotificationRead } = useBbiduru();

  return (
    <Page>
      <div className="page-column">
        <TopBar title="알림" backHref="/" />
        <div className="scroll-content notification-content">
          {notifications.length ? (
            <div className="notification-list">
              {notifications.map((notification) => {
                const href = notification.challengeId
                  ? `/profile/uploads/${notification.challengeId}`
                  : "/profile";
                return (
                  <Link
                    className={`notification-card card outlined${
                      notification.readAt ? " notification-read" : ""
                    }`}
                    href={href}
                    key={notification.id}
                    onClick={() => void markNotificationRead(notification.id)}
                  >
                    <span className="notification-icon">
                      {notification.readAt ? <Check size={17} /> : <Bell size={17} />}
                    </span>
                    <div>
                      <strong>{notification.title}</strong>
                      <p>{notification.body}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-state fill notification-empty">
              <Bell size={28} />
              <strong>아직 새 알림이 없어요</strong>
              <span>내 글씨에 판독이 모이면 바로 알려드릴게요.</span>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
