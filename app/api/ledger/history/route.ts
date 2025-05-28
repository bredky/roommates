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
    const ledger = db.collection('ledger')

    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user?.householdId) {
      return NextResponse.json({ error: 'Not in household' }, { status: 400 })
    }

    const logs = await ledger.find({
      householdId: user.householdId,
      fromUser: user._id,
    }).sort({ timestamp: -1 }).toArray()

    return NextResponse.json(logs)

  } catch (err) {
    console.error('Ledger history fetch error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
