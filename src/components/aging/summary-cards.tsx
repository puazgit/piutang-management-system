import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AgingSummaryCardProps } from '@/lib/types/aging'
import { formatCurrency } from '@/lib/aging-utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AgingSummaryCard({
  title,
  count,
  amount,
  percentage,
  colorClass,
  trend
}: AgingSummaryCardProps) {
  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', colorClass.replace('text-', 'border-').replace('-800', '-300'))}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {trend && (
          <div className={cn(
            'flex items-center text-xs',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-1">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold">
              {count}
            </div>
            <div className="text-sm text-gray-500">
              {percentage.toFixed(1)}%
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {formatCurrency(amount)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AgingSummaryGrid({ 
  summary 
}: { 
  summary: {
    current: { count: number; amount: number; percentage: number }
    specialMention: { count: number; amount: number; percentage: number }
    substandard: { count: number; amount: number; percentage: number }
    doubtful: { count: number; amount: number; percentage: number }
    badDebt: { count: number; amount: number; percentage: number }
  }
}) {
  const summaryCards = [
    {
      title: 'Belum Jatuh Tempo',
      ...summary.current,
      colorClass: 'bg-green-50 border-green-200',
    },
    {
      title: 'Perhatian Khusus (1-30 hari)',
      ...summary.specialMention,
      colorClass: 'bg-yellow-50 border-yellow-200',
    },
    {
      title: 'Kurang Lancar (31-60 hari)',
      ...summary.substandard,
      colorClass: 'bg-orange-50 border-orange-200',
    },
    {
      title: 'Diragukan (61-90 hari)',
      ...summary.doubtful,
      colorClass: 'bg-red-50 border-red-200',
    },
    {
      title: 'Macet (>90 hari)',
      ...summary.badDebt,
      colorClass: 'bg-gray-50 border-gray-200',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {summaryCards.map((card, index) => (
        <AgingSummaryCard
          key={index}
          title={card.title}
          count={card.count}
          amount={card.amount}
          percentage={card.percentage}
          colorClass={card.colorClass}
        />
      ))}
    </div>
  )
}