# ymmybttn - Restaurant Inventory Management System

## Overview

A hybrid restaurant inventory management system that helps restaurants find the best prices across multiple distributors while respecting proprietary pricing windows.

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ymmybttn
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Architecture

- **Web App**: Next.js + TypeScript + Tailwind CSS + Supabase
- **Local App**: Tauri + Rust + SQLite (to be implemented)
- **Database**: PostgreSQL (Supabase) with event-sourced pricing

## Project Structure

```
/src
  /app         - Next.js app router pages
  /components  - Reusable UI components
  /lib         - Utilities and database client
  /hooks       - Custom React hooks
  /types       - TypeScript type definitions
  /services    - External API integrations
```

## Development

See the following documents for more information:
- `PLANNING.md` - High-level project roadmap
- `TASKS.md` - Current development tasks
- `BUSINESS_LOGIC.md` - Detailed business logic implementation
- `DATABASE_SCHEMA.md` - Complete database schema