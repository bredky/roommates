import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verify } from 'jsonwebtoken'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let decoded: any
  try {
    decoded = verify(token, process.env.NEXTAUTH_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const db = await connectDB()
  const users = db.collection('users')
  const activity = db.collection('activity')

  const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'User not found or no household' }, { status: 401 })
  }

  const activityLog = await activity
    .find({ householdId: user.householdId })
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray()

  return NextResponse.json({ activityLog }, { status: 200 })
}
