import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const decoded: any = verify(token, process.env.NEXTAUTH_SECRET!)
    const db = await connectDB()
    const { toUserId } = await req.json()

    const users = db.collection('users')
    const ledger = db.collection('ledger')
    const split = db.collection('split')

    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user?.householdId) {
      return NextResponse.json({ error: 'User not in a household' }, { status: 400 })
    }

    const householdId = user.householdId
    const fromId = user._id
    const toId = new ObjectId(toUserId)

    // 1. Fetch ALL unpaid ledger entries between both users
    const aToB = await ledger.find({
      householdId,
      fromUser: fromId,
      toUser: toId,
      paid: false
    }).toArray()

    const bToA = await ledger.find({
      householdId,
      fromUser: toId,
      toUser: fromId,
      paid: false
    }).toArray()

    const totalAtoB = aToB.reduce((sum, e) => sum + e.amount, 0)
    const totalBtoA = bToA.reduce((sum, e) => sum + e.amount, 0)

    const net = totalAtoB - totalBtoA

    // 2. Mark all entries between both users as paid
    await ledger.updateMany(
      { householdId, fromUser: fromId, toUser: toId, paid: false },
      { $set: { paid: true } }
    )

    await ledger.updateMany(
      { householdId, fromUser: toId, toUser: fromId, paid: false },
      { $set: { paid: true } }
    )

    // 3. Insert a new ledger entry for the net payment
    if (net !== 0) {
      await ledger.insertOne({
        householdId,
        fromUser: net > 0 ? fromId : toId,
        toUser: net > 0 ? toId : fromId,
        amount: Math.abs(net),
        reason: 'Net payment settlement',
        paid: true,
        timestamp: new Date()
      })
    }

    // 4. Delete all split entries between both users
    await split.deleteMany({
      householdId,
      $or: [
        { fromUser: fromId, toUser: toId },
        { fromUser: toId, toUser: fromId }
      ]
    })

    // 5. Recompute all balances
    await fetch(`${process.env.API_BASE}/api/ledger/recompute`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return NextResponse.json({ message: 'Mutual payments confirmed and cleared.' })

  } catch (err) {
    console.error('Ledger confirm error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
