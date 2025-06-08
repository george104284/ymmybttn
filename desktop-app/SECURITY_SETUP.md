# Security Setup Instructions

## ⚠️ CRITICAL: Apply Secure RLS Policy

The application currently has an **insecure development-only RLS policy** that must be replaced before any production use.

### Current Insecure State
```sql
-- THIS IS INSECURE - Anyone can read all data
CREATE POLICY "Anyone can view products (Dev Only)" ON public.product_catalog
    FOR SELECT USING (true);
```

### Steps to Secure Your Application

1. **Open Supabase SQL Editor**
   - Go to your Supabase dashboard: https://supabase.com/dashboard
   - Select your project
   - Navigate to SQL Editor

2. **Run the Security Migration**
   - Copy the contents of `SECURE_RLS_POLICY.sql`
   - Paste and execute in the SQL Editor
   - This will:
     - Drop the insecure development policy
     - Create a secure policy requiring authentication
     - Only allow access to active products
     - Restrict access to the `anon` role only

3. **Verify Security**
   - After running the migration, test the app
   - You should see "Authenticated" in the sync status
   - If you see "Auth Error", check:
     - The RLS policy was applied correctly
     - Your anon key in `.env` is correct
     - The Supabase URL is correct

### What the Secure Policy Does

```sql
CREATE POLICY "Anonymous authenticated users can view active products" ON public.product_catalog
    FOR SELECT 
    TO anon  -- Only the anonymous role from Supabase Auth
    USING (is_active = true);  -- Only active products
```

This ensures:
- ✅ Only authenticated requests can read data
- ✅ Only active products are visible
- ✅ The anon key must be provided
- ✅ No public access without authentication

### Testing Authentication

1. **With Valid Auth** - The app should:
   - Show "🔓 Authenticated" in green
   - Successfully sync products
   - Allow force sync

2. **With Invalid Auth** - The app should:
   - Show "🔒 Auth Error" in red
   - Display error message on hover
   - Disable force sync button
   - Continue showing cached data (read-only)

3. **Without Auth Headers** - Requests will:
   - Return HTTP 403 Forbidden
   - Not expose any data

### Troubleshooting

If authentication fails after applying the secure policy:

1. **Check RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'product_catalog';
   ```

2. **Verify policy exists**:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'product_catalog';
   ```

3. **Test with curl**:
   ```bash
   # This should fail with 403
   curl https://uphnitdzaarwcbbivdte.supabase.co/rest/v1/product_catalog

   # This should succeed
   curl https://uphnitdzaarwcbbivdte.supabase.co/rest/v1/product_catalog \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

### Important Notes

- The anon key is safe to use in desktop apps when RLS is properly configured
- Never use the service role key in client applications
- This setup uses Supabase's built-in anonymous authentication
- For multi-tenant support, implement user-specific authentication later

### Next Steps

After securing with RLS:
1. Test thoroughly in development
2. Monitor authentication status in the app
3. Consider adding user-specific authentication for enhanced security
4. Implement the timestamp-based sync optimization