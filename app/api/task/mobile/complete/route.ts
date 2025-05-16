import { connectDB } from '@/lib/mongodb'
import { verify } from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { taskId } = await req.json()
  const decoded: any = verify(token, process.env.NEXTAUTH_SECRET!)
  const db = await connectDB()
  const users = db.collection('users')
  const tasks = db.collection('tasks')

  const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
  const task = await tasks.findOne({ _id: new ObjectId(taskId) })
  if (!user || !task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (task.assignedTo.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Not your task' }, { status: 403 })
  }

  const now = new Date()
  const assignedAt = new Date(task.assignedAt)
  const days = task.cycle === 'weekly' ? 7 :
               task.cycle === 'biweekly' ? 14 :
               task.cycle === 'monthly' ? 30 :
               task.cycle === 'custom' ? task.customDays || 1 : 1

  const deadline = new Date(assignedAt.getTime() + days * 86400000)
  const overdue = Math.floor((now.getTime() - deadline.getTime()) / 86400000)

  if (overdue > 0) {
    await users.updateOne({ _id: user._id }, { $inc: { points: overdue } })
  }

  await tasks.updateOne(
    { _id: task._id },
    {
      $set: { completed: true, completedAt: now },
      $push: {
        history: {
          user: user._id,
          assignedAt: task.assignedAt,
          completedAt: now,
          deadline
        }
      }
    }
  )

  return NextResponse.json({ success: true })
}
