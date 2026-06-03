import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { isDemoDataMode } from "@/lib/db-config";
import {
  demoAdminCredentials,
  demoAdminId,
  demoOwnerPassword,
  findDemoOwnerByEmail,
} from "@/lib/demo-store";
import { findOwnerWithPasswordByEmail, findUserByEmail } from "@/lib/data";
// Customer phone-OTP auth — disabled (see CustomerLoginForm.disabled.tsx)
// import { verifyOtp } from "@/lib/otp";
// import { normalizeIndianMobile, isValidIndianMobile } from "@/lib/phone";
// import { placeholderEmailForPhone } from "@/lib/user-email";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    /* CredentialsProvider({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Mobile", type: "text" },
        code: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        const phone = normalizeIndianMobile(credentials?.phone ?? "");
        const code = (credentials?.code ?? "").trim();
        if (!isValidIndianMobile(phone) || !/^\d{6}$/.test(code)) return null;
        const valid = await verifyOtp(phone, code);
        if (!valid) return null;
        let user = await prisma.user.findUnique({ where: { phone } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              phone,
              role: "USER",
              email: placeholderEmailForPhone(phone),
            },
          });
        } else if (user.role !== "USER") {
          return null;
        } else if (!user.phone) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { phone },
          });
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          phone: user.phone,
          role: "USER" as const,
        };
      },
    }), */
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const email = credentials.email.trim().toLowerCase();

        if (isDemoDataMode()) {
          const admin = demoAdminCredentials();
          if (email === admin.email && credentials.password === admin.password) {
            return {
              id: demoAdminId(),
              email: admin.email,
              name: "Heavy Hulk Admin",
              role: "ADMIN" as const,
            };
          }
          const owner = findDemoOwnerByEmail(email);
          if (owner && credentials.password === demoOwnerPassword()) {
            return {
              id: owner.id,
              email: owner.email,
              name: owner.name,
              role: "OWNER" as const,
            };
          }
          return null;
        }

        const user = await findUserByEmail(email);
        if (user?.passwordHash) {
          const ok = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!ok) return null;
          if (user.role === "ADMIN") {
            return {
              id: user.id,
              email: user.email,
              name: user.name ?? "Admin",
              role: "ADMIN" as const,
            };
          }
        }

        const owner = await findOwnerWithPasswordByEmail(email);
        if (owner?.passwordHash) {
          const ok = await bcrypt.compare(credentials.password, owner.passwordHash);
          if (!ok) return null;
          return {
            id: owner.id,
            email: owner.email,
            name: owner.name,
            role: "OWNER" as const,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.sub = user.id;
        token.phone = (user as { phone?: string | null }).phone ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role as string;
        session.user.phone = (token.phone as string | null) ?? null;
        if (!session.user.email && token.sub) {
          session.user.email = null;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  secret: process.env.NEXTAUTH_SECRET?.trim(),
};

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      phone?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    phone?: string | null;
  }
}
