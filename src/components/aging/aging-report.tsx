'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw } from 'lucide-react'
import { AgingSummaryGrid } from './summary-cards'
import { AgingCharts } from './aging-charts'
import { QualityBadge } from './quality-badge'
import { formatCurrency } from '@/lib/aging-utils'
import { DashboardAnalytics } from '@/lib/types/aging'

interface AgingReportProps {
  customerId?: string | null
  showHeader?: boolean
}

export function AgingReport({ customerId = null, showHeader = true }: AgingReportProps) {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportDate] = useState(new Date())

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        type: 'analytics',
        date: reportDate.toISOString(),
      })
      
      if (customerId && customerId !== 'all') {
        params.append('customerId', customerId)
      }

      const response = await fetch(`/api/invoices/aging?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch aging analytics')
      }
      
      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching aging analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [customerId, reportDate])

  const handleRefresh = () => {
    fetchAnalytics()
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export aging report')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Memuat data aging...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
            <Button onClick={handleRefresh} variant="outline" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            <p>Tidak ada data piutang yang tersedia.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data
  const chartData = analytics.qualityDistribution.map(item => ({
    name: item.label,
    count: item.count,
    amount: item.amount,
    percentage: item.percentage,
    quality: item.quality,
    color: item.colorClass,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Analisis Aging Piutang</h2>
            <p className="text-gray-600">
              Laporan per tanggal {reportDate.toLocaleDateString('id-ID', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analytics.outstandingAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risiko Rendah</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.agingSummary.current.count}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analytics.agingSummary.current.amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perlu Perhatian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {analytics.agingSummary.specialMention.count + analytics.agingSummary.substandard.count}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analytics.agingSummary.specialMention.amount + analytics.agingSummary.substandard.amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risiko Tinggi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics.agingSummary.doubtful.count + analytics.agingSummary.badDebt.count}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analytics.agingSummary.doubtful.amount + analytics.agingSummary.badDebt.amount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <AgingSummaryGrid summary={analytics.agingSummary} />

      {/* Charts */}
      <AgingCharts 
        data={chartData}
        totalAmount={analytics.outstandingAmount}
        totalCount={analytics.totalInvoices}
      />

      {/* Quality Distribution Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Distribusi Kualitas</CardTitle>
          <CardDescription>
            Breakdown lengkap berdasarkan kategori aging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.qualityDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <QualityBadge 
                    quality={item.quality} 
                    daysOverdue={0}
                    showDays={false} 
                  />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-gray-600">
                      {item.count} invoice • {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(item.amount)}</div>
                  <div className="text-sm text-gray-600">
                    Rata-rata: {formatCurrency(item.count > 0 ? item.amount / item.count : 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}