import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface Props {
  params: Promise<{
    id: string
  }>
}

// GET /api/payments/[id] - Get single payment
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const paymentId = parseInt(resolvedParams.id)

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pembayaran tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/payments/[id] - Delete payment
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const paymentId = parseInt(resolvedParams.id)

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: true,
      }
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Pembayaran tidak ditemukan' },
        { status: 404 }
      )
    }

    // Delete payment and update invoice status in transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete the payment
      await tx.payment.delete({
        where: { id: paymentId },
      })

      // Recalculate invoice status
      const remainingPayments = await tx.payment.findMany({
        where: { invoiceId: existingPayment.invoiceId },
      })

      const totalPayments = remainingPayments.reduce((sum: number, payment: { penerimaan: number }) => sum + payment.penerimaan, 0)
      const remainingBalance = existingPayment.invoice.nilaiInvoice - totalPayments

      // Update invoice status
      let newStatus = 'BELUM_LUNAS'
      if (remainingBalance <= 0) {
        newStatus = 'LUNAS'
      } else if (totalPayments > 0) {
        newStatus = 'SEBAGIAN'
      }

      await tx.invoice.update({
        where: { id: existingPayment.invoiceId },
        data: {
          statusPembayaran: newStatus,
        },
      })

      // Update customer balance (increase piutang back)
      await tx.customer.update({
        where: { id: existingPayment.invoice.customerId },
        data: {
          totalPiutang: {
            increment: existingPayment.penerimaan,
          },
        },
      })
    })

    return NextResponse.json({ message: 'Pembayaran berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}