// app/api/user/me/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await connectDB()
  const users = db.collection('users')
  const households = db.collection('households')

  const user = await users.findOne({ email: session.user.email })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let joinCode = null

  if (user.householdId) {
    const household = await households.findOne({ _id: new ObjectId(user.householdId) })
    joinCode = household?.joinCode || null
  }

  return NextResponse.json({
    name: user.name,
    email: user.email,
    householdId: user.householdId || null,
    userpoints: user.points || 0,
    joinCode,
  })
}
