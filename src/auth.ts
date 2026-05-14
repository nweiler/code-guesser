import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (!profile?.login) return false;

      try {
        const githubId = Number(profile.id);
      if (isNaN(githubId)) return false;

      const existing = await db
          .select()
          .from(users)
          .where(eq(users.githubId, githubId))
          .limit(1);

        if (existing.length === 0) {
          const p = profile as Record<string, string>;
          await db.insert(users).values({
            githubId,
            name: p.name || p.login || "Unknown",
            avatar: p.avatar_url || "",
          });
        }
        return true;
      } catch {
        return false;
      }
    },
  },
});
