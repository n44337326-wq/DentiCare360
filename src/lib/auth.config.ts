import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/types";

/**
 * Edge-safe half of the Auth.js configuration: no database or Node-only imports,
 * so it can also run inside `proxy.ts` for coarse route protection. The
 * credentials provider (which hits the database) is added in `auth.ts`.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as Role;
        token.doctorId = user.doctorId;
        token.patientId = user.patientId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as Role;
        session.user.doctorId = token.doctorId as string | undefined;
        session.user.patientId = token.patientId as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
