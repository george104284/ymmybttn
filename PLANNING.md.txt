Planning doc 2

# Planning.md - ymmybttn Restaurant Inventory System

## Vision & Success Metrics

**Vision:** Build the most reliable inventory pricing system for restaurants, enabling them to save 15–20% on supply costs through intelligent distributor selection while respecting proprietary pricing windows.

**Success Metrics:**
- Reduce order processing time from 2 hours to 30 minutes  
- Save restaurants 15–20% on supply costs through optimal distributor selection  
- 99.9% sync reliability between local and cloud systems  
- Support 10,000+ restaurants with 3–6 distributors each

**Target Users** -Primary users include chefs, kitchen managers, and owners of independent restaurants and small restaurant groups wanting to collaboratively work on, streamline and 
get best value product. 

---

## Architecture Overview

###Core Data Concepts

#### Key Entities:

ProductCatalog - Global product database shared across all restaurants
RestaurantProducts - Restaurant-specific product assignments with par levels
Organizations - Billing entities that own multiple restaurants
Distributors - Supplier companies (Sysco, US Foods, etc.)
DistributorSpecs - Pack sizes and units for each distributor's products
PriceEvents - Time-stamped price changes (event-sourced history)
CurrentPrices - Materialized view of latest prices per product/distributor
Orders - Purchase orders with winner selections
Users - Staff with role-based permissions (GM, chef, distributor sales)
SubstitutionGroups - Interchangeable products (e.g., any size tomato)
ProductLocations - Storage locations for pick list generation

#### Key Calculations:

TotalPreferredUnits - Standardized units per case for comparison
UnitPrice - Price per preferred unit (enables true comparison)
EffectiveDate - When a price becomes valid (drives sync logic)
WinnerCalculation - Algorithm selecting lowest unit price respecting preferences

#### Key Processes:

MondaySync - Proprietary prices become historical at week's end
CSVImport - File date becomes effective date for pricing
InvoiceCorrection - Historical updates propagate forward in time

### Hybrid Architecture Decision  
Distributor pricing is proprietary for the current week. Legal requirement drives our two-app approach:

- **Local Desktop (Tauri/Rust/SQLite):** Stores current proprietary prices, performs winner calculations  
- **Web App (Next.js/Supabase):** Historical pricing, order management, analytics, multi-restaurant support  

**Data Flow:**  
CSVs → Local App → Monday 12:01 AM → Cloud Database → Analytics/Orders  

**Why Event Sourcing:**  
Price changes are events, not states. Enables accurate historical graphs and retroactive corrections when users upload old invoices weeks later.

---

## Development Phases

### Phase 1: Core Infrastructure

**Goal:** Foundation for reliable data management and user access

- Database schema with event-sourced pricing  
- Authentication with organization/restaurant hierarchy  
- Global product catalog with restaurant assignments  
- Basic CRUD operations for products and distributors  

**Success Criteria:** Can create products, assign to restaurants, manage users with proper permissions

---

### Phase 2: Local App & Pricing Engine

**Goal:** Accurate price management respecting proprietary data rules

- Tauri desktop app with SQLite for current prices  
- CSV import with intelligent effective date detection  
- Winner calculation engine (preferences, substitutions, unit conversions)  
- Monday sync mechanism for proprietary → historical data  

**Success Criteria:** Can import CSVs, calculate winners locally, sync to cloud after proprietary period

---

### Phase 3: Order Management

**Goal:** Streamline ordering process from selection to distributor delivery

- Order creation interface with location-based pick lists  
- Substitution groups for flexible product selection  
- Export to distributor formats (CSV, email, API)  
- Order history and analytics  

**Success Criteria:** Complete order cycle from creation to distributor delivery

---

### Phase 4: Historical Intelligence

**Goal:** Turn price history into actionable insights

- Invoice scanning and OCR integration  
- Historical price correction workflow  
- Price trend graphs by product/distributor  
- Savings reports and analytics  

