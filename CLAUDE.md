# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
- `npm run dev` - Start development server with Turbo mode
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run preview` - Build and start production server

### Code Quality
- `npm run check` - Run linting and type checking
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run typecheck` - Run TypeScript type checking without emitting files
- `npm run format:check` - Check code formatting with Prettier
- `npm run format:write` - Format code with Prettier

### Environment Setup
Generate NextAuth.js secret: `npx auth secret`

## Architecture

### Tech Stack
- **Next.js 15** with App Router and React Server Components (RSC)
- **TypeScript** with strict mode enabled
- **Tailwind CSS 4.0** for styling
- **shadcn/ui** components (New York style with slate base color)
- **NextAuth.js v5** for authentication
- **MongoDB** with Mongoose ODM
- **T3 Env** for type-safe environment variables with Zod validation

### Project Structure
```
src/
├── app/              # App Router pages and API routes
├── components/ui/    # shadcn/ui components
├── lib/             # Utilities (db.ts, utils.ts)
├── server/auth/     # NextAuth.js configuration
├── styles/          # Global CSS
└── env.js           # Environment variable schema (Zod)
```

### Path Aliases
Use `~/` prefix for all imports (e.g., `~/lib/db`, `~/components/ui/button`)
Configured in `tsconfig.json` and `components.json`

### Database Connection
MongoDB uses a singleton pattern in `src/lib/db.ts`:
- Connection is cached globally to prevent multiple instances in development (Hot Module Replacement)
- Import `connectDB()` function to access the connection
- Connection string validated via `DATABASE_URL` in `env.js`

### Authentication
NextAuth.js v5 (beta) setup:
- Configuration in `src/server/auth/config.ts`
- Exports cached `auth()` function from `src/server/auth/index.ts`
- Session includes user ID via token.sub callback
- API routes at `/api/auth/[...nextauth]`
- Module augmentation for custom session types

### Environment Variables
All environment variables must be:
1. Defined in `src/env.js` with Zod schema
2. Added to `.env.example`
3. Type-safe via `env` import from `~/env`

Server variables: `AUTH_SECRET`, `DATABASE_URL`, `NODE_ENV`
Client variables must be prefixed with `NEXT_PUBLIC_`

### Component Library (shadcn/ui)
- Install components using: `npx shadcn@latest add <component-name>`
- Components placed in `src/components/ui/`
- Uses lucide-react for icons
- Utility function `cn()` available at `~/lib/utils`
