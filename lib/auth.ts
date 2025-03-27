// lib/auth.ts
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectDB } from './mongodb'
import { compare } from 'bcryptjs'
import { AuthOptions } from 'next-auth'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const db = await connectDB()
        const user = await db.collection('users').findOne({ email: credentials!.email })

        if (user && await compare(credentials!.password, user.password)) {
          return { id: user._id.toString(), email: user.email, name: user.name }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id
      return session
    },
  },
}
