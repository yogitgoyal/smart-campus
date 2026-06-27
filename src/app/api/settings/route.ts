import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    let settings = await prisma.schoolSetting.findUnique({ where: { id: 1 } })
    if (!settings) {
      settings = await prisma.schoolSetting.create({ data: { id: 1 } })
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, createdAt, updatedAt, ...data } = body

    const settings = await prisma.schoolSetting.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    })
    return NextResponse.json(settings)
  } catch (error) {
    console.error('PUT /api/settings error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}