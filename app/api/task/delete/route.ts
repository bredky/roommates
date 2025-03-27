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

  const { taskId } = await req.json()
  const db = await connectDB()

  const users = db.collection('users')
  const households = db.collection('households')
  const tasks = db.collection('tasks')

  const user = await users.findOne({ email: session.user.email })
  if (!user?.householdId) {
    return NextResponse.json({ error: 'Not in a household' }, { status: 400 })
  }

  await tasks.deleteOne({ _id: new ObjectId(taskId) })

  await households.updateOne(
    { _id: user.householdId },
    { $pull: { tasks: new ObjectId(taskId) } }
  )

  return NextResponse.json({ message: 'Task deleted' })
}
