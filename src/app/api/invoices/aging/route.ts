import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAgingSummary, getAgingBuckets, analyzeInvoiceAging } from '@/lib/aging-utils'
import { DashboardAnalytics, AgingReport } from '@/lib/types/aging'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'summary' // summary | detailed | analytics
    const customerId = searchParams.get('customerId')
    const dateStr = searchParams.get('date')
    
    const referenceDate = dateStr ? new Date(dateStr) : new Date()
    
    // Build where clause - only BELUM_LUNAS invoices (outstanding)
    const where: { statusPembayaran: string; customerId?: number } = {
      statusPembayaran: 'BELUM_LUNAS'
    }
    
    if (customerId && customerId !== 'all') {
      where.customerId = parseInt(customerId)
    }

    // Fetch outstanding invoices
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          include: {
            kategori: true,
          },
        },
        payments: true,
      },
      orderBy: {
        jatuhTempo: 'asc',
      },
    })

    // Calculate remaining balances and aging
    const invoicesWithAging = invoices.map(invoice => {
      const totalPayments = invoice.payments.reduce((sum, payment) => sum + payment.penerimaan, 0)
      const remainingBalance = invoice.nilaiInvoice - totalPayments
      
      // Only include if there's still outstanding balance
      if (remainingBalance > 0) {
        const agingAnalysis = analyzeInvoiceAging(invoice, referenceDate)
        
        return {
          ...invoice,
          totalPayments,
          remainingBalance,
          aging: agingAnalysis,
        }
      }
      return null
    }).filter(Boolean)

    if (reportType === 'summary') {
      // Generate aging summary
      const summary = generateAgingSummary(invoices, referenceDate)
      
      return NextResponse.json({
        reportDate: referenceDate,
        summary,
      })
    }

    if (reportType === 'analytics') {
      // Generate comprehensive analytics for dashboard
      const summary = generateAgingSummary(invoices, referenceDate)
      const buckets = getAgingBuckets(invoices, referenceDate)
      
      const totalOutstanding = summary.total.amount
      
      const analytics: DashboardAnalytics = {
        totalInvoices: summary.total.count,
        totalAmount: totalOutstanding,
        paidAmount: 0, // This would need calculation from all invoices
        outstandingAmount: totalOutstanding,
        agingSummary: {
          current: {
            count: summary.current.count,
            amount: summary.current.amount,
            percentage: totalOutstanding > 0 ? (summary.current.amount / totalOutstanding) * 100 : 0,
          },
          specialMention: {
            count: summary.specialMention.count,
            amount: summary.specialMention.amount,
            percentage: totalOutstanding > 0 ? (summary.specialMention.amount / totalOutstanding) * 100 : 0,
          },
          substandard: {
            count: summary.substandard.count,
            amount: summary.substandard.amount,
            percentage: totalOutstanding > 0 ? (summary.substandard.amount / totalOutstanding) * 100 : 0,
          },
          doubtful: {
            count: summary.doubtful.count,
            amount: summary.doubtful.amount,
            percentage: totalOutstanding > 0 ? (summary.doubtful.amount / totalOutstanding) * 100 : 0,
          },
          badDebt: {
            count: summary.badDebt.count,
            amount: summary.badDebt.amount,
            percentage: totalOutstanding > 0 ? (summary.badDebt.amount / totalOutstanding) * 100 : 0,
          },
        },
        qualityDistribution: buckets.map(bucket => ({
          quality: bucket.quality,
          label: bucket.label,
          count: bucket.count,
          amount: bucket.amount,
          percentage: totalOutstanding > 0 ? (bucket.amount / totalOutstanding) * 100 : 0,
          colorClass: getColorClassForQuality(bucket.quality),
        })),
      }
      
      return NextResponse.json(analytics)
    }

    if (reportType === 'detailed') {
      // Generate detailed aging report
      const buckets = getAgingBuckets(invoices, referenceDate)
      const summary = generateAgingSummary(invoices, referenceDate)
      
      const report: AgingReport = {
        reportDate: referenceDate,
        totalOutstanding: summary.total.amount,
        totalCount: summary.total.count,
        buckets: buckets.map((bucket, index) => ({
          label: bucket.label,
          daysRange: getDaysRangeLabel(index),
          count: bucket.count,
          amount: bucket.amount,
          percentage: summary.total.amount > 0 ? (bucket.amount / summary.total.amount) * 100 : 0,
          quality: bucket.quality,
          colorClass: getColorClassForQuality(bucket.quality),
        })),
        riskAnalysis: {
          lowRisk: { count: summary.current.count, amount: summary.current.amount },
          mediumRisk: { count: summary.specialMention.count, amount: summary.specialMention.amount },
          highRisk: { count: summary.substandard.count, amount: summary.substandard.amount },
          criticalRisk: { 
            count: summary.doubtful.count + summary.badDebt.count, 
            amount: summary.doubtful.amount + summary.badDebt.amount 
          },
        },
      }
      
      return NextResponse.json(report)
    }

    // Default: return invoices with aging data
    return NextResponse.json({
      reportDate: referenceDate,
      invoices: invoicesWithAging,
      total: invoicesWithAging.length,
    })

  } catch (error) {
    console.error('Error generating aging report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function getColorClassForQuality(quality: string): string {
  switch (quality) {
    case 'CURRENT':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'SPECIAL_MENTION':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'SUBSTANDARD':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'DOUBTFUL':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'BAD_DEBT':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getDaysRangeLabel(index: number): string {
  switch (index) {
    case 0: return '< 0 hari'
    case 1: return '1-30 hari'
    case 2: return '31-60 hari'
    case 3: return '61-90 hari'
    case 4: return '> 90 hari'
    default: return 'Unknown'
  }
}