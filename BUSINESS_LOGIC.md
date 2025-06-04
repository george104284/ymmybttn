#BUSINESS_LOGIC

###Arrival of Preferred Total Units

Key Variables:

preferred_measurement - How the operator thinks about the item (lb for steaks, count for produce)
measurement_type - Category validation (weight, volume, count)
total_preferred_units - Calculated standardized units per case

####Logic:
When ProductDistributorSpecs are saved:
1. Validate measurement types match (can't convert count to weight)
2. Calculate: total_preferred_units = case_packs × pack_size × conversion_factor
3. Store this standardized value for price comparisons
4. Sync to LocalCurrentPrices when specs change

}

###Preferences

Key Variables:

preferred_distributor_id - Which distributor is preferred for a product
always_use_preferred - Boolean flag to skip price comparison

Logic:
ProductPreferences (one per product):
- If always_use_preferred = true → Use that distributor regardless of price
- If always_use_preferred = false → Use for tiebreaking only
- Database enforces one preference per product via unique constraint

###Substitution Groups

Key Variables:

group_id - Identifies the substitution group
group_name - Human-readable name (e.g., "Tomatoes - Any Size")
generic_product_id - Products that can substitute for each other

Logic:
SubstitutionGroups allow products to compete across types:
- All products in group must have same measurement_type
- No preferences within group (uses ProductPreferences if needed)
- Groups products that operators view as interchangeable

### Winner Calculation

Key Variables for Winner Calculation:

case_price - Current price per case
total_preferred_units - Standardized units per case
unit_price - Calculated as case_price / total_preferred_units
preferred_distributor_id - For tiebreaking
always_use_preferred - Overrides price comparison

This system ensures true apples-to-apples price comparison while respecting operator preferences and allowing flexible product substitutions.

Logic
For each item in order:

1. Check if item has hard preference (always_use_preferred = true)
   → If yes: Select that distributor, skip all other logic

2. Check if item belongs to a substitution group
   → If yes: 
      a. Get all products in the group
      b. Calculate unit_price for each:
         unit_price = case_price / total_preferred_units
      c. Find lowest unit_price across ALL products & distributors
      d. If tied, check ProductPreferences for tiebreaker

3. Standard single product (no substitution group)
   → Calculate unit_price for each distributor
   → Select lowest unit_price
   → If tied, use ProductPreferences for tiebreaker

4. Display result with both case and unit pricing:
   "US Foods Plum Tomatoes: $22.00/case ($0.85/lb)"

###When ProductDistributorSpecs changes in web app:
1. Recalculate total_preferred_units
2. Create sync event: {
    event_type: "product_spec_update",
    generic_product_id: xxx,
    distributor_id: xxx,
    total_preferred _units: xxx
}
3. Push to all affected local apps
4. Local app updates:
   - Updates total_preferred_units
   - Recalculates unit_price = case_price / total_preferred_units

###Price Sync Logic

####CSV Import Logic (Local App)

1. User selects CSV file for import
2. System reads file metadata:
   - Try: File creation date
   - Fallback: Earliest last modified date
   - Result → effective_date

3. For each price in CSV:
   - Check: Is CSV effective_date > existing local_current_prices.effective_date?
   - If YES: Update local_current_prices with new price and effective_date
   - If NO: Skip (user uploaded an old CSV)

4. Create pending_sync_events record with:
   - effective_date = CSV file date
   - created_at = now()

#### Invoice Scan / Upload in Web App

1. User uploads invoice to web app
2. OCR extracts potential invoice date
3. System shows: "Is this invoice date correct? [2024-01-20]"
4. User confirms or corrects date → effective_date

5. For each price on invoice:
   - Insert into price_events with confirmed effective_date (skip if confirmed effective already exists for the product)
   - Check if this is newer than current_prices
   - If newer: Update current_prices view
   - Sync to local app if newest known price

#### Manual Price Entry

1. User enters price manually
2. System defaults to today's date
3. User can override → effective_date
4. Insert into price_events with chosen effective_date

####Monday 12:01 AM Sync Process


1. Query pending_sync_events where effective_date < current_monday
2. For each event:
   - Send to web with original effective_date (from CSV file date)
   - Web inserts into price_events keeping that effective_date
   - NOT using current date - preserving original CSV date


####Web → Local Sync
1. Local requests updates since last_sync_timestamp
2. Supabase returns price_events where:
   - created_at > last_sync_timestamp
   - effective_date > local's current effective_date
3. Local updates only if incoming effective_date is newer

### Order Export Process

1. Collaborative order between users (chefts managers etc) is complete
2. System groups items by distributor
3. For each distributor:
   - Check order_export_configs for format/delivery
   - Generate CSV with mapped columns
   - If auto_send:
     - Email to sales contact
     - OR text order summary with link
   - Else: Provide download link
4. Log in order_exports table

### Distributor Sales Rep
1. Restaurant invites distributor sales rep
2. System creates user account (if new)
3. Creates user_assignment with type 'distributor_sales'
4. Sales rep logs in and can:
   - View products their distributor supplies
   - Edit product_distributor_specs for their items
   - View orders from this restaurant
   - Cannot see other distributors' data

### Adding a new product:

1. Create Product in Global Catalog

User enters: Product Name, Category, Preferred Measurement
System saves to product_catalog table
Product now exists but isn't assigned to any restaurant


2. Assign Product to Restaurants

User sees list of all their restaurants with checkboxes
User checks which restaurants should have this product
For each checked restaurant:

Option to set custom name (optional)
Option to set par level (optional)


System creates entries in restaurant_products table

### Subscriptions

#### Local App Startup

1. Check subscription_cache
2. If cache expired (>24 hours old):
   - Call web API to verify subscription
   - Update cache with new status
3. If subscription invalid:
   - Show "Subscription Expired" screen
   - Disable all features except viewing
   - Provide link to billing portal

#### Web App Restaurant Creation

1. User tries to add new restaurant
2. Check subscription_status view:
   - If can_add_restaurant = false:
     - Show "Upgrade Required" message
     - Display current plan limits
     - Link to upgrade options
3. If allowed, proceed with creation


### Schema Update Workflow
1. **Update DATABASE_SCHEMA.md** with proposed changes first
2. **Create migration files** based on the documented changes
3. **Implement and test** the migration
4. **Verify DATABASE_SCHEMA.md** still matches actual implementation
5. **Update related TypeScript types** and business logic
