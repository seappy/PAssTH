"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { MenuCard } from "@/components/menu/MenuCard";
import { PromptModal } from "@/components/PromptModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { IconPlus } from "@/components/icons";
import type { MenuDTO, CategoryDTO } from "@/lib/trpc/types";

export default function MenuPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [sel, setSel] = useState<string>("all"); // "all" or category id
  const [editMode, setEditMode] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<CategoryDTO | null>(null);

  const catsQ = trpc.category.list.useQuery();
  const menusQ = trpc.menu.list.useQuery();
  const cats = catsQ.data ?? [];
  const menus: MenuDTO[] = menusQ.data ?? [];

  const createCat = trpc.category.create.useMutation({
    onSuccess: () => {
      void utils.category.invalidate();
      setAdding(false);
    },
  });
  const removeCat = trpc.category.remove.useMutation({
    onSuccess: () => {
      void utils.category.invalidate();
      void utils.menu.invalidate();
      setDeleting(null);
      setSel("all");
    },
  });

  const filtered = menus.filter((m) => sel === "all" || m.categoryId === sel);

  const chipCls =
    "flex items-center gap-1.5 flex-none rounded-full px-4 py-2.5 font-bold text-sm transition-colors";
  const chipStyle = (active: boolean) =>
    active
      ? { background: "#191f28", color: "#fff" }
      : { background: "#fff", color: "#4e5968", boxShadow: "0 1px 3px rgba(0,0,0,.05)" };

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto pl-scroll bg-canvas">
        <div className="px-5 pt-2 pb-7" style={{ animation: "plFade .25s ease" }}>
          <div className="flex items-center justify-between my-2 mb-[18px]">
            <span className="font-bold text-2xl">메뉴 관리</span>
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className="font-bold text-sm text-accent"
            >
              {editMode ? "완료" : "분류 편집"}
            </button>
          </div>

          {/* category chips */}
          <div className="flex gap-2 overflow-x-auto pl-scroll mb-5">
            <button
              type="button"
              onClick={() => setSel("all")}
              className={chipCls}
              style={chipStyle(sel === "all")}
            >
              전체
            </button>
            {cats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => (editMode ? undefined : setSel(c.id))}
                className={chipCls}
                style={chipStyle(sel === c.id)}
              >
                {c.name}
                {editMode ? (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleting(c);
                    }}
                    className="ml-0.5 text-[13px] opacity-70"
                  >
                    ✕
                  </span>
                ) : null}
              </button>
            ))}
            {editMode ? (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex-none rounded-full px-4 py-2.5 font-bold text-sm border-[1.5px] border-dashed border-[#c9cfd6] text-ink-3"
              >
                ＋ 분류
              </button>
            ) : null}
          </div>

          {/* menu list */}
          <div className="flex flex-col gap-3">
            {filtered.map((m) => (
              <MenuCard key={m.id} menu={m} />
            ))}
            {!menusQ.isLoading && filtered.length === 0 && (
              <div className="text-center text-ink-4 text-sm py-10">메뉴가 없어요</div>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => router.push("/menu/new")}
        className="absolute right-5 bottom-[84px] w-14 h-14 rounded-[20px] flex items-center justify-center text-white"
        style={{
          background: "var(--color-accent)",
          boxShadow: "0 10px 24px -6px color-mix(in srgb, var(--color-accent) 65%, transparent)",
          animation: "plUp .3s ease",
        }}
        aria-label="메뉴 추가"
      >
        <IconPlus size={26} />
      </button>

      <PromptModal
        open={adding}
        title="분류 추가"
        placeholder="분류명 (예: 스무디)"
        loading={createCat.isPending}
        onConfirm={(name) => createCat.mutate({ name })}
        onCancel={() => setAdding(false)}
      />
      <ConfirmModal
        open={!!deleting}
        title={`'${deleting?.name}' 분류 삭제`}
        message="이 분류의 메뉴는 첫 번째 분류로 이동돼요."
        confirmLabel="삭제"
        danger
        loading={removeCat.isPending}
        onConfirm={() => deleting && removeCat.mutate({ id: deleting.id })}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
