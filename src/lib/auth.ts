import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, username } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

/** Better-Auth-Config nach Spec 3.2. `nextCookies()` muss das letzte Plugin sein. */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 10,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 Tage
    updateAge: 60 * 60 * 24, // täglich verlängern
    cookieCache: { enabled: true, maxAge: 300 },
  },
  rateLimit: {
    enabled: true,
    customRules: {
      "/sign-in/username": { window: 60, max: 5 },
    },
  },
  plugins: [username(), admin(), nextCookies()],
});
