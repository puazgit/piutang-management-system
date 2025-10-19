import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing database (except User table)...')

    // Delete in order to respect foreign key constraints
    await prisma.payment.deleteMany({})
    console.log('✅ Cleared Payment table')

    await prisma.invoice.deleteMany({})
    console.log('✅ Cleared Invoice table')

    await prisma.customer.deleteMany({})
    console.log('✅ Cleared Customer table')

    await prisma.customerCategory.deleteMany({})
    console.log('✅ Cleared CustomerCategory table')

    await prisma.companyProfile.deleteMany({})
    console.log('✅ Cleared CompanyProfile table')

    console.log('✨ Database cleared successfully (User table preserved)')
  } catch (error) {
    console.error('❌ Error clearing database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

clearDatabase()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
