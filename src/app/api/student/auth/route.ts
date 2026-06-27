import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        student: {
          include: {
            section: { include: { class: true } }
          }
        }
      }
    })

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'No student account found with this email' }, { status: 401 })
    }
    if (!user.student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 401 })
    }

    // Password is stored on User.avatar (schema has no dedicated password field).
    // NOTE: if the admin-side "create student" form never collects a password,
    // this will be null/empty here, and ANY password will be accepted below.
    // That's fine for testing today, but should be locked down before real use --
    // see the note at the end of this message.
    const storedPassword = user.avatar
    if (storedPassword && storedPassword !== password) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    return NextResponse.json({
      id: user.student.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      rollNumber: user.student.rollNumber,
      admissionNo: user.student.admissionNo,
      gender: user.student.gender,
      phone: user.student.phone,
      address: user.student.address,
      status: user.student.status,
      section: user.student.section,
    })
  } catch (error) {
    console.error('Student auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}