import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import type { NextAuthConfig } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      discordId: string
      discordUsername: string
      discordAvatar: string | null
      isAdmin: boolean
    }
  }
}

const config: NextAuthConfig = {
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.discordId = profile.id as string
        token.discordUsername = profile.username as string
        token.discordAvatar = profile.avatar as string | null
        token.isAdmin = profile.id === process.env.ADMIN_DISCORD_ID
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.discordId = token.discordId as string
        session.user.discordUsername = token.discordUsername as string
        session.user.discordAvatar = token.discordAvatar as string | null
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)
