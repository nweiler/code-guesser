import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.providerAccountId) {
        const githubId = Number(account.providerAccountId);
        if (!isNaN(githubId)) {
          const existing = await getDb()
            .select()
            .from(users)
            .where(eq(users.githubId, githubId))
            .limit(1);
          if (existing.length > 0) {
            token.id = String(existing[0].id);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub!;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (!profile?.login) {
        console.error("[auth] No profile login");
        return false;
      }

      const githubId = Number(profile.id);
      if (isNaN(githubId)) {
        console.error("[auth] Invalid githubId", profile.id);
        return false;
      }

      try {
        const existing = await getDb()
          .select()
          .from(users)
          .where(eq(users.githubId, githubId))
          .limit(1);

        if (existing.length === 0) {
          const p = profile as Record<string, string>;
          await getDb().insert(users).values({
            githubId,
            name: p.name || p.login || "Unknown",
            avatar: p.avatar_url || "",
          });
        }
        return true;
      } catch (err) {
        console.error("[auth] DB error in signIn:", err);
        return false;
      }
    },
  },
});
