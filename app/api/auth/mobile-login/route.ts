import { connectDB } from '@/lib/mongodb'
import { compare, hash } from 'bcryptjs'
import { NextResponse } from 'next/server'
import { sign } from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

export async function POST(req: Request) {
  const { email, phoneNumber, password, name } = await req.json()
  const db = await connectDB()
  const users = db.collection('users')

  const query: any = email ? { email } : phoneNumber ? { phoneNumber } : null
  if (!query) {
    return NextResponse.json({ error: 'Must provide email or phone number' }, { status: 400 })
  }

  const existingUser = await users.findOne(query)

  // LOGIN
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
        phoneNumber: existingUser.phoneNumber || null,
        householdId: existingUser.householdId,
        points: existingUser.points || 0,
      },
    })
  }

  // SIGNUP
  if (!existingUser && name) {
    if (!email) {
      return NextResponse.json({ error: 'Email is required to sign up' }, { status: 400 })
    }

    if (phoneNumber) {
      const phoneExists = await users.findOne({ phoneNumber })
      if (phoneExists) {
        return NextResponse.json({ error: 'Phone number already in use' }, { status: 400 })
      }
    }

    const hashedPassword = await hash(password, 10)

    const result = await users.insertOne({
      name,
      email,
      phoneNumber: phoneNumber || null,
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
        phoneNumber: phoneNumber || null,
        householdId: null,
        points: 0,
      },
    })
  }

  return NextResponse.json({ error: 'User not found' }, { status: 404 })
}
