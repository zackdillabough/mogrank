"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { signOut } from "next-auth/react"
import { Logo } from "@/components/logo"

interface ScrollHeaderProps {
  isLoggedIn: boolean
  user?: {
    discordUsername: string
    discordAvatar: string | null
    discordId: string
    isAdmin?: boolean
  }
}

export function ScrollHeader({ isLoggedIn, user }: ScrollHeaderProps) {
  const [visible, setVisible] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.5)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = isLoggedIn
    ? [
        { href: "/dashboard", label: "My Orders", primary: true },
        { href: "/dashboard/packages", label: "Packages" },
        { href: "/dashboard/faq", label: "FAQ" },
      ]
    : [
        { href: "#packages", label: "Packages" },
        { href: "#faq", label: "FAQ" },
      ]

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b bg-background transition-all duration-300"
      style={{
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Logo className="h-7" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-1">
            {navLinks.map((link) =>
              link.primary ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground"
                >
                  {link.label}
                </Link>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative size-8 rounded-full">
                    <Avatar className="size-8">
                      <AvatarImage
                        src={user.discordAvatar
                          ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`
                          : undefined}
                      />
                      <AvatarFallback className="text-xs">
                        {user.discordUsername.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.discordUsername}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {user.isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin">Admin Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm">
                <Link href="/login">Login with Discord</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Menu */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[260px]">
              <SheetHeader>
                <SheetTitle>
                  <Logo className="h-6" />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={
                      link.primary
                        ? "px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground w-fit"
                        : "px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    }
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t my-3" />
                {isLoggedIn && user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <Avatar className="size-8">
                        <AvatarImage
                          src={user.discordAvatar
                            ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`
                            : undefined}
                        />
                        <AvatarFallback className="text-xs">
                          {user.discordUsername.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user.discordUsername}</span>
                    </div>
                    {user.isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        signOut({ callbackUrl: "/" })
                      }}
                      className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-left"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground w-fit"
                  >
                    Login with Discord
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
