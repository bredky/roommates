import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verify } from 'jsonwebtoken'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { taskId } = await req.json()
  const decoded: any = verify(token, process.env.NEXTAUTH_SECRET!)
  const db = await connectDB()
  const users = db.collection('users')
  const households = db.collection('households')
  const tasks = db.collection('tasks')

  const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
  if (!user?.householdId) {
    return NextResponse.json({ error: 'Not in a household' }, { status: 400 })
  }

  await tasks.deleteOne({ _id: new ObjectId(taskId) })
  await households.updateOne(
    { _id: user.householdId },
    { $pull: { tasks: new ObjectId(taskId) },
      $set: {updatedAt: new Date()}
  }
  )

  return NextResponse.json({ message: 'Task deleted' })
}
