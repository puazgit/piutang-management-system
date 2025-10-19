'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Edit2, Trash2, Search, Eye, Calendar, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createInvoiceSchema, type CreateInvoice } from '@/lib/schemas'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'
import { QualityBadge } from '@/components/aging/quality-badge'
import { AgingAnalysis } from '@/lib/types/aging'

interface Invoice {
  id: number
  tanggal: string
  termin: number
  jatuhTempo: string
  noInvoice: string
  customerId: number
  kategori: string | null
  keteranganTransaksi: string | null
  nilaiInvoice: number
  statusPembayaran: string | null
  statusInvoice: string | null
  customer: {
    id: number
    kode: string
    namaCustomer: string
    kategori: {
      keterangan: string | null
    }
  }
  payments: Array<{
    id: number
    penerimaan: number
  }>
  totalPayments: number
  remainingBalance: number
  isFullyPaid: boolean
  isOverdue: boolean
  aging: AgingAnalysis
  createdAt: string
  updatedAt: string
}

interface Customer {
  id: number
  kode: string
  namaCustomer: string
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateInvoice>({
    resolver: zodResolver(createInvoiceSchema),
  })

  const watchedTanggal = watch('tanggal')
  const watchedTermin = watch('termin')


  useEffect(() => {
    fetchInvoices()
    fetchCustomers()
  }, [pagination.page, searchTerm, selectedCustomer, selectedStatus])

