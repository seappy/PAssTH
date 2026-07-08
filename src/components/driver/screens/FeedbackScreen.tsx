"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDriverStore } from "@/stores/driver.store";
import { StarIcon } from "@/components/driver/Icons";

const RATING_LABEL = ["평가를 선택해 주세요", "별로예요", "그저 그래요", "괜찮아요", "좋아요", "최고예요"];

export default function FeedbackScreen() {
  const placedOrder = useDriverStore((s) => s.placedOrder);
  const resetOrder = useDriverStore((s) => s.resetOrder);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);

  const submit = trpc.driver.submitFeedback.useMutation({
    onSettled: () => resetOrder(),
  });

  const active = hover || rating;
  const canSubmit = rating > 0 && !submit.isPending;

  const onSubmit = () => {
    if (rating === 0 || !placedOrder) return;
    submit.mutate({ orderId: placedOrder.id, rating, reviewText: text || undefined });
  };

  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }}>
      <div
        style={{
          width: 560,
          maxWidth: "100%",
          background: "#fff",
          border: "1px solid #EDF0F3",
          borderRadius: 26,
          boxShadow: "0 16px 44px rgba(20,40,80,.10)",
          padding: "36px 40px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* badge */}
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 20,
            background: "linear-gradient(135deg,#3182F6,#2B6EE0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 24px rgba(49,130,246,.35)",
            marginBottom: 18,
          }}
        >
          <StarIcon size={34} color="#fff" />
        </div>

        <div style={{ fontSize: 28, fontWeight: 800, color: "#191F28", letterSpacing: "-.02em" }}>픽업은 어떠셨나요?</div>
        <div style={{ fontSize: 15, color: "#8B95A1", marginTop: 6 }}>
          <span className="num">{placedOrder?.orderNo ?? ""}</span> 주문의 경험을 평가해 주세요
        </div>

        {/* stars in a soft tray */}
        <div
          onMouseLeave={() => setHover(0)}
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            background: "#F7F8FA",
            border: "1px solid #EDF0F3",
            borderRadius: 18,
            padding: "16px 22px",
            margin: "24px 0 10px",
          }}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              style={{ cursor: "pointer", transform: active >= n ? "scale(1.08)" : "scale(1)", transition: "transform .1s" }}
            >
              <StarIcon size={44} color={active >= n ? "#FFB020" : "#DDE2E7"} />
            </div>
          ))}
        </div>
        <div style={{ height: 24, fontSize: 16, fontWeight: 700, color: active ? "#FF9F1C" : "#B0B8C1", marginBottom: 20 }}>
          {RATING_LABEL[active]}
        </div>

        {/* one-line review */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="한줄평을 남겨주세요 (선택)"
          maxLength={200}
          style={{
            width: "100%",
            height: 84,
            background: "#fff",
            border: `1.5px solid ${focused ? "#3182F6" : "#E5E8EB"}`,
            borderRadius: 16,
            padding: "14px 16px",
            fontSize: 16,
            color: "#191F28",
            lineHeight: 1.5,
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
            marginBottom: 22,
            transition: "border-color .15s",
          }}
        />

        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <div
            onClick={() => resetOrder()}
            style={{ flex: 1, height: 60, borderRadius: 16, background: "#fff", border: "1.5px solid #E5E8EB", color: "#4E5968", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, cursor: "pointer" }}
          >
            건너뛰기
          </div>
          <div
            onClick={onSubmit}
            style={{
              flex: 2,
              height: 60,
              borderRadius: 16,
              background: canSubmit ? "#3182F6" : "#C4CBD3",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 19,
              fontWeight: 800,
              cursor: canSubmit ? "pointer" : "default",
              boxShadow: canSubmit ? "0 10px 24px rgba(49,130,246,.3)" : "none",
              transition: "background .15s",
            }}
          >
            {submit.isPending ? "제출 중…" : "평가 남기고 홈으로"}
          </div>
        </div>
      </div>
    </div>
  );
}
