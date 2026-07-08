import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 24, ...props }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export const IconChevronDown = (p: P) => (
  <svg {...base({ strokeWidth: 2.4, ...p })}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const IconChevronRight = (p: P) => (
  <svg {...base({ strokeWidth: 2.4, ...p })}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const IconChevronLeft = (p: P) => (
  <svg {...base({ strokeWidth: 2.2, ...p })}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
export const IconCar = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
    <path d="M4 11h16v5H4z" />
    <circle cx="7.5" cy="16" r="1.4" />
    <circle cx="16.5" cy="16" r="1.4" />
  </svg>
);
export const IconClock = (p: P) => (
  <svg {...base({ strokeWidth: 2.4, ...p })}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const IconHome = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V20h13V9.5" />
  </svg>
);
export const IconList = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 6h11M8 12h11M8 18h11" />
    <circle cx="4" cy="6" r="1" />
    <circle cx="4" cy="12" r="1" />
    <circle cx="4" cy="18" r="1" />
  </svg>
);
export const IconGrid = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="3" width="7" height="7" rx="2" />
    <rect x="3" y="14" width="7" height="7" rx="2" />
    <rect x="14" y="14" width="7" height="7" rx="2" />
  </svg>
);
export const IconStore = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9.5 5 5h14l1 4.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0z" />
    <path d="M5 11v9h14v-9" />
    <path d="M9.5 20v-5h5v5" />
  </svg>
);
export const IconPlus = (p: P) => (
  <svg {...base({ strokeWidth: 2.6, ...p })}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);
export const IconImage = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="15" rx="3" />
    <circle cx="9" cy="11" r="2" />
    <path d="M3 17l5-4 4 3 3-2 6 5" />
  </svg>
);
export const IconMessage = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L4 21l1.1-4A8.4 8.4 0 1 1 21 11.5z" />
  </svg>
);
