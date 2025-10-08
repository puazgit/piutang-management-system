import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateCompanyProfileSchema } from '@/lib/schemas'

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.companyProfile.findUnique({
      where: {
        id: parseInt(params.id),
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil perusahaan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching company profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateCompanyProfileSchema.parse({
      ...body,
      id: parseInt(params.id),
    })

    // Check if profile exists
    const existingProfile = await prisma.companyProfile.findUnique({
      where: { id: validatedData.id },
    })

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profil perusahaan tidak ditemukan' },
        { status: 404 }
      )
    }

    const { id, ...updateData } = validatedData
    const profile = await prisma.companyProfile.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating company profile:', error)
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

export async function DELETE(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if profile exists
    const profile = await prisma.companyProfile.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil perusahaan tidak ditemukan' },
        { status: 404 }
      )
    }

    await prisma.companyProfile.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ message: 'Profil perusahaan berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting company profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}