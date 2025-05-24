import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verify } from 'jsonwebtoken'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  verify(token, process.env.NEXTAUTH_SECRET!) // just to validate

  const db = await connectDB()
  const tasks = db.collection('tasks')
  const users = db.collection('users')

  const allTasks = await tasks.find({}).toArray()
  const now = new Date()
  const msPerDay = 86400000

  const getDeadline = (task: any) => {
    const assignedAt = new Date(task.assignedAt)
    const days =
      task.cycle === 'weekly' ? 7 :
      task.cycle === 'biweekly' ? 14 :
      task.cycle === 'monthly' ? 30 :
      task.cycle === 'custom' ? task.customDays || 1 :
      365 * 10
    return new Date(assignedAt.getTime() + days * msPerDay)
  }

  const getOverdueDays = (task: any) => {
    if (task.completed) return 0
    const deadline = getDeadline(task)
    const msLate = now.getTime() - deadline.getTime()
    return msLate > 0 ? Math.floor(msLate / msPerDay) + 1 : 0
  }

  const sortedTasks = [...allTasks].sort((a, b) =>
    getDeadline(a).getTime() - getDeadline(b).getTime()
  )

  let reassignmentMade = false
  const results: any[] = []

  for (const task of sortedTasks) {
    const deadline = getDeadline(task)
    const assignedUserId = task.assignedTo?.toString()
    const isCompleted = task.completed
    const overdueDays = getOverdueDays(task)

    if (isCompleted && now > deadline) {
      const householdUsers = await users.find({ householdId: task.householdId }).toArray()
      const workloadMap = new Map<string, number>()

      for (const u of householdUsers) {
        if (u._id.toString() === assignedUserId) continue
        const userTasks = await tasks.find({
          assignedTo: u._id,
          completed: false
        }).toArray()
        workloadMap.set(u._id.toString(), userTasks.length)
      }

      const sorted = [...workloadMap.entries()].sort((a, b) => a[1] - b[1])
      if (sorted.length === 0) continue
      const newAssigneeId = sorted[0][0]

      await tasks.updateOne(
        { _id: task._id },
        {
          $set: {
            assignedTo: new ObjectId(newAssigneeId),
            assignedAt: now,
            completed: false,
            completedAt: null
          },
          $push: {
            history: {
              user: new ObjectId(assignedUserId),
              assignedAt: task.assignedAt,
              completedAt: task.completedAt,
              deadline
            }
          }
        }
      )

      reassignmentMade = true
      results.push({
        task: task.name,
        reason: 'completed + deadline passed',
        from: assignedUserId,
        to: newAssigneeId
      })
      break
    }

    if (overdueDays > 0 && !isCompleted && assignedUserId) {
      const user = await users.findOne({ _id: new ObjectId(assignedUserId) })
      if (!user) continue

      await users.updateOne({ _id: user._id }, { $inc: { points: overdueDays } })
      await tasks.updateOne({ _id: task._id }, { $inc: { overduePoints: overdueDays } })


      const updatedTask = await tasks.findOne({ _id: task._id })
      if (updatedTask && updatedTask.points >= 3) {
        const householdUsers = await users.find({ householdId: task.householdId }).toArray()
        const workloadMap = new Map<string, number>()

        for (const u of householdUsers) {
          const userTasks = await tasks.find({
            assignedTo: u._id,
            completed: false
          }).toArray()
          workloadMap.set(u._id.toString(), userTasks.length)
        }

        const sorted = [...workloadMap.entries()].sort((a, b) => a[1] - b[1])
        if (sorted.length === 0) continue
        const newAssigneeId = sorted[0][0]

        await tasks.updateOne(
          { _id: task._id },
          {
            $set: {
              assignedTo: new ObjectId(newAssigneeId),
              assignedAt: now,
              completed: false,
              completedAt: null
            },
            $push: {
              history: {
                user: new ObjectId(assignedUserId),
                assignedAt: task.assignedAt,
                completedAt: null,
                deadline
              }
            }
          }
        )
        await tasks.updateOne({ _id: task._id }, { $set: { overduePoints: 0 } })

        reassignmentMade = true
        results.push({
          task: task.name,
          reason: 'user reached 3+ points',
          from: assignedUserId,
          to: newAssigneeId
        })
        break
      }
    }
  }

  return NextResponse.json({
    message: reassignmentMade ? 'Reassignment occurred' : 'No tasks reassigned',
    summary: results
  })
}
