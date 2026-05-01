import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import type { Role } from "@prisma/client";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const SESSION_MAX_AGE_SECONDS = 30 * 60;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
    };
  }
}

async function logLoginAttempt(
  email: string,
  userId: string | null,
  ip: string | null,
  userAgent: string | null,
  success: boolean
) {
  try {
    await prisma.loginAttempt.create({
      data: { email, userId, ip, userAgent, success },
    });
  } catch {
    // 日志记录失败不影响登录流程
  }
}

async function checkBruteForce(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return null;

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000
    );
    return `账户已被锁定，请在 ${remainingMinutes} 分钟后重试`;
  }

  if (
    user.lockedUntil &&
    user.lockedUntil <= new Date() &&
    user.failedAttempts > 0
  ) {
    await prisma.user.update({
      where: { email },
      data: { lockedUntil: null, failedAttempts: 0 },
    });
  }

  return null;
}

async function recordFailedAttempt(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const newFailedAttempts = user.failedAttempts + 1;
  const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS;

  await prisma.user.update({
    where: { email },
    data: {
      failedAttempts: newFailedAttempts,
      lockedUntil: shouldLock
        ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
        : user.lockedUntil,
    },
  });
}

async function resetFailedAttempts(email: string) {
  await prisma.user.update({
    where: { email },
    data: { failedAttempts: 0, lockedUntil: null },
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = (credentials?.email as string)?.toLowerCase().trim();
        const password = credentials?.password as string;

        if (!email || !password) {
          return null;
        }

        const ip =
          req?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          req?.headers?.get("x-real-ip") ||
          null;
        const userAgent = req?.headers?.get("user-agent") || null;

        const lockError = await checkBruteForce(email);
        if (lockError) {
          await logLoginAttempt(email, null, ip, userAgent, false);
          throw new Error(lockError);
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          await logLoginAttempt(email, null, ip, userAgent, false);
          throw new Error("邮箱或密码错误");
        }

        if (!user.password) {
          await logLoginAttempt(email, user.id, ip, userAgent, false);
          throw new Error(
            "该账户未设置密码，请使用邮箱链接登录或先设置密码"
          );
        }

        const isValidPassword = await compare(password, user.password);

        if (!isValidPassword) {
          await recordFailedAttempt(email);
          await logLoginAttempt(email, user.id, ip, userAgent, false);

          const updatedUser = await prisma.user.findUnique({
            where: { email },
          });
          if (updatedUser?.lockedUntil && updatedUser.lockedUntil > new Date()) {
            throw new Error(
              `密码错误次数过多，账户已被锁定 ${LOCK_DURATION_MINUTES} 分钟`
            );
          }

          const remainingAttempts =
            MAX_FAILED_ATTEMPTS - (updatedUser?.failedAttempts || 0);
          throw new Error(
            `邮箱或密码错误，还剩 ${remainingAttempts} 次尝试机会`
          );
        }

        await resetFailedAttempts(email);
        await logLoginAttempt(email, user.id, ip, userAgent, true);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.id = user.id as string;
      }

      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as Role;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
