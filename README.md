# Maw3idokom - موعدكُم

A comprehensive SaaS appointment booking platform built with Next.js 15, TypeScript, and PostgreSQL.

## Features

- **Multi-Role Authentication**: Admin, Business, and Client accounts with role-based access
- **Internationalization**: Full support for English, French, and Arabic with RTL layout
- **Business Management**: Profile, services, staff, schedules, and emergency blocks
- **Booking System**: Complete appointment booking workflow with status tracking
- **Reviews & Ratings**: Client reviews with star ratings
- **Real-time Chat**: Polling-based messaging system for bookings
- **Search & Filter**: Advanced search with price range, rating, category, and availability filters
- **Map Integration**: Leaflet maps with clustering for business locations
- **SEO Optimized**: Dynamic metadata, sitemaps, schema.org structured data
- **Dark Mode**: Full dark mode support via next-themes
- **Responsive Design**: Mobile-first design with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15.3.6 (App Router)
- **Language**: TypeScript 5.3
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js 4.24.5
- **Styling**: Tailwind CSS 3.3.6 with RTL support
- **Animations**: Framer Motion 10.16.5
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Maps**: React Leaflet with marker clustering
- **Notifications**: Sonner toasts

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure your database URL and other variables:
```
DATABASE_URL="postgresql://user:password@localhost:5432/maw3idokom"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
ADMIN_EMAIL="M@w3id"
ADMIN_PASSWORD="Saha1201200"
```

4. Initialize the database:
```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Default Credentials

### Admin Account
- Email: `M@w3id`
- Password: `Saha1201200`

**Important**: Change the admin password immediately after first login in production!

## Project Structure

```
src/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/             # API endpoints
│   ├── [lng]/           # Internationalized routes
│   └── globals.css      # Global styles
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── admin/          # Admin dashboard components
│   ├── business/       # Business dashboard components
│   ├── client/         # Client dashboard components
│   └── landing/        # Public landing page components
├── lib/                # Utility functions and configurations
│   ├── auth.ts         # NextAuth configuration
│   ├── prisma.ts       # Prisma client
│   └── utils.ts        # Helper functions
├── i18n/               # Internationalization
│   ├── locales/        # Translation files (EN, FR, AR)
│   ├── client.tsx      # Client-side i18n
│   └── index.ts        # Server-side i18n
└── types/              # TypeScript type definitions

prisma/
├── schema.prisma       # Database schema
└── seed.ts            # Database seeding script
```

## Key Features

### Admin Dashboard
- User management (activate/deactivate accounts)
- Subscription plan management
- Category management
- Global settings (logo, hero, contact info)
- View all bookings, reviews, messages

### Business Dashboard
- Profile management with map location picker
- Weekly schedule management
- Emergency closure blocks
- Services CRUD
- Staff CRUD
- Booking management (confirm/reject/reschedule)
- Reviews display
- Chat with clients

### Client Dashboard
- Profile management
- View bookings (upcoming/past)
- Cancel pending bookings
- Submit reviews for completed bookings
- Chat with businesses

### Public Pages
- Landing page with hero and categories
- Advanced search with multiple filters
- Business detail pages
- Map view with clustering
- Contact page

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

## Environment Variables

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Application URL
- `NEXTAUTH_SECRET`: Secret for NextAuth (generate with `openssl rand -base64 32`)
- `ADMIN_EMAIL`: Admin login email
- `ADMIN_PASSWORD`: Admin login password

## Database Schema

The application uses the following main models:

- **User**: Admin, Business, and Client accounts
- **Business**: Business profiles with location data
- **Category**: Service categories with i18n names
- **Service**: Business services with pricing
- **Staff**: Business staff members
- **Schedule**: Weekly business hours
- **EmergencyBlock**: Temporary closures
- **Booking**: Appointment bookings with status
- **Review**: Client reviews with ratings
- **Message**: Chat messages for bookings
- **SubscriptionPlan**: Business subscription tiers
- **GlobalSettings**: Platform-wide settings

## Contributing

This is a private project. For bugs or feature requests, please contact the development team.

## License

Proprietary - All rights reserved.

## Support

For support, email contact@maw3idokom.com
