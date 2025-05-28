import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import crypto from 'crypto'
import { verify } from 'jsonwebtoken'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const decoded: any = verify(token, process.env.NEXTAUTH_SECRET!)
    const db = await connectDB()
    const users = db.collection('users')
    const households = db.collection('households')

    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (user.householdId) {
      return NextResponse.json({ error: 'Already in household' }, { status: 400 })
    }

    const joinCode = crypto.randomBytes(3).toString('hex')
    const household = await households.insertOne({
      joinCode,
      members: [user._id],
      createdAt: new Date(),
      nextReset: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })

    await users.updateOne(
      { _id: user._id },
      { $set: { householdId: household.insertedId } }
      
    )

    return NextResponse.json({ joinCode })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
