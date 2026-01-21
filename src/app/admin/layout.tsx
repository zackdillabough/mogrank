import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminNav } from "@/components/admin/admin-nav"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.isAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav user={session.user} />
      <main className="container mx-auto py-6 px-4">{children}</main>
    </div>
  )
}
