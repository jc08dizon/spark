import type { NextAuthConfig } from "next-auth";

// Edge-safe config shared between the full auth.ts (used in server
// components/route handlers) and middleware.ts. Must not import Prisma or
// any Node-only code, since middleware runs on the Edge runtime.
export default {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = request.nextUrl.pathname.startsWith("/login");

      if (isOnLogin) {
        return isLoggedIn ? Response.redirect(new URL("/", request.nextUrl)) : true;
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
