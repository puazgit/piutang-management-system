'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import { ArrowLeft, Save } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { toast } from 'sonner'

const customerSchema = z.object({
  kode: z.string().min(1, 'Kode customer harus diisi'),
  namaCustomer: z.string().min(1, 'Nama customer harus diisi'),
  kategoriId: z.number().min(1, 'Kategori harus dipilih'),
  alamatNoInvoice: z.string().optional(),
  telepon: z.string().optional(),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
})

type CustomerForm = z.infer<typeof customerSchema>

interface Customer {
  id: number
  kode: string
  namaCustomer: string
  kategoriId: number
  alamatNoInvoice: string | null
  telepon: string | null
  email: string | null
  totalPiutang: number
  kategori: {
    id: number
    keterangan: string
  } | null
}

interface CustomerCategory {
  id: number
  keterangan: string
}

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [categories, setCategories] = useState<CustomerCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  })

  useEffect(() => {
    if (customerId) {
      fetchCustomer()
      fetchCategories()
    }
  }, [customerId])

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/customers/${customerId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch customer')
      }

      const data = await response.json()
      setCustomer(data)

      // Populate form with existing data
      setValue('kode', data.kode)
      setValue('namaCustomer', data.namaCustomer)
      setValue('kategoriId', data.kategoriId)
      setValue('alamatNoInvoice', data.alamatNoInvoice || '')
      setValue('telepon', data.telepon || '')
      setValue('email', data.email || '')
    } catch (error) {
      console.error('Error fetching customer:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load customer'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/customer-categories?limit=100')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data.categories || data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load customer categories')
    }
  }

  const onSubmit = async (data: CustomerForm) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          email: data.email || null,
          alamatNoInvoice: data.alamatNoInvoice || null,
          telepon: data.telepon || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update customer')
      }

      toast.success('Customer berhasil diupdate!')
      router.push(`/dashboard/customers/${customerId}`)
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update customer')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
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
            <Button onClick={() => fetchCustomer()} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => router.push('/dashboard/customers')}>
              Back to Customers
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Customer not found</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">The customer you&apos;re looking for doesn&apos;t exist.</p>
          <Button 
            className="mt-4"
            onClick={() => router.push('/dashboard/customers')}
          >
            Back to Customers
          </Button>
        </div>
      </DashboardLayout>
    )
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
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Customer</h1>
            <p className="text-gray-600 dark:text-gray-400">Update customer information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="kode">Customer Code *</Label>
                  <Input
                    id="kode"
                    {...register('kode')}
                    placeholder="CUST001"
                  />
                  {errors.kode && (
                    <p className="text-sm text-red-600 mt-1">{errors.kode.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="namaCustomer">Customer Name *</Label>
                  <Input
                    id="namaCustomer"
                    {...register('namaCustomer')}
                    placeholder="PT. ABC Company"
                  />
                  {errors.namaCustomer && (
                    <p className="text-sm text-red-600 mt-1">{errors.namaCustomer.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="kategoriId">Category *</Label>
                  <Select
                    value={watch('kategoriId')?.toString() || ''}
                    onValueChange={(value) => setValue('kategoriId', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.keterangan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.kategoriId && (
                    <p className="text-sm text-red-600 mt-1">{errors.kategoriId.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="telepon">Phone Number</Label>
                  <Input
                    id="telepon"
                    {...register('telepon')}
                    placeholder="021-55667788"
                  />
                  {errors.telepon && (
                    <p className="text-sm text-red-600 mt-1">{errors.telepon.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="finance@company.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="alamatNoInvoice">Invoice Address</Label>
                  <Textarea
                    id="alamatNoInvoice"
                    {...register('alamatNoInvoice')}
                    placeholder="Jl. ABC No. 456, Jakarta Pusat"
                    rows={3}
                  />
                  {errors.alamatNoInvoice && (
                    <p className="text-sm text-red-600 mt-1">{errors.alamatNoInvoice.message}</p>
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
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[120px] flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}