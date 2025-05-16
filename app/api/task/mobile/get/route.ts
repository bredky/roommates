import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verify } from 'jsonwebtoken'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  console.log('✅ /api/task/mobile/get route HIT')

  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    console.log('⛔ No Authorization header')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    console.log('⛔ Token missing after split')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let decoded: any
  try {
    decoded = verify(token, process.env.NEXTAUTH_SECRET!)
    console.log('🔓 Token decoded:', decoded)
  } catch (err) {
    console.error('❌ Token verification failed:', err)
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  }

  const db = await connectDB()
  const users = db.collection('users')
  const tasks = db.collection('tasks')
  const members = db.collection('users') // redundant, but fine

  const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
  console.log('👤 User found:', user)

  if (!user?.householdId) {
    console.log('⚠️ User has no household')
    return NextResponse.json({ tasks: [] })
  }

  const taskList = await tasks.find({ householdId: user.householdId }).toArray()
  console.log('📄 Raw tasks:', taskList)

  const populatedTasks = await Promise.all(
    taskList.map(async (task) => {
      if (task.assignedTo) {
        const assignee = await members.findOne({ _id: new ObjectId(task.assignedTo) })
        return {
          ...task,
          assignedTo: assignee ? { name: assignee.name, email: assignee.email } : null,
        }
      }
      return task
    })
  )

  console.log('✅ Populated tasks:', populatedTasks)

  return NextResponse.json({ tasks: populatedTasks })
}
