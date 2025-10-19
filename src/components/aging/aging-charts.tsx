'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Cell, PieChart, Pie, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/aging-utils'
import { InvoiceQuality } from '@/lib/aging-utils'

interface AgingChartData {
  name: string
  count: number
  amount: number
  percentage: number
  quality: InvoiceQuality
  color: string
}

interface AgingChartsProps {
  data: AgingChartData[]
  totalAmount: number
  totalCount: number
}

const COLORS = {
  PAID: '#3B82F6',           // blue-500
  CURRENT: '#10B981',        // green-500
  SPECIAL_MENTION: '#F59E0B', // yellow-500
  SUBSTANDARD: '#F97316',    // orange-500
  DOUBTFUL: '#EF4444',       // red-500
  BAD_DEBT: '#6B7280',       // gray-500
}

export function AgingCharts({ data, totalAmount, totalCount }: AgingChartsProps) {
  // Prepare data for charts
  const chartData = data.map(item => ({
    ...item,
    color: COLORS[item.quality] || '#6B7280'
  }))

  // Custom tooltip for pie chart
  const renderPieTooltip = (props: { active?: boolean; payload?: Array<{ payload: AgingChartData }> }) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            Jumlah: {data.count} invoice ({data.percentage.toFixed(1)}%)
          </p>
          <p className="text-sm text-gray-600">
            Nilai: {formatCurrency(data.amount)}
          </p>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for bar chart
  const renderBarTooltip = (props: { active?: boolean; payload?: Array<{ payload: AgingChartData }> }) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-blue-600">
            Jumlah: {data.count} invoice
          </p>
          <p className="text-sm text-green-600">
            Nilai: {formatCurrency(data.amount)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Pie Chart - Distribution by Count */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Jumlah Invoice</CardTitle>
          <CardDescription>
            Berdasarkan kualitas piutang ({totalCount} total invoice)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                // label={(entry) => `${((entry as { percent: number }).percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={renderPieTooltip} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-4">
            {chartData.map((entry, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart - Amount by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Nilai Piutang</CardTitle>
          <CardDescription>
            Berdasarkan kualitas piutang ({formatCurrency(totalAmount)} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value: number) => formatCurrency(value).replace('Rp ', 'Rp')}
                fontSize={12}
              />
              <Tooltip content={renderBarTooltip} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Risk Analysis */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Analisis Risiko Piutang</CardTitle>
          <CardDescription>
            Klasifikasi berdasarkan tingkat risiko
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Low Risk */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm font-medium text-green-800 mb-1">Risiko Rendah</div>
              <div className="text-xs text-green-600 mb-2">Belum jatuh tempo</div>
              <div className="text-lg font-bold text-green-900">
                {chartData.find(d => d.quality === InvoiceQuality.CURRENT)?.count || 0}
              </div>
              <div className="text-sm text-green-700">
                {formatCurrency(chartData.find(d => d.quality === InvoiceQuality.CURRENT)?.amount || 0)}
              </div>
            </div>

            {/* Medium Risk */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm font-medium text-yellow-800 mb-1">Risiko Sedang</div>
              <div className="text-xs text-yellow-600 mb-2">1-30 hari</div>
              <div className="text-lg font-bold text-yellow-900">
                {chartData.find(d => d.quality === InvoiceQuality.SPECIAL_MENTION)?.count || 0}
              </div>
              <div className="text-sm text-yellow-700">
                {formatCurrency(chartData.find(d => d.quality === InvoiceQuality.SPECIAL_MENTION)?.amount || 0)}
              </div>
            </div>

            {/* High Risk */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm font-medium text-orange-800 mb-1">Risiko Tinggi</div>
              <div className="text-xs text-orange-600 mb-2">31-60 hari</div>
              <div className="text-lg font-bold text-orange-900">
                {chartData.find(d => d.quality === InvoiceQuality.SUBSTANDARD)?.count || 0}
              </div>
              <div className="text-sm text-orange-700">
                {formatCurrency(chartData.find(d => d.quality === InvoiceQuality.SUBSTANDARD)?.amount || 0)}
              </div>
            </div>

            {/* Critical Risk */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm font-medium text-red-800 mb-1">Risiko Kritis</div>
              <div className="text-xs text-red-600 mb-2">&gt;60 hari</div>
              <div className="text-lg font-bold text-red-900">
                {(chartData.find(d => d.quality === InvoiceQuality.DOUBTFUL)?.count || 0) + 
                 (chartData.find(d => d.quality === InvoiceQuality.BAD_DEBT)?.count || 0)}
              </div>
              <div className="text-sm text-red-700">
                {formatCurrency(
                  (chartData.find(d => d.quality === InvoiceQuality.DOUBTFUL)?.amount || 0) + 
                  (chartData.find(d => d.quality === InvoiceQuality.BAD_DEBT)?.amount || 0)
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}