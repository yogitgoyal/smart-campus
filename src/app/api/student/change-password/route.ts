import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { studentId, currentPassword, newPassword } = await req.json()
    if (!studentId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    if (student.user.avatar && student.user.avatar !== currentPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: { avatar: newPassword }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}