import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedDomain = process.env.ADMIN_EMAIL_DOMAIN ?? "dripos.com";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { signIn: "/login" },
  callbacks: {
    signIn({ profile }) {
      const email = profile?.email ?? "";
      return profile?.email_verified === true && email.endsWith(`@${allowedDomain}`);
    },
  },
});

/** Resolves the signed-in admin or throws. Use inside server actions. */
export async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");
  return { email, name: session.user?.name ?? email };
}
