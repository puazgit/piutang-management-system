import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createInvoiceSchema } from '@/lib/schemas'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    interface WhereClause {
      customerId?: number
      statusPembayaran?: string
      OR?: Array<{
        noInvoice?: { contains: string; mode: 'insensitive' }
        customer?: {
          namaCustomer?: { contains: string; mode: 'insensitive' }
          kode?: { contains: string; mode: 'insensitive' }
        }
      }>
    }
    
    const where: WhereClause = {}

    if (search) {
      where.OR = [
        { noInvoice: { contains: search, mode: 'insensitive' } },
        { customer: { namaCustomer: { contains: search, mode: 'insensitive' } } },
        { customer: { kode: { contains: search, mode: 'insensitive' } } },
      ]
    }
    
    if (customerId && customerId !== 'all') {
      where.customerId = parseInt(customerId)
    }
    
    if (status && status !== 'all') {
      where.statusPembayaran = status
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: {
            include: {
              kategori: true,
            },
          },
          payments: true,
          _count: {
            select: {
              payments: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.invoice.count({ where }),
    ])

    // Calculate remaining balance for each invoice
    const invoicesWithBalance = invoices.map((invoice) => {
      const totalPayments = invoice.payments.reduce((sum: number, payment: { penerimaan: number }) => sum + payment.penerimaan, 0)
      const remainingBalance = invoice.nilaiInvoice - totalPayments
      const isFullyPaid = remainingBalance <= 0
      const isOverdue = new Date() > new Date(invoice.jatuhTempo) && !isFullyPaid
      
      return {
        ...invoice,
        totalPayments,
        remainingBalance,
        isFullyPaid,
        isOverdue,
      }
    })

    return NextResponse.json({
      invoices: invoicesWithBalance,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
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
    
    // Convert date strings to Date objects
    const processedBody = {
      ...body,
      tanggal: new Date(body.tanggal),
      jatuhTempo: new Date(body.jatuhTempo),
    }
    
    const validatedData = createInvoiceSchema.parse(processedBody)

    // Check if invoice number already exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { noInvoice: validatedData.noInvoice },
    })

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'No invoice sudah ada' },
        { status: 400 }
      )
    }

    // Create invoice and update customer total piutang
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.invoice.create({
        data: validatedData,
        include: {
          customer: {
            include: {
              kategori: true,
            },
          },
          payments: true,
        },
      })

      // Update customer total piutang
      await tx.customer.update({
        where: { id: validatedData.customerId },
        data: {
          totalPiutang: {
            increment: validatedData.nilaiInvoice,
          },
        },
      })

      return invoice
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
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