import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    // With the Prisma adapter the default session strategy is "database",
    // so the callback receives the DB `user`. Expose its id on the session.
    // (Admin is now per-room ownership, not a global flag — see lib/rooms.ts.)
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};

/** Server-side session helper for route handlers / server components. */
export const getServerAuthSession = () => getServerSession(authOptions);
