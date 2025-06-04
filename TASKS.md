Tasks.md - ymmybttn Restaurant Inventory System
Current Sprint Focus
Goal: Complete core infrastructure and begin local app development

Phase 1: Core Infrastructure
Database Setup

 Initialize Supabase project

Status: Not Started
Priority: High
Dependencies: None
Notes: Set up auth, enable RLS, configure database


 Create initial database schema

Status: Not Started
Priority: High
Dependencies: Supabase project
Notes: Run migrations for all core tables


 Set up Row Level Security policies

Status: Not Started
Priority: High
Dependencies: Database schema
Notes: Ensure restaurant data isolation


 Create database indexes

Status: Not Started
Priority: Medium
Dependencies: Database schema
Notes: Focus on restaurant_id + product lookups



Authentication & Users

 Implement Supabase Auth integration

Status: Not Started
Priority: High
Dependencies: Supabase project
Notes: Email/password, magic links


 Create user management system

Status: Not Started
Priority: High
Dependencies: Auth integration
Notes: User types, permissions, assignments


 Build organization/restaurant hierarchy

Status: Not Started
Priority: High
Dependencies: User management
Notes: Support multi-restaurant owners



Product Catalog

 Create product CRUD operations

Status: Not Started
Priority: High
Dependencies: Database schema
Notes: Global catalog with restaurant assignments


 Implement category management

Status: Not Started
Priority: Medium
Dependencies: Product CRUD
Notes: Hierarchical categories with temperature zones


 Build distributor product specs interface

Status: Not Started
Priority: High
Dependencies: Product CRUD
Notes: Pack sizes, units, conversion calculations


 Create unit conversion system

Status: Not Started
Priority: High
Dependencies: None
Notes: Database functions for consistent calculations




Phase 2: Local App & Pricing Engine
Tauri Desktop App

 Initialize Tauri project structure

Status: Not Started
Priority: High
Dependencies: None
Notes: Rust backend, React frontend


 Set up SQLite database

Status: Not Started
Priority: High
Dependencies: Tauri project
Notes: Local schema matching web structure


 Create subscription validation

Status: Not Started
Priority: High
Dependencies: SQLite setup
Notes: Cache subscription status, periodic checks



CSV Import

 Build file picker and parser

Status: Not Started
Priority: High
Dependencies: Tauri app
Notes: Support multiple distributor formats


 Implement effective date detection

Status: Not Started
Priority: High
Dependencies: CSV parser
Notes: File creation/modified date logic


 Create duplicate detection

Status: Not Started
Priority: Medium
Dependencies: CSV parser
Notes: Hash file contents, skip duplicates



Winner Calculation

 Build unit price calculation engine

Status: Not Started
Priority: High
Dependencies: Local database
Notes: Handle preferred units conversion


 Implement preference logic

Status: Not Started
Priority: High
Dependencies: Price calculation
Notes: Hard preferences override price


 Create substitution group handling

Status: Not Started
Priority: High
Dependencies: Price calculation
Notes: Compare across product groups



Sync Mechanism

 Build pending sync queue

Status: Not Started
Priority: High
Dependencies: Local database
Notes: Track events awaiting Monday sync


 Implement Monday 12:01 AM scheduler

Status: Not Started
Priority: High
Dependencies: Sync queue
Notes: Batch upload proprietary data


 Create web-to-local sync

Status: Not Started
Priority: High
Dependencies: API endpoints
Notes: Pull non-proprietary updates immediately




Phase 3: Order Management
Order Creation

 Build order header interface

Status: Not Started
Priority: High
Dependencies: Product catalog
Notes: Restaurant selection, delivery date


 Create product selection UI

Status: Not Started
Priority: High
Dependencies: Winner calculation
Notes: Show winners, allow overrides


 Implement quantity entry

Status: Not Started
Priority: High
Dependencies: Product selection
Notes: Par level suggestions



Location-Based Pick Lists

 Design storage location hierarchy

Status: Not Started
Priority: Medium
Dependencies: Database schema
Notes: Rooms → locations → shelves


 Build location assignment interface

