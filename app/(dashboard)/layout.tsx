import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="page">{children}</main>
    </div>
  );
}
