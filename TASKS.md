# Tasks.md – ymmybttn Restaurant Inventory System

## Current Sprint Focus
**Goal:** Complete core infrastructure and begin local app development

---

## Phase 1: Core Infrastructure

### 🗄️ Database Setup

#### Initialize Supabase project
- **Status:** Complete
- **Priority:** High
- **Dependencies:** None  
- **Notes:** Set up auth, enable RLS, configure database
- **Completed:** 2025-06-04 - Installed Supabase client libraries and created configuration files

#### Create initial database schema
- **Status:** Complete
- **Priority:** High
- **Dependencies:** Supabase project  
- **Notes:** Run migrations for all core tables
- **Completed:** 2025-06-04 - Created 10 migration files with proper ordering

#### Set up Row Level Security policies
- **Status:** Complete
- **Priority:** High
- **Dependencies:** Database schema  
- **Notes:** Ensure restaurant data isolation
- **Completed:** 2025-06-04 - Created comprehensive RLS policies in migration 010

#### Create database indexes
- **Status:** Complete
- **Priority:** Medium
- **Dependencies:** Database schema  
- **Notes:** Focus on restaurant_id + product lookups
- **Completed:** 2025-06-04 - Indexes included in migration files

### 👥 Authentication & Users

#### Implement Supabase Auth integration
- **Status:** Complete
- **Priority:** High
- **Dependencies:** Supabase project  
- **Notes:** Email/password, magic links
- **Completed:** 2025-06-04 - Implemented full auth flow with automatic user sync

#### Create user management system
- **Status:** Complete
- **Priority:** High
- **Dependencies:** Auth integration  
- **Notes:** User types, permissions, assignments
- **Completed:** 2025-06-04 - Built comprehensive user service with CRUD operations

#### Build organization/restaurant hierarchy
- **Status:** Complete
- **Priority:** High
- **Dependencies:** User management  
- **Notes:** Support multi-restaurant owners
- **Completed:** 2025-06-04 - Created organization service for multi-restaurant management

### 🛒 Product Catalog

#### Create product CRUD operations
- **Status:** Complete
- **Priority:** High
- **Dependencies:** Database schema  
- **Notes:** Global catalog with restaurant assignments
- **Completed:** 2025-06-04 - Full CRUD operations with search and filtering

#### Implement category management
- **Status:** Complete
- **Priority:** Medium
- **Dependencies:** Product CRUD  
- **Notes:** Hierarchical categories with temperature zones
- **Completed:** 2025-06-04 - Service layer complete, UI pending

#### Build distributor product specs interface
- **Status:** Complete
- **Priority:** High
- **Dependencies:** Product CRUD  
- **Notes:** Pack sizes, units, conversion calculations
- **Completed:** 2025-06-04 - Service layer with total units calculation

#### Create unit conversion system
- **Status:** Complete
- **Priority:** High
- **Dependencies:** None  
- **Notes:** Database functions for consistent calculations
- **Completed:** 2025-06-04 - Full conversion service with validation

---

## Phase 2: Local App & Pricing Engine

### 🖥️ Tauri Desktop App

#### Initialize Tauri project structure
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** None  
- **Notes:** Rust backend, React frontend

#### Set up SQLite database
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Tauri project  
- **Notes:** Local schema matching web structure

#### Create subscription validation
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** SQLite setup  
- **Notes:** Cache subscription status, periodic checks

### 📄 CSV Import

#### Build file picker and parser
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Tauri app  
- **Notes:** Support multiple distributor formats

#### Implement effective date detection
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** CSV parser  
- **Notes:** File creation/modified date logic

#### Create duplicate detection
- **Status:** Not Started
- **Priority:** Medium
- **Dependencies:** CSV parser  
- **Notes:** Hash file contents, skip duplicates

### 🏆 Winner Calculation

#### Build unit price calculation engine
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Local database  
- **Notes:** Handle preferred units conversion

#### Implement preference logic
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Price calculation  
- **Notes:** Hard preferences override price

#### Create substitution group handling
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Price calculation  
- **Notes:** Compare across product groups

### 🔄 Sync Mechanism

#### Build pending sync queue
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Local database  
- **Notes:** Track events awaiting Monday sync

