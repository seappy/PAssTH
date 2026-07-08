import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { subscribe } from "@/server/events";
import type { RealtimeEvent } from "@/types/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream, scoped to the authenticated owner's store.
 * Any order created/updated — including by an external order app that NOTIFYs
 * the shared Postgres — is pushed here without a page reload.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const store = await prisma.store.findFirst({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  if (!store) return new Response("No store", { status: 404 });

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: RealtimeEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      send({ type: "hello", storeId: store.id });
      unsubscribe = await subscribe(store.id, send);

      // Comment lines keep proxies/browsers from closing an idle connection.
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 25_000);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
