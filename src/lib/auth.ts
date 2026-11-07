import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, username } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";
import { authBaseUrl, authSecret } from "./auth-url";

const baseUrl = authBaseUrl();

/** Better-Auth-Config nach Spec 3.2. `nextCookies()` muss das letzte Plugin sein. */
export const auth = betterAuth({
  secret: authSecret(),
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: baseUrl,
  trustedOrigins: [baseUrl],
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
    // Spec 3.2 bleibt in Produktion (5 pro 60 s auf /sign-in/username). Der E2E-Lauf macht
    // sechs Sign-Ins in einer Minute – über das env wird der Limiter dort ausgeschaltet.
    enabled: process.env.BETTER_AUTH_RATE_LIMIT !== "off",
    customRules: {
      "/sign-in/username": { window: 60, max: 5 },
    },
  },
  plugins: [username(), admin(), nextCookies()],
});
