Rules

# ymmybttn - Restaurant Inventory Management System

## Project Context & Overview

This is a hybrid restaurant inventory management system that helps restaurants find the best prices across multiple distributors.

**Architecture:**
- Local Desktop App (Tauri + Rust + SQLite): Handles proprietary current pricing data
- Web App (Next.js + Supabase): Historical data, ordering, analytics
- Proprietary data stays local until week ends (Monday 12:01 AM sync)

**Technology Stack:**
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Supabase (PostgreSQL), Edge Functions
- Local App: Tauri, Rust, SQLite
- Mobile: React Native (future)
- Auth: Supabase Auth with RLS

**Key Dependencies:**
- Zod for validation
- React Query for data fetching
- Recharts for data visualization
- No ORM - direct SQL with Supabase client

## Coding Standards & Conventions

### Naming Conventions
- Tables: snake_case plural (e.g., `price_events`, `restaurant_products`)
- Columns: snake_case (e.g., `effective_date`, `catalog_product_id`)
- TypeScript interfaces: PascalCase with descriptive names (e.g., `PriceEvent`, `RestaurantProduct`)
- React components: PascalCase (e.g., `WinnerCalculator`, `PriceGraph`)
- Functions: camelCase, verb-first (e.g., `calculateWinner`, `syncPrices`)
- API routes: kebab-case (e.g., `/api/sync-prices`)

### File Organization
/src
/components   - Reusable UI components
/app         - Next.js app router pages
/lib         - Utilities, database client, business logic
/hooks       - Custom React hooks
/types       - TypeScript type definitions
/services    - External API integrations

### Code Style
- Prefer functional components with hooks
- Use `async/await` over `.then()` chains
- Destructure props at function declaration
- Keep components under 200 lines - split if larger
- One component per file

## Technology-Specific Guidelines

### Database Patterns
- Always use migrations for schema changes
- Never store prices as floats - use DECIMAL(10,2)
- All tables need created_at, updated_at timestamps
- Use database-generated UUIDs for primary keys
- Write queries with explicit column names, no `SELECT *`
- Use proper indexes for restaurant_id + product lookups

### Supabase/PostgreSQL
- Use Row Level Security (RLS) for all tables
- Leverage database functions for complex calculations
- Use materialized views for expensive queries
- Always handle null cases in queries
- Use transactions for multi-table updates

### React/Next.js
- Server components by default, client only when needed
- Use loading.tsx and error.tsx for better UX
- Implement optimistic updates for better perceived performance
- Cache distributor data aggressively (changes rarely)
- Prefetch data on hover for instant navigation

### Local App Integration
- Local app is source of truth for current week's prices
- Never send proprietary data to cloud before Monday
- All sync operations must be idempotent
- Handle offline scenarios gracefully
- Validate effective_date logic on both sides

## Security & Performance Rules

### Security
- Never expose internal distributor pricing logic
- Sanitize all file uploads (CSV, invoice images)
- Implement rate limiting on price uploads
- Use RLS to ensure restaurant data isolation
- Validate all prices are positive numbers
- Hash file contents to prevent duplicate uploads

