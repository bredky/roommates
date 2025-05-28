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
    const users = db.collection('users')
    const households = db.collection('households')
    const ledger = db.collection('ledger')

    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user?.householdId) {
      return NextResponse.json({ error: 'User not in a household' }, { status: 400 })
    }

    const household = await households.findOne({ _id: user.householdId })
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 })

    const now = new Date()

    if (!household.nextReset || now >= new Date(household.nextReset)) {
      const members = await users.find({ householdId: user.householdId }).toArray()

      for (const member of members) {
        const currentPoints = member.points || 0

        // Store last week’s points
        await users.updateOne(
          { _id: member._id },
          { $set: { lastWeekPoints: currentPoints, points: 0 } }
        )

        if (currentPoints >= 3) {
          const penaltyAmount = currentPoints >= 5 ? 5 : 3
          const reason = currentPoints >= 5 ? '5-point penalty' : '3-point penalty'

          const roommates = members.filter((m) => m._id.toString() !== member._id.toString())

          const ledgerEntries = roommates.map((roommate) => ({
            householdId: user.householdId,
            fromUser: member._id,
            toUser: roommate._id,
            amount: penaltyAmount,
            reason,
            weekOf: now,
            timestamp: now,
            paid: false,
          }))

          if (ledgerEntries.length > 0) {
            await ledger.insertMany(ledgerEntries)
          }
        }
      }

      // Update next reset
      const nextReset = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      await households.updateOne(
        { _id: user.householdId },
        { $set: { nextReset } }
      )

      // Trigger recompute payments
      await fetch(`${process.env.BASE_URL}/api/ledger/recompute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      return NextResponse.json({ message: 'Weekly reset and ledger penalties applied.' })
    }

    return NextResponse.json({ message: 'No reset needed.' })

  } catch (err) {
    console.error('Reset error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