Status: Not Started
Priority: Medium
Dependencies: Location hierarchy
Notes: Drag-drop or form-based


 Create pick list generator

Status: Not Started
Priority: Medium
Dependencies: Location assignments
Notes: Sort by walking path



Order Export

 Build distributor contact management

Status: Not Started
Priority: High
Dependencies: User system
Notes: Email, phone, preferred method


 Create CSV export templates

Status: Not Started
Priority: High
Dependencies: Order data
Notes: Configurable column mapping


 Implement email/text sending

Status: Not Started
Priority: Medium
Dependencies: Export templates
Notes: SendGrid or similar service




Phase 4: Historical Intelligence
Invoice Processing

 Integrate OCR service

Status: Not Started
Priority: High
Dependencies: File upload
Notes: Extract prices and dates


 Build date confirmation UI

Status: Not Started
Priority: High
Dependencies: OCR integration
Notes: Show extracted date, allow correction


 Create price extraction logic

Status: Not Started
Priority: High
Dependencies: OCR integration
Notes: Match products, extract prices



Historical Corrections

 Implement retroactive price updates

Status: Not Started
Priority: High
Dependencies: Price events
Notes: Update forward-looking history


 Build conflict resolution UI

Status: Not Started
Priority: Medium
Dependencies: Price updates
Notes: Handle duplicate dates



Analytics & Reporting

 Create price trend graphs

Status: Not Started
Priority: Medium
Dependencies: Historical data
Notes: Recharts implementation


 Build savings calculator

Status: Not Started
Priority: Medium
Dependencies: Order history
Notes: Compare actual vs. alternatives


 Design dashboard layout

Status: Not Started
Priority: Low
Dependencies: Analytics components
Notes: Mobile-responsive




Phase 5: Scale & Reliability
Performance Optimization

 Implement pagination

Status: Not Started
Priority: High
Dependencies: Large datasets
Notes: Products, orders, history


 Create materialized views

Status: Not Started
Priority: High
Dependencies: Performance testing
Notes: Current prices, analytics


 Add caching layer

Status: Not Started
Priority: Medium
Dependencies: API structure
Notes: Redis for frequently accessed data



Subscription & Billing

 Integrate Stripe

Status: Not Started
Priority: High
Dependencies: User system
Notes: Subscription management


 Build billing portal

Status: Not Started
Priority: High
Dependencies: Stripe integration
Notes: Plan changes, payment methods


 Implement usage tracking

Status: Not Started
Priority: High
Dependencies: Billing system
Notes: Restaurant count enforcement



Mobile App

 Initialize React Native project

Status: Not Started
Priority: Medium
Dependencies: Core API complete
Notes: iOS and Android support


 Create offline data sync

Status: Not Started
Priority: High
Dependencies: Mobile app
Notes: Queue actions when offline


 Build responsive order interface

Status: Not Started
Priority: High
Dependencies: Mobile app
Notes: Touch-optimized




Technical Debt & Improvements
Testing

 Set up testing framework

Status: Not Started
Priority: High
Dependencies: None
Notes: Jest, React Testing Library


 Write winner calculation tests

Status: Not Started
Priority: High
Dependencies: Testing framework
Notes: Edge cases, preferences


 Create sync logic tests

Status: Not Started
Priority: High
Dependencies: Testing framework
Notes: Date scenarios, conflicts



Documentation

 Create API documentation

Status: Not Started
Priority: Medium
Dependencies: API implementation
Notes: OpenAPI/Swagger spec


 Write deployment guide

Status: Not Started
Priority: Low
Dependencies: Infrastructure complete
Notes: Vercel, Supabase setup



Security

 Implement rate limiting

Status: Not Started
Priority: High
Dependencies: API structure
Notes: Prevent abuse


 Add input validation

Status: Not Started
Priority: High
Dependencies: Forms complete
Notes: Zod schemas everywhere


 Create audit logging

Status: Not Started
Priority: Medium
Dependencies: User actions
Notes: Track sensitive operations




Discovered During Development
New tasks discovered during implementation will be added here

Blocked Tasks
Tasks that cannot proceed due to dependencies or external factors

Completed Tasks
Move tasks here when complete with date and notes