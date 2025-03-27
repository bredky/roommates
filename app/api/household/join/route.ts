// app/api/household/join/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { connect } from 'http2'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { joinCode } = await req.json()

  if (!joinCode) {
    return NextResponse.json({ error: 'Join code is required' }, { status: 400 })
  }

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

  const household = await households.findOne({ joinCode })
  if (!household) {
    return NextResponse.json({ error: 'Invalid join code' }, { status: 404 })
  }

  await households.updateOne(
    { _id: household._id },
    { $addToSet: { members: user._id } }
  )

  await users.updateOne(
    { _id: user._id },
    { $set: { householdId: household._id } }
  )

  return NextResponse.json({ message: 'Joined successfully', joinCode })
}
