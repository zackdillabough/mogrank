"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
        <Link href="/">
          <Logo className="h-7" />
        </Link>
        <div className="flex items-center gap-2">
          {isLoggedIn && user ? (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Button size="sm">My Orders</Button>
              <Avatar className="size-7">
                <AvatarImage
                  src={user.discordAvatar
                    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`
                    : undefined}
                />
                <AvatarFallback className="text-xs">
                  {user.discordUsername.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
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
