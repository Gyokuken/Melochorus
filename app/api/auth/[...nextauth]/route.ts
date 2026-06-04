import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth";

// NextAuth's catch-all handler for /api/auth/* (sign in, callback, session, ...).
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
