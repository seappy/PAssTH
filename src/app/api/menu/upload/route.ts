import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { getStorage, MENU_BUCKET } from "@/server/storage";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Owner-authenticated menu photo upload. Streams the file to Supabase Storage
 * (menu-images bucket) using the server-side service role key and returns the
 * public URL to store on Menu.imageUrl.
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

  const storage = getStorage();
  if (!storage) {
    return Response.json(
      { error: "이미지 저장소가 설정되지 않았어요 (SUPABASE_URL/SERVICE_ROLE_KEY)." },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "파일이 없어요." }, { status: 400 });
  }
  const ext = EXT[file.type];
  if (!ext) {
    return Response.json({ error: "JPG/PNG/WebP/GIF만 올릴 수 있어요." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "최대 5MB까지 올릴 수 있어요." }, { status: 400 });
  }

  const path = `${store.id}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await storage.storage
    .from(MENU_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) {
    return Response.json({ error: `업로드 실패: ${error.message}` }, { status: 500 });
  }

  const { data } = storage.storage.from(MENU_BUCKET).getPublicUrl(path);
  return Response.json({ url: data.publicUrl });
}
