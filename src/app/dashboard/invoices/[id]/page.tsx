'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Receipt, 
  CreditCard, 
  Plus,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPaymentSchema, type CreatePayment } from '@/lib/schemas'
import { toast } from 'sonner'
import Link from 'next/link'

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
    tanggal: string
    keterangan: string | null
    penerimaan: number
    createdAt: string
    updatedAt: string
  }>
  totalPayments: number
  remainingBalance: number
  isFullyPaid: boolean
  isOverdue: boolean
  createdAt: string
  updatedAt: string
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>('transfer')
  const [suggestedAmount, setSuggestedAmount] = useState<number>(0)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePayment>({
    resolver: zodResolver(createPaymentSchema),
  })

  const penerimaanValue = watch('penerimaan')

  useEffect(() => {
    if (params.id) {
      fetchInvoice()
    }
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/invoices/${params.id}`, {
        cache: 'no-store', // Prevent caching
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch invoice')
      }

      const data = await response.json()
      setInvoice(data.invoice || data)
    } catch (error) {
      console.error('Error fetching invoice:', error)
      setError(error instanceof Error ? error.message : 'Gagal memuat data invoice')
      toast.error(error instanceof Error ? error.message : 'Gagal memuat data invoice')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: CreatePayment) => {
    console.log('🚀 Form submission started with data:', data)
    console.log('📊 Current invoice:', invoice)
    console.log('🔧 Payment method:', paymentMethod)
    
    try {
      const paymentData = {
        ...data,
        invoiceId: parseInt(params.id as string),
        keterangan: data.keterangan || `Pembayaran via ${paymentMethod}`,
      }
      
      console.log('📤 Sending payment data:', paymentData)
      
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment')
      }

      const successMessage = invoice?.remainingBalance === data.penerimaan 
        ? '🎉 Pembayaran berhasil dicatat - Invoice LUNAS!' 
        : '✅ Pembayaran berhasil dicatat'
      
      toast.success(successMessage)
      setIsPaymentDialogOpen(false)
      reset()
      fetchInvoice() // Call without await - non-blocking refresh
    } catch (error) {
      console.error('Error creating payment:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal mencatat pembayaran')
    }
  }

  const handleOpenPaymentDialog = () => {
    if (!invoice) return
    
    // Set suggested amount to remaining balance
    const remaining = invoice.remainingBalance
    setSuggestedAmount(remaining)
    
    reset({
      tanggal: new Date().toISOString().split('T')[0],
      penerimaan: remaining || 0,
      keterangan: ''
    })
    setPaymentMethod('transfer')
    
    // Set value after reset to ensure it's properly set
    setTimeout(() => {
      setValue('penerimaan', remaining)
    }, 0)
  }

  const handleQuickAmount = (percentage: number) => {
    if (!invoice) return
    const amount = Math.round(invoice.remainingBalance * (percentage / 100))
    setValue('penerimaan', amount)
  }

  const handlePayFull = () => {
    if (!invoice) return
    setValue('penerimaan', invoice.remainingBalance)
  }

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pembayaran ini?')) {
      return
    }

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete payment')
      }

      toast.success('Pembayaran berhasil dihapus')
      
      // Force refresh invoice data
      await fetchInvoice()
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

  const getStatusBadge = () => {
    if (!invoice) return null

    if (invoice.isOverdue) {
      return <Badge variant="destructive">Jatuh Tempo</Badge>
    }
    
    switch (invoice.statusPembayaran) {
      case 'LUNAS':
        return <Badge variant="default" className="bg-green-500">Lunas</Badge>
      case 'SEBAGIAN':
        return <Badge variant="secondary">Sebagian</Badge>
      case 'BELUM_LUNAS':
        return <Badge variant="outline">Belum Lunas</Badge>
      default:
        return <Badge variant="outline">{invoice.statusPembayaran}</Badge>
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Error</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{error}</p>
          <div className="mt-4 space-x-3">
            <Button onClick={() => fetchInvoice()} variant="outline">
              Coba Lagi
            </Button>
            <Link href="/dashboard/invoices">
              <Button>Kembali ke Daftar Invoice</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Invoice tidak ditemukan</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Invoice yang Anda cari tidak ditemukan.</p>
          <Link href="/dashboard/invoices" className="mt-4">
            <Button>Kembali ke Daftar Invoice</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/invoices">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detail Invoice</h1>
              <p className="text-sm text-gray-500">{invoice.noInvoice}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            {invoice.isOverdue && (
              <div className="flex items-center text-red-500 text-sm">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Jatuh Tempo
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2" />
                  Informasi Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">No. Invoice</Label>
                    <p className="text-sm font-semibold">{invoice.noInvoice}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nilai Invoice</Label>
                    <p className="text-sm font-semibold">{formatCurrency(invoice.nilaiInvoice)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Tanggal Invoice</Label>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {format(new Date(invoice.tanggal), 'dd MMMM yyyy')}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Jatuh Tempo</Label>
                    <div className={`flex items-center text-sm ${invoice.isOverdue ? 'text-red-600' : ''}`}>
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {format(new Date(invoice.jatuhTempo), 'dd MMMM yyyy')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Termin</Label>
                    <p className="text-sm">{invoice.termin} hari</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Kategori</Label>
                    <p className="text-sm">{invoice.kategori || '-'}</p>
                  </div>
                </div>

                {invoice.keteranganTransaksi && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Keterangan</Label>
                    <p className="text-sm">{invoice.keteranganTransaksi}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Informasi Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Kode Customer</Label>
                    <p className="text-sm font-semibold">{invoice.customer.kode}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nama Customer</Label>
                    <p className="text-sm font-semibold">{invoice.customer.namaCustomer}</p>
                  </div>
                </div>
                
                {invoice.customer.kategori?.keterangan && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-500">Kategori Customer</Label>
                    <p className="text-sm">{invoice.customer.kategori.keterangan}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Riwayat Pembayaran
                  </CardTitle>
                  
                  {!invoice.isFullyPaid && (
                    <Dialog 
                      open={isPaymentDialogOpen} 
                      onOpenChange={(open) => {
                        setIsPaymentDialogOpen(open)
                        if (open) {
                          handleOpenPaymentDialog()
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Catat Pembayaran
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Catat Pembayaran</DialogTitle>
                          <DialogDescription>
                            Invoice {invoice.noInvoice} - Sisa tagihan: <span className="font-semibold text-primary">{formatCurrency(invoice.remainingBalance)}</span>
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                          {/* Quick Amount Buttons */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Jumlah Cepat</Label>
                            <div className="grid grid-cols-4 gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickAmount(25)}
                                className="text-xs"
                              >
                                25%
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickAmount(50)}
                                className="text-xs"
                              >
                                50%
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickAmount(75)}
                                className="text-xs"
                              >
                                75%
                              </Button>
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={handlePayFull}
                                className="text-xs"
                              >
                                Lunas
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="tanggal">Tanggal Pembayaran *</Label>
                            <Input
                              id="tanggal"
                              type="date"
                              defaultValue={new Date().toISOString().split('T')[0]}
                              {...register('tanggal', { required: 'Tanggal wajib diisi' })}
                              className={errors.tanggal ? 'border-red-500' : ''}
                            />
                            {errors.tanggal && (
                              <p className="text-sm text-red-500">{errors.tanggal.message}</p>
                            )}
                          </div>

                          {/* Payment Method */}
                          <div className="space-y-2">
                            <Label>Metode Pembayaran</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                type="button"
                                variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPaymentMethod('transfer')}
                                className="text-xs"
                              >
                                Transfer
                              </Button>
                              <Button
                                type="button"
                                variant={paymentMethod === 'tunai' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPaymentMethod('tunai')}
                                className="text-xs"
                              >
                                Tunai
                              </Button>
                              <Button
                                type="button"
                                variant={paymentMethod === 'giro' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPaymentMethod('giro')}
                                className="text-xs"
                              >
                                Giro
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label htmlFor="penerimaan">Jumlah Pembayaran *</Label>
                              {penerimaanValue && penerimaanValue === invoice.remainingBalance && (
                                <Badge variant="default" className="text-xs">
                                  Pelunasan
                                </Badge>
                              )}
                            </div>
                            <Input
                              id="penerimaan"
                              type="number"
                              placeholder="Masukkan jumlah pembayaran"
                              step="1"
                              min="1"
                              {...register('penerimaan', { 
                                valueAsNumber: true,
                                required: 'Jumlah pembayaran wajib diisi',
                                min: { value: 1, message: 'Jumlah harus lebih dari 0' },
                                validate: (value) => {
                                  if (!invoice) return 'Invoice tidak ditemukan'
                                  if (value > invoice.remainingBalance) return 'Jumlah melebihi sisa tagihan'
                                  return true
                                }
                              })}
                              className={errors.penerimaan ? 'border-red-500' : ''}
                            />
                            {errors.penerimaan && (
                              <p className="text-sm text-red-500">{errors.penerimaan.message}</p>
                            )}
                            {penerimaanValue > 0 && penerimaanValue < invoice.remainingBalance && (
                              <p className="text-xs text-amber-600">
                                Sisa setelah pembayaran: {formatCurrency(invoice.remainingBalance - penerimaanValue)}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="keterangan">Keterangan</Label>
                            <textarea
                              id="keterangan"
                              rows={3}
                              placeholder={`Pembayaran via ${paymentMethod}...`}
                              {...register('keterangan')}
                              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>

                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsPaymentDialogOpen(false)}
                            >
                              Batal
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {invoice.payments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                              {format(new Date(payment.tanggal), 'dd/MM/yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-green-600">
                              {formatCurrency(payment.penerimaan)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {payment.keterangan || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeletePayment(payment.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>Belum ada pembayaran</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Nilai Invoice:</span>
                  <span className="text-sm font-semibold">{formatCurrency(invoice.nilaiInvoice)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total Terbayar:</span>
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(invoice.totalPayments)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Sisa Tagihan:</span>
                  <span className={`text-sm font-bold ${invoice.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(invoice.remainingBalance)}
                  </span>
                </div>

                <div className="pt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (invoice.totalPayments / invoice.nilaiInvoice) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {Math.round((invoice.totalPayments / invoice.nilaiInvoice) * 100)}% terbayar
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/dashboard/invoices/${invoice.id}/edit`} className="w-full">
                  <Button variant="outline" className="w-full">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Invoice
                  </Button>
                </Link>
                
                <Link href={`/dashboard/customers/${invoice.customerId}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    Lihat Customer
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}