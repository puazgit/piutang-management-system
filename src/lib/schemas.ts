import { z } from 'zod'

// Customer schemas
export const createCustomerSchema = z.object({
  kode: z.string().min(1, 'Kode customer harus diisi'),
  namaCustomer: z.string().min(1, 'Nama customer harus diisi'),
  kategoriId: z.number().min(1, 'Kategori harus dipilih'),
  alamatNoInvoice: z.string().optional(),
  telepon: z.string().optional(),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
})

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.number(),
})

// Customer Category schemas
export const createCustomerCategorySchema = z.object({
  keterangan: z.string().optional(),
})

export const updateCustomerCategorySchema = createCustomerCategorySchema.extend({
  id: z.number(),
})

// Invoice schemas
export const createInvoiceSchema = z.object({
  tanggal: z.date(),
  termin: z.number().min(0, 'Termin tidak boleh negatif'),
  jatuhTempo: z.date(),
  noInvoice: z.string().min(1, 'No invoice harus diisi'),
  customerId: z.number().min(1, 'Customer harus dipilih'),
  kategori: z.string().optional(),
  keteranganTransaksi: z.string().optional(),
  nilaiInvoice: z.number().min(0, 'Nilai invoice tidak boleh negatif'),
  statusPembayaran: z.string().optional(),
  statusInvoice: z.string().optional(),
})

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  id: z.number(),
})

// Payment schemas
export const createPaymentSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  invoiceId: z.number().min(1, 'Invoice harus dipilih'),
  keterangan: z.string().optional(),
  penerimaan: z.number().min(1, 'Jumlah pembayaran harus lebih dari 0'),
})

// Form payment schema (without invoiceId - will be added later)
export const createPaymentFormSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  keterangan: z.string().optional(),
  penerimaan: z.number().min(1, 'Jumlah pembayaran harus lebih dari 0'),
})

export const updatePaymentSchema = createPaymentSchema.partial().extend({
  id: z.number(),
})

// Company Profile schemas
export const createCompanyProfileSchema = z.object({
  namaUsaha: z.string().min(1, 'Nama usaha harus diisi'),
  alamatUsaha: z.string().min(1, 'Alamat usaha harus diisi'),
  nomorTelepon: z.string().min(1, 'Nomor telepon harus diisi'),
})

export const updateCompanyProfileSchema = createCompanyProfileSchema.partial().extend({
  id: z.number(),
})

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  name: z.string().min(1, 'Nama harus diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak sama",
  path: ["confirmPassword"],
})

export type CreateCustomer = z.infer<typeof createCustomerSchema>
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>
export type CreateCustomerCategory = z.infer<typeof createCustomerCategorySchema>
export type UpdateCustomerCategory = z.infer<typeof updateCustomerCategorySchema>
export type CreateInvoice = z.infer<typeof createInvoiceSchema>
export type UpdateInvoice = z.infer<typeof updateInvoiceSchema>
export type CreatePayment = z.infer<typeof createPaymentSchema>
export type CreatePaymentForm = z.infer<typeof createPaymentFormSchema>
export type UpdatePayment = z.infer<typeof updatePaymentSchema>
export type CreateCompanyProfile = z.infer<typeof createCompanyProfileSchema>
export type UpdateCompanyProfile = z.infer<typeof updateCompanyProfileSchema>
export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>