**Success Criteria:** Can upload old invoices to correct history, view accurate price trends

---

### Phase 5: Scale & Reliability 

**Goal:** Production-ready system for thousands of restaurants

- Subscription management and billing  
- Performance optimization for 10k+ items  
- Offline resilience for poor connectivity  
- Mobile app for on-the-go ordering  

**Success Criteria:** System handles 1000+ concurrent users, works offline, processes large catalogs

---

## Core Features

### Product Management  
Global catalog shared across restaurants with location-specific assignments. Products belong to one catalog but can be assigned to multiple restaurants with custom names and par levels.

### Winner Calculation  
Finds lowest unit price across distributors, respecting hard preferences and substitution groups. Converts all units to preferred measurement for true comparison.

### Sync Engine  
Intelligent bi-directional sync preserving effective dates.  
- Local → Cloud on Mondays for proprietary data  
- Cloud → Local immediately for non-proprietary updates  

### Order Processing  
Location-aware pick lists, distributor-specific exports, sales contact management. Orders created in web app using latest available prices.

### Historical Corrections  
Upload old invoices to correct price history. System propagates corrections forward through affected time periods.

---

## Integration Points

### Local ↔ Cloud Sync
- **Trigger:** Monday 12:01 AM for proprietary data  
- **Method:** Batch events with deduplication  
- **Conflict Resolution:** Cloud wins for historical, Local wins for current week  

### Distributor Integrations
- **Import:** CSV files with auto-detection of format  
- **Export:** Configurable CSV mapping per distributor. User Downloads .csv or emailed to sales person
- **Future:** Direct API integration for real-time pricing  

### Payment Processing
- Stripe for subscription management  
- Usage-based pricing by restaurant count  
- Feature flags for plan limitations  

---

## Key Business Constraints

- **Proprietary Pricing Window:** Current week prices cannot leave local app until Monday. This is non-negotiable and drives entire architecture.  
- **Mobile-First Reality:** Restaurant staff use phones during service. Poor connectivity is common. UI must be touch-optimized and work offline.  
- **Distributor Variability:** Same product has different codes, pack sizes, and prices per distributor. Unit conversion and normalization are critical.  
- **Historical Accuracy:** Restaurants may upload invoices months later. System must handle retroactive updates without breaking current operations.  

---

## Technical Decisions

- **Why Tauri:** Need desktop app for local data. Rust provides performance for large CSVs. Native file system access for automated imports.  
- **Why Supabase:** Built-in auth, RLS for data isolation, real-time subscriptions, edge functions for performance.  
- **Why Event Sourcing:** Prices change over time. Events preserve history and enable corrections. Materialized views provide current state.  
- **Why Global Catalog:** Reduce duplication, enable product sharing across restaurant groups, standardize reporting.  

---

## Risk Mitigation

- **Data Loss:** Event sourcing provides natural audit trail. Local SQLite regularly backed up. Cloud database has point-in-time recovery.  
- **Sync Failures:** Idempotent operations, retry queues, manual sync triggers. Both apps show sync status clearly.  
- **Scale Issues:** Pagination, materialized views, edge caching. Database sharding plan ready for 10k+ restaurants.  
- **User Adoption:** Progressive rollout, import existing data, maintain familiar workflows. Desktop app for power users, web for convenience.  

---

## Future Considerations
  
- **Marketplace:** Restaurants share pricing data anonymously, gain collective bargaining power.  
- **Inventory Integration:** Connect to POS systems, auto-generate orders based on depletion rates.  
- **API Integrations with Purveyors:** Connect directly to purveyor, no need for invoice scanning or .csv upload
- **Voice Ordering:** "Add 5 cases of tomatoes to tomorrow's order" via mobile app.  

---

> This document provides strategic direction.  
> For implementation details, see **BUSINESS_LOGIC.md** and **DATABASE_SCHEMA.md**.  
> For current tasks, see **Tasks.md**.
