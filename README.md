# TRAJECTORY

**Explore different paths your career could take.**

TRAJECTORY is a career exploration tool that helps students, new grads, and career switchers discover structured career paths through real case studies from people who've navigated similar journeys.

---

## Overview

The idea is simple: instead of generic career advice, show users **real stories** of people who made similar transitions—from their starting point to where they ended up. Users input their background, interests, and goals, and TRAJECTORY surfaces relevant career paths with case studies they can learn from.

### What It Does (V1)

- **Landing Page**: Users fill out a short form about their current situation, interests, and timeline
- **Paths Page**: Displays multiple career directions the user could explore (e.g., Software Engineering, Business/Product, Construction-Tech)
- **Path Detail Page**: Shows curated case studies for each path—real stories of people who made that career transition

### What's Coming

- AI-powered path recommendations based on user profile
- Automated case study ingestion from YouTube, blogs, LinkedIn
- Personalized summaries and action items
- User accounts and saved paths

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| API | [tRPC](https://trpc.io/) |
| Database | [Prisma](https://prisma.io/) + PostgreSQL |
| Fonts | Space Grotesk, Inter, IBM Plex Mono |

Built with the [T3 Stack](https://create.t3.gg/).

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home/landing page with form
│   ├── layout.tsx         # Root layout with fonts & providers
│   └── paths/
│       ├── page.tsx       # Career paths grid
│       └── [pathId]/
│           └── page.tsx   # Path detail with case studies
├── server/
│   ├── api/
│   │   ├── root.ts        # tRPC app router
│   │   ├── trpc.ts        # tRPC context & procedures
│   │   └── routers/
│   │       ├── paths.ts       # Paths data (mock)
│   │       └── caseStudies.ts # Case studies data (mock)
│   └── db.ts              # Prisma client
├── trpc/                  # tRPC client setup
│   ├── react.tsx          # React hooks
│   └── server.ts          # Server-side caller
└── styles/
    └── globals.css        # Global styles & CSS variables
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- PostgreSQL database (optional for V1, required for full features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/trajectory.git
cd trajectory

# Install dependencies
npm install
```

### Running the App

**Without database (mock data mode):**

```bash
SKIP_ENV_VALIDATION=true npm run dev
```

**With database:**

```bash
# 1. Create .env file with your PostgreSQL connection
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/trajectory"' > .env

# 2. Push schema to database
npx prisma db push

# 3. Generate Prisma client
npx prisma generate

# 4. Run the app
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Design

TRAJECTORY uses a monochrome, tech-forward aesthetic:

- **Colors**: White (#FFFFFF), Black (#000000), Grey (#9A9A9A), Borders (#E5E5E5)
- **Typography**: 
  - Headings: Space Grotesk (geometric, slightly robotic)
  - Body: Inter (clean, readable)
  - Labels/Code: IBM Plex Mono (technical feel)
- **Style**: No gradients, no bright colors—clean and professional

---

## Current Status

| Feature | Status |
|---------|--------|
| Landing page UI | ✅ Complete |
| Paths listing page | ✅ Complete |
| Path detail page | ✅ Complete |
| tRPC API setup | ✅ Complete |
| Mock data | ✅ Complete |
| Database schema | 🔄 In Progress |
| User profiles | 📋 Planned |
| AI recommendations | 📋 Planned |
| Case study ingestion | 📋 Planned |

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Prisma Commands

```bash
npx prisma studio    # Open database GUI
npx prisma db push   # Push schema changes to database
npx prisma generate  # Regenerate Prisma client
```

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run linting: `npm run lint`
4. Commit and push
5. Open a Pull Request

---

## License

MIT

---

<p align="center">
  <strong>TRAJECTORY</strong> — See what's possible from where you are now.
</p>
