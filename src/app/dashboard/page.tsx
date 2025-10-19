'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  DollarSign,
  ArrowRight,
  Plus,
  BarChart3
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'
import { AgingReport } from '@/components/aging/aging-report'

interface DashboardStats {
  totalCustomers: number
  totalInvoices: number
  totalPiutang: number
  overdueInvoices: number
  totalPaidThisMonth: number
  totalUnpaidInvoices: number
  averageInvoiceValue: number
  totalPaymentsCount: number
}

interface RecentInvoice {
  id: number
  noInvoice: string
  customer: {
    namaCustomer: string
  }
  nilaiInvoice: number
  jatuhTempo: string
  statusPembayaran: string
  isOverdue: boolean
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalInvoices: 0,
    totalPiutang: 0,
    overdueInvoices: 0,
    totalPaidThisMonth: 0,
    totalUnpaidInvoices: 0,
    averageInvoiceValue: 0,
    totalPaymentsCount: 0,
  })
  
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Fetch customers
      const customersResponse = await fetch('/api/customers?limit=1000')
      const customersData = await customersResponse.json()
      const totalCustomers = customersData.customers?.length || 0

      // Fetch invoices
      const invoicesResponse = await fetch('/api/invoices?limit=1000')
      const invoicesData = await invoicesResponse.json()
      const invoices = invoicesData.invoices || []

      // Fetch payments
      const paymentsResponse = await fetch('/api/payments?limit=1000')
      const paymentsData = await paymentsResponse.json()
      const payments = paymentsData.payments || []

      // Calculate stats
      const totalInvoices = invoices.length
      const totalPiutang = invoices.reduce((sum: number, invoice: { remainingBalance: number }) => sum + invoice.remainingBalance, 0)
      const overdueInvoices = invoices.filter((invoice: { isOverdue: boolean }) => invoice.isOverdue).length
      const totalUnpaidInvoices = invoices.filter((invoice: { statusPembayaran: string }) => invoice.statusPembayaran !== 'LUNAS').length
      const averageInvoiceValue = totalInvoices > 0 ? invoices.reduce((sum: number, invoice: { nilaiInvoice: number }) => sum + invoice.nilaiInvoice, 0) / totalInvoices : 0

      // Calculate this month's payments
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const thisMonthPayments = payments.filter((payment: { tanggal: string }) => {
        const paymentDate = new Date(payment.tanggal)
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
      })
      const totalPaidThisMonth = thisMonthPayments.reduce((sum: number, payment: { penerimaan: number }) => sum + payment.penerimaan, 0)

      setStats({
        totalCustomers,
        totalInvoices,
        totalPiutang,
        overdueInvoices,
        totalPaidThisMonth,
        totalUnpaidInvoices,
        averageInvoiceValue,
        totalPaymentsCount: payments.length,
      })

      // Set recent invoices (latest 5)
      const sortedInvoices = invoices
        .sort((a: { createdAt: string }, b: { createdAt: string }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
      
      setRecentInvoices(sortedInvoices)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Gagal memuat data dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    // Prioritas: Jika sudah lunas, selalu tampilkan "Lunas" (hijau)
    if (status === 'LUNAS') {
      return <Badge variant="default" className="bg-green-500">Lunas</Badge>
    }
    
    // Jika belum lunas dan sudah jatuh tempo, tampilkan "Belum Lunas" (merah)
    if (isOverdue && status === 'BELUM_LUNAS') {
      return <Badge variant="destructive">Belum Lunas</Badge>
    }
    
    // Jika belum lunas tapi belum jatuh tempo, tampilkan "Belum Lunas" (outline)
    if (status === 'BELUM_LUNAS') {
      return <Badge variant="outline">Belum Lunas</Badge>
    }
    
    // Fallback untuk status lainnya
    return <Badge variant="outline">{status}</Badge>
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Selamat Datang Kembali! Ada perkembangan apa dengan piutangmu hari ini?
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Hari Ini</p>
            <p className="text-lg font-semibold text-gray-900">
              {format(new Date(), 'dd MMMM yyyy')}
            </p>
          </div>
        </div>

        {/* Alert for Overdue Invoices */}
        {stats.overdueInvoices > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">
                    Perhatian Diperlukan
                  </h3>
                  <p className="text-sm text-red-700">
                    Anda memiliki {stats.overdueInvoices} invoice yang jatuh tempo{stats.overdueInvoices > 1 ? '' : ''} dengan total{' '}
                    <span className="font-semibold">
                      {formatCurrency(recentInvoices
                        .filter(invoice => invoice.isOverdue)
                        .reduce((sum, invoice) => sum + invoice.nilaiInvoice, 0)
                      )}
                    </span>
                  </p>
                </div>
                <Link href="/dashboard/invoices?status=BELUM_LUNAS">
                  <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                    Lihat Detail
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Active customer accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalUnpaidInvoices} unpaid invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Piutang</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalPiutang)}</div>
              <p className="text-xs text-muted-foreground">
                Outstanding receivables
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invoices Jatuh Tempo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueInvoices}</div>
              <p className="text-xs text-muted-foreground">
                Requires immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payments This Month</CardTitle>
              <CreditCard className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaidThisMonth)}</div>
              <p className="text-xs text-muted-foreground">
                Total received in {format(new Date(), 'MMMM yyyy')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Invoice</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averageInvoiceValue)}</div>
              <p className="text-xs text-muted-foreground">
                Average invoice value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPaymentsCount}</div>
              <p className="text-xs text-muted-foreground">
                Payment transactions recorded
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Key metrics at a glance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalInvoices > 0 ? Math.round(((stats.totalInvoices - stats.totalUnpaidInvoices) / stats.totalInvoices) * 100) : 0}%
                </div>
                <div className="text-sm text-blue-600 font-medium">Collection Rate</div>
                <div className="text-xs text-gray-500">Paid invoices</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.overdueInvoices > 0 && stats.totalInvoices > 0 ? Math.round((stats.overdueInvoices / stats.totalInvoices) * 100) : 0}%
                </div>
                <div className="text-sm text-green-600 font-medium">Overdue Rate</div>
                <div className="text-xs text-gray-500">Need attention</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.totalCustomers > 0 ? Math.round(stats.totalInvoices / stats.totalCustomers * 10) / 10 : 0}
                </div>
                <div className="text-sm text-purple-600 font-medium">Avg per Customer</div>
                <div className="text-xs text-gray-500">Invoices/customer</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.totalPaymentsCount}
                </div>
                <div className="text-sm text-orange-600 font-medium">Total Payments</div>
                <div className="text-xs text-gray-500">All transactions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aging Analysis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>Analisis Aging Piutang</span>
              </CardTitle>
              <CardDescription>
                Kualitas piutang berdasarkan umur jatuh tempo
              </CardDescription>
            </div>
            <Link href="/dashboard/aging">
              <Button variant="outline" size="sm">
                View Full Report
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <AgingReport showHeader={false} />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Recent Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>
                  Latest invoice activity
                </CardDescription>
              </div>
              <Link href="/dashboard/invoices">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((invoice) => (
                    <Link key={invoice.id} href={`/dashboard/invoices/${invoice.id}`} className="block">
                      <div className="flex items-center justify-between space-x-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {invoice.noInvoice}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {invoice.customer.namaCustomer}
                          </p>
                          <div className="flex items-center mt-1 space-x-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Due: {format(new Date(invoice.jatuhTempo), 'dd MMM yyyy')}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className="text-sm font-medium">
                            {formatCurrency(invoice.nilaiInvoice)}
                          </span>
                          {getStatusBadge(invoice.statusPembayaran, invoice.isOverdue)}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No invoices found</p>
                    <Link href="/dashboard/invoices" className="mt-2">
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/dashboard/invoices" className="block">
                  <div className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Create New Invoice</p>
                          <p className="text-sm text-gray-500">Generate a new invoice for a customer</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/payments" className="block">
                  <div className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">View Payments</p>
                          <p className="text-sm text-gray-500">Check all payment records</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/customers" className="block">
                  <div className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-medium">Manage Customers</p>
                          <p className="text-sm text-gray-500">Add or edit customer information</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/invoices?status=BELUM_LUNAS" className="block">
                  <div className="w-full p-3 text-left border rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium">View Overdue</p>
                          <p className="text-sm text-gray-500">Check all overdue invoices ({stats.overdueInvoices} items)</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}