export function StatusBar() {
  return (
    <div className="flex-none h-[50px] flex items-end justify-between px-7 pb-2 text-sm font-semibold text-ink">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="#191f28">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="4.5" width="3" height="6.5" rx="1" />
          <rect x="9" y="2" width="3" height="9" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="#191f28" strokeWidth="1.4">
          <path d="M1 3.5C3 1.5 5.4.5 8 .5s5 1 7 3M3.2 6C4.5 4.8 6.2 4 8 4s3.5.8 4.8 2M5.5 8.5C6.2 7.9 7 7.5 8 7.5s1.8.4 2.5 1" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="#191f28" opacity=".4" />
          <rect x="2.5" y="2.5" width="16" height="7" rx="1.5" fill="#191f28" />
          <rect x="23" y="4" width="2" height="4" rx="1" fill="#191f28" opacity=".4" />
        </svg>
      </div>
    </div>
  );
}
