"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { Toggle } from "@/components/Toggle";
import { DayPicker } from "@/components/DayPicker";
import { TimeRangeField } from "@/components/TimeRangeField";
import { IconImage } from "@/components/icons";
import { CONGESTION_META, WEEKDAY_LABELS } from "@/lib/format";
import { CONGESTION_LEVELS, type Congestion } from "@/types/domain";

export default function StorePage() {
  const utils = trpc.useUtils();
  const storeQ = trpc.store.get.useQuery();
  const store = storeQ.data;

  // Optimistic patch helper for the single store.get cache.
  const patchStore = (patch: Partial<NonNullable<typeof store>>) =>
    utils.store.get.setData(undefined, (old) => (old ? { ...old, ...patch } : old));

  const setStatus = trpc.store.setStatus.useMutation({
    onMutate: async (p) => {
      await utils.store.get.cancel();
      patchStore(p);
    },
    onSettled: () => utils.store.invalidate(),
  });
  const setCongestion = trpc.store.setCongestion.useMutation({
    onMutate: async ({ level }) => {
      await utils.store.get.cancel();
      patchStore({ congestion: level });
    },
    onSettled: () => utils.store.invalidate(),
  });
  const setClosedDays = trpc.store.setClosedDays.useMutation({
    onMutate: async ({ days }) => {
      await utils.store.get.cancel();
      patchStore({ closedDays: days });
    },
    onSettled: () => utils.store.invalidate(),
  });
  const updateHours = trpc.store.updateHours.useMutation({
    onSettled: () => utils.store.invalidate(),
  });
  const setImage = trpc.store.setImage.useMutation({
    onMutate: async ({ imageUrl }) => {
      await utils.store.get.cancel();
      patchStore({ imageUrl });
    },
    onSettled: () => utils.store.invalidate(),
  });
  const sim = trpc.sim.createFakeOrder.useMutation();

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const onPickStorePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/store/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setPhotoError(data.error ?? "사진 업로드에 실패했어요.");
        return;
      }
      setImage.mutate({ imageUrl: data.url });
    } catch {
      setPhotoError("사진 업로드 중 오류가 발생했어요.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Local hours state, synced from server.
  const [hours, setHours] = useState({
    weekdayOpen: "08:00",
    weekdayClose: "22:00",
    weekendOpen: "09:00",
    weekendClose: "21:00",
  });
  useEffect(() => {
    if (store) {
      setHours({
        weekdayOpen: store.weekdayOpen,
        weekdayClose: store.weekdayClose,
        weekendOpen: store.weekendOpen,
        weekendClose: store.weekendClose,
      });
    }
  }, [store]);

  const saveHours = (next: typeof hours) => {
    setHours(next);
    updateHours.mutate(next);
  };

  if (!store) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-4 text-sm bg-canvas">
        불러오는 중…
      </div>
    );
  }

  const closedLabel =
    store.closedDays.length > 0
      ? store.closedDays.map((d) => `매주 ${WEEKDAY_LABELS[d]}요일`).join(", ")
      : "휴무 없음";

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pl-scroll bg-canvas">
      <div className="px-5 pt-2 pb-7" style={{ animation: "plFade .25s ease" }}>
        <div className="font-bold text-2xl my-2 mb-[18px]">매장 관리</div>

        {/* store photo — shown to drivers browsing stores in the nav client */}
        <div className="text-[13px] text-ink-3 font-semibold mx-0.5 mb-1.5">매장 사진</div>
        <div className="relative h-[140px] mb-1">
          <label
            className={`${store.imageUrl ? "" : "pl-stripe"} absolute inset-0 rounded-2xl bg-[#eef1f4] flex flex-col items-center justify-center gap-1.5 text-ink-3 font-semibold cursor-pointer overflow-hidden`}
          >
            {store.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.imageUrl} alt="매장 사진" className="w-full h-full object-cover" />
            ) : (
              <>
                <IconImage size={26} />
                <span className="text-[13px]">{uploadingPhoto ? "업로드 중…" : "사진 추가"}</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickStorePhoto}
              disabled={uploadingPhoto}
            />
          </label>
          {uploadingPhoto ? (
            <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center text-white text-[13px] font-semibold">
              업로드 중…
            </div>
          ) : null}
          {store.imageUrl && !uploadingPhoto ? (
            <button
              type="button"
              onClick={() => setImage.mutate({ imageUrl: null })}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/55 text-white text-sm flex items-center justify-center"
              aria-label="사진 삭제"
            >
              ✕
            </button>
          ) : null}
        </div>
        {photoError ? (
          <div className="text-[13px] font-semibold text-[#f04452] mb-3 ml-0.5">{photoError}</div>
        ) : (
          <div className="text-[12.5px] text-ink-4 mb-[26px] ml-0.5">
            운전자 앱(네비)에 표시되는 매장 사진이에요
          </div>
        )}

        {/* open status */}
        <div
          className="rounded-[18px] p-[18px] flex items-center justify-between mb-3 transition-colors"
          style={
            store.isOpen
              ? { background: "linear-gradient(135deg, var(--color-accent), #1b64da)" }
              : { background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }
          }
        >
          <div>
            <div
              className="font-bold text-[17px]"
              style={{ color: store.isOpen ? "#fff" : "#191f28" }}
            >
              영업 상태
            </div>
            <div
              className="text-[13px] mt-0.5"
              style={{ color: store.isOpen ? "rgba(255,255,255,.85)" : "#8b95a1" }}
            >
              {store.isOpen ? "현재 주문을 받고 있어요" : "영업이 종료되었어요"}
            </div>
          </div>
          <Toggle on={store.isOpen} onChange={(v) => setStatus.mutate({ isOpen: v })} />
        </div>

        {/* pickup */}
        <div className="bg-white rounded-[18px] p-[18px] flex items-center justify-between mb-[26px] shadow-sm">
          <div>
            <div className="font-bold text-base">픽업 주문 받기</div>
            <div className="text-[13px] text-ink-3 mt-0.5">
              {store.pickupOn ? "픽업 주문 접수 중" : "픽업 주문 중지됨"}
            </div>
          </div>
          <Toggle on={store.pickupOn} onChange={(v) => setStatus.mutate({ pickupOn: v })} />
        </div>

        {/* congestion */}
        <div className="font-bold text-[17px] mb-3">매장 혼잡도</div>
        <div className="flex gap-2.5 mb-[26px]">
          {CONGESTION_LEVELS.map((level) => {
            const meta = CONGESTION_META[level];
            const active = store.congestion === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setCongestion.mutate({ level: level as Congestion })}
                className="flex-1 rounded-2xl px-1.5 py-4 text-center font-bold text-sm transition-colors"
                style={
                  active
                    ? {
                        background: "#fff",
                        border: "2px solid var(--color-accent)",
                        boxShadow: "0 4px 12px -4px color-mix(in srgb, var(--color-accent) 40%, transparent)",
                      }
                    : { background: "#fff", border: "2px solid transparent", color: "#8b95a1", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }
                }
              >
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-1.5"
                  style={{ background: meta.dot }}
                />
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* hours */}
        <div className="font-bold text-[17px] mb-3">영업시간</div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-[26px]">
          <TimeRangeField
            label="평일"
            open={hours.weekdayOpen}
            close={hours.weekdayClose}
            onChange={(o, c) => saveHours({ ...hours, weekdayOpen: o, weekdayClose: c })}
          />
          <div className="border-t border-line" />
          <TimeRangeField
            label="주말"
            open={hours.weekendOpen}
            close={hours.weekendClose}
            onChange={(o, c) => saveHours({ ...hours, weekendOpen: o, weekendClose: c })}
          />
        </div>

        {/* closed days */}
        <div className="font-bold text-[17px] mb-3">휴무 설정</div>
        <div className="bg-white rounded-2xl px-4 py-3.5 shadow-sm mb-3">
          <div className="text-[13px] text-ink-3 font-semibold mb-2.5">{closedLabel}</div>
          <DayPicker
            value={store.closedDays}
            onChange={(days) => setClosedDays.mutate({ days })}
          />
        </div>

        {/* demo tools */}
        <div className="font-bold text-[17px] mb-3 mt-[26px]">데모 도구</div>
        <button
          type="button"
          onClick={() => sim.mutate()}
          disabled={sim.isPending}
          className="w-full bg-white rounded-2xl px-4 py-4 shadow-sm flex items-center justify-between mb-3 disabled:opacity-60"
        >
          <div className="text-left">
            <div className="font-bold text-[15px]">가짜 주문 생성</div>
            <div className="text-[13px] text-ink-3 mt-0.5">실시간 수신 데모용 랜덤 주문</div>
          </div>
          <span className="font-bold text-accent text-sm">
            {sim.isPending ? "생성 중…" : "＋ 생성"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-center py-3.5 font-bold text-[15px] text-ink-3"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
