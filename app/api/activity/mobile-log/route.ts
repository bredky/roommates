import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verify } from 'jsonwebtoken'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let decoded: any
  try {
    decoded = verify(token, process.env.NEXTAUTH_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const db = await connectDB()
  const users = db.collection('users')
  const activity = db.collection('activity')
  const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
  if (!user || !user.householdId) {
    return NextResponse.json({ error: 'User not found or no household' }, { status: 401 })
  }

  const body = await req.json()

  const logEntry = {
    type: body.type,
    taskName: body.taskName,
    deletedBy: body.deletedBy,
    points: body.points,
    imageUri: body.imageUri || null,        // ✅ add this
    description: body.description || '',
    timestamp: new Date(),
    user: {
      name: user.name,
      email: user.email,
    },
    householdId: user.householdId,
  }

  await activity.insertOne(logEntry)

  return NextResponse.json({ message: 'Activity logged' }, { status: 200 })
}
