# mogrank

A web application for managing a Phasmophobia game boosting service. Customers can purchase level boost packages, track their order status, and receive Discord notifications throughout the process.

## Features

- **Customer Portal**: Browse packages, purchase boosts, track order status and queue position
- **Admin Dashboard**: Kanban board for queue management, order history, statistics
- **Discord Integration**: OAuth login + DM notifications for order updates
- **Payment Processing**: Ramp Network integration for fiat-to-crypto payments (USDC on Solana)
- **Real-time Updates**: Automated queue progression via Vercel cron jobs

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth v5 with Discord OAuth
- **UI**: shadcn/ui + Tailwind CSS
- **Drag & Drop**: @dnd-kit for Kanban board
- **Payments**: Ramp Network SDK
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account
- Discord application (OAuth + Bot)
- Ramp Network API key (optional for testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/zackdillabough/mogrank.git
cd mogrank

# Install dependencies
pnpm install

# Copy environment variables
cp .env.local.example .env.local
```

### Environment Variables

Fill in `.env.local` with your credentials:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Discord
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=

# Auth
AUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Admin
ADMIN_DISCORD_ID=

# Cron
CRON_SECRET=

# Payments
WALLET_ADDRESS=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Run the SQL schema in your Supabase SQL Editor:

```bash
# The schema is located at:
supabase/schema.sql
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
pnpm build
pnpm start
```

## Deployment

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The cron job for auto-moving queue items runs every 5 minutes (configured in `vercel.json`).

## License

MIT
