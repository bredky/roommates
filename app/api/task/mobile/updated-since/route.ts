import { connectDB } from '@/lib/mongodb'
import { verify } from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded: any = verify(token, process.env.NEXTAUTH_SECRET!)
  const db = await connectDB()
  const tasks = db.collection('tasks')

  const url = new URL(req.url)
  const timestamp = parseInt(url.searchParams.get('timestamp') || '0')

  const hasNew = await tasks.findOne({
    householdId: new ObjectId(decoded.householdId),
    updatedAt: { $gt: new Date(timestamp) }
  })

  return NextResponse.json({ hasNew: !!hasNew })
}
