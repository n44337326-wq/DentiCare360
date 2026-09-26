import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth.config";
import { authenticate } from "@/services/users";
import { loginSchema } from "@/lib/validation";

/**
 * Credentials sign-in backed by the `User` table. Passwords are verified with
 * bcrypt; the rate limiter and audit log live in `authenticate`.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const ip = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        return authenticate(parsed.data.email, parsed.data.password, ip);
      },
    }),
  ],
});
