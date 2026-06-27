import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// POST /api/student/submissions
// body: { studentId, assignmentId, content?, fileUrl? }
// Creates the student's submission, or updates it if one already exists for
// this assignment (re-submitting overwrites, matching the unique constraint
// on [assignmentId, studentId] in the schema).
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { studentId, assignmentId, content, fileUrl } = body

    if (!studentId || !assignmentId) {
      return NextResponse.json({ error: 'studentId and assignmentId are required' }, { status: 400 })
    }
    if (!content?.trim() && !fileUrl) {
      return NextResponse.json({ error: 'Provide a text answer or a file' }, { status: 400 })
    }

    // Verify the assignment actually belongs to this student's class --
    // a student should never be able to submit against an assignment
    // outside their own class by guessing an assignmentId.
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { section: { include: { class: true } } }
    })
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } })

    if (!student?.section || !assignment) {
      return NextResponse.json({ error: 'Student or assignment not found' }, { status: 404 })
    }
    if (assignment.classId !== student.section.classId) {
      return NextResponse.json({ error: 'This assignment is not for your class' }, { status: 403 })
    }

    const existing = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } }
    })

    const submission = existing
      ? await prisma.submission.update({
          where: { id: existing.id },
          data: {
            content: content?.trim() || null,
            fileUrl: fileUrl || null,
            submittedAt: new Date(),
            status: 'SUBMITTED',
          }
        })
      : await prisma.submission.create({
          data: {
            assignmentId,
            studentId,
            content: content?.trim() || null,
            fileUrl: fileUrl || null,
            status: 'SUBMITTED',
          }
        })

    return NextResponse.json(submission, { status: existing ? 200 : 201 })
  } catch (error) {
    console.error('POST /api/student/submissions error:', error)
    return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 })
  }
}

// GET /api/student/submissions?studentId=xxx&assignmentId=xxx
// Returns this student's own submission for one assignment, or null.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const assignmentId = searchParams.get('assignmentId')

    if (!studentId || !assignmentId) {
      return NextResponse.json(null)
    }

    const submission = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } }
    })

    return NextResponse.json(submission)
  } catch (error) {
    console.error('GET /api/student/submissions error:', error)
    return NextResponse.json(null)
  }
}