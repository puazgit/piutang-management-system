import React from 'react'
import { Badge } from '@/components/ui/badge'
import { InvoiceQuality } from '@/lib/aging-utils'
import { QualityBadgeProps } from '@/lib/types/aging'
import { cn } from '@/lib/utils'

export function QualityBadge({ 
  quality, 
  daysOverdue, 
  size = 'md', 
  showDays = true 
}: QualityBadgeProps) {
  const getQualityConfig = (quality: InvoiceQuality) => {
    switch (quality) {
      case InvoiceQuality.CURRENT:
        return {
          label: 'Belum Jatuh Tempo',
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
          icon: '✅'
        }
      case InvoiceQuality.SPECIAL_MENTION:
        return {
          label: 'Perhatian Khusus',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
          icon: '⚠️'
        }
      case InvoiceQuality.SUBSTANDARD:
        return {
          label: 'Kurang Lancar',
          className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
          icon: '⏰'
        }
      case InvoiceQuality.DOUBTFUL:
        return {
          label: 'Diragukan',
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
          icon: '❌'
        }
      case InvoiceQuality.BAD_DEBT:
        return {
          label: 'Macet',
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
          icon: '💀'
        }
      default:
        return {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '❓'
        }
    }
  }

  const config = getQualityConfig(quality)
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  }

  const getDaysText = () => {
    if (!showDays) return ''
    
    if (daysOverdue < 0) {
      return ` (${Math.abs(daysOverdue)} hari lagi)`
    } else if (daysOverdue === 0) {
      return ' (hari ini)'
    } else {
      return ` (${daysOverdue} hari)`
    }
  }

  return (
    <Badge 
      variant="outline"
      className={cn(
        config.className,
        sizeClasses[size],
        'font-medium border-2 transition-colors duration-200'
      )}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
      {showDays && (
        <span className="ml-1 font-normal opacity-75">
          {getDaysText()}
        </span>
      )}
    </Badge>
  )
}