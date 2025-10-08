'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createInvoiceSchema, type CreateInvoice } from '@/lib/schemas'
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
  }
  payments: Array<{
    id: number
    penerimaan: number
  }>
}

interface Customer {
  id: number
  kode: string
  namaCustomer: string
}

export default function EditInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    if (params.id) {
      fetchInvoice()
      fetchCustomers()
    }
  }, [params.id])

  useEffect(() => {
    // Auto calculate jatuh tempo when tanggal or termin changes
    if (watchedTanggal && watchedTermin) {
      const tanggalDate = new Date(watchedTanggal)
      const jatuhTempoDate = new Date(tanggalDate)
      jatuhTempoDate.setDate(jatuhTempoDate.getDate() + watchedTermin)
      setValue('jatuhTempo', jatuhTempoDate)
    }
  }, [watchedTanggal, watchedTermin, setValue])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Invoice tidak ditemukan')
      }

      const data = await response.json()
      const invoiceData = data.invoice
      setInvoice(invoiceData)
      
      // Populate form with current data
      reset({
        tanggal: new Date(invoiceData.tanggal),
        termin: invoiceData.termin,
        jatuhTempo: new Date(invoiceData.jatuhTempo),
        noInvoice: invoiceData.noInvoice,
        customerId: invoiceData.customerId,
        kategori: invoiceData.kategori || '',
        keteranganTransaksi: invoiceData.keteranganTransaksi || '',
        nilaiInvoice: invoiceData.nilaiInvoice,
        statusPembayaran: invoiceData.statusPembayaran || 'BELUM_LUNAS',
        statusInvoice: invoiceData.statusInvoice || 'AKTIF',
      })
    } catch (error) {
      console.error('Error fetching invoice:', error)
      toast.error('Gagal memuat data invoice')
      router.push('/dashboard/invoices')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCustomers = async () => {
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
  }

  const onSubmit = async (data: CreateInvoice) => {
    if (!invoice) return

    // Check if invoice has payments and critical fields are being changed
    if (invoice.payments.length > 0) {
      const criticalFieldsChanged = 
        data.customerId !== invoice.customerId || 
        data.nilaiInvoice !== invoice.nilaiInvoice

      if (criticalFieldsChanged) {
        toast.error('Invoice yang sudah ada pembayaran tidak dapat mengubah customer atau nilai invoice')
        return
      }
    }

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
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
        throw new Error(errorData.error || 'Failed to update invoice')
      }

      toast.success('Invoice berhasil diupdate')
      router.push(`/dashboard/invoices/${invoice.id}`)
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal mengupdate invoice')
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

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900">Invoice tidak ditemukan</h2>
          <p className="text-gray-500 mt-2">Invoice yang Anda cari tidak ditemukan.</p>
          <Link href="/dashboard/invoices" className="mt-4">
            <Button>Kembali ke Daftar Invoice</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const hasPayments = invoice.payments.length > 0
  const totalPayments = invoice.payments.reduce((sum, payment) => sum + payment.penerimaan, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/dashboard/invoices/${invoice.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
              <p className="text-sm text-gray-500">{invoice.noInvoice}</p>
            </div>
          </div>
        </div>

        {hasPayments && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-yellow-400 rounded-full"></div>
                <p className="text-sm text-yellow-800">
                  <strong>Peringatan:</strong> Invoice ini sudah memiliki pembayaran sebesar{' '}
                  <span className="font-semibold">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalPayments)}
                  </span>.
                  Customer dan nilai invoice tidak dapat diubah.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Invoice</CardTitle>
            <CardDescription>
              Edit informasi invoice. Beberapa field mungkin tidak dapat diubah jika sudah ada pembayaran.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="noInvoice">No. Invoice *</Label>
                  <Input
                    id="noInvoice"
                    placeholder="INV-2024-001"
                    {...register('noInvoice')}
                    className={errors.noInvoice ? 'border-red-500' : ''}
                  />
                  {errors.noInvoice && (
                    <p className="text-sm text-red-500">{errors.noInvoice.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Select 
                    onValueChange={(value) => setValue('customerId', parseInt(value))}
                    defaultValue={invoice.customerId.toString()}
                    disabled={hasPayments}
                  >
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
                  {hasPayments && (
                    <p className="text-xs text-gray-500">Customer tidak dapat diubah karena sudah ada pembayaran</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tanggal">Tanggal Invoice *</Label>
                  <Input
                    id="tanggal"
                    type="date"
                    {...register('tanggal', { valueAsDate: true })}
                    className={errors.tanggal ? 'border-red-500' : ''}
                  />
                  {errors.tanggal && (
                    <p className="text-sm text-red-500">{errors.tanggal.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termin">Termin (hari) *</Label>
                  <Input
                    id="termin"
                    type="number"
                    placeholder="30"
                    {...register('termin', { valueAsNumber: true })}
                    className={errors.termin ? 'border-red-500' : ''}
                  />
                  {errors.termin && (
                    <p className="text-sm text-red-500">{errors.termin.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jatuhTempo">Jatuh Tempo *</Label>
                  <Input
                    id="jatuhTempo"
                    type="date"
                    {...register('jatuhTempo', { valueAsDate: true })}
                    className={errors.jatuhTempo ? 'border-red-500' : ''}
                    readOnly
                  />
                  {errors.jatuhTempo && (
                    <p className="text-sm text-red-500">{errors.jatuhTempo.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kategori">Kategori</Label>
                  <Input
                    id="kategori"
                    placeholder="Penjualan Barang"
                    {...register('kategori')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nilaiInvoice">Nilai Invoice *</Label>
                  <Input
                    id="nilaiInvoice"
                    type="number"
                    placeholder="1000000"
                    {...register('nilaiInvoice', { valueAsNumber: true })}
                    className={errors.nilaiInvoice ? 'border-red-500' : ''}
                    disabled={hasPayments}
                  />
                  {errors.nilaiInvoice && (
                    <p className="text-sm text-red-500">{errors.nilaiInvoice.message}</p>
                  )}
                  {hasPayments && (
                    <p className="text-xs text-gray-500">Nilai tidak dapat diubah karena sudah ada pembayaran</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan Transaksi</Label>
                <textarea
                  id="keterangan"
                  rows={3}
                  placeholder="Deskripsi invoice atau transaksi"
                  {...register('keteranganTransaksi')}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Link href={`/dashboard/invoices/${invoice.id}`}>
                  <Button type="button" variant="outline">
                    Batal
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}