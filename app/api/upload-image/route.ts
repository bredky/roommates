// import { IncomingForm } from 'formidable'
// import { Readable } from 'stream'
// import fs from 'fs'
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
// import { NextResponse } from 'next/server'

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// }

// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//   },
// })

// async function buffer(req: Request) {
//   const buf = await req.arrayBuffer()
//   return Buffer.from(buf)
// }

// export async function POST(req: Request) {
//     console.log('⚡️ /api/upload-image POST received')
//     const form = new IncomingForm()
  
//     // Convert Next.js Request to Node.js Readable stream for formidable
//     const readable = new Readable()
//     const buf = await buffer(req)
//     readable.push(buf)
//     readable.push(null)
  
//     return new Promise((resolve, reject) => {
//       console.log('⏳ Starting form.parse...')
  
//       form.parse(readable as any, async (err, fields, files) => {
//         console.log('🚦 Inside form.parse callback')
  
//         if (err) {
//           console.error('❌ Form parse error:', err)
//           reject(NextResponse.json({ error: err.message }, { status: 500 }))
//           return
//         }
  
//         console.log('📄 Parsed fields:', fields)
//         console.log('📁 Parsed files:', files)
  
//         const file = files.file
//         if (!file) {
//           console.warn('⚠️ No file found in upload')
//           reject(NextResponse.json({ error: 'No file uploaded' }, { status: 400 }))
//           return
//         }
  
//         try {
//           const data = fs.readFileSync((file as any).filepath)
//           console.log('✅ File read into buffer')
  
//           const uploadParams = {
//             Bucket: process.env.S3_BUCKET_NAME!,
//             Key: `${Date.now()}-${(file as any).originalFilename}`,
//             Body: data,
//             ACL: 'public-read' as const,
//             ContentType: (file as any).mimetype,
//           }
  
//           console.log('☁️ Uploading to S3 with params:', uploadParams.Key)
  
//           const command = new PutObjectCommand(uploadParams)
//           await s3Client.send(command)
  
//           const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`
  
//           console.log('✅ Upload successful:', fileUrl)
//           resolve(NextResponse.json({ url: fileUrl }, { status: 200 }))
//         } catch (uploadErr) {
//           console.error('❌ Upload error:', uploadErr)
//           reject(NextResponse.json({ error: (uploadErr as Error).message }, { status: 500 }))
//         }
//       })
//     })
//   }

import { NextResponse } from 'next/server'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: Request) {
  console.log('⚡️ [PLACEHOLDER] /api/upload-image POST received')

  // Just simulate a delay
  await new Promise((r) => setTimeout(r, 500))

  // Return fake image URL
  const fakeUrl = 'https://example-bucket.s3.fake-region.amazonaws.com/fake-upload.jpg'

  console.log('✅ [PLACEHOLDER] Returning fake image URL:', fakeUrl)
  return NextResponse.json({ url: fakeUrl }, { status: 200 })
}




