# Next.js Starter Template

A modern Next.js starter template with TypeScript, Tailwind CSS, shadcn/ui, NextAuth.js, and MongoDB integration.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **UI Components**: shadcn/ui
- **Authentication**: NextAuth.js v5
- **Database**: MongoDB with Mongoose
- **Environment**: T3 Env for type-safe environment variables

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── auth/          # NextAuth.js API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   ├── db.ts            # MongoDB connection (singleton)
│   └── utils.ts         # Utility functions (cn helper)
├── server/              # Server-side code
│   └── auth/           # NextAuth.js configuration
├── styles/             # Global styles
│   └── globals.css     # Tailwind CSS imports
└── env.js              # Environment variable validation
```

## Configuration Files

- `components.json` - shadcn/ui configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration with `~/` path alias
- `next.config.js` - Next.js configuration
- `.env.example` - Environment variables template

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
AUTH_SECRET=""              # NextAuth.js secret
DATABASE_URL=""            # MongoDB connection string
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## Features

- ✅ Type-safe environment variables
- ✅ Singleton MongoDB connection
- ✅ NextAuth.js authentication setup
- ✅ shadcn/ui components
- ✅ Tailwind CSS with custom configuration
- ✅ TypeScript with path aliases (`~/`)
- ✅ ESLint and Prettier configuration
