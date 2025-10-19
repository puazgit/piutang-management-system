'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Phone, Mail, MapPin, Calendar, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

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
  createdAt: string
  updatedAt: string
  invoices: Array<{
    id: number
    tanggal: string
    termin: number
    jatuhTempo: string
    noInvoice: string
    kategori: string | null
    keteranganTransaksi: string | null
    nilaiInvoice: number
    statusPembayaran: string | null
    statusInvoice: string | null
    payments: Array<{
      id: number
      tanggal: string
      keterangan: string | null
      penerimaan: number
    }>
  }>
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/customers/${customerId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch customer')
        }
        
        const data = await response.json()
        setCustomer(data)
      } catch (error) {
        console.error('Error fetching customer:', error)
        setError('Failed to load customer data')
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchCustomer()
    }
  }, [customerId])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !customer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">{error || 'Customer not found'}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const getStatusBadge = (status: string | null) => {
    const statusStyles = {
      'BELUM_LUNAS': 'bg-red-500',
      'LUNAS': 'bg-green-500',
      'AKTIF': 'bg-blue-500',
      'BATAL': 'bg-gray-500',
    }
    
    return (
      <Badge className={`${statusStyles[(status || '') as keyof typeof statusStyles] || 'bg-gray-500'} text-white`}>
        {status || 'Unknown'}
      </Badge>
    )
  }

  const calculatePaidAmount = (payments: Array<{ penerimaan: number }>) => {
    return payments.reduce((sum, payment) => sum + payment.penerimaan, 0)
  }

  const totalInvoiceAmount = customer.invoices?.reduce((sum, invoice) => sum + invoice.nilaiInvoice, 0) || 0
  const totalPaidAmount = customer.invoices?.reduce((sum, invoice) => sum + calculatePaidAmount(invoice.payments), 0) || 0
  const outstandingAmount = totalInvoiceAmount - totalPaidAmount

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customer.namaCustomer || 'Unknown Customer'}</h1>
              <p className="text-gray-600 dark:text-gray-400">Customer Details</p>
            </div>
          </div>
          <Button onClick={() => router.push(`/dashboard/customers/${customer.id}/edit`)}>
            Edit Customer
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                    {customer.namaCustomer?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{customer.namaCustomer || 'Unknown'}</p>
                    {customer.kategori && (
                      <Badge variant="outline">{customer.kategori.keterangan}</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <div className="h-4 w-4 bg-gray-400 rounded-sm flex items-center justify-center text-xs text-white">
                    ID
                  </div>
                  <span>{customer.kode}</span>
                </div>

                {customer.telepon && (
                  <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span>{customer.telepon}</span>
                  </div>
                )}

                {customer.email && (
                  <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    <span>{customer.email}</span>
                  </div>
                )}

                {customer.alamatNoInvoice && (
                  <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{customer.alamatNoInvoice}</span>
                  </div>
                )}

                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Customer since {formatDate(customer.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Invoiced</span>
                  <span className="font-medium">{formatCurrency(totalInvoiceAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Paid</span>
                  <span className="font-medium text-green-600">{formatCurrency(totalPaidAmount)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-gray-600 dark:text-gray-400">Outstanding</span>
                  <span className={`font-medium ${outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(outstandingAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoices */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Invoices ({customer.invoices?.length || 0})</CardTitle>
                <Button onClick={() => router.push(`/dashboard/invoices/create?customerId=${customer.id}`)}>
                  Create Invoice
                </Button>
              </CardHeader>
              <CardContent>
                {!customer.invoices || customer.invoices.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">No invoices found</p>
                    <Button 
                      className="mt-4"
                      onClick={() => router.push(`/dashboard/invoices/create?customerId=${customer.id}`)}
                    >
                      Create First Invoice
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.invoices?.map((invoice) => {
                        const paidAmount = calculatePaidAmount(invoice.payments)
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">
                              {invoice.noInvoice}
                            </TableCell>
                            <TableCell>{formatDate(invoice.tanggal)}</TableCell>
                            <TableCell>{formatDate(invoice.jatuhTempo)}</TableCell>
                            <TableCell>{formatCurrency(invoice.nilaiInvoice)}</TableCell>
                            <TableCell>{formatCurrency(paidAmount)}</TableCell>
                            <TableCell>{getStatusBadge(invoice.statusPembayaran)}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}