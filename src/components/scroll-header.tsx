"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.5)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b bg-background transition-all duration-300"
      style={{
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Logo className="h-7" />
          </Link>
          {isLoggedIn ? (
            <div className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground"
              >
                My Orders
              </Link>
              <Link
                href="/dashboard/packages"
                className="px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Packages
              </Link>
              <Link
                href="/dashboard/faq"
                className="px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                FAQ
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <a
                href="#packages"
                className="px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Packages
              </a>
              <a
                href="#faq"
                className="px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                FAQ
              </a>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLoggedIn && user ? (
            <>
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
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Login with Discord</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
