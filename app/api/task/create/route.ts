import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { connect } from 'http2'

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

  const household = await households.findOne({ _id: user.householdId })
  const memberIds = household?.members || []

  // Get all active tasks in this household
  const allTasks = await tasks.find({
    householdId: user.householdId,
  }).toArray()

  // Map userId -> weighted task load
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
  const now = new Date();
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
  
console.log('Members:', memberIds)
console.log('Workload Map:', [...workloadMap.entries()])


  // Pick user with lowest load
  const sortedByLoad = [...workloadMap.entries()].sort((a, b) => a[1] - b[1])
  if (sortedByLoad.length === 0) {
    return NextResponse.json({ error: 'No eligible users found to assign this task' }, { status: 400 })
  }
  
  const selectedUserId = sortedByLoad[0][0]

  // Create the task and assign
  const taskDoc = {
    name,
    householdId: user.householdId,
    completed: false,
    assignedTo: new ObjectId(selectedUserId),
    assignedAt: new Date(),
    cycle,
    customDays: cycle === 'custom' ? customDays : null,
    completedAt: null,
    history: []
  }

  const result = await tasks.insertOne(taskDoc)

  await households.updateOne(
    { _id: user.householdId },
    { $push: { tasks: result.insertedId } }
  )

  // Fetch assignee’s name/email to return for frontend display
  const assignee = await users.findOne({ _id: new ObjectId(selectedUserId) })

  return NextResponse.json({
    task: {
      _id: result.insertedId,
      ...taskDoc,
      assignedTo: assignee ? { name: assignee.name, email: assignee.email } : { name: null, email: null }
    }
  })
}
