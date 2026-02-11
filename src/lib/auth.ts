import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const allowedEmail = process.env.ALLOWED_EMAIL;
        const allowedPassword = process.env.AUTH_PASSWORD;
        if (!allowedEmail || !allowedPassword) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        if (
          email.toLowerCase() === allowedEmail.toLowerCase() &&
          password === allowedPassword
        ) {
          return { id: "1", email: allowedEmail, name: "Admin" };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});
