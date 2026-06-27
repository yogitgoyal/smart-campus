import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

async function getOrCreateUser(clerkId: string) {
  let user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) {
    let school = await prisma.school.findFirst()
    if (!school) school = await prisma.school.create({ data: { name: 'Smart Campus School' } })
    user = await prisma.user.create({
      data: { clerkId, email: `${clerkId}@temp.com`, name: 'Admin', role: 'ADMIN', schoolId: school.id }
    })
  }
  return user
}

async function getOrCreateTeacher(userId: string) {
  let teacher = await prisma.teacher.findUnique({ where: { userId } })
  if (!teacher) teacher = await prisma.teacher.create({ data: { userId } })
  return teacher
}

async function getOrCreateSchool() {
  let school = await prisma.school.findFirst()
  if (!school) school = await prisma.school.create({ data: { name: 'Smart Campus School' } })
  return school
}

export async function GET() {
  const notes = await prisma.note.findMany({
    include: { teacher: { include: { user: true } }, subject: true, section: { include: { class: true } } },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(notes)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const subjectName = formData.get('subjectName') as string
    const fileType = formData.get('fileType') as string
    const file = formData.get('file') as File | null

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const user = await getOrCreateUser(userId)
    const teacher = await getOrCreateTeacher(user.id)
    const school = await getOrCreateSchool()

    let fileUrl = ''

    // Save file physically if uploaded
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Get file extension
      const ext = path.extname(file.name) || '.pdf'
      // Create unique filename
      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`
      
      const filepath = path.join(process.cwd(), 'public', 'uploads', filename)
      await writeFile(filepath, buffer)
      
      fileUrl = `/uploads/${filename}` // Path accessible by frontend
    }

    const note = await prisma.note.create({
      data: { 
        title, 
        description, 
        fileUrl, 
        subjectName, // Save string for easy filtering
        fileType,     // Save string for easy filtering
        teacherId: teacher.id, 
        schoolId: school.id 
      }
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const ids = searchParams.get('ids')

  try {
    if (id) {
      // Delete physical file
      const note = await prisma.note.findUnique({ where: { id } })
      if (note?.fileUrl) {
        const filepath = path.join(process.cwd(), 'public', note.fileUrl)
        await unlink(filepath).catch(() => {}) // Ignore error if file doesn't exist
      }
      await prisma.note.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (ids) {
      const notesToDelete = await prisma.note.findMany({ where: { id: { in: ids.split(',') } } })
      // Delete physical files
      for (const note of notesToDelete) {
        if (note.fileUrl) {
          const filepath = path.join(process.cwd(), 'public', note.fileUrl)
          await unlink(filepath).catch(() => {})
        }
      }
      await prisma.note.deleteMany({ where: { id: { in: ids.split(',') } } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'No id or ids provided' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}