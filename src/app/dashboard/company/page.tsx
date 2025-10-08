'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Save, RefreshCw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCompanyProfileSchema, type CreateCompanyProfile } from '@/lib/schemas'
import { toast } from 'sonner'

interface CompanyProfile {
  id: number
  namaUsaha: string
  alamatUsaha: string
  nomorTelepon: string
  createdAt: string
  updatedAt: string
}

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateCompanyProfile>({
    resolver: zodResolver(createCompanyProfileSchema),
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/company-profile')
      
      if (!response.ok) {
        throw new Error('Failed to fetch company profile')
      }

      const data = await response.json()
      setProfile(data.profile)
      
      if (data.profile) {
        reset({
          namaUsaha: data.profile.namaUsaha,
          alamatUsaha: data.profile.alamatUsaha,
          nomorTelepon: data.profile.nomorTelepon,
        })
      }
    } catch (error) {
      console.error('Error fetching company profile:', error)
      toast.error('Gagal memuat profil perusahaan')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const onSubmit = async (data: CreateCompanyProfile) => {
    try {
      const url = profile ? `/api/company-profile/${profile.id}` : '/api/company-profile'
      const method = profile ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save company profile')
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      
      toast.success('Profil perusahaan berhasil disimpan')
      
      // Reset form dengan data terbaru untuk menghilangkan isDirty
      reset({
        namaUsaha: updatedProfile.namaUsaha,
        alamatUsaha: updatedProfile.alamatUsaha,
        nomorTelepon: updatedProfile.nomorTelepon,
      })
    } catch (error) {
      console.error('Error saving company profile:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan profil perusahaan')
    }
  }

  const handleReset = () => {
    if (profile) {
      reset({
        namaUsaha: profile.namaUsaha,
        alamatUsaha: profile.alamatUsaha,
        nomorTelepon: profile.nomorTelepon,
      })
    }
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
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
            <p className="mt-1 text-sm text-gray-500">
              Kelola informasi profil perusahaan Anda
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Profile Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Perusahaan</CardTitle>
                <CardDescription>
                  {profile 
                    ? 'Ubah informasi profil perusahaan Anda' 
                    : 'Lengkapi informasi profil perusahaan Anda'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="namaUsaha">Nama Usaha *</Label>
                    <Input
                      id="namaUsaha"
                      placeholder="PT. Nama Perusahaan Anda"
                      {...register('namaUsaha')}
                      className={errors.namaUsaha ? 'border-red-500' : ''}
                    />
                    {errors.namaUsaha && (
                      <p className="text-sm text-red-500">{errors.namaUsaha.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alamatUsaha">Alamat Usaha *</Label>
                    <textarea
                      id="alamatUsaha"
                      rows={3}
                      placeholder="Jl. Alamat Lengkap Perusahaan, Kota, Kode Pos"
                      {...register('alamatUsaha')}
                      className={`flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        errors.alamatUsaha ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.alamatUsaha && (
                      <p className="text-sm text-red-500">{errors.alamatUsaha.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nomorTelepon">Nomor Telepon *</Label>
                    <Input
                      id="nomorTelepon"
                      placeholder="021-12345678 atau 08123456789"
                      {...register('nomorTelepon')}
                      className={errors.nomorTelepon ? 'border-red-500' : ''}
                    />
                    {errors.nomorTelepon && (
                      <p className="text-sm text-red-500">{errors.nomorTelepon.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      disabled={!isDirty || isSubmitting}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !isDirty}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Company Profile Preview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  Tampilan informasi perusahaan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {profile.namaUsaha}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {profile.alamatUsaha}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Telepon: {profile.nomorTelepon}
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-xs text-gray-500">
                        Terakhir diupdate: {new Date(profile.updatedAt).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Dibuat: {new Date(profile.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">
                      Belum ada informasi perusahaan.
                      <br />
                      Lengkapi form untuk melihat preview.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Informasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    • Informasi ini akan muncul di laporan dan invoice
                  </p>
                  <p>
                    • Pastikan data yang dimasukkan akurat dan lengkap
                  </p>
                  <p>
                    • Nomor telepon dapat berupa telepon kantor atau mobile
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}