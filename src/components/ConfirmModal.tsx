"use client";

type Props = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(15,20,30,.5)", backdropFilter: "blur(2px)", animation: "plFade .2s ease" }}
      onClick={onCancel}
    >
      <div
        className="w-full bg-white rounded-[24px] p-6 text-center"
        style={{ boxShadow: "0 24px 60px rgba(0,0,0,.35)", animation: "plUp .26s cubic-bezier(.2,.8,.3,1.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-extrabold text-[19px] text-ink">{title}</div>
        {message ? (
          <div className="text-[15px] text-ink-2 mt-2 leading-relaxed">{message}</div>
        ) : null}
        <div className="flex gap-2.5 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-[14px] py-[15px] font-bold text-[15px] text-ink-2 border-[1.5px] border-line-2 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-[14px] py-[15px] font-bold text-[15px] text-white disabled:opacity-60"
            style={{ background: danger ? "#f04452" : "var(--color-accent)" }}
          >
            {loading ? "처리 중…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
