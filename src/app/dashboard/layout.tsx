import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CustomerNav } from "@/components/customer/customer-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav user={session.user} />
      <main className="container mx-auto py-6 px-4">{children}</main>
    </div>
  )
}
