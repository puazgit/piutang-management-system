'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AgingReport } from '@/components/aging/aging-report'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'

export default function AgingReportPage() {
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export aging report')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Laporan Aging Piutang</h1>
              <p className="text-gray-600">
                Analisis komprehensif kualitas piutang berdasarkan umur jatuh tempo
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Tentang Analisis Aging</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Kategori Kualitas Piutang:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span><strong>Belum Jatuh Tempo:</strong> Invoice yang belum melewati tanggal jatuh tempo</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span><strong>Dalam Perhatian Khusus:</strong> Terlambat 1-30 hari dari jatuh tempo</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    <span><strong>Kurang Lancar:</strong> Terlambat 31-60 hari dari jatuh tempo</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span><strong>Diragukan:</strong> Terlambat 61-90 hari dari jatuh tempo</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
                    <span><strong>Macet:</strong> Terlambat lebih dari 90 hari dari jatuh tempo</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Kegunaan Laporan:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Memantau risiko piutang tidak tertagih</li>
                  <li>• Merencanakan strategi penagihan yang tepat</li>
                  <li>• Mengidentifikasi customer yang perlu perhatian khusus</li>
                  <li>• Mengevaluasi kebijakan kredit perusahaan</li>
                  <li>• Mendukung pengambilan keputusan bisnis</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aging Report Component */}
        <AgingReport showHeader={false} />
      </div>
    </DashboardLayout>
  )
}