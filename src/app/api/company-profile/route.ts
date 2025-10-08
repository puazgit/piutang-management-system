import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCompanyProfileSchema } from '@/lib/schemas'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the first (and should be only) company profile
    const profile = await prisma.companyProfile.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error fetching company profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCompanyProfileSchema.parse(body)

    // Check if company profile already exists
    const existingProfile = await prisma.companyProfile.findFirst()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profil perusahaan sudah ada. Gunakan PUT untuk mengupdate.' },
        { status: 400 }
      )
    }

    const profile = await prisma.companyProfile.create({
      data: validatedData,
    })

    return NextResponse.json(profile, { status: 201 })
  } catch (error) {
    console.error('Error creating company profile:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}