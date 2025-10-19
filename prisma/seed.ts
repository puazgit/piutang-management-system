import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@piutang.com' },
    update: {},
    create: {
      email: 'admin@piutang.com',
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create company profile
  const companyProfile = await prisma.companyProfile.create({
    data: {
      namaUsaha: 'PT. Contoh Piutang',
      alamatUsaha: 'Jl. Contoh No. 123, Jakarta',
      nomorTelepon: '021-12345678',
    },
  })

  console.log('✅ Created company profile:', companyProfile.namaUsaha)

  // Create customer categories
  const categories = [
    { keterangan: 'Retail' },
    { keterangan: 'Wholesale' },
    { keterangan: 'Corporate' },
  ]

  const createdCategories = []
  for (const category of categories) {
    const createdCategory = await prisma.customerCategory.create({
      data: category,
    })
    createdCategories.push(createdCategory)
    console.log('✅ Created customer category:', createdCategory.keterangan)
  }

  // Create sample customers
  const customers = [
    {
      kode: 'CUST001',
      namaCustomer: 'PT. Maju Sejahtera',
      kategoriId: createdCategories[2].id, // Corporate
      alamatNoInvoice: 'Jl. Sudirman No. 123, Jakarta Pusat',
      telepon: '021-55667788',
      email: 'finance@majusejahtera.com',
    },
    {
      kode: 'CUST002',
      namaCustomer: 'CV. Berkah Jaya',
      kategoriId: createdCategories[1].id, // Wholesale
      alamatNoInvoice: 'Jl. Gatot Subroto No. 456, Surabaya',
      telepon: '031-99887766',
      email: 'admin@berkahjaya.co.id',
    },
    {
      kode: 'CUST003',
      namaCustomer: 'Toko Sumber Rezeki',
      kategoriId: createdCategories[0].id, // Retail
      alamatNoInvoice: 'Jl. Ahmad Yani No. 789, Bandung',
      telepon: '022-44332211',
      email: 'toko@sumberrezeki.net',
    },
    {
      kode: 'CUST004',
      namaCustomer: 'PT. Elektronik Indo',
      kategoriId: createdCategories[2].id, // Corporate
      alamatNoInvoice: 'Jl. HR Rasuna Said No. 88, Jakarta Selatan',
      telepon: '021-77889900',
      email: 'purchasing@elektronikindo.com',
    },
    {
      kode: 'CUST005',
      namaCustomer: 'UD. Mitra Usaha',
      kategoriId: createdCategories[1].id, // Wholesale
      alamatNoInvoice: 'Jl. Diponegoro No. 234, Semarang',
      telepon: '024-33445566',
      email: 'contact@mitrausaha.id',
    },
  ]

  const createdCustomers = []
  for (const customer of customers) {
    const createdCustomer = await prisma.customer.create({
      data: customer,
    })
    createdCustomers.push(createdCustomer)
    console.log('✅ Created customer:', createdCustomer.namaCustomer)
  }

  // Create sample invoices with more realistic data
  const invoices = [
    {
      tanggal: new Date('2024-10-01'),
      termin: 30,
      jatuhTempo: new Date('2024-10-31'),
      noInvoice: 'INV-2024-001',
      customerId: createdCustomers[0].id, // PT. Maju Sejahtera
      kategori: 'Penjualan Barang',
      keteranganTransaksi: 'Penjualan 50 unit komputer desktop',
      nilaiInvoice: 75000000,
      statusPembayaran: 'BELUM_LUNAS',
      statusInvoice: 'AKTIF',
    },
    {
      tanggal: new Date('2024-10-05'),
      termin: 45,
      jatuhTempo: new Date('2024-11-19'),
      noInvoice: 'INV-2024-002',
      customerId: createdCustomers[1].id, // CV. Berkah Jaya
      kategori: 'Penjualan Barang',
      keteranganTransaksi: 'Penjualan alat tulis kantor dan supplies',
      nilaiInvoice: 25000000,
      statusPembayaran: 'SEBAGIAN',
      statusInvoice: 'AKTIF',
    },
    {
      tanggal: new Date('2024-09-15'),
      termin: 30,
      jatuhTempo: new Date('2024-10-15'),
      noInvoice: 'INV-2024-003',
      customerId: createdCustomers[2].id, // Toko Sumber Rezeki
      kategori: 'Penjualan Barang',
      keteranganTransaksi: 'Penjualan produk elektronik consumer',
      nilaiInvoice: 15000000,
      statusPembayaran: 'LUNAS',
      statusInvoice: 'AKTIF',
    },
    {
      tanggal: new Date('2024-10-10'),
      termin: 60,
      jatuhTempo: new Date('2024-12-09'),
      noInvoice: 'INV-2024-004',
      customerId: createdCustomers[3].id, // PT. Elektronik Indo
      kategori: 'Penjualan Barang',
      keteranganTransaksi: 'Penjualan komponen elektronik industri',
      nilaiInvoice: 120000000,
      statusPembayaran: 'SEBAGIAN',
      statusInvoice: 'AKTIF',
    },
    {
      tanggal: new Date('2024-10-12'),
      termin: 30,
      jatuhTempo: new Date('2024-11-11'),
      noInvoice: 'INV-2024-005',
      customerId: createdCustomers[4].id, // UD. Mitra Usaha
      kategori: 'Penjualan Barang',
      keteranganTransaksi: 'Penjualan perlengkapan toko dan rak display',
      nilaiInvoice: 35000000,
      statusPembayaran: 'BELUM_LUNAS',
      statusInvoice: 'AKTIF',
    },
  ]

  const createdInvoices = []
  for (const invoice of invoices) {
    const createdInvoice = await prisma.invoice.create({
      data: invoice,
    })
    createdInvoices.push(createdInvoice)
    console.log('✅ Created invoice:', createdInvoice.noInvoice, '-', createdInvoice.keteranganTransaksi)

    // Update customer total piutang
    await prisma.customer.update({
      where: { id: invoice.customerId },
      data: {
        totalPiutang: {
          increment: invoice.nilaiInvoice,
        },
      },
    })
  }

  // Create sample payments
  const payments = [
    // Payment for INV-2024-002 (CV. Berkah Jaya) - partial
    {
      tanggal: new Date('2024-10-10'),
      invoiceId: createdInvoices[1].id,
      keterangan: 'Pembayaran DP 40% via transfer bank',
      penerimaan: 10000000,
    },
    // Payment for INV-2024-003 (Toko Sumber Rezeki) - lunas
    {
      tanggal: new Date('2024-10-05'),
      invoiceId: createdInvoices[2].id,
      keterangan: 'Pelunasan via transfer BCA',
      penerimaan: 15000000,
    },
    // Payment for INV-2024-004 (PT. Elektronik Indo) - partial
    {
      tanggal: new Date('2024-10-15'),
      invoiceId: createdInvoices[3].id,
      keterangan: 'Pembayaran tahap 1 sebesar 30%',
      penerimaan: 36000000,
    },
    {
      tanggal: new Date('2024-02-15'),
      invoiceId: createdInvoices[2].id, // INV-2024-003 (full payment)
      keterangan: 'Pelunasan via tunai',
      penerimaan: 2500000,
    },
  ]

  for (const payment of payments) {
    const createdPayment = await prisma.payment.create({
      data: payment,
    })
    console.log('✅ Created payment for invoice ID:', createdPayment.invoiceId, '- Rp', createdPayment.penerimaan.toLocaleString('id-ID'))

    // Update customer total piutang (decrease)
    const invoice = await prisma.invoice.findUnique({
      where: { id: payment.invoiceId },
      include: { customer: true },
    })

    if (invoice) {
      await prisma.customer.update({
        where: { id: invoice.customerId },
        data: {
          totalPiutang: {
            decrement: payment.penerimaan,
          },
        },
      })
    }
  }

  console.log('🎉 Database seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })