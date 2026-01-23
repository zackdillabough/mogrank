import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"
import { PackageCard } from "@/components/package-card"
import { GhostOrbs } from "@/components/ghost-orbs"
import { ScrollHeader } from "@/components/scroll-header"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { Zap, HandHelping, EyeOff } from "lucide-react"

async function getPackages() {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from("packages")
    .select("*")
    .eq("active", true)
    .order("position", { ascending: true })

  return data || []
}

export default async function Home() {
  const [session, packages] = await Promise.all([auth(), getPackages()])
  const isLoggedIn = !!session?.user

  return (
    <div className="min-h-screen bg-background relative">
      <GhostOrbs />
      <ScrollHeader
        isLoggedIn={isLoggedIn}
        user={session?.user ? {
          discordUsername: session.user.discordUsername,
          discordAvatar: session.user.discordAvatar,
          discordId: session.user.discordId,
          isAdmin: session.user.isAdmin,
        } : undefined}
      />

      <div className="relative isolate">
        {/* Hero Section - Full Viewport */}
        <section className="h-screen flex flex-col items-center justify-center relative px-4">
          {/* Centered wordmark + subtitle */}
          <div className="text-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/colored-wordmark.svg" alt="mogrank" className="h-16 md:h-20 mx-auto mb-6" />
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
              Level up fast in Phasmophobia. Private lobbies, no mods, no risk.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" asChild>
                <a href="#packages">View Packages</a>
              </Button>
              {isLoggedIn ? (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/dashboard">My Orders</Link>
                </Button>
              ) : (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Login with Discord</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Features anchored at bottom */}
          <div className="absolute bottom-16 left-0 right-0">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
                <div className="text-center">
                  <Zap className="size-7 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="text-base font-semibold mb-1">Lightning Fast</h3>
                  <p className="text-sm text-muted-foreground">
                    100 levels in just 15 minutes
                  </p>
                </div>
                <div className="text-center">
                  <HandHelping className="size-7 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="text-base font-semibold mb-1">Hassle-Free</h3>
                  <p className="text-sm text-muted-foreground">
                    Just join and we handle the rest
                  </p>
                </div>
                <div className="text-center">
                  <EyeOff className="size-7 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="text-base font-semibold mb-1">Discreet</h3>
                  <p className="text-sm text-muted-foreground">
                    Private lobbies, no public exposure
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Packages */}
        <section id="packages" className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-8">Choose Your Package</h2>
          <div className="flex flex-wrap justify-center gap-10 max-w-4xl mx-auto py-4">
            {packages.map((pkg, index) => (
              <div key={pkg.id} className="w-full sm:w-[calc(50%-1.25rem)] lg:w-[calc(33.333%-1.75rem)]">
                <PackageCard package={pkg} index={index} isLoggedIn={isLoggedIn} />
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-16">
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
                We&apos;ll DM you with room code
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2">Level Up!</h3>
              <p className="text-sm text-muted-foreground">
                Join and enjoy your levels
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
    </div>
  )
}
