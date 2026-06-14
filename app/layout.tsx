import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";
import { AppProvider } from "@/components/app-provider";
import { AppChrome } from "@/components/layout";

export const metadata: Metadata = {
  title: {
    default: "삐뚜루",
    template: "%s | 삐뚜루",
  },
  description: "읽히지 않는 글씨를 함께 판독해요. 악필 커뮤니티 삐뚜루",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F3F0E9",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body>
        <AppProvider>
          <AppChrome>{children}</AppChrome>
        </AppProvider>
      </body>
    </html>
  );
}
