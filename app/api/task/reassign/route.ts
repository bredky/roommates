import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST() {
  const db = await connectDB()
  const tasks = db.collection('tasks')
  const users = db.collection('users')

  const allTasks = await tasks.find({}).toArray()
  const now = new Date()
  const msPerDay = 1000 * 60 * 60 * 24

  const getDeadline = (task: any) => {
    const assignedAt = new Date(task.assignedAt)
    const days =
      task.cycle === 'weekly' ? 7 :
      task.cycle === 'biweekly' ? 14 :
      task.cycle === 'monthly' ? 30 :
      task.cycle === 'custom' ? task.customDays || 1 :
      365 * 10
    const deadline = new Date(assignedAt)
    deadline.setDate(deadline.getDate() + days)
    return deadline
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
    const isOverdue = !isCompleted && now > deadline

    // Case 1: Completed + deadline passed → reassign (skip previous assignee)
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

    // Case 2: Overdue + incomplete → give points
    if (isOverdue) {
      const overdueDays = Math.floor((now.getTime() - deadline.getTime()) / msPerDay)
      if (overdueDays > 0) {
        await users.updateOne(
          { _id: new ObjectId(assignedUserId) },
          { $inc: { points: overdueDays } }
        )
      }

      const user = await users.findOne({ _id: new ObjectId(assignedUserId) })

      // Case 3: If user has 3+ points → reassign (include previous assignee)
      if (user && user.points >= 3) {
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
