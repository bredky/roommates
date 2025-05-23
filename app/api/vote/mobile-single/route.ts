// /app/api/vote/mobile-single/route.ts
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verify } from 'jsonwebtoken'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let decoded: any
  try {
    decoded = verify(token, process.env.NEXTAUTH_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const voteId = searchParams.get('voteId')
  if (!voteId) return NextResponse.json({ error: 'Missing voteId' }, { status: 400 })

  const db = await connectDB()
  const vote = await db.collection('votes').findOne({ _id: new ObjectId(voteId) })
  if (!vote) return NextResponse.json({ error: 'Vote not found' }, { status: 404 })

  return NextResponse.json({ vote }, { status: 200 })
}