#### Implement Monday 12:01 AM scheduler
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Sync queue  
- **Notes:** Batch upload proprietary data

#### Create web-to-local sync
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** API endpoints  
- **Notes:** Pull non-proprietary updates immediately

---

## Phase 3: Order Management

### 📦 Order Creation

#### Build order header interface
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Product catalog  
- **Notes:** Restaurant selection, delivery date

#### Create product selection UI
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Winner calculation  
- **Notes:** Show winners, allow overrides

#### Implement quantity entry
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Product selection  
- **Notes:** Par level suggestions

### 📍 Location-Based Pick Lists

#### Design storage location hierarchy
- **Status:** Not Started
- **Priority:** Medium
- **Dependencies:** Database schema  
- **Notes:** Rooms → locations → shelves

#### Build location assignment interface
- **Status:** Not Started
- **Priority:** Medium
- **Dependencies:** Location hierarchy  
- **Notes:** Drag-drop or form-based

#### Create pick list generator
- **Status:** Not Started
- **Priority:** Medium
- **Dependencies:** Location assignments  
- **Notes:** Sort by walking path

### 📤 Order Export

#### Build distributor contact management
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** User system  
- **Notes:** Email, phone, preferred method

#### Create CSV export templates
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Order data  
- **Notes:** Configurable column mapping

#### Implement email/text sending
- **Status:** Not Started
- **Priority:** Medium
- **Dependencies:** Export templates  
- **Notes:** SendGrid or similar service

---

## Phase 4: Historical Intelligence

### 🧾 Invoice Processing

#### Integrate OCR service
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** File upload  
- **Notes:** Extract prices and dates

#### Build date confirmation UI
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** OCR integration  
- **Notes:** Show extracted date, allow correction

#### Create price extraction logic
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** OCR integration  
- **Notes:** Match products, extract prices

### 🕒 Historical Corrections

#### Implement retroactive price updates
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Price events  
- **Notes:** Update forward-looking history

#### Build conflict resolution UI
- **Status:** Not Started
- **Priority:** Medium
- **Dependencies:** Price updates  
- **Notes:** Handle duplicate dates

### 📊 Analytics & Reporting

#### Create price trend graphs
- **Status:** Not Started
- **Priority:** Medium
- **Dependencies:** Historical data  
- **Notes:** Recharts implementation

#### Build savings calculator
- **Status:** Not Started
- **Priority:** Medium
- **Dependencies:** Order history  
- **Notes:** Compare actual vs. alternatives

#### Design dashboard layout
- **Status:** Not Started
- **Priority:** Low
- **Dependencies:** Analytics components  
- **Notes:** Mobile-responsive

---

## Phase 5: Scale & Reliability

### 🚀 Performance Optimization

#### Implement pagination
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Large datasets  
- **Notes:** Products, orders, history

#### Create materialized views
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Performance testing  
- **Notes:** Current prices, analytics

#### Add caching layer
- **Status:** Not Started
- **Priority:** Medium
- **Dependencies:** API structure  
- **Notes:** Redis for frequently accessed data

### 💳 Subscription & Billing

#### Integrate Stripe
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** User system  
- **Notes:** Subscription management

#### Build billing portal
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Stripe integration  
- **Notes:** Plan changes, payment methods

#### Implement usage tracking
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Billing system  
- **Notes:** Restaurant count enforcement

### 📱 Mobile App

#### Initialize React Native project
- **Status:** Not Started
- **Priority:** Medium
- **Dependencies:** Core API complete  
- **Notes:** iOS and Android support

#### Create offline data sync
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Mobile app  
- **Notes:** Queue actions when offline

#### Build responsive order interface
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Mobile app  
- **Notes:** Touch-optimized

---

## Technical Debt & Improvements

### ✅ Testing

#### Set up testing framework
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** None  
- **Notes:** Jest, React Testing Library

#### Write winner calculation tests
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Testing framework  
- **Notes:** Edge cases, preferences

#### Create sync logic tests
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Testing framework  
- **Notes:** Date scenarios, conflicts

### 📝 Documentation

