import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers/_app";

/**
 * Vanilla (non-React) tRPC client for the driver flow. Used where hooks can't
 * reach — notably the Zustand store's `placeOrder` action, so touch AND voice
 * create real orders through the same code path. React components should prefer
 * the `trpc.driver.*` React Query hooks (`@/lib/trpc/client`) for reads.
 */
function baseUrl() {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export const driverApi = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: `${baseUrl()}/api/trpc`, transformer: superjson })],
});