  useEffect(() => {
    // Auto calculate jatuh tempo when tanggal or termin changes
    if (watchedTanggal && watchedTermin && watchedTermin > 0) {
      // Handle Date object or string
      let tanggalDate: Date
      if (watchedTanggal instanceof Date) {
        tanggalDate = watchedTanggal
      } else {
        tanggalDate = new Date(watchedTanggal)
      }
      
      // Add termin days
      const jatuhTempoDate = new Date(tanggalDate)
      jatuhTempoDate.setDate(jatuhTempoDate.getDate() + watchedTermin)
      
      // Set the value as Date object (since we use valueAsDate: true)
      setValue('jatuhTempo', jatuhTempoDate, { shouldValidate: true, shouldDirty: false })
    }
  }, [watchedTanggal, watchedTermin, setValue])

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch('/api/customers?limit=1000')
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }

      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Gagal memuat data customer')
    }
  }, [])

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      if (selectedCustomer && selectedCustomer !== 'all') {
        params.append('customerId', selectedCustomer)
      }

      if (selectedStatus && selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      const response = await fetch(`/api/invoices?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }

      const data = await response.json()
      setInvoices(data.invoices || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast.error('Gagal memuat data invoice')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, searchTerm, selectedCustomer, selectedStatus])

  const onCreateSubmit = async (data: CreateInvoice) => {
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          tanggal: data.tanggal.toISOString(),
          jatuhTempo: data.jatuhTempo.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create invoice')
      }

      toast.success('Invoice berhasil dibuat')
      setIsCreateDialogOpen(false)
      reset()
      fetchInvoices()
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal membuat invoice')
    }
  }



  const handleDelete = async (invoice: Invoice) => {
    if (invoice.payments.length > 0) {
      toast.error('Invoice tidak dapat dihapus karena sudah ada pembayaran')
      return
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus invoice "${invoice.noInvoice}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete invoice')
      }

      toast.success('Invoice berhasil dihapus')
      fetchInvoices()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus invoice')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (invoice: Invoice) => {
    // Prioritas: Jika sudah lunas, selalu tampilkan "Lunas" (hijau)
    if (invoice.statusPembayaran === 'LUNAS') {
      return <Badge variant="default" className="bg-green-500">Lunas</Badge>
    }
    
    // Jika belum lunas dan sudah jatuh tempo, tampilkan "Belum Lunas" (merah)  
    if (invoice.isOverdue && invoice.statusPembayaran === 'BELUM_LUNAS') {
      return <Badge variant="destructive">Belum Lunas</Badge>
    }
    
    // Jika belum lunas tapi belum jatuh tempo, tampilkan "Belum Lunas" (outline)
    if (invoice.statusPembayaran === 'BELUM_LUNAS') {
      return <Badge variant="outline">Belum Lunas</Badge>
    }
    
    // Fallback untuk status lainnya
    return <Badge variant="outline">{invoice.statusPembayaran}</Badge>
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCustomer('all')
    setSelectedStatus('all')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="mt-1 text-sm text-gray-500">
              Kelola invoice dan tagihan customer
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open)
            if (open) {
              // Reset form ketika dialog dibuka dengan default values
              const today = new Date()
              const defaultTermin = 30
              const defaultJatuhTempo = new Date(today)
              defaultJatuhTempo.setDate(defaultJatuhTempo.getDate() + defaultTermin)
              
              reset({
                tanggal: today,
                termin: defaultTermin,
                jatuhTempo: defaultJatuhTempo,
                noInvoice: '',
                kategori: '',
                keteranganTransaksi: '',
              })
            } else {
              // Reset form when closing
              reset()
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Buat Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Buat Invoice Baru</DialogTitle>
                <DialogDescription>
                  Buat invoice baru untuk customer
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-noInvoice">No. Invoice *</Label>
                    <Input
                      id="create-noInvoice"
                      placeholder="INV-2024-001"
                      {...register('noInvoice')}
                      className={errors.noInvoice ? 'border-red-500' : ''}
                    />
                    {errors.noInvoice && (
                      <p className="text-sm text-red-500">{errors.noInvoice.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-customer">Customer *</Label>
                    <Select onValueChange={(value) => setValue('customerId', parseInt(value))}>
                      <SelectTrigger className={errors.customerId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Pilih customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.kode} - {customer.namaCustomer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.customerId && (
                      <p className="text-sm text-red-500">{errors.customerId.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-tanggal">Tanggal Invoice *</Label>
                    <Input
                      id="create-tanggal"
                      type="date"
                      {...register('tanggal', { valueAsDate: true })}
                      className={errors.tanggal ? 'border-red-500' : ''}
                    />
                    {errors.tanggal && (
                      <p className="text-sm text-red-500">{errors.tanggal.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-termin">Termin (hari) *</Label>
                    <Input
                      id="create-termin"
                      type="number"
                      placeholder="30"
                      min="1"
                      max="365"
                      {...register('termin', { valueAsNumber: true })}
                      className={errors.termin ? 'border-red-500' : ''}
                    />
                    {errors.termin && (
                      <p className="text-sm text-red-500">{errors.termin.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Jatuh tempo akan otomatis dihitung berdasarkan tanggal + termin
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-jatuhTempo" className="flex items-center gap-2">
                      Jatuh Tempo *
                      {watchedTanggal && watchedTermin && (
                        <span className="text-xs text-green-600 font-normal">
                          (otomatis terisi)
                        </span>
                      )}
                    </Label>
                    <Input
                      id="create-jatuhTempo"
                      type="date"
                      {...register('jatuhTempo', { valueAsDate: true })}
                      className={
                        errors.jatuhTempo 
                          ? 'border-red-500' 
                          : (watchedTanggal && watchedTermin ? 'bg-green-50 border-green-200' : '')
                      }
                      placeholder="Akan terisi otomatis"
                    />
                    {errors.jatuhTempo && (
                      <p className="text-sm text-red-500">{errors.jatuhTempo.message}</p>
                    )}
                    {watchedTanggal && watchedTermin && watchedTermin > 0 && (
                      <p className="text-xs text-gray-500">
                        Tanggal {watchedTanggal instanceof Date 
                          ? format(watchedTanggal, 'dd/MM/yyyy') 
                          : format(new Date(watchedTanggal), 'dd/MM/yyyy')
                        } + {watchedTermin} hari
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-kategori">Kategori</Label>
                    <Input
                      id="create-kategori"
                      placeholder="Penjualan Barang"
                      {...register('kategori')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-nilaiInvoice">Nilai Invoice *</Label>
                    <Input
                      id="create-nilaiInvoice"
                      type="number"
                      placeholder="1000000"
                      {...register('nilaiInvoice', { valueAsNumber: true })}
                      className={errors.nilaiInvoice ? 'border-red-500' : ''}
                    />
                    {errors.nilaiInvoice && (
                      <p className="text-sm text-red-500">{errors.nilaiInvoice.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-keterangan">Keterangan Transaksi</Label>
                  <textarea
                    id="create-keterangan"
                    rows={3}
                    placeholder="Deskripsi invoice atau transaksi"
                    {...register('keteranganTransaksi')}
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
                  placeholder="Cari invoice (no/customer)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Semua customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua customer</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.kode} - {customer.namaCustomer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  <SelectItem value="BELUM_LUNAS">Belum Lunas</SelectItem>
                  <SelectItem value="LUNAS">Lunas</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters}>
                Reset Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Daftar Invoice</CardTitle>
                <CardDescription>
                  {pagination.total} invoice, halaman {pagination.page} dari {pagination.totalPages}
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
                      <TableHead>No. Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jatuh Tempo</TableHead>
                      <TableHead>Nilai</TableHead>
                      <TableHead>Terbayar</TableHead>
                      <TableHead>Sisa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Kualitas</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-medium">{invoice.noInvoice}</p>
                            {invoice.isOverdue && (
                              <div className="flex items-center text-red-500 text-xs mt-1">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Jatuh Tempo
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{invoice.customer.namaCustomer}</p>
                            <p className="text-sm text-gray-500">{invoice.customer.kode}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            {format(new Date(invoice.tanggal), 'dd/MM/yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center text-sm ${invoice.isOverdue ? 'text-red-600' : ''}`}>
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            {format(new Date(invoice.jatuhTempo), 'dd/MM/yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatCurrency(invoice.nilaiInvoice)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={invoice.totalPayments > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}>
                            {formatCurrency(invoice.totalPayments)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={invoice.remainingBalance > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                            {formatCurrency(invoice.remainingBalance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(invoice)}
                        </TableCell>
                        <TableCell>
                          {invoice.aging ? (
                            <QualityBadge 
                              quality={invoice.aging.quality}
                              daysOverdue={invoice.aging.daysOverdue}
                              size="sm"
                              showDays={false}
                            />
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              N/A
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Link href={`/dashboard/invoices/${invoice.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                              <Button variant="outline" size="sm">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(invoice)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {invoices.length === 0 && !isLoading && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          Tidak ada invoice ditemukan
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                      Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} invoice
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