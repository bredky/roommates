import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verify } from 'jsonwebtoken'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  verify(token, process.env.NEXTAUTH_SECRET!)

  const db = await connectDB()
  const tasks = db.collection('tasks')
  const users = db.collection('users')
  const activity = db.collection('activity')

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

  const getOverduePointCount = (task: any) => {
    const deadline = getDeadline(task)
    const msLate = now.getTime() - deadline.getTime()
    if (msLate < 0) return 0
    return 1 + Math.floor(msLate / msPerDay) // immediate + one per 24h
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

    // ✅ Delete overdue report-based task
    if (task.fromReport && !isCompleted && now > deadline) {
      if (assignedUserId) {
        await users.updateOne(
          { _id: new ObjectId(assignedUserId) },
          { $inc: { points: 1 } }
        )

        const user = await users.findOne({ _id: new ObjectId(assignedUserId) })
        await activity.insertOne({
          type: 'reportTaskMissed',
          taskName: task.name,
          points: 1,
          timestamp: now,
          user: {
            name: user?.name || 'Unknown',
            email: user?.email || 'Unknown',
          },
          householdId: task.householdId,
        })
      }

      await tasks.deleteOne({ _id: task._id })
      continue
    }

    // ✅ CASE 1: Completed + deadline passed → reassign
    if (isCompleted && now > deadline) {
      const householdUsers = await users.find({ householdId: task.householdId }).toArray()
      const workloadMap = new Map<string, number>()

      for (const u of householdUsers) {
        if (u._id.toString() === assignedUserId) continue
        const userTasks = await tasks.find({
          assignedTo: u._id,
          completed: false,
          fromReport: { $ne: true },
        }).toArray()
        workloadMap.set(u._id.toString(), userTasks.length)
      }

      const sorted = [...workloadMap.entries()].sort((a, b) => a[1] - b[1])
      if (sorted.length === 0) continue
      const newAssigneeId = sorted[0][0]
      const newUser = await users.findOne({ _id: new ObjectId(newAssigneeId) })

      await tasks.updateOne(
        { _id: task._id },
        {
          $set: {
            assignedTo: new ObjectId(newAssigneeId),
            assignedAt: now,
            completed: false,
            completedAt: null,
            overduePoints: 0,
          },
          $push: {
            history: {
              user: new ObjectId(assignedUserId),
              assignedAt: task.assignedAt,
              completedAt: task.completedAt,
              deadline,
            },
          },
        }
      )

      await activity.insertOne({
        type: 'taskReassigned',
        taskName: task.name,
        user: {
          name: newUser?.name || 'Unknown',
          email: newUser?.email || 'Unknown',
        },
        timestamp: now,
        householdId: task.householdId,
      })

      reassignmentMade = true
      results.push({
        task: task.name,
        reason: 'completed + deadline passed',
        from: assignedUserId,
        to: newAssigneeId,
      })
      break
    }

    // ✅ CASE 2: Overdue and incomplete → add points
    if (!isCompleted && now > deadline && assignedUserId) {
      const user = await users.findOne({ _id: new ObjectId(assignedUserId) })
      if (!user) continue

      const overduePointsGiven = task.overduePoints || 0
      const totalShouldHave = getOverduePointCount(task)
      const newPointsToGive = totalShouldHave - overduePointsGiven

      if (newPointsToGive > 0) {
        await users.updateOne({ _id: user._id }, { $inc: { points: newPointsToGive } })
        await tasks.updateOne({ _id: task._id }, { $inc: { overduePoints: newPointsToGive } })

        await activity.insertOne({
          type: 'pointGiven',
          taskName: task.name,
          user: {
            name: user.name,
            email: user.email,
          },
          points: newPointsToGive,
          timestamp: now,
          householdId: task.householdId,
        })
      }

      if ((overduePointsGiven + newPointsToGive) >= 3) {
        const householdUsers = await users.find({ householdId: task.householdId }).toArray()
        const workloadMap = new Map<string, number>()

        for (const u of householdUsers) {
          const userTasks = await tasks.find({
            assignedTo: u._id,
            completed: false,
            fromReport: { $ne: true },
          }).toArray()
          workloadMap.set(u._id.toString(), userTasks.length)
        }

        const sorted = [...workloadMap.entries()].sort((a, b) => a[1] - b[1])
        if (sorted.length === 0) continue
        const newAssigneeId = sorted[0][0]
        const newUser = await users.findOne({ _id: new ObjectId(newAssigneeId) })

        await tasks.updateOne(
          { _id: task._id },
          {
            $set: {
              assignedTo: new ObjectId(newAssigneeId),
              assignedAt: now,
              completed: false,
              completedAt: null,
              overduePoints: 0,
            },
            $push: {
              history: {
                user: new ObjectId(assignedUserId),
                assignedAt: task.assignedAt,
                completedAt: null,
                deadline,
              },
            },
          }
        )

        await activity.insertOne({
          type: 'taskReassigned',
          taskName: task.name,
          user: {
            name: newUser?.name || 'Unknown',
            email: newUser?.email || 'Unknown',
          },
          timestamp: now,
          householdId: task.householdId,
        })

        reassignmentMade = true
        results.push({
          task: task.name,
          reason: 'task reached 3+ overdue points',
          from: assignedUserId,
          to: newAssigneeId,
        })
        break
      }
    }
  }

  return NextResponse.json({
    message: reassignmentMade ? 'Reassignment occurred' : 'No tasks reassigned',
    summary: results,
  })
}