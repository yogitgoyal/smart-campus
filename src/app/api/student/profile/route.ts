import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    if (!studentId) return NextResponse.json({ error: 'Required' }, { status: 400 })

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { name: true, email: true } }, section: { include: { class: true } } }
    })
    return NextResponse.json(student)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}