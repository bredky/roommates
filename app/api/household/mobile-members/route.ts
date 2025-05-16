import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

export async function GET(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const decoded: any = verify(token, process.env.NEXTAUTH_SECRET!)
    const db = await connectDB()
    const users = db.collection('users')
    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })

    if (!user?.householdId) {
      return NextResponse.json({ error: 'Not in household' }, { status: 400 })
    }

    const members = await users.find({ householdId: user.householdId }).toArray()
    const formatted = members.map((m) => ({
      name: m.name,
      email: m.email,
      points: m.points || 0,
    }))

    return NextResponse.json({ members: formatted })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
