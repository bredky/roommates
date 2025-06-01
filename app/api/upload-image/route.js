import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

export async function POST(req) {
  try {
    console.log('📩 Incoming image upload request...')

    const formData = await req.formData()
    const file = formData.get('file')
    console.log('📦 File received:', file?.name || 'No file')

    if (!file) {
      console.log('❌ No file found in form data.')
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('📏 File size (bytes):', buffer.length)

    const ext = file.name.split('.').pop()
    const fileName = `report-${randomUUID()}.${ext}`
    console.log('📝 Generated file name:', fileName)

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type || 'image/jpeg',
    }

    console.log('🚀 Uploading to S3 bucket:', uploadParams.Bucket)
    const command = new PutObjectCommand(uploadParams)
    await s3Client.send(command)
    console.log('✅ Upload successful.')

    const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`
    console.log('🌐 Public URL:', url)

    return NextResponse.json({ url }, { status: 200 })
  } catch (err) {
    console.error('🔥 Error during upload:', err)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