#### Create API documentation
- **Status:** Not Started
- **Priority:** Medium
- **Dependencies:** API implementation  
- **Notes:** OpenAPI/Swagger spec

#### Write deployment guide
- **Status:** Not Started
- **Priority:** Low
- **Dependencies:** Infrastructure complete  
- **Notes:** Vercel, Supabase setup

### 🔐 Security

#### Implement rate limiting
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** API structure  
- **Notes:** Prevent abuse

#### Add input validation
- **Status:** Not Started
- **Priority:** High
- **Dependencies:** Forms complete  
- **Notes:** Zod schemas everywhere

#### Create audit logging
- **Status:** Not Started
- **Priority:** Medium
- **Dependencies:** User actions  
- **Notes:** Track sensitive operations

---

## 🆕 Discovered During Development
New tasks discovered during implementation will be added here

## ⛔ Blocked Tasks
Tasks that cannot proceed due to dependencies or external factors

## ✅ Completed Tasks
Move tasks here when complete with date and notes

### 2025-06-04

#### Set up Next.js Project with TypeScript and Tailwind CSS
- **Completed:** 2025-06-04
- **Notes:** Initialized Next.js project with App Router, TypeScript, and Tailwind CSS
- **Details:** Created basic folder structure following conventions in CLAUDE.md

#### Initialize Supabase Project
- **Completed:** 2025-06-04  
- **Notes:** Installed @supabase/ssr and @supabase/supabase-js
- **Details:** Created client/server utilities and middleware configuration

#### Create Initial Database Schema
- **Completed:** 2025-06-04
- **Notes:** Created 10 migration files covering all core tables
- **Details:** 
  - 001: PostgreSQL extensions
  - 002: Core reference tables (units, measurements)
  - 003: Organization and user management
  - 004: Restaurants and distributors
  - 005: Product catalog
  - 006: Storage locations
  - 007: Price events and history
  - 008: Orders and analytics
  - 009: Subscription billing
  - 010: Row Level Security policies

#### Set up Row Level Security Policies
- **Completed:** 2025-06-04
- **Notes:** Comprehensive RLS policies for all tables
- **Details:** Includes helper functions for checking user permissions

#### Create Database Indexes
- **Completed:** 2025-06-04
- **Notes:** Performance indexes included in migration files
- **Details:** Focused on restaurant_id, product lookups, and common queries

#### Update TypeScript Types
- **Completed:** 2025-06-04
- **Notes:** Complete TypeScript interfaces matching database schema
- **Details:** Added all table types, enums, and view types in /types/database.ts

#### Create Development Schema and Reset Script
- **Completed:** 2025-06-04
- **Notes:** Combined all migrations into single development schema file
- **Details:** 
  - Created `/database/development-schema.sql` with complete schema
  - Created `/scripts/reset-dev-database.js` for easy database reset
  - Script includes proper error handling and confirmation requirements

#### Implement Authentication System
- **Completed:** 2025-06-04
- **Notes:** Full Supabase Auth integration with automatic user sync
- **Details:**
  - Created `/lib/auth.ts` with client/server auth functions
  - Created `/lib/services/user-service.ts` for user management
  - Created `/lib/services/organization-service.ts` for org/restaurant hierarchy
  - Built auth pages: sign-in, sign-up, password reset, callback
  - Created `/app/dashboard` with protected routes
  - Added database triggers for automatic user sync from Supabase Auth
  - Created auth hook `/hooks/use-auth.ts` for React state management
  - Updated `.env.local.example` with required environment variables

#### Implement Product Catalog Management
- **Completed:** 2025-06-04
- **Notes:** Complete product catalog system with unit conversions
- **Details:**
  - Created `/lib/services/category-service.ts` for hierarchical categories
  - Created `/lib/services/unit-conversion-service.ts` for unit calculations
  - Created `/lib/services/product-service.ts` for global catalog CRUD
  - Created `/lib/services/restaurant-product-service.ts` for assignments
  - Created `/lib/services/distributor-spec-service.ts` for pack specifications
  - Built product UI pages: listing, add/edit forms
  - Created `/app/dashboard/products/` directory structure
  - Implemented search, filtering, and pagination
  - Added validation for measurement units and conversions
