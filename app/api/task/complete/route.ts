// ✅ /app/api/task/complete/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { taskId } = await req.json()
  const db = await connectDB()

  const users = db.collection('users')
  const tasks = db.collection('tasks')

  const user = await users.findOne({ email: session.user.email })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const task = await tasks.findOne({ _id: new ObjectId(taskId) })
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (task.assignedTo.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Not your task to complete' }, { status: 403 })
  }

  const now = new Date()
  const assignedAt = new Date(task.assignedAt)

  let durationDays = 0
  switch (task.cycle) {
    case 'weekly': durationDays = 7; break
    case 'biweekly': durationDays = 14; break
    case 'monthly': durationDays = 30; break
    case 'custom': durationDays = task.customDays || 1; break
    default: durationDays = 1
  }

  const deadline = new Date(assignedAt)
  deadline.setDate(deadline.getDate() + durationDays)

  const msPerDay = 24 * 60 * 60 * 1000
  const overdueDays = Math.floor((now.getTime() - deadline.getTime()) / msPerDay)
  const pointsToAdd = overdueDays > 0 ? overdueDays : 0

  if (pointsToAdd > 0) {
    await users.updateOne(
      { _id: user._id },
      { $inc: { points: pointsToAdd } }
    )
  }

  const historyEntry = {
    user: user._id,
    assignedAt: task.assignedAt,
    completedAt: now,
    deadline
  }

  await tasks.updateOne(
    { _id: task._id },
    {
      $set: {
        completed: true,
        completedAt: now
      },
      $push: {
        history: historyEntry
      }
    }
  )

  return NextResponse.json({ success: true })
}
