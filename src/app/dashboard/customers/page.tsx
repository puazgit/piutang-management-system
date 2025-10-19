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
import { Plus, Edit2, Trash2, Search, Eye } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCustomerSchema, type CreateCustomer } from '@/lib/schemas'
import { toast } from 'sonner'
import Link from 'next/link'

interface Customer {
  id: number
  kode: string
  namaCustomer: string
  kategoriId: number
  alamatNoInvoice: string | null
  totalPiutang: number
  kategori: {
    id: number
    keterangan: string | null
  }
  _count: {
    invoices: number
  }
  createdAt: string
  updatedAt: string
}

interface CustomerCategory {
  id: number
  keterangan: string | null
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [categories, setCategories] = useState<CustomerCategory[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomer>({
    resolver: zodResolver(createCustomerSchema),
  })

  useEffect(() => {
    fetchCustomers()
    fetchCategories()
  }, [pagination.page, searchTerm, selectedCategory])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/customer-categories?limit=100')
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Gagal memuat kategori customer')
    }
  }

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      if (selectedCategory && selectedCategory !== 'all') {
        params.append('categoryId', selectedCategory)
      }

      const response = await fetch(`/api/customers?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }

      const data = await response.json()
      setCustomers(data.customers || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Gagal memuat data customer')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, searchTerm, selectedCategory])

  const onCreateSubmit = async (data: CreateCustomer) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create customer')
      }

      toast.success('Customer berhasil dibuat')
      setIsCreateDialogOpen(false)
      reset()
      fetchCustomers()
    } catch (error) {
      console.error('Error creating customer:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal membuat customer')
    }
  }

  const onEditSubmit = async (data: CreateCustomer) => {
    if (!editingCustomer) return

    try {
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update customer')
      }

      toast.success('Customer berhasil diupdate')
      setIsEditDialogOpen(false)
      setEditingCustomer(null)
      reset()
      fetchCustomers()
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal mengupdate customer')
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    reset({
      kode: customer.kode,
      namaCustomer: customer.namaCustomer,
      kategoriId: customer.kategoriId,
      alamatNoInvoice: customer.alamatNoInvoice || '',
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (customer: Customer) => {
    if (customer._count.invoices > 0) {
      toast.error('Customer tidak dapat dihapus karena memiliki invoice')
      return
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus customer "${customer.namaCustomer}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete customer')
      }

      toast.success('Customer berhasil dihapus')
      fetchCustomers()
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus customer')
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
    setSelectedCategory('all')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pelanggan</h1>
            <p className="mt-1 text-sm text-gray-500">
              Kelola data pelanggan dan informasi kontak
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pelanggan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
                <DialogDescription>
                  Tambahkan customer baru ke dalam sistem
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-kode">Kode Pelanggan *</Label>
                  <Input
                    id="create-kode"
                    placeholder="CUST001"
                    {...register('kode')}
                    className={errors.kode ? 'border-red-500' : ''}
                  />
                  {errors.kode && (
                    <p className="text-sm text-red-500">{errors.kode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-nama">Nama Pelanggan *</Label>
                  <Input
                    id="create-nama"
                    placeholder="PT. Contoh Company"
                    {...register('namaCustomer')}
                    className={errors.namaCustomer ? 'border-red-500' : ''}
                  />
                  {errors.namaCustomer && (
                    <p className="text-sm text-red-500">{errors.namaCustomer.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-kategori">Kategori *</Label>
                  <Select 
                    onValueChange={(value) => setValue('kategoriId', parseInt(value))}
                  >
                    <SelectTrigger className={errors.kategoriId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.keterangan || `Kategori ${category.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.kategoriId && (
                    <p className="text-sm text-red-500">{errors.kategoriId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-alamat">Alamat Invoice</Label>
                  <Input
                    id="create-alamat"
                    placeholder="Jl. Contoh No. 123, Jakarta"
                    {...register('alamatNoInvoice')}
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
                  placeholder="Cari customer (kode/nama)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Semua kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua kategori</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.keterangan || `Kategori ${category.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters}>
                Reset Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Daftar Pelanggan</CardTitle>
                <CardDescription>
                  {pagination.total} pelanggan, halaman {pagination.page} dari {pagination.totalPages}
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
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama Pelanggan</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Total Piutang</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          {customer.kode}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.namaCustomer}</p>
                            {customer.alamatNoInvoice && (
                              <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                {customer.alamatNoInvoice}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {customer.kategori.keterangan || `Kategori ${customer.kategori.id}`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={customer.totalPiutang > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                            {formatCurrency(customer.totalPiutang)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {customer._count.invoices} invoice
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Link href={`/dashboard/customers/${customer.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(customer)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(customer)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {customers.length === 0 && !isLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Tidak ada customer ditemukan
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                      Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} customer
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

        {/* Edit Dialog - Similar structure to Create Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                Ubah informasi customer
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
              {/* Same form fields as create dialog */}
              <div className="space-y-2">
                <Label htmlFor="edit-kode">Kode Customer *</Label>
                <Input
                  id="edit-kode"
                  placeholder="CUST001"
                  {...register('kode')}
                  className={errors.kode ? 'border-red-500' : ''}
                />
                {errors.kode && (
                  <p className="text-sm text-red-500">{errors.kode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-nama">Nama Customer *</Label>
                <Input
                  id="edit-nama"
                  placeholder="PT. Contoh Company"
                  {...register('namaCustomer')}
                  className={errors.namaCustomer ? 'border-red-500' : ''}
                />
                {errors.namaCustomer && (
                  <p className="text-sm text-red-500">{errors.namaCustomer.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-kategori">Kategori *</Label>
                <Select 
                  value={editingCustomer?.kategoriId.toString()}
                  onValueChange={(value) => setValue('kategoriId', parseInt(value))}
                >
                  <SelectTrigger className={errors.kategoriId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.keterangan || `Kategori ${category.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.kategoriId && (
                  <p className="text-sm text-red-500">{errors.kategoriId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-alamat">Alamat Invoice</Label>
                <Input
                  id="edit-alamat"
                  placeholder="Jl. Contoh No. 123, Jakarta"
                  {...register('alamatNoInvoice')}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingCustomer(null)
                    reset()
                  }}
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
    </DashboardLayout>
  )
}