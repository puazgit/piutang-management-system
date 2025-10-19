import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPaymentSchema } from '@/lib/schemas'
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
    const invoiceId = searchParams.get('invoiceId')

    const skip = (page - 1) * limit

    interface WhereClause {
      invoiceId?: number
    }
    
    const where: WhereClause = {}
    
    if (invoiceId) {
      where.invoiceId = parseInt(invoiceId)
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          invoice: {
            include: {
              customer: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.payment.count({ where }),
    ])

    return NextResponse.json({
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
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
    
    const validatedData = createPaymentSchema.parse(body)
    console.log('Payment data validated:', validatedData)

    // Check if invoice exists and get current balance
    const invoice = await prisma.invoice.findUnique({
      where: { id: validatedData.invoiceId },
      include: {
        payments: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice tidak ditemukan' },
        { status: 400 }
      )
    }

    // Calculate current total payments and remaining balance
    const currentTotalPayments = invoice.payments.reduce((sum: number, payment: { penerimaan: number }) => sum + payment.penerimaan, 0)
    const remainingBalance = invoice.nilaiInvoice - currentTotalPayments

    // Validate payment amount
    if (validatedData.penerimaan > remainingBalance) {
      return NextResponse.json(
        { error: `Jumlah pembayaran melebihi sisa tagihan (${remainingBalance})` },
        { status: 400 }
      )
    }

    // Create payment and update invoice status in transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const payment = await tx.payment.create({
        data: {
          ...validatedData,
          tanggal: new Date(validatedData.tanggal),
        },
        include: {
          invoice: {
            include: {
              customer: true,
            },
          },
        },
      })

      // Calculate new total payments after this payment
      const newTotalPayments = currentTotalPayments + validatedData.penerimaan
      const newRemainingBalance = invoice.nilaiInvoice - newTotalPayments

      // Update invoice status based on payment
      let newStatus = 'BELUM_LUNAS'
      if (newRemainingBalance <= 0) {
        newStatus = 'LUNAS'
      } else if (newTotalPayments > 0) {
        newStatus = 'SEBAGIAN'
      }

      await tx.invoice.update({
        where: { id: validatedData.invoiceId },
        data: {
          statusPembayaran: newStatus,
        },
      })

      // Update customer balance (decrease piutang)
      await tx.customer.update({
        where: { id: invoice.customerId },
        data: {
          totalPiutang: {
            decrement: validatedData.penerimaan,
          },
        },
      })

      return payment
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
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