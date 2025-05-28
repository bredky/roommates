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
    const split = db.collection('split')

    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user?.householdId) {
      return NextResponse.json({ error: 'Not in household' }, { status: 400 })
    }

    // Fetch user names for mapping
    const allUsers = await users.find({ householdId: user.householdId }).toArray()
    const userMap = new Map(allUsers.map(u => [u._id.toString(), u.name]))

    const splits = await split.find({ householdId: user.householdId, fromUser: user._id }).toArray()

    const response = splits.map((s) => ({
      toUser: s.toUser.toString(),
      name: userMap.get(s.toUser.toString()) || 'Unknown',
      amount: s.amount,
    }))

    return NextResponse.json(response)

  } catch (err) {
    console.error('Split fetch error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
