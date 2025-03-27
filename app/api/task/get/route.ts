import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await connectDB()
  const users = db.collection('users')
  const tasks = db.collection('tasks')
  const members = db.collection('users')

  const user = await users.findOne({ email: session.user.email })
  if (!user?.householdId) {
    return NextResponse.json({ tasks: [] })
  }

  const taskList = await tasks.find({ householdId: user.householdId }).toArray()

  // Manually populate assignedTo with user name/email
  const populatedTasks = await Promise.all(
    taskList.map(async (task) => {
      if (task.assignedTo) {
        const assignee = await members.findOne({ _id: new ObjectId(task.assignedTo) })
        return { ...task, assignedTo: { name: assignee?.name, email: assignee?.email } }
      }
      return task
    })
  )

  return NextResponse.json({ tasks: populatedTasks })
}
