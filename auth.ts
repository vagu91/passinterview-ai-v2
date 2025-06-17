import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { NextAuthOptions } from "next-auth"

// Check if Google OAuth is configured
const hasGoogleCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET

export const authOptions: NextAuthOptions = {
  providers: hasGoogleCredentials ? [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ] : [],
  pages: {
    signIn: '/auth',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("JWT callback:", { token: !!token, user: !!user })
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      console.log("Session callback:", { session: !!session, token: !!token })
      if (token && session.user) {
        (session.user as any).id = token.id as string
      }
      return session
    }
  },
  debug: false, // Disable debug to reduce console noise
}

export default NextAuth(authOptions)