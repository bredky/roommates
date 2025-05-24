import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const decoded: any = verify(token, process.env.NEXTAUTH_SECRET!)
    const { name, cycle, customDays } = await req.json()

    const db = await connectDB()
    const users = db.collection('users')
    const households = db.collection('households')
    const tasks = db.collection('tasks')

    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user?.householdId) {
      return NextResponse.json({ error: 'User not in a household' }, { status: 400 })
    }

    const household = await households.findOne({ _id: user.householdId })
    const memberIds = household?.members || []

    const allTasks = await tasks.find({ householdId: user.householdId }).toArray()

    const getWeight = (cycle: string, customDays: number | null) => {
      switch (cycle) {
        case 'weekly': return 3
        case 'biweekly': return 2
        case 'monthly': return 1
        case 'custom': return customDays || 1
        case 'indefinite': return 1
        default: return 1
      }
    }

    const workloadMap = new Map()
    const memberIdStrings = memberIds.map((id: ObjectId) => id.toString())
    const now = new Date()

    for (const uid of memberIdStrings) {
      const relevantTasks = allTasks.filter(t => {
        const assignedToId = t.assignedTo?.toString()
        const isAssigned = assignedToId === uid
        const isIncomplete = !t.completed
        const isEarlyComplete = t.completed && (() => {
          const assignedAt = new Date(t.assignedAt)
          const deadline = new Date(assignedAt)
          deadline.setDate(deadline.getDate() + getWeight(t.cycle, t.customDays))
          return now < deadline
        })()
        return isAssigned && (isIncomplete || isEarlyComplete)
      })

      workloadMap.set(uid, relevantTasks.length)
    }

    const sortedByLoad = [...workloadMap.entries()].sort((a, b) => a[1] - b[1])
    if (sortedByLoad.length === 0) {
      return NextResponse.json({ error: 'No eligible users found' }, { status: 400 })
    }

    const selectedUserId = sortedByLoad[0][0]

    const taskDoc = {
      name,
      householdId: user.householdId,
      completed: false,
      assignedTo: new ObjectId(selectedUserId),
      assignedAt: new Date(),
      cycle,
      customDays: cycle === 'custom' ? customDays : null,
      completedAt: null,
      history: [],
      overduePoints: 0,
      fromReport: false
    }

    const result = await tasks.insertOne(taskDoc)

    await households.updateOne(
      { _id: user.householdId },
      { $push: { tasks: result.insertedId } }
    )

    const assignee = await users.findOne({ _id: new ObjectId(selectedUserId) })

    return NextResponse.json({
      task: {
        _id: result.insertedId,
        ...taskDoc,
        assignedTo: assignee ? { name: assignee.name, email: assignee.email } : { name: null, email: null }
      }
    })

  } catch (err) {
    console.error('Task creation error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
