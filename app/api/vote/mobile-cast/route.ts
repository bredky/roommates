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

  const memberList = await users.find({ householdId: vote.householdId }).toArray()
  const totalVoters = memberList.length // Includes reporter
  const majority = Math.floor(totalVoters / 2) + 1

  const yesVotes = updatedVotes.filter((v: any) => v.vote === 'yes').length
  const noVotes = updatedVotes.filter((v: any) => v.vote === 'no').length
  const totalVotes = updatedVoters.length

  let shouldResolve = false
  let majorityDecision = null

  if (yesVotes >= majority) {
    shouldResolve = true
    majorityDecision = 'yes'
  } else if (noVotes >= majority) {
    shouldResolve = true
    majorityDecision = 'no'
  } else if (totalVotes === totalVoters) {
    shouldResolve = true
    majorityDecision = 'yes' // Default to yes on tie
  }

  // Update the vote document
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

  // Handle result if resolved
  if (shouldResolve && majorityDecision === 'yes') {
    // 2. Create follow-up task
    const deadline = new Date()
    deadline.setHours(deadline.getHours() + vote.delayHours)

    const now = new Date()
    const pointDeadline = new Date(now.getTime() + vote.delayHours * 60 * 60 * 1000)
    const expiryDeadline = new Date(pointDeadline.getTime() + 24 * 60 * 60 * 1000)

    await tasks.insertOne({
      name: 'Clean reported mess',
      householdId: vote.householdId,
      assignedTo: vote.reportedUserId,
      assignedAt: now,
      completed: false,
      cycle: 'single',
      completedAt: null,
      history: [],
      overduePoints: 0,
      fromReport: true,
      pointDeadline,        // 🔥 custom field
      expiryDeadline,       // 🔥 custom field
    })


    // 3. Log activity
    const reportedUser = await users.findOne({ _id: vote.reportedUserId })

await activity.insertOne({
  type: 'reportResolved',
  taskName: 'Clean reported mess',
  points: 1,
  image: vote.imageUri || null, // assuming you stored image in the vote
  description: vote.description || '', // assuming description is stored too
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
