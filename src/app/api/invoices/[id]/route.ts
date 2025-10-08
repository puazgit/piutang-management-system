import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createInvoiceSchema } from '@/lib/schemas'
import { Prisma } from '@prisma/client'

interface Props {
  params: Promise<{
    id: string
  }>
}

// GET /api/invoices/[id] - Get single invoice
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const invoiceId = parseInt(resolvedParams.id)

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: {
          include: {
            kategori: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc'
          }
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice tidak ditemukan' },
        { status: 404 }
      )
    }

    // Calculate balance information
    const totalPayments = invoice.payments.reduce((sum: number, payment: any) => sum + payment.penerimaan, 0)
    const remainingBalance = invoice.nilaiInvoice - totalPayments
    const isFullyPaid = remainingBalance <= 0
    const isOverdue = new Date() > new Date(invoice.jatuhTempo) && !isFullyPaid

    const enrichedInvoice = {
      ...invoice,
      totalPayments,
      remainingBalance,
      isFullyPaid,
      isOverdue,
    }

    return NextResponse.json({ invoice: enrichedInvoice })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const invoiceId = parseInt(resolvedParams.id)
    const body = await request.json()

    // Convert date strings to Date objects
    const processedBody = {
      ...body,
      tanggal: new Date(body.tanggal),
      jatuhTempo: new Date(body.jatuhTempo),
    }
    
    const validatedData = createInvoiceSchema.parse(processedBody)

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
      }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if invoice number is being changed and if it conflicts
    if (validatedData.noInvoice !== existingInvoice.noInvoice) {
      const conflictingInvoice = await prisma.invoice.findUnique({
        where: { noInvoice: validatedData.noInvoice },
      })

      if (conflictingInvoice) {
        return NextResponse.json(
          { error: 'No invoice sudah ada' },
          { status: 400 }
        )
      }
    }

    // Update invoice in transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Calculate difference in invoice value for customer total update
      const valueDifference = validatedData.nilaiInvoice - existingInvoice.nilaiInvoice

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
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

      // Update customer total piutang if invoice value changed
      if (valueDifference !== 0) {
        await tx.customer.update({
          where: { id: validatedData.customerId },
          data: {
            totalPiutang: {
              increment: valueDifference,
            },
          },
        })
      }

      // If customer changed, update both customers
      if (validatedData.customerId !== existingInvoice.customerId) {
        // Remove from old customer
        await tx.customer.update({
          where: { id: existingInvoice.customerId },
          data: {
            totalPiutang: {
              decrement: existingInvoice.nilaiInvoice,
            },
          },
        })

        // Add to new customer (this is in addition to the valueDifference update above)
        await tx.customer.update({
          where: { id: validatedData.customerId },
          data: {
            totalPiutang: {
              increment: existingInvoice.nilaiInvoice,
            },
          },
        })
      }

      return updatedInvoice
    })

    return NextResponse.json({ invoice: result })
  } catch (error) {
    console.error('Error updating invoice:', error)
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

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const invoiceId = parseInt(resolvedParams.id)

    // Check if invoice exists and has payments
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
      }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice tidak ditemukan' },
        { status: 404 }
      )
    }

    if (existingInvoice.payments.length > 0) {
      return NextResponse.json(
        { error: 'Invoice tidak dapat dihapus karena sudah ada pembayaran' },
        { status: 400 }
      )
    }

    // Delete invoice and update customer total
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.invoice.delete({
        where: { id: invoiceId },
      })

      // Update customer total piutang
      await tx.customer.update({
        where: { id: existingInvoice.customerId },
        data: {
          totalPiutang: {
            decrement: existingInvoice.nilaiInvoice,
          },
        },
      })
    })

    return NextResponse.json({ message: 'Invoice berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}