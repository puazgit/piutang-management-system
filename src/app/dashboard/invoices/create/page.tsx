'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { toast } from 'sonner'

const invoiceSchema = z.object({
  customerId: z.number().min(1, 'Customer harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal invoice harus diisi'),
  termin: z.number().min(1, 'Termin harus diisi'),
  noInvoice: z.string().min(1, 'Nomor invoice harus diisi'),
  kategori: z.string().optional(),
  keteranganTransaksi: z.string().optional(),
  nilaiInvoice: z.number().min(1, 'Nilai invoice harus diisi'),
})

type InvoiceForm = z.infer<typeof invoiceSchema>

interface Customer {
  id: number
  kode: string
  namaCustomer: string
}

function CreateInvoiceForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedCustomerId = searchParams.get('customerId')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      tanggal: new Date().toISOString().split('T')[0],
      termin: 30,
      customerId: preSelectedCustomerId ? parseInt(preSelectedCustomerId) : undefined,
    },
  })

  const tanggalValue = watch('tanggal')
  const terminValue = watch('termin')

  // Calculate due date automatically
  useEffect(() => {
    if (tanggalValue && terminValue) {
      const invoiceDate = new Date(tanggalValue)
      const dueDate = new Date(invoiceDate)
      dueDate.setDate(dueDate.getDate() + terminValue)
      
      // Update the calculated due date display (read-only)
      const dueDateElement = document.getElementById('calculated-due-date')
      if (dueDateElement) {
        dueDateElement.textContent = dueDate.toLocaleDateString('id-ID')
      }
    }
  }, [tanggalValue, terminValue])

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=1000')
      if (!response.ok) throw new Error('Failed to fetch customers')
      const data = await response.json()
      setCustomers(data.customers || data)
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Gagal memuat data customer')
    }
  }

  const onSubmit = async (data: InvoiceForm) => {
    try {
      setIsLoading(true)
      
      // Calculate due date
      const invoiceDate = new Date(data.tanggal)
      const jatuhTempo = new Date(invoiceDate)
      jatuhTempo.setDate(jatuhTempo.getDate() + data.termin)

      const invoiceData = {
        ...data,
        tanggal: new Date(data.tanggal).toISOString(),
        jatuhTempo: jatuhTempo.toISOString(),
        statusPembayaran: 'BELUM_LUNAS',
        statusInvoice: 'AKTIF',
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create invoice')
      }

      const result = await response.json()
      toast.success('Invoice berhasil dibuat!')
      router.push(`/dashboard/invoices/${result.id}`)
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal membuat invoice')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Buat Invoice Baru</h1>
            <p className="text-gray-600 dark:text-gray-400">Buat invoice baru untuk customer</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Invoice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customerId">Customer *</Label>
                  <Select
                    value={watch('customerId')?.toString() || ''}
                    onValueChange={(value) => setValue('customerId', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih customer..." />
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
                    <p className="text-sm text-red-600 mt-1">{errors.customerId.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="noInvoice">Nomor Invoice *</Label>
                  <Input
                    id="noInvoice"
                    {...register('noInvoice')}
                    placeholder="INV-2024-001"
                  />
                  {errors.noInvoice && (
                    <p className="text-sm text-red-600 mt-1">{errors.noInvoice.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tanggal">Tanggal Invoice *</Label>
                    <Input
                      id="tanggal"
                      type="date"
                      {...register('tanggal')}
                    />
                    {errors.tanggal && (
                      <p className="text-sm text-red-600 mt-1">{errors.tanggal.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="termin">Termin (Hari) *</Label>
                    <Input
                      id="termin"
                      type="number"
                      {...register('termin', { valueAsNumber: true })}
                      placeholder="30"
                    />
                    {errors.termin && (
                      <p className="text-sm text-red-600 mt-1">{errors.termin.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Tanggal Jatuh Tempo</Label>
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span id="calculated-due-date" className="text-sm text-gray-700 dark:text-gray-300">
                      Otomatis dihitung
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detail Transaksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="kategori">Kategori</Label>
                  <Input
                    id="kategori"
                    {...register('kategori')}
                    placeholder="Penjualan Barang / Jasa"
                  />
                </div>

                <div>
                  <Label htmlFor="keteranganTransaksi">Keterangan Transaksi</Label>
                  <Textarea
                    id="keteranganTransaksi"
                    {...register('keteranganTransaksi')}
                    placeholder="Deskripsi detail transaksi..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="nilaiInvoice">Nilai Invoice *</Label>
                  <Input
                    id="nilaiInvoice"
                    type="number"
                    step="0.01"
                    {...register('nilaiInvoice', { valueAsNumber: true })}
                    placeholder="5000000"
                  />
                  {errors.nilaiInvoice && (
                    <p className="text-sm text-red-600 mt-1">{errors.nilaiInvoice.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoading}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Membuat...' : 'Buat Invoice'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div>Loading...</div>
        </div>
      </DashboardLayout>
    }>
      <CreateInvoiceForm />
    </Suspense>
  )
}