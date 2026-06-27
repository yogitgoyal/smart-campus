import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { marks, feedback, status } = await req.json()

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        marks: marks !== undefined ? parseFloat(marks) : undefined,
        feedback: feedback || null,
        status: status || 'GRADED',
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH submission error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}