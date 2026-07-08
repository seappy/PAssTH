"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { BackHeader } from "@/components/BackHeader";
import { Toggle } from "@/components/Toggle";
import { ConfirmModal } from "@/components/ConfirmModal";
import { IconImage } from "@/components/icons";

type OptionDraft = { name: string; extraPrice: number };

export function MenuEditor({ menuId }: { menuId?: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const isEdit = !!menuId;

  const catsQ = trpc.category.list.useQuery();
  const menuQ = trpc.menu.byId.useQuery({ id: menuId! }, { enabled: isEdit });

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [soldOut, setSoldOut] = useState(false);
  const [options, setOptions] = useState<OptionDraft[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill: existing menu (edit) or first category (new).
  useEffect(() => {
    if (isEdit && menuQ.data) {
      setName(menuQ.data.name);
      setPrice(String(menuQ.data.price));
      setCategoryId(menuQ.data.categoryId);
      setSoldOut(menuQ.data.soldOut);
      setOptions(
        menuQ.data.options.map((o) => ({ name: o.name, extraPrice: o.extraPrice })),
      );
    }
  }, [isEdit, menuQ.data]);

  useEffect(() => {
    if (!isEdit && !categoryId && catsQ.data?.length) {
      setCategoryId(catsQ.data[0].id);
    }
  }, [isEdit, categoryId, catsQ.data]);

  const invalidateAndLeave = () => {
    void utils.menu.invalidate();
    router.push("/menu");
  };

  const createM = trpc.menu.create.useMutation({ onSuccess: invalidateAndLeave });
  const updateM = trpc.menu.update.useMutation({ onSuccess: invalidateAndLeave });
  const removeM = trpc.menu.remove.useMutation({ onSuccess: invalidateAndLeave });

  const saving = createM.isPending || updateM.isPending;

  const onSave = () => {
    setError(null);
    if (!name.trim()) return setError("메뉴명을 입력하세요");
    if (!categoryId) return setError("분류를 선택하세요");
    const priceNum = parseInt(price.replace(/[^0-9]/g, ""), 10) || 0;
    const cleanOptions = options
      .filter((o) => o.name.trim())
      .map((o) => ({ name: o.name.trim(), extraPrice: Number(o.extraPrice) || 0 }));

    if (isEdit) {
      updateM.mutate({ id: menuId!, name: name.trim(), price: priceNum, categoryId, soldOut, options: cleanOptions });
    } else {
      createM.mutate({ name: name.trim(), price: priceNum, categoryId, soldOut, options: cleanOptions });
    }
  };

  const setOpt = (i: number, patch: Partial<OptionDraft>) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  const inputCls =
    "w-full bg-white rounded-[14px] px-4 py-3.5 font-bold text-base outline-none border-[1.5px] border-transparent focus:border-accent shadow-sm";

  return (
    <>
      <BackHeader title={isEdit ? "메뉴 수정" : "메뉴 추가"} fallbackHref="/menu" />

      <div className="flex-1 min-h-0 overflow-y-auto pl-scroll px-5 pt-4 pb-5 bg-canvas">
        {/* photo placeholder */}
        <div className="pl-stripe h-[120px] rounded-2xl bg-[#eef1f4] flex flex-col items-center justify-center gap-1.5 text-ink-3 font-semibold mb-[18px]">
          <IconImage size={26} />
          <span className="text-[13px]">사진 추가</span>
        </div>

        {/* name */}
        <div className="text-[13px] text-ink-3 font-semibold mx-0.5 mb-1.5">메뉴명</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="메뉴명을 입력하세요"
          className={`${inputCls} mb-4`}
        />

        {/* price */}
        <div className="text-[13px] text-ink-3 font-semibold mx-0.5 mb-1.5">가격</div>
        <div className="bg-white rounded-[14px] px-4 py-3.5 mb-4 shadow-sm flex items-center">
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="numeric"
            placeholder="0"
            className="flex-1 bg-transparent outline-none font-bold text-base"
          />
          <span className="font-bold text-base text-ink-3">원</span>
        </div>

        {/* category */}
        <div className="text-[13px] text-ink-3 font-semibold mx-0.5 mb-1.5">분류</div>
        <div className="flex gap-2 overflow-x-auto pl-scroll mb-4">
          {(catsQ.data ?? []).map((c) => {
            const active = c.id === categoryId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className="flex-none rounded-full px-4 py-2.5 font-bold text-sm"
                style={
                  active
                    ? { background: "#191f28", color: "#fff" }
                    : { background: "#fff", color: "#4e5968", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }
                }
              >
                {c.name}
              </button>
            );
          })}
        </div>

        {/* options */}
        <div className="text-[13px] text-ink-3 font-semibold mx-0.5 mb-2">옵션</div>
        <div className="flex flex-col gap-2 mb-4">
          {options.map((o, i) => (
            <div key={i} className="bg-white rounded-xl px-3 py-2.5 flex items-center gap-2 shadow-sm">
              <input
                value={o.name}
                onChange={(e) => setOpt(i, { name: e.target.value })}
                placeholder="옵션명"
                className="flex-1 min-w-0 bg-transparent outline-none font-semibold text-[15px]"
              />
              <div className="flex items-center gap-0.5 text-ink-3">
                <span className="text-sm font-semibold">+</span>
                <input
                  value={o.extraPrice}
                  onChange={(e) =>
                    setOpt(i, { extraPrice: parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0 })
                  }
                  inputMode="numeric"
                  className="w-14 bg-transparent outline-none font-semibold text-[15px] text-right"
                />
                <span className="text-sm font-semibold">원</span>
              </div>
              <button
                type="button"
                onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-ink-4 px-1"
                aria-label="옵션 삭제"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOptions((prev) => [...prev, { name: "", extraPrice: 0 }])}
            className="border-[1.5px] border-dashed border-[#c9cfd6] rounded-xl py-3 text-center text-ink-3 font-semibold text-sm"
          >
            ＋ 옵션 추가
          </button>
        </div>

        {/* sold out */}
        <div className="bg-white rounded-[14px] px-4 py-3.5 flex justify-between items-center shadow-sm">
          <div>
            <div className="font-bold text-[15px]">품절 설정</div>
            <div className="text-[13px] text-ink-3 mt-0.5">켜면 주문을 받지 않아요</div>
          </div>
          <Toggle on={soldOut} onChange={setSoldOut} />
        </div>

        {error ? (
          <div className="text-[13px] font-semibold text-[#f04452] mt-3 ml-0.5">{error}</div>
        ) : null}

        {isEdit ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full text-center py-4 font-bold text-[15px] text-[#f04452] mt-4"
          >
            메뉴 삭제
          </button>
        ) : null}
      </div>

      {/* save */}
      <div className="flex-none px-5 pt-3 pb-7 bg-white" style={{ boxShadow: "0 -4px 16px rgba(0,0,0,.04)" }}>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full rounded-[14px] py-4 font-bold text-base text-white disabled:opacity-60"
          style={{
            background: "var(--color-accent)",
            boxShadow: "0 6px 16px -6px color-mix(in srgb, var(--color-accent) 60%, transparent)",
          }}
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="메뉴를 삭제할까요?"
        message="삭제한 메뉴는 되돌릴 수 없어요."
        confirmLabel="삭제"
        danger
        loading={removeM.isPending}
        onConfirm={() => removeM.mutate({ id: menuId! })}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
