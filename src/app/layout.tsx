import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";

const APP_TITLE = "PAssTH - 매장 관리 앱";
const APP_DESCRIPTION = "PAssTH 매장 관리 앱 — 실시간 픽업 주문 수신·처리";

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  applicationName: "PAssTH",
  openGraph: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    siteName: "PAssTH",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3182f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
