import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PAssTH · 차량 인포테인먼트",
  description: "PleOS 차량 인포테인먼트용 PAssTH 주문 서비스 — 가는 길에 미리 주문",
};

/**
 * Driver (in-car infotainment) client. Unlike the merchant client it renders a
 * full-bleed 1280×720 canvas (no PhoneFrame / BottomNav chrome). It shares the
 * same server (tRPC / Prisma / SSE) exposed by the root layout's providers.
 */
export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
