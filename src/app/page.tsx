import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"
import { PackageCard } from "@/components/package-card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { CustomerNav } from "@/components/customer/customer-nav"
import Link from "next/link"

async function getPackages() {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from("packages")
    .select("*")
    .eq("active", true)
    .order("price", { ascending: true })

  return data || []
}

export default async function Home() {
  const [session, packages] = await Promise.all([auth(), getPackages()])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {session?.user ? (
        <CustomerNav user={{
          discordUsername: session.user.discordUsername,
          discordAvatar: session.user.discordAvatar,
          discordId: session.user.discordId,
          isAdmin: session.user.isAdmin,
        }} />
      ) : (
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/">
              <Logo className="h-8" />
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button asChild>
                <Link href="/login">Login with Discord</Link>
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-4">
          Level Up Fast in Phasmophobia
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join private boosted lobbies and gain hundreds of levels in minutes.
          AFK-friendly, safe, and fast. No cheats on your account.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" asChild>
            <a href="#packages">View Packages</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard">Check Order Status</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              100 levels in just 15 minutes
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-3">🛋️</div>
            <h3 className="font-semibold mb-2">AFK Friendly</h3>
            <p className="text-sm text-muted-foreground">
              Join and relax - we handle everything
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="font-semibold mb-2">100% Safe</h3>
            <p className="text-sm text-muted-foreground">
              Private lobbies, no risk to your account
            </p>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">Choose Your Package</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} package={pkg} isLoggedIn={!!session?.user} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 bg-muted/30 dark:bg-card/50">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 font-bold">
              1
            </div>
            <h3 className="font-semibold mb-2">Choose Package</h3>
            <p className="text-sm text-muted-foreground">
              Select how many levels you want
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 font-bold">
              2
            </div>
            <h3 className="font-semibold mb-2">Pay Securely</h3>
            <p className="text-sm text-muted-foreground">
              Card, Apple Pay, or bank transfer
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 font-bold">
              3
            </div>
            <h3 className="font-semibold mb-2">Get Scheduled</h3>
            <p className="text-sm text-muted-foreground">
              We'll DM you with room code
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 font-bold">
              4
            </div>
            <h3 className="font-semibold mb-2">Level Up!</h3>
            <p className="text-sm text-muted-foreground">
              Join, AFK, and enjoy your levels
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <Logo className="h-6 opacity-50 mx-auto" />
          <p className="mt-2">
            Questions? DM us on Discord
          </p>
        </div>
      </footer>
    </div>
  )
}
