import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, cycle, customDays } = await req.json()
  const db = await connectDB()

  const users = db.collection('users')
  const households = db.collection('households')
  const tasks = db.collection('tasks')

  const user = await users.findOne({ email: session.user.email })
  if (!user?.householdId) {
    return NextResponse.json({ error: 'User not in a household' }, { status: 400 })
  }

  const taskDoc = {
    name,
    householdId: user.householdId,
    assignedTo: null, // We'll handle assignment later
    customDays: cycle === 'custom' ? customDays : null,
    completed: false,

  }

  const result = await tasks.insertOne(taskDoc)

  await households.updateOne(
    { _id: user.householdId },
    { $push: { tasks: result.insertedId } }
  )

  return NextResponse.json({ task: { _id: result.insertedId, ...taskDoc } })
}