### Performance
- Paginate any list over 50 items
- Index all foreign keys and common WHERE clauses
- Use database views for complex winner calculations
- Batch sync operations (don't sync item by item)
- Lazy load historical data (only current prices upfront)
- Cache product catalog data (changes infrequently)

### Error Handling
- Always catch and log database errors
- Show user-friendly error messages
- Implement retry logic for sync operations
- Validate CSV format before processing
- Handle timezone issues explicitly (restaurant's local time)

## Development Workflow

### Git Commits
- Prefix: feat|fix|chore|docs|refactor|test
- Example: "feat: add substitution group winner logic"
- Keep commits atomic and focused
- Reference issue numbers when applicable

### Testing
- Test winner calculation edge cases thoroughly
- Mock external distributor APIs
- Test sync logic with various date scenarios
- Ensure RLS policies are tested
- Test offline functionality for local app

## Architecture Principles

###
The AI should adhere to the architectural principles, data flows, and business logic placements as outlined in Planning.md.

### State Management
- Server state: React Query + Supabase realtime
- Form state: React Hook Form with Zod validation
- UI state: React useState/useReducer
- Global state: Zustand (if needed)

## Communication Preferences

### When Working on Features
1. Assume common patterns unless specified otherwise
2. Implement database changes via migrations
3. Create TypeScript types from database schema
4. Add loading and error states for all async operations
5. Include basic responsive design (mobile-first)
6. Auto-update Planning.md, Tasks.md, AND Business_Logic.md as part of development workflow

### Ask for Confirmation When:
- Modifying database schema significantly
- Changing authentication/security patterns
- Altering the sync logic between apps
- Adding new external dependencies
- Implementing payment/billing features

### Code Response Format
- Include file paths as comments
- Show incremental changes, not entire files
- Explain non-obvious logic with comments
- Provide example usage for new utilities
- Include TypeScript types for all functions

### Known Constraints
- Poor internet connectivity is common in restaurants  
- Distributors may change item codes without notice
- Price files can be very large (10k+ items)
- Users may upload files weeks or months old

## Project Management & Documentation

### Planning & Task Management
- **Always reference `Planning.md` and `Tasks.md`** before starting any work
- **Update both documents automatically** as part of your workflow
- Keep `Planning.md` lean and scannable - high-level roadmap only
- Maintain `Tasks.md` with granular, actionable items

### Documentation Auto-Update Requirements
- **Planning.md**: Update when architecture or high-level approach changes
- **Tasks.md**: Update task status, add discovered sub-tasks, document blockers
- **Business_Logic.md**: Update when implementing complex logic, discovering edge cases, or establishing new workflows

### Documentation Hierarchy
- **`.claude_rules`** - Always read, development guidelines only
- **`Planning.md`** - Always read, lean high-level roadmap 
- **`Tasks.md`** - Always read, current work items and progress
- **`BUSINESS_LOGIC.md`** - Reference when implementing core features, detailed step-by-step workflows
- **`DATABASE_SCHEMA.md`** - Reference when working on database operations, migrations, or data models. **update when schema changes**
- **`README.md`** - Setup instructions, don't read unless asked

### Planning.md Guidelines
- **Keep it scannable** - brief feature summaries, not detailed implementation
- **Mirror Business_Logic.md structure** - same sections, but condensed
- **Focus on what and why**, not how
- Example: "Winner Calculation - Finds lowest unit price across distributors, respects preferences and substitution groups"

### Business_Logic.md Guidelines
- **Comprehensive step-by-step workflows** for all major features
- **Mirror Planning.md sections** but with full implementation details
- **Update when logic is established** - don't wait until after implementation
- **Preserve valuable logic** that took time to work out
- Consider splitting into multiple files if it grows large (e.g., `SYNC_LOGIC.md`, `PRICING_LOGIC.md`)

### When to Reference Business Logic
Only read `BUSINESS_LOGIC.md` when working on:
- Price calculations or winner logic
- Sync processes between apps (CSV import, Monday sync, web updates)
- Data transformations or imports
- Complex business rules implementation
- Substitution groups and preferences
- Order export processes

### When to Reference Database Schema
Only read `DATABASE_SCHEMA.md` when working on:
- Database migrations or schema changes
- Data model implementations  
- API endpoints that touch the database
- Sync logic between local and web databases
- Complex queries or business logic involving multiple tables

### When to Update DATABASE_SCHEMA.md
- **Before implementing** any database changes - design first
- **During development** when adding/modifying tables, columns, or indexes
- **When migration succeeds** - ensure docs match actual implementation
- **When business logic changes** require schema adjustments
- **When sync patterns** between local and web databases evolve
- **Immediately after** discovering schema improvements during development

### Schema Update Workflow
1. **Update DATABASE_SCHEMA.md** with proposed changes first
2. **Create migration files** based on the documented changes
3. **Implement and test** the migration
4. **Verify DATABASE_SCHEMA.md** still matches actual implementation
5. **Update related TypeScript types** and business logic

### When to Update Planning.md
- Architecture or technology stack changes
- New feature requirements discovered
- Integration patterns or data flow modifications
- Security or performance requirement changes
- Timeline or milestone adjustments
- **Keep updates brief** - detailed logic goes in Business_Logic.md

### When to Update Business_Logic.md
- **Immediately when complex logic is designed** - capture it while fresh
- When workflows change or new edge cases discovered
- When business rules are clarified or modified
- When integration patterns are established
- **Before implementation begins** - use as implementation reference

### When to Update Tasks.md
- Breaking down new features into actionable items
- Marking tasks complete with implementation notes
- Adding newly discovered technical debt
- Recording blockers or dependencies found during development
- Documenting testing requirements for new features

### Task Documentation Format

 Task description

Status: Not Started | In Progress | Blocked | Complete
Priority: High | Medium | Low
Dependencies: Other tasks or external factors
Notes: Implementation details, blockers, or decisions made


### Error-Driven Updates
- When encountering unexpected errors, update Planning.md with lessons learned
- Add preventive tasks to Tasks.md based on issues found
- Document workarounds and their rationale in Business_Logic.md
- Update testing strategies based on failure patterns

Remember: The system must be reliable during busy restaurant operations. Prioritize stability and clarity over cleverness.