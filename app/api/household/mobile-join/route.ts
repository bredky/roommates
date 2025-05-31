import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verify } from 'jsonwebtoken'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const decoded: any = verify(token, process.env.NEXTAUTH_SECRET!)
    const db = await connectDB()
    const users = db.collection('users')
    const households = db.collection('households')

    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (user.householdId) {
      return NextResponse.json({ error: 'Already in household' }, { status: 400 })
    }

    const { joinCode } = await req.json()
    if (!joinCode) return NextResponse.json({ error: 'Join code required' }, { status: 400 })

    const household = await households.findOne({ joinCode })
    if (!household) return NextResponse.json({ error: 'Invalid join code' }, { status: 404 })

    await households.updateOne(
      { _id: household._id },
      { $addToSet: { members: user._id },
    $set: {updatedAt: new Date() }
    }
      
    )

    await users.updateOne(
      { _id: user._id },
      { $set: { householdId: household._id,
        updatedAt: new Date() 
       } }

    )

    return NextResponse.json({ message: 'Joined successfully', joinCode })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
