import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { uploadImage } from "@/server/storage";

export const runtime = "nodejs";

/**
 * Owner-authenticated store photo upload. Shown to drivers browsing stores in
 * the nav client (trpc.driver.stores / storeMenu). Returns the public URL to
 * store on Store.imageUrl.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const store = await prisma.store.findFirst({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  if (!store) return Response.json({ error: "매장을 찾을 수 없습니다." }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "파일이 없어요." }, { status: 400 });
  }

  const result = await uploadImage(file, `store/${store.id}`);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ url: result.url });
}
