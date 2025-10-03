import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Types } from "mongoose";
import { connectDB } from "~/lib/db";
import User from "~/lib/db/models/User";
import Role from "~/lib/db/models/Role";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name: string;
      email: string;
      isTelephoniste: boolean;
      isAdmin: boolean;
      isAgent: boolean;
      adminRoles?: Types.ObjectId[];
      agentRoles?: Types.ObjectId[];
      adminDirectPermissions?: string[];
      agentDirectPermissions?: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name: string;
    email: string;
    isTelephoniste: boolean;
    isAdmin: boolean;
    isAgent: boolean;
    adminRoles?: Types.ObjectId[];
    agentRoles?: Types.ObjectId[];
    adminDirectPermissions?: string[];
    agentDirectPermissions?: string[];
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();

        // Ensure Role model is registered
        await Role.init();

        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase(),
        });

        if (!user) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          isTelephoniste: user.isTelephoniste,
          isAdmin: user.isAdmin,
          isAgent: user.isAgent,
          adminRoles: user.adminRoles as any,
          agentRoles: user.agentRoles as any,
          adminDirectPermissions: user.adminDirectPermissions,
          agentDirectPermissions: user.agentDirectPermissions,
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.isTelephoniste = user.isTelephoniste;
        token.isAdmin = user.isAdmin;
        token.isAgent = user.isAgent;
        token.adminRoles = user.adminRoles;
        token.agentRoles = user.agentRoles;
        token.adminDirectPermissions = user.adminDirectPermissions;
        token.agentDirectPermissions = user.agentDirectPermissions;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
        isTelephoniste: token.isTelephoniste as boolean,
        isAdmin: token.isAdmin as boolean,
        isAgent: token.isAgent as boolean,
        adminRoles: token.adminRoles as Types.ObjectId[],
        agentRoles: token.agentRoles as Types.ObjectId[],
        adminDirectPermissions: token.adminDirectPermissions as string[],
        agentDirectPermissions: token.agentDirectPermissions as string[],
      },
    }),
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
