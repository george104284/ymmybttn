# Database Migrations

This directory contains SQL migration files for setting up the ymmybttn database schema in Supabase.

## Migration Files

The migrations are organized in numbered files to ensure they run in the correct order:

1. **001_enable_extensions.sql** - Enables necessary PostgreSQL extensions
2. **002_core_reference_tables.sql** - Creates unit conversions and measurement types
3. **003_organization_and_users.sql** - User management and permissions
4. **004_restaurants_and_distributors.sql** - Restaurant and distributor tables
5. **005_product_catalog.sql** - Product catalog and related tables
6. **006_storage_locations.sql** - Storage room and location management
7. **007_price_events.sql** - Price history and event sourcing
8. **008_orders_and_analytics.sql** - Order management and analytics
9. **009_subscription_billing.sql** - Subscription plans and billing
10. **010_row_level_security.sql** - RLS policies for data security

## Running Migrations

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order (001 through 010)
4. Verify each migration completes successfully before running the next

### Option 2: Using Supabase CLI

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Run migrations:
```bash
# Run all migrations
for file in database/migrations/*.sql; do
  supabase db push --file "$file"
done
```

### Option 3: Using psql

1. Get your database connection string from Supabase dashboard
2. Run migrations using psql:
```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres:[password]@[host]:[port]/postgres"

# Run all migrations
for file in database/migrations/*.sql; do
  psql $DATABASE_URL -f "$file"
done
```

## Important Notes

1. **Order Matters**: Always run migrations in numerical order
2. **Extensions First**: The extensions migration (001) must run before all others
3. **RLS Policies**: The RLS migration (010) should run last as it depends on all tables
4. **Idempotency**: Migrations use `IF NOT EXISTS` where possible, but be careful about re-running
5. **Production**: Always test migrations in a development environment first

## Verifying Installation

After running all migrations, verify the setup:

```sql
-- Check all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check materialized views
SELECT matviewname 
FROM pg_matviews 
WHERE schemaname = 'public';
```

## Troubleshooting

- **Permission Errors**: Ensure you're using the correct database user
- **Foreign Key Errors**: Tables must be created in the correct order
- **Extension Errors**: Some extensions require superuser privileges
- **RLS Issues**: Make sure to test with different user roles

## Next Steps

After migrations are complete:
1. Create your first organization and user
2. Set up Supabase Auth integration
3. Configure environment variables in your application
4. Test RLS policies with different user types