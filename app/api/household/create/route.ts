// app/api/household/create/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import crypto from 'crypto'
import { connect } from 'http2'

// app/api/household/create/route.ts

export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await connectDB()
    const users = db.collection('users')
    const households = db.collection('households')

    const user = await users.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.householdId) {
      return NextResponse.json({ error: 'User already in a household' }, { status: 400 })
    }

    const joinCode = crypto.randomBytes(3).toString('hex') // 6-char code

    const household = await households.insertOne({
      joinCode,
      members: [user._id],
      createdAt: new Date(),
    })

    await users.updateOne(
      { _id: user._id },
      { $set: { householdId: household.insertedId } }
    )

    return NextResponse.json({ joinCode })
  } catch (err: any) {
    console.error('Household creation failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
