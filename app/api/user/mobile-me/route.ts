import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 })
  }

  try {
    const decoded: any = verify(token, process.env.NEXTAUTH_SECRET!)
    const db = await connectDB()
    const users = db.collection('users')
    const households = db.collection('households')

    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let joinCode = null
    if (user.householdId) {
      const household = await households.findOne({ _id: new ObjectId(user.householdId) })
      joinCode = household?.joinCode || null
    }

    return NextResponse.json({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      householdId: user.householdId || null,
      points: user.points || 0,
      joinCode,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
