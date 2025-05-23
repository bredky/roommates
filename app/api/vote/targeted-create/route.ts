import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verify } from 'jsonwebtoken'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let decoded: any
  try {
    decoded = verify(token, process.env.NEXTAUTH_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const db = await connectDB()
  const users = db.collection('users')
  const votes = db.collection('votes')

  const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
  if (!user || !user.householdId) {
    return NextResponse.json(
      { error: 'User not found or no household' },
      { status: 401 }
    )
  }

  const body = await req.json()

  const voteEntry = {
    type: 'targeted',
    status: 'open',
    householdId: user.householdId,
    reporterId: user._id,
    reportedUserId: new ObjectId(body.reportedUserId),
    imageUri: body.imageUri,
    description: body.description || '',
    delayHours: body.delayHours || 0,
    votes: [], // { userId: ObjectId, vote: 'yes' | 'no' }
    voters: [], // userIds who voted
    createdAt: new Date(),
  }

  await votes.insertOne(voteEntry)

  return NextResponse.json({ message: 'Targeted vote created' }, { status: 200 })
}
