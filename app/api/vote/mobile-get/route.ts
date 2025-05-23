// /app/api/vote/mobile-get/route.ts
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
  const votes = db.collection('votes')

  const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'User or household not found' }, { status: 401 })
  }

  const openVotes = await votes
    .find({ householdId: user.householdId, status: 'open' })
    .toArray()

  return NextResponse.json({ votes: openVotes }, { status: 200 })
}
