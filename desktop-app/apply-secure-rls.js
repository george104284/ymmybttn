const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'src-tauri/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uphnitdzaarwcbbivdte.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwaG5pdGR6YWFyd2NiYml2ZHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDg0OTYsImV4cCI6MjA2MzkyNDQ5Nn0.QNKBU7uMmKZmQfLFsNdhkQzdEdLqt7NdFstYNibvK80';

// Read the SQL file
const sqlContent = fs.readFileSync(path.join(__dirname, 'SECURE_RLS_POLICY.sql'), 'utf8');

// Function to execute SQL via Supabase REST API
async function executeSql(sql) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
  
  const options = {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };

  const body = JSON.stringify({ query: sql });

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: JSON.parse(data) });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Test authentication
async function testAuthentication() {
  console.log('Testing authentication...');
  
  // Test without auth headers
  const urlNoAuth = new URL(`${SUPABASE_URL}/rest/v1/product_catalog?limit=1`);
  
  return new Promise((resolve) => {
    https.get(urlNoAuth, (res) => {
      console.log(`Without auth: HTTP ${res.statusCode}`);
      resolve(res.statusCode === 403);
    });
  });
}

// Test with auth headers
async function testAuthenticatedAccess() {
  const url = new URL(`${SUPABASE_URL}/rest/v1/product_catalog?limit=1`);
  
  const options = {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  };

  return new Promise((resolve) => {
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`With auth: HTTP ${res.statusCode}`);
        if (res.statusCode === 200) {
          const products = JSON.parse(data);
          console.log(`Successfully fetched ${products.length} products`);
          resolve(true);
        } else {
          console.log('Response:', data);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.error('Error:', err);
      resolve(false);
    });
  });
}

async function main() {
  console.log('Applying Secure RLS Policy to Supabase...\n');
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Using anon key:', SUPABASE_ANON_KEY.substring(0, 20) + '...\n');

  try {
    // Note: Direct SQL execution via REST API requires service role key
    // Since we only have anon key, we'll provide instructions instead
    
    console.log('⚠️  IMPORTANT: Direct SQL execution requires service role key.');
    console.log('Please run the following SQL in your Supabase SQL Editor:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/uphnitdzaarwcbbivdte/sql/new');
    console.log('2. Copy and paste the contents of SECURE_RLS_POLICY.sql');
    console.log('3. Execute the query\n');
    
    // Test current authentication state
    console.log('Testing current authentication state...\n');
    
    const isSecure = await testAuthentication();
    if (isSecure) {
      console.log('✅ Good! Unauthenticated requests are already blocked (403)');
    } else {
      console.log('⚠️  WARNING: Unauthenticated requests are NOT blocked!');
      console.log('   This means the insecure policy is still active.');
    }
    
    const canAccess = await testAuthenticatedAccess();
    if (canAccess) {
      console.log('✅ Authenticated requests work correctly');
    } else {
      console.log('❌ Authenticated requests failed - check your configuration');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();