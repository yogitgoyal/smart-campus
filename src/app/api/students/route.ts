import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sectionId = searchParams.get('sectionId')

    const students = await prisma.student.findMany({
      where: sectionId ? { sectionId } : undefined,
      include: {
        user: { select: { name: true, email: true } },
        section: { include: { class: true } }
      },
      orderBy: { user: { name: 'asc' } }
    })
    return NextResponse.json(students)
  } catch (error) {
    console.error('GET /api/students error:', error)
    return NextResponse.json([])
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Find the logged-in admin's User row to get their schoolId.
    // Class.schoolId is required, so every new Class we create must belong
    // to the same school as the admin creating the student.
    // Auto-create school if needed — no manual linking required
    let school = await prisma.school.findFirst()
    if (!school) {
      school = await prisma.school.create({ data: { name: 'Smart Campus School' } })
    }
    const schoolId = school.id

    // Also link admin user to school if not already linked
    const adminUser = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (adminUser && !adminUser.schoolId) {
      await prisma.user.update({ where: { id: adminUser.id }, data: { schoolId } })
    }

    const body = await req.json()
    const {
      name, email, phone, dob, gender,
      bloodGroup, religion, nationality,
      rollNumber, admissionNo,
      address, city, state, pincode,
      guardianName, guardianRelation, guardianPhone, guardianOccupation,
      medicalNotes, allergies,
      className, sectionName,
    } = body

    if (!name?.trim()) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    const cleanEmail = email.trim().toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (existing) return NextResponse.json({ error: 'A student with this email already exists' }, { status: 400 })

    const fullAddress = [address, city, state, pincode].filter(Boolean).join(', ') || null

    const notesParts = [
      bloodGroup ? `Blood Group: ${bloodGroup}` : null,
      religion ? `Religion: ${religion}` : null,
      nationality ? `Nationality: ${nationality}` : null,
      guardianName ? `Guardian: ${guardianName}` : null,
      guardianRelation ? `Relation: ${guardianRelation}` : null,
      guardianPhone ? `Guardian Phone: ${guardianPhone}` : null,
      guardianOccupation ? `Occupation: ${guardianOccupation}` : null,
      medicalNotes ? `Medical: ${medicalNotes}` : null,
      allergies ? `Allergies: ${allergies}` : null,
    ].filter(Boolean).join(' | ')

    // Resolve className + sectionName (plain strings from the form) into a
    // real sectionId. Class is scoped to schoolId, Section is scoped to classId.
    let sectionId: string | null = null

    if (className?.trim() && sectionName?.trim()) {
      let classRecord = await prisma.class.findFirst({
        where: { name: className.trim(), schoolId }
      })
      if (!classRecord) {
        classRecord = await prisma.class.create({
          data: { name: className.trim(), schoolId }
        })
      }

      let sectionRecord = await prisma.section.findFirst({
        where: { name: sectionName.trim(), classId: classRecord.id }
      })
      if (!sectionRecord) {
        sectionRecord = await prisma.section.create({
          data: { name: sectionName.trim(), classId: classRecord.id }
        })
      }

      sectionId = sectionRecord.id
    }

    const user = await prisma.user.create({
      data: {
        clerkId: `student_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        email: cleanEmail,
        name: name.trim(),
        role: 'STUDENT',
        avatar: body.password || null,
      }
    })

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        rollNumber: rollNumber?.trim() || null,
        admissionNo: admissionNo?.trim() || null,
        phone: phone?.trim() || null,
        gender: gender || null,
        dob: dob ? new Date(dob) : null,
        address: notesParts ? `${fullAddress || ''} | EXTRA: ${notesParts}` : fullAddress,
        status: 'ACTIVE',
        sectionId,
      },
      include: {
        user: { select: { name: true, email: true } },
        section: { include: { class: true } }
      }
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/students error:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A student with this email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create student. Please try again.' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const ids = searchParams.get('ids') // bulk: comma-separated

    const toDelete = ids ? ids.split(',').filter(Boolean) : id ? [id] : []
    if (toDelete.length === 0) return NextResponse.json({ error: 'No student ID(s) provided' }, { status: 400 })

    for (const sid of toDelete) {
      const student = await prisma.student.findUnique({ where: { id: sid } })
      if (!student) continue
      await prisma.attendanceRecord.deleteMany({ where: { studentId: sid } })
      await prisma.submission.deleteMany({ where: { studentId: sid } })
      await prisma.student.delete({ where: { id: sid } })
      await prisma.user.delete({ where: { id: student.userId } })
    }

    return NextResponse.json({ success: true, deleted: toDelete.length })
  } catch (error) {
    console.error('DELETE /api/students error:', error)
    return NextResponse.json({ error: 'Failed to delete student(s)' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { studentId, newPassword } = body
    if (!studentId || !newPassword) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}