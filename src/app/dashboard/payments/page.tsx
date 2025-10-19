'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Calendar, Receipt, User, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import Link from 'next/link'

interface Payment {
  id: number
  tanggal: string
  keterangan: string | null
  penerimaan: number
  invoiceId: number
  invoice: {
    id: number
    noInvoice: string
    nilaiInvoice: number
    customer: {
      id: number
      kode: string
      namaCustomer: string
    }
  }
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPayments()
  }, [pagination.page, searchTerm])

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/payments?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments')
      }

      const data = await response.json()
      setPayments(data.payments || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Gagal memuat data pembayaran')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, searchTerm])

  const handleDelete = async (payment: Payment) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pembayaran sebesar ${formatCurrency(payment.penerimaan)}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete payment')
      }

      toast.success('Pembayaran berhasil dihapus')
      fetchPayments()
    } catch (error) {
      console.error('Error deleting payment:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus pembayaran')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const resetFilters = () => {
    setSearchTerm('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Calculate statistics
  const totalPayments = payments.reduce((sum, payment) => sum + payment.penerimaan, 0)
  const uniqueInvoices = new Set(payments.map(payment => payment.invoiceId)).size
  const uniqueCustomers = new Set(payments.map(payment => payment.invoice.customer.id)).size

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pembayaran</h1>
            <p className="mt-1 text-sm text-gray-500">
              Riwayat pembayaran dari customer
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pembayaran</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPayments)}</div>
              <p className="text-xs text-muted-foreground">
                Dari {payments.length} transaksi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invoice Terbayar</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueInvoices}</div>
              <p className="text-xs text-muted-foreground">
                Invoice dengan pembayaran
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Aktif</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Customer yang sudah bayar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payments.length > 0 ? formatCurrency(totalPayments / payments.length) : formatCurrency(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per pembayaran
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2 flex-1">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari pembayaran (invoice/customer)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <Button variant="outline" onClick={resetFilters}>
                Reset Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Riwayat Pembayaran</CardTitle>
                <CardDescription>
                  {pagination.total} pembayaran, halaman {pagination.page} dari {pagination.totalPages}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            {format(new Date(payment.tanggal), 'dd/MM/yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/dashboard/invoices/${payment.invoice.id}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {payment.invoice.noInvoice}
                          </Link>
                          <p className="text-xs text-gray-500">
                            Nilai: {formatCurrency(payment.invoice.nilaiInvoice)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.invoice.customer.namaCustomer}</p>
                            <p className="text-sm text-gray-500">{payment.invoice.customer.kode}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-green-600">
                            {formatCurrency(payment.penerimaan)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {payment.keterangan || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(payment)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {payments.length === 0 && !isLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Tidak ada pembayaran ditemukan
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                      Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} pembayaran
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                      >
                        Sebelumnya
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}