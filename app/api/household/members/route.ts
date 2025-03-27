// app/api/household/members/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await connectDB()
  const users = db.collection('users')
  const households = db.collection('households')

  const user = await users.findOne({ email: session.user.email })
  if (!user?.householdId) {
    return NextResponse.json({ error: 'User is not in a household' }, { status: 400 })
  }

  const household = await households.findOne({ _id: new ObjectId(user.householdId) })
  if (!household) {
    return NextResponse.json({ error: 'Household not found' }, { status: 404 })
  }

  const memberIds = household.members || []

  const members = await users.find({ _id: { $in: memberIds } }).project({ name: 1, email: 1 }).toArray()

  return NextResponse.json({ members })
}
