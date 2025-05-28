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

    // Get all members for name mapping
    const householdUsers = await users.find({ householdId: user.householdId }).toArray()
    const userMap = Object.fromEntries(householdUsers.map(u => [u._id.toString(), u.name]))

    // Fetch all ledger entries involving the user
    const logs = await ledger.find({
      householdId: user.householdId,
      $or: [
        { fromUser: user._id },
        { toUser: user._id }
      ]
    }).sort({ timestamp: -1 }).toArray()

    // Attach names
    const enrichedLogs = logs.map(log => ({
      ...log,
      fromName: userMap[log.fromUser?.toString()] || 'Someone',
      toName: userMap[log.toUser?.toString()] || 'Someone'
    }))

    return NextResponse.json(enrichedLogs)

  } catch (err) {
    console.error('Ledger history fetch error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
