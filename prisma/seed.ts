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
  const companyProfile = await prisma.companyProfile.upsert({
    where: { id: 1 },
    update: {},
    create: {
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
    const createdCategory = await prisma.customerCategory.upsert({
      where: { id: categories.indexOf(category) + 1 },
      update: {},
      create: category,
    })
    createdCategories.push(createdCategory)
    console.log('✅ Created customer category:', createdCategory.keterangan)
  }

  // Create sample customers
  const customers = [
    {
      kode: 'CUST001',
      namaCustomer: 'PT. ABC Company',
      kategoriId: createdCategories[0].id,
      alamatNoInvoice: 'Jl. ABC No. 456, Jakarta',
    },
    {
      kode: 'CUST002',
      namaCustomer: 'CV. XYZ Trading',
      kategoriId: createdCategories[1].id,
      alamatNoInvoice: 'Jl. XYZ No. 789, Surabaya',
    },
    {
      kode: 'CUST003',
      namaCustomer: 'Toko Maju Jaya',
      kategoriId: createdCategories[0].id,
      alamatNoInvoice: 'Jl. Maju No. 101, Bandung',
    },
  ]

  const createdCustomers = []
  for (const customer of customers) {
    const existingCustomer = await prisma.customer.findUnique({
      where: { kode: customer.kode },
    })

    if (!existingCustomer) {
      const createdCustomer = await prisma.customer.create({
        data: customer,
      })
      createdCustomers.push(createdCustomer)
      console.log('✅ Created customer:', createdCustomer.namaCustomer)
    } else {
      createdCustomers.push(existingCustomer)
      console.log('⏭️  Customer already exists:', existingCustomer.namaCustomer)
    }
  }

  // Create sample invoices
  const invoices = [
    {
      tanggal: new Date('2024-01-15'),
      termin: 30,
      jatuhTempo: new Date('2024-02-14'),
      noInvoice: 'INV-2024-001',
      customerId: createdCustomers[0].id,
      kategori: 'Penjualan Barang',
      keteranganTransaksi: 'Penjualan produk elektronik',
      nilaiInvoice: 5000000,
      statusPembayaran: 'BELUM_LUNAS',
      statusInvoice: 'AKTIF',
    },
    {
      tanggal: new Date('2024-01-20'),
      termin: 45,
      jatuhTempo: new Date('2024-03-05'),
      noInvoice: 'INV-2024-002',
      customerId: createdCustomers[1].id,
      kategori: 'Penjualan Jasa',
      keteranganTransaksi: 'Konsultasi IT',
      nilaiInvoice: 3000000,
      statusPembayaran: 'SEBAGIAN',
      statusInvoice: 'AKTIF',
    },
    {
      tanggal: new Date('2024-02-01'),
      termin: 30,
      jatuhTempo: new Date('2024-03-03'),
      noInvoice: 'INV-2024-003',
      customerId: createdCustomers[2].id,
      kategori: 'Penjualan Barang',
      keteranganTransaksi: 'Penjualan furniture',
      nilaiInvoice: 2500000,
      statusPembayaran: 'LUNAS',
      statusInvoice: 'AKTIF',
    },
  ]

  const createdInvoices = []
  for (const invoice of invoices) {
    const existingInvoice = await prisma.invoice.findUnique({
      where: { noInvoice: invoice.noInvoice },
    })

    if (!existingInvoice) {
      const createdInvoice = await prisma.invoice.create({
        data: invoice,
      })
      createdInvoices.push(createdInvoice)
      console.log('✅ Created invoice:', createdInvoice.noInvoice)

      // Update customer total piutang
      await prisma.customer.update({
        where: { id: invoice.customerId },
        data: {
          totalPiutang: {
            increment: invoice.nilaiInvoice,
          },
        },
      })
    } else {
      createdInvoices.push(existingInvoice)
      console.log('⏭️  Invoice already exists:', existingInvoice.noInvoice)
    }
  }

  // Create sample payments
  const payments = [
    {
      tanggal: new Date('2024-02-10'),
      invoiceId: createdInvoices[1].id, // INV-2024-002 (partial payment)
      keterangan: 'Pembayaran sebagian via transfer',
      penerimaan: 1500000,
    },
    {
      tanggal: new Date('2024-02-15'),
      invoiceId: createdInvoices[2].id, // INV-2024-003 (full payment)
      keterangan: 'Pelunasan via tunai',
      penerimaan: 2500000,
    },
  ]

  for (const payment of payments) {
    const existingPayment = await prisma.payment.findFirst({
      where: {
        invoiceId: payment.invoiceId,
        tanggal: payment.tanggal,
        penerimaan: payment.penerimaan,
      },
    })

    if (!existingPayment) {
      const createdPayment = await prisma.payment.create({
        data: payment,
      })
      console.log('✅ Created payment for invoice ID:', createdPayment.invoiceId)

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
    } else {
      console.log('⏭️  Payment already exists for invoice ID:', payment.invoiceId)
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