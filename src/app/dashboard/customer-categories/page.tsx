'use client'

import { useState, useEffect } from 'react'
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
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCustomerCategorySchema, type CreateCustomerCategory } from '@/lib/schemas'
import { toast } from 'sonner'

interface CustomerCategory {
  id: number
  keterangan: string | null
  _count: {
    customers: number
  }
  createdAt: string
  updatedAt: string
}

export default function CustomerCategoriesPage() {
  const [categories, setCategories] = useState<CustomerCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CustomerCategory | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomerCategory>({
    resolver: zodResolver(createCustomerCategorySchema),
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/customer-categories')
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Gagal memuat kategori customer')
    } finally {
      setIsLoading(false)
    }
  }

  const onCreateSubmit = async (data: CreateCustomerCategory) => {
    try {
      const response = await fetch('/api/customer-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create category')
      }

      toast.success('Kategori customer berhasil dibuat')
      setIsCreateDialogOpen(false)
      reset()
      fetchCategories()
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal membuat kategori')
    }
  }

  const onEditSubmit = async (data: CreateCustomerCategory) => {
    if (!editingCategory) return

    try {
      const response = await fetch(`/api/customer-categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update category')
      }

      toast.success('Kategori customer berhasil diupdate')
      setIsEditDialogOpen(false)
      setEditingCategory(null)
      reset()
      fetchCategories()
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal mengupdate kategori')
    }
  }

  const handleEdit = (category: CustomerCategory) => {
    setEditingCategory(category)
    reset({ keterangan: category.keterangan || '' })
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (category: CustomerCategory) => {
    if (category._count.customers > 0) {
      toast.error('Kategori tidak dapat dihapus karena masih digunakan oleh customer')
      return
    }

    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      return
    }

    try {
      const response = await fetch(`/api/customer-categories/${category.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete category')
      }

      toast.success('Kategori customer berhasil dihapus')
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus kategori')
    }
  }

  const filteredCategories = categories.filter(category =>
    category.keterangan?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Categories</h1>
            <p className="mt-1 text-sm text-gray-500">
              Kelola kategori customer untuk organisasi yang lebih baik
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kategori
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Kategori Customer</DialogTitle>
                <DialogDescription>
                  Buat kategori baru untuk mengelompokkan customer
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-keterangan">Nama Kategori</Label>
                  <Input
                    id="create-keterangan"
                    placeholder="Masukkan nama kategori"
                    {...register('keterangan')}
                    className={errors.keterangan ? 'border-red-500' : ''}
                  />
                  {errors.keterangan && (
                    <p className="text-sm text-red-500">{errors.keterangan.message}</p>
                  )}
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

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Kategori Customer</CardTitle>
            <CardDescription>
              {filteredCategories.length} kategori ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nama Kategori</TableHead>
                    <TableHead>Jumlah Customer</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.id}
                      </TableCell>
                      <TableCell>
                        {category.keterangan || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {category._count.customers} customer
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(category.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(category)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCategories.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Tidak ada kategori ditemukan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Kategori Customer</DialogTitle>
              <DialogDescription>
                Ubah informasi kategori customer
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-keterangan">Nama Kategori</Label>
                <Input
                  id="edit-keterangan"
                  placeholder="Masukkan nama kategori"
                  {...register('keterangan')}
                  className={errors.keterangan ? 'border-red-500' : ''}
                />
                {errors.keterangan && (
                  <p className="text-sm text-red-500">{errors.keterangan.message}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingCategory(null)
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