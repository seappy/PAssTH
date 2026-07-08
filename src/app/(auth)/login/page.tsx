"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { IconStore } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@pleos.dev");
  const [password, setPassword] = useState("pleos1234");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않아요.");
      return;
    }
    router.push("/home");
    router.refresh();
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-canvas">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-[22px] flex items-center justify-center text-white mb-4"
            style={{ background: "linear-gradient(135deg,var(--color-accent),#1b64da)" }}
          >
            <IconStore size={32} />
          </div>
          <h1 className="font-extrabold text-2xl text-ink">PAssTH</h1>
          <p className="text-ink-3 font-semibold text-sm mt-1">매장 관리 앱</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-[13px] text-ink-3 font-semibold ml-0.5">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="w-full mt-1.5 bg-white rounded-[14px] px-4 py-3.5 font-semibold text-[15px] outline-none border-[1.5px] border-transparent focus:border-accent shadow-sm"
              placeholder="owner@pleos.dev"
            />
          </div>
          <div>
            <label className="text-[13px] text-ink-3 font-semibold ml-0.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full mt-1.5 bg-white rounded-[14px] px-4 py-3.5 font-semibold text-[15px] outline-none border-[1.5px] border-transparent focus:border-accent shadow-sm"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <div className="text-[13px] font-semibold text-[#f04452] ml-0.5">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-[14px] py-4 font-bold text-base text-white disabled:opacity-60"
            style={{
              background: "var(--color-accent)",
              boxShadow: "0 6px 16px -6px color-mix(in srgb, var(--color-accent) 60%, transparent)",
            }}
          >
            {loading ? "로그인 중…" : "로그인"}
          </button>
        </form>

        <p className="text-center text-[12.5px] text-ink-4 mt-5 leading-relaxed">
          데모 계정이 미리 입력돼 있어요
          <br />
          owner@pleos.dev / pleos1234
        </p>
      </div>
    </div>
  );
}
