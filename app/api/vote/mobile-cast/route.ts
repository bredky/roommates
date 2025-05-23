// /app/api/vote/mobile-cast/route.ts
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
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const db = await connectDB()
  const body = await req.json()
  const { voteId, decision } = body

  const users = db.collection('users')
  const votes = db.collection('votes')
  const tasks = db.collection('tasks')
  const activity = db.collection('activity')

  const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
  const vote = await votes.findOne({ _id: new ObjectId(voteId) })

  if (!user || !vote || vote.status !== 'open') {
    return NextResponse.json({ error: 'Invalid user or vote' }, { status: 400 })
  }

  // Prevent double voting
  if (vote.voters?.includes(user._id.toString())) {
    return NextResponse.json({ error: 'Already voted' }, { status: 400 })
  }

  const updatedVotes = [...(vote.votes || []), { userId: user._id, vote: decision }]
  const updatedVoters = [...(vote.voters || []), user._id.toString()]

  // Fetch all household members to calculate majority
  const memberList = await users.find({ householdId: vote.householdId }).toArray()
  const numVotersRequired = memberList.length - 1 // excluding reporter

  // Check if vote should be resolved
  let shouldResolve = updatedVoters.length >= numVotersRequired
  let majorityDecision = null

  if (shouldResolve) {
    const yesVotes = updatedVotes.filter((v: any) => v.vote === 'yes').length
    const noVotes = updatedVotes.filter((v: any) => v.vote === 'no').length
    majorityDecision = yesVotes >= noVotes ? 'yes' : 'no'
  }

  // Update the vote doc
  await votes.updateOne(
    { _id: vote._id },
    {
      $set: {
        votes: updatedVotes,
        voters: updatedVoters,
        status: shouldResolve ? 'complete' : 'open',
      },
    }
  )

  // Handle result
  if (shouldResolve && majorityDecision === 'yes') {
    // 1. Assign point to reported user
    await users.updateOne(
      { _id: vote.reportedUserId },
      { $inc: { points: 1 } }
    )

    // 2. Create task
    const deadline = new Date()
    deadline.setHours(deadline.getHours() + vote.delayHours)

    await tasks.insertOne({
      name: 'Clean reported mess',
      householdId: vote.householdId,
      assignedTo: vote.reportedUserId,
      assignedAt: new Date(),
      completed: false,
      cycle: 'single',
      completedAt: null,
    })

    // 3. Log to activity
    const reporter = await users.findOne({ _id: vote.reporterId })
    const reportedUser = await users.findOne({ _id: vote.reportedUserId })

    await activity.insertOne({
      type: 'pointAssigned',
      taskName: 'Clean reported mess',
      points: 1,
      deletedBy: null,
      timestamp: new Date(),
      user: {
        name: reportedUser?.name || 'Unknown',
        email: reportedUser?.email || 'Unknown',
      },
      householdId: vote.householdId,
    })
  }

  return NextResponse.json({ message: 'Vote recorded' }, { status: 200 })
}
