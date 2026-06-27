import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        teacher: { include: { user: true } },
        subject: true,
        class: true,
        school: true,
        submissions: {
          include: {
            student: { include: { user: true } }
          }
        }
      }
    })
    if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(assignment)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Delete submissions first, then the assignment
    await prisma.submission.deleteMany({ where: { assignmentId: id } })
    await prisma.assignment.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE assignment error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}