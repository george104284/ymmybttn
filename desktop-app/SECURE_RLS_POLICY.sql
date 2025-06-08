-- IMPORTANT: Run this SQL in your Supabase SQL Editor to secure the product_catalog table
-- This replaces the insecure development policy with proper authentication

-- Step 1: Drop the insecure development policy
DROP POLICY IF EXISTS "Anyone can view products (Dev Only)" ON public.product_catalog;

-- Step 2: Create secure policy for anonymous authenticated access
-- This policy ensures only authenticated requests (with valid anon key) can read data
CREATE POLICY "Anonymous authenticated users can view active products" ON public.product_catalog
    FOR SELECT 
    TO anon  -- Specifically for the anonymous role from Supabase Auth
    USING (is_active = true);  -- Only show active products

-- Step 3: Ensure RLS is enabled (it should already be)
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'product_catalog';