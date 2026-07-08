import { MenuEditor } from "@/components/menu/MenuEditor";

export default function EditMenuPage({
  params,
}: {
  params: { id: string };
}) {
  return <MenuEditor menuId={params.id} />;
}
