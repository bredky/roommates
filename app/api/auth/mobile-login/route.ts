import { connectDB } from '@/lib/mongodb'
import { compare, hash } from 'bcryptjs'
import { NextResponse } from 'next/server'
import { sign } from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

export async function POST(req: Request) {
  const { email, password, name } = await req.json()
  const db = await connectDB()
  const users = db.collection('users')

  const existingUser = await users.findOne({ email })

  // --- If user exists: login flow
  if (existingUser) {
    const isValid = await compare(password, existingUser.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = sign(
      { userId: existingUser._id, email: existingUser.email },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      token,
      user: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        householdId: existingUser.householdId,
        points: existingUser.points || 0,
      },
    })
  }

  // --- If user does not exist & name is provided: signup flow
  if (!existingUser && name) {
    const hashedPassword = await hash(password, 10)
    const result = await users.insertOne({
      name,
      email,
      password: hashedPassword,
      householdId: null,
      points: 0,
    })

    const token = sign(
      { userId: result.insertedId, email },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      token,
      user: {
        id: result.insertedId,
        name,
        email,
        householdId: null,
        points: 0,
      },
    })
  }

  // --- If no name provided, treat as failed login
  return NextResponse.json({ error: 'User not found' }, { status: 404 })
}
