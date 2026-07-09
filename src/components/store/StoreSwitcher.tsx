"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { IconChevronDown } from "@/components/icons";
import { PromptModal } from "@/components/PromptModal";

/**
 * Store name + chevron trigger (Home header) that opens a bottom sheet to
 * switch which of the owner's stores the merchant UI manages, or create a
 * new one. Switching updates `User.activeStoreId` (read by `storeProcedure`),
 * so every store-scoped query needs a full cache invalidate afterward.
 */
export function StoreSwitcher({
  currentId,
  currentName,
}: {
  currentId?: string;
  currentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const utils = trpc.useUtils();

  const storesQ = trpc.store.myStores.useQuery(undefined, { enabled: open });

  const switchTo = trpc.store.switchTo.useMutation({
    onSuccess: async () => {
      setOpen(false);
      await utils.invalidate();
    },
  });
  const createStore = trpc.store.createStore.useMutation({
    onSuccess: async () => {
      setAdding(false);
      setOpen(false);
      await utils.invalidate();
    },
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5"
      >
        <span className="font-bold text-[22px]">{currentName}</span>
        <span className="text-ink-3">
          <IconChevronDown size={20} />
        </span>
      </button>

      {open && (
        <div
          className="absolute inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(15,20,30,.5)", backdropFilter: "blur(2px)", animation: "plFade .2s ease" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-[26px] px-5 pt-5 pb-7 max-h-[70%] overflow-y-auto pl-scroll"
            style={{ animation: "plUp .25s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-bold text-lg mb-4">매장 전환</div>

            <div className="flex flex-col gap-2 mb-3">
              {(storesQ.data ?? []).map((s) => {
                const isCurrent = s.id === currentId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isCurrent || switchTo.isPending}
                    onClick={() => switchTo.mutate({ storeId: s.id })}
                    className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left disabled:cursor-default"
                    style={
                      isCurrent
                        ? { background: "color-mix(in srgb, var(--color-accent) 8%, #fff)", border: "1.5px solid var(--color-accent)" }
                        : { background: "#f7f8fa", border: "1.5px solid transparent" }
                    }
                  >
                    {s.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.imageUrl} alt={s.name} className="w-11 h-11 rounded-xl object-cover flex-none" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-[#eef1f4] flex-none" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[15px] truncate">{s.name}</div>
                      <div className="text-[12.5px] text-ink-3">{s.isOpen ? "영업중" : "영업종료"}</div>
                    </div>
                    {isCurrent ? (
                      <span className="text-accent font-bold text-xs flex-none">사용 중</span>
                    ) : null}
                  </button>
                );
              })}
              {storesQ.isLoading ? (
                <div className="text-center text-ink-4 text-sm py-4">불러오는 중…</div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full border-[1.5px] border-dashed border-[#c9cfd6] rounded-2xl py-3.5 text-center text-ink-3 font-semibold text-sm"
            >
              ＋ 새 매장 추가
            </button>
          </div>
        </div>
      )}

      <PromptModal
        open={adding}
        title="새 매장 추가"
        placeholder="매장명을 입력하세요"
        confirmLabel="추가"
        loading={createStore.isPending}
        onConfirm={(name) => createStore.mutate({ name })}
        onCancel={() => setAdding(false)}
      />
    </>
  );
}
