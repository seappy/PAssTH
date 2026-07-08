"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  title: string;
  placeholder?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

export function PromptModal({
  open,
  title,
  placeholder,
  confirmLabel = "추가",
  loading,
  onConfirm,
  onCancel,
}: Props) {
  const [value, setValue] = useState("");
  if (!open) return null;

  const submit = () => {
    const v = value.trim();
    if (v) onConfirm(v);
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(15,20,30,.5)", backdropFilter: "blur(2px)", animation: "plFade .2s ease" }}
      onClick={onCancel}
    >
      <div
        className="w-full bg-white rounded-[24px] p-6"
        style={{ boxShadow: "0 24px 60px rgba(0,0,0,.35)", animation: "plUp .26s cubic-bezier(.2,.8,.3,1.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-extrabold text-[19px] text-ink text-center mb-4">{title}</div>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={placeholder}
          className="w-full bg-canvas rounded-[14px] px-4 py-3.5 font-semibold text-[15px] outline-none border-[1.5px] border-transparent focus:border-accent"
        />
        <div className="flex gap-2.5 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-[14px] py-[15px] font-bold text-[15px] text-ink-2 border-[1.5px] border-line-2 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading || !value.trim()}
            className="flex-1 rounded-[14px] py-[15px] font-bold text-[15px] text-white disabled:opacity-40"
            style={{ background: "var(--color-accent)" }}
          >
            {loading ? "처리 중…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
