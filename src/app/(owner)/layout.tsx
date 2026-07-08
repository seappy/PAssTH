import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { RealtimeBridge } from "@/components/RealtimeBridge";
import { ArrivalAlert } from "@/components/ArrivalAlert";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <PhoneFrame>
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      <BottomNav />
      <RealtimeBridge />
      <ArrivalAlert />
    </PhoneFrame>
  );
}
