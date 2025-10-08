import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateCustomerSchema } from '@/lib/schemas'

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

    const customer = await prisma.customer.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        kategori: true,
        invoices: {
          include: {
            payments: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
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
    const validatedData = updateCustomerSchema.parse({
      ...body,
      id: parseInt(params.id),
    })

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: validatedData.id },
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if new kode already exists (if kode is being updated)
    if (validatedData.kode && validatedData.kode !== existingCustomer.kode) {
      const duplicateKode = await prisma.customer.findUnique({
        where: { kode: validatedData.kode },
      })

      if (duplicateKode) {
        return NextResponse.json(
          { error: 'Kode customer sudah ada' },
          { status: 400 }
        )
      }
    }

    const { id, ...updateData } = validatedData
    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        kategori: true,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)
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

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        invoices: true,
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if customer has invoices
    if (customer.invoices.length > 0) {
      return NextResponse.json(
        { error: 'Customer tidak dapat dihapus karena memiliki invoice' },
        { status: 400 }
      )
    }

    await prisma.customer.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ message: 'Customer berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}