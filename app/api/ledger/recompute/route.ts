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
    const ledger = db.collection('ledger')

    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user?.householdId) {
      return NextResponse.json({ error: 'User not in a household' }, { status: 400 })
    }

    const householdId = user.householdId

    // 1. Fetch all unpaid ledger entries
    const entries = await ledger.find({ householdId, paid: false }).toArray()

    // 2. Build a net balance map
    const balanceMap = new Map<string, number>()

    for (const entry of entries) {
      const from = entry.fromUser.toString()
      const to = entry.toUser.toString()

      balanceMap.set(from, (balanceMap.get(from) || 0) - entry.amount)
      balanceMap.set(to, (balanceMap.get(to) || 0) + entry.amount)
    }

    // 3. Separate into debtors and creditors
    const debtors: { id: string, amount: number }[] = []
    const creditors: { id: string, amount: number }[] = []

    for (const [userId, balance] of balanceMap.entries()) {
      if (balance < 0) {
        debtors.push({ id: userId, amount: -balance }) // owes money
      } else if (balance > 0) {
        creditors.push({ id: userId, amount: balance }) // is owed money
      }
    }

    // 4. Greedy minimize payments
    const minimized: { from: string, to: string, amount: number }[] = []

    while (debtors.length && creditors.length) {
      const debtor = debtors.pop()!
      const creditor = creditors.pop()!

      const amountToPay = Math.min(debtor.amount, creditor.amount)

      minimized.push({
        from: debtor.id,
        to: creditor.id,
        amount: amountToPay
      })

      // Update remaining balances
      if (debtor.amount > amountToPay) {
        debtors.push({ id: debtor.id, amount: debtor.amount - amountToPay })
      }
      if (creditor.amount > amountToPay) {
        creditors.push({ id: creditor.id, amount: creditor.amount - amountToPay })
      }
    }

    // 5. OPTIONAL: You can store these minimized entries in-memory in a cache or return them directly.
    // For now, we return the minimized payments for frontend use.
    const split = db.collection('split')

// Clear existing split data for the household
await split.deleteMany({ householdId })

// Insert new simplified list
await split.insertMany(
  minimized.map((entry) => ({
    householdId,
    fromUser: new ObjectId(entry.from),
    toUser: new ObjectId(entry.to),
    amount: entry.amount,
    timestamp: new Date(),
  }))

  
)
console.log('🔍 Unpaid ledger entries:', entries)


    return NextResponse.json({ simplified: minimized })

  } catch (err) {
    console.error('Recompute error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
