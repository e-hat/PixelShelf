import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { User as PrismaUser } from '@prisma/client';
import type { User as AppUser } from '@/types';
import prisma from "@/lib/db/prisma";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Extend the Prisma User type to include the password field
type UserWithPassword = AppUser & {
  password?: string | null;
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    // We'll handle the newUser redirect in a middleware to avoid redirecting
    // users who have already completed onboarding
    // newUser: "/onboarding",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        }) as UserWithPassword | null;

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          name: user.name || "",
          email: user.email || "",
          image: user.image || "",
          username: user.username || "",
          subscriptionTier: user.subscriptionTier,
        } as User;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
        session.user.username = token.username as string;
        session.user.subscriptionTier = token.subscriptionTier as string;
      }
      return session;
    },
    async jwt({
      token,
      user,
      trigger,
      session,
    }: {
      token: JWT;
      user?: User;
      trigger?: string;
      session?: Session;
    }) {
      // When update is triggered from the client and session data is provided
      if (trigger === "update" && session) {
        // Make sure we update all relevant user fields
        if (session.user?.name) token.name = session.user.name;
        if (session.user?.image) token.picture = session.user.image;
        if (session.user?.username) token.username = session.user.username;
        return token;
      }
  
      // When a user signs in, fetch their full data from the database
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
  
        if (dbUser) {
          token.id = dbUser.id;
          token.name = dbUser.name || "";
          token.email = dbUser.email || "";
          token.picture = dbUser.image || "";
          token.username = dbUser.username || "";
          token.subscriptionTier = dbUser.subscriptionTier;
        }
      }
  
      return token;
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};