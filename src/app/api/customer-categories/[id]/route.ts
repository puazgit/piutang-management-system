import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateCustomerCategorySchema } from '@/lib/schemas'

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

    const category = await prisma.customerCategory.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        customers: {
          select: {
            id: true,
            kode: true,
            namaCustomer: true,
            totalPiutang: true,
          },
        },
        _count: {
          select: {
            customers: true,
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Kategori customer tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching customer category:', error)
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
    const validatedData = updateCustomerCategorySchema.parse({
      ...body,
      id: parseInt(params.id),
    })

    // Check if category exists
    const existingCategory = await prisma.customerCategory.findUnique({
      where: { id: validatedData.id },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Kategori customer tidak ditemukan' },
        { status: 404 }
      )
    }

    const { id, ...updateData } = validatedData
    const category = await prisma.customerCategory.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            customers: true,
          },
        },
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating customer category:', error)
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

    // Check if category exists
    const category = await prisma.customerCategory.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        customers: true,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Kategori customer tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if category has customers
    if (category.customers.length > 0) {
      return NextResponse.json(
        { error: 'Kategori tidak dapat dihapus karena masih digunakan oleh customer' },
        { status: 400 }
      )
    }

    await prisma.customerCategory.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ message: 'Kategori customer berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting customer category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}