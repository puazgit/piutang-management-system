# Piutang Management SystemThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



Sistem manajemen piutang (accounts receivable) yang modern dan professional menggunakan Next.js, shadcn/ui, Prisma, PostgreSQL, dan Docker.## Getting Started



## 🚀 FeaturesFirst, run the development server:



- **Manajemen Customer**: CRUD customer dengan kategorisasi```bash

- **Manajemen Invoice**: Pembuatan, pelacakan, dan monitoring invoicenpm run dev

- **Manajemen Pembayaran**: Recording dan tracking pembayaran per invoice# or

- **Dashboard Analytics**: Overview dan statistik piutangyarn dev

- **Authentication**: Sistem login dengan NextAuth.js# or

- **Responsive Design**: UI yang responsive menggunakan shadcn/ui componentspnpm dev

- **Docker Support**: Containerization dengan Docker Compose# or

bun dev

## 🛠 Tech Stack```



- **Framework**: Next.js 15 (App Router)Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- **UI Components**: shadcn/ui (Tailwind CSS + Radix UI)

- **Database**: PostgreSQLYou can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

- **ORM**: Prisma

- **Authentication**: NextAuth.jsThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

- **Validation**: Zod

- **Form Handling**: React Hook Form## Learn More

- **Containerization**: Docker & Docker Compose

- **TypeScript**: Full type safetyTo learn more about Next.js, take a look at the following resources:



## 📋 Prerequisites- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

- Node.js 18+

- Docker & Docker ComposeYou can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

- Git

## Deploy on Vercel

## 🏗 Installation & Setup

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### 1. Clone Repository

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```bash
git clone <repository-url>
cd piutang
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Database
DATABASE_URL="postgresql://piutang_user:piutang_password@localhost:5432/piutang_db?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

### 4. Start PostgreSQL with Docker

```bash
docker compose up postgres -d
```

### 5. Database Setup

Generate and run migrations:

```bash
npx prisma generate
npx prisma db push
```

Seed the database with sample data:

```bash
npm run seed
```

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🐳 Docker Deployment

### Full Stack Deployment

Build and run the entire application with Docker:

```bash
docker compose up --build
```

### Production Environment

For production deployment:

1. Update environment variables in `.env`
2. Set strong passwords and secrets
3. Configure domain and SSL
4. Use production-ready database

```bash
# Production build
docker compose -f docker-compose.prod.yml up --build -d
```

## 📚 Database Schema

### Models

- **CompanyProfile**: Informasi perusahaan
- **CustomerCategory**: Kategori customer  
- **Customer**: Data customer
- **Invoice**: Data invoice/tagihan
- **Payment**: Data pembayaran
- **User**: Data user untuk authentication

### Key Relationships

- Customer → CustomerCategory (many-to-one)
- Invoice → Customer (many-to-one)  
- Payment → Invoice (many-to-one)

## 🔐 Authentication

Default admin credentials (for demo):
- **Email**: admin@piutang.com
- **Password**: admin123

⚠️ **Change these credentials in production!**

## 📖 API Routes

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/[id]` - Get customer
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/[id]` - Get invoice
- `PUT /api/invoices/[id]` - Update invoice

## 🎨 UI Components

Built with shadcn/ui components:
- Forms with validation
- Data tables with pagination
- Modal dialogs
- Toast notifications
- Responsive navigation
- Dashboard cards and charts

## 🧪 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run seed         # Seed database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

## 📁 Project Structure

```
piutang/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   └── layout/           # Layout components
│   └── lib/                  # Utilities and configurations
│       ├── auth.ts           # NextAuth configuration
│       ├── prisma.ts         # Prisma client
│       └── schemas.ts        # Zod validation schemas
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts              # Database seeder
├── docker-compose.yml        # Docker configuration
├── Dockerfile               # Container definition
└── README.md               # This file
```

## 🔧 Configuration

### Prisma Configuration

The Prisma schema is configured for PostgreSQL with the following key features:
- Auto-incrementing IDs
- Timestamps (createdAt, updatedAt)
- Proper foreign key relationships
- Data validation at database level

### NextAuth Configuration

- Credentials provider for email/password authentication
- JWT strategy for sessions
- Custom pages for login
- Role-based access control ready

### Tailwind CSS

Configured with shadcn/ui defaults:
- Design system with consistent spacing and colors
- Dark mode support (can be enabled)
- Mobile-first responsive design
- Custom component styling

## 🚀 Deployment Options

### Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Railway/Heroku

1. Configure `package.json` scripts
2. Set environment variables
3. Deploy using Git

### VPS/Cloud Server

1. Build Docker image
2. Use docker-compose for deployment
3. Configure reverse proxy (nginx)
4. Setup SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues & Roadmap

### Current Limitations
- Basic reporting features
- Email notifications not implemented
- Advanced filtering needs enhancement

### Planned Features
- [ ] Advanced reporting and analytics
- [ ] Email/SMS notifications for overdue invoices
- [ ] Export functionality (PDF, Excel)
- [ ] Multi-tenant support
- [ ] Advanced dashboard charts
- [ ] Mobile app (React Native)
- [ ] Automated backup system
- [ ] Advanced user roles and permissions

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check the documentation
- Review the code comments

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) team for the amazing framework
- [shadcn](https://ui.shadcn.com/) for the beautiful component library
- [Prisma](https://prisma.io/) for the excellent ORM
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
🧪 **Auto-deploy test**: Sun Oct 19 10:14:41 WIB 2025
