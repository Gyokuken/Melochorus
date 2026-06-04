import type { DefaultSession } from "next-auth";

// Augment the NextAuth Session so `session.user.id` is typed everywhere.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}
