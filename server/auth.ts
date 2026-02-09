import { betterAuth } from "better-auth"

// TODO: Configure BetterAuth with your database adapter
// import { prismaAdapter } from "better-auth/adapters/prisma"
// For now, using a basic setup - you'll need to add your database connection
export const auth = betterAuth({
  // database: prismaAdapter(prisma), // Uncomment when Prisma is set up
  emailAndPassword: {
    enabled: true,
  },
})

export type Session = typeof auth.$Infer.Session
