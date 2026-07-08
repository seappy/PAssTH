import type { ReactNode } from "react";
import { StatusBar } from "./StatusBar";

/**
 * Mobile-first device frame. On phones it fills the viewport; on ≥sm screens it
 * renders as a centered 390×844 device with the prototype's bezel shadow.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center sm:p-8 bg-[#e9ecef]">
      <div
        className="relative w-full h-[100dvh] sm:w-[390px] sm:h-[844px] sm:max-w-full bg-white overflow-hidden flex flex-col sm:rounded-[52px]"
        style={{
          boxShadow:
            "0 40px 90px -25px rgba(20,30,50,.4),0 0 0 12px #0f1115,0 0 0 13px #2a2d34",
        }}
      >
        <StatusBar />
        <div className="flex-1 min-h-0 relative flex flex-col">{children}</div>
      </div>
    </div>
  );
}
