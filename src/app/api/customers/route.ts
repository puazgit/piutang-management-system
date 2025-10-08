import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCustomerSchema } from '@/lib/schemas'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId')

    const skip = (page - 1) * limit

    interface WhereClause {
      OR?: Array<{
        kode?: { contains: string; mode: 'insensitive' }
        namaCustomer?: { contains: string; mode: 'insensitive' }
      }>
      kategoriId?: number
    }
    
    const where: WhereClause = {}
    
    if (search) {
      where.OR = [
        { kode: { contains: search, mode: 'insensitive' as const } },
        { namaCustomer: { contains: search, mode: 'insensitive' as const } },
      ]
    }
    
    if (categoryId) {
      where.kategoriId = parseInt(categoryId)
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          kategori: true,
          _count: {
            select: {
              invoices: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
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
    const validatedData = createCustomerSchema.parse(body)

    // Check if customer code already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { kode: validatedData.kode },
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Kode customer sudah ada' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: validatedData,
      include: {
        kategori: true,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
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