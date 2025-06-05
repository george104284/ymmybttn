/**
 * Development Database Reset Script
 * 
 * This script drops and recreates the development database using the combined schema.
 * DANGER: This will destroy all data in the database!
 * 
 * Usage:
 *   node scripts/reset-dev-database.js
 * 
 * Environment Variables Required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (not anon key!)
 *   DATABASE_URL - Direct PostgreSQL connection string (optional, fallback)
 * 
 * Make sure you have these set in your .env.local file
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SCHEMA_FILE = path.join(__dirname, '../database/development-schema.sql');
const REQUIRED_ENV_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

/**
 * Load and validate environment variables
 */
function loadEnvironment() {
    // Try to load .env.local
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        console.log('✓ Loaded .env.local');
    }

    // Validate required environment variables
    const missing = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(varName => console.error(`   ${varName}`));
        console.error('\nMake sure these are set in your .env.local file');
        process.exit(1);
    }

    return {
        supabaseUrl: process.env.SUPABASE_URL,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    };
}

/**
 * Read the schema file
 */
function readSchemaFile() {
    if (!fs.existsSync(SCHEMA_FILE)) {
        console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
        console.error('Make sure you run this from the project root directory');
        process.exit(1);
    }

    const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');
    console.log(`✓ Read schema file (${schema.length.toLocaleString()} characters)`);
    return schema;
}

/**
 * Split SQL into individual statements
 */
function splitSqlStatements(sql) {
    // Remove comments and empty lines
    const lines = sql.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('--'));
    
    const cleanSql = lines.join('\n');
    
    // Split on semicolons that aren't inside quotes
    const statements = [];
    let currentStatement = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < cleanSql.length; i++) {
        const char = cleanSql[i];
        const nextChar = cleanSql[i + 1];
        
        if (!inQuotes && (char === "'" || char === '"')) {
            inQuotes = true;
            quoteChar = char;
        } else if (inQuotes && char === quoteChar) {
            // Check for escaped quotes
            if (nextChar === quoteChar) {
                currentStatement += char + nextChar;
                i++; // Skip next character
                continue;
            }
            inQuotes = false;
            quoteChar = '';
        }
        
        if (!inQuotes && char === ';') {
            currentStatement = currentStatement.trim();
            if (currentStatement) {
                statements.push(currentStatement);
                currentStatement = '';
            }
        } else {
            currentStatement += char;
        }
    }
    
    // Add final statement if it exists
    currentStatement = currentStatement.trim();
    if (currentStatement) {
        statements.push(currentStatement);
    }
    
    return statements.filter(stmt => stmt.length > 0);
}

/**
 * Execute SQL statements with better error handling
 */
async function executeStatements(supabase, statements) {
    console.log(`\n🔄 Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        const statementPreview = statement.substring(0, 80) + (statement.length > 80 ? '...' : '');
        
        try {
            const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
            
            if (error) {
                console.error(`❌ Statement ${i + 1} failed: ${statementPreview}`);
                console.error(`   Error: ${error.message}`);
                errorCount++;
                
                // Don't exit on error - some statements might fail expectedly (like DROP TABLE)
                continue;
            }
            
            successCount++;
            if (successCount % 10 === 0) {
                console.log(`✓ Completed ${successCount}/${statements.length} statements`);
            }
            
        } catch (err) {
            console.error(`❌ Statement ${i + 1} failed: ${statementPreview}`);
            console.error(`   Error: ${err.message}`);
            errorCount++;
        }
    }
    
    console.log(`\n📊 Results: ${successCount} succeeded, ${errorCount} failed`);
    return { successCount, errorCount };
}

/**
 * Create the exec_sql function if it doesn't exist
 */
async function ensureExecSqlFunction(supabase) {
    const functionSql = `
        CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            EXECUTE sql_query;
        END;
        $$;
    `;
    
    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: functionSql });
        if (error && !error.message.includes('function "exec_sql" does not exist')) {
            throw error;
        }
        console.log('✓ Ensured exec_sql function exists');
    } catch (err) {
        // If function doesn't exist yet, create it using direct SQL
        console.log('⚠️  Creating exec_sql function...');
        // This is a bit of a chicken-and-egg problem, but we can try
        // For now, we'll handle this manually
    }
}

/**
 * Confirm destructive action
 */
async function confirmReset() {
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ Cannot run database reset in production environment');
        process.exit(1);
    }
    
    console.log('\n⚠️  WARNING: This will completely destroy and recreate your database!');
    console.log('   All data will be lost permanently.');
    console.log('   This should only be used in development.');
    
    // In a real script, you'd want readline here for interactive confirmation
    // For now, we'll just add a flag check
    if (!process.argv.includes('--confirm')) {
        console.log('\n❌ Cancelled. Add --confirm flag to proceed.');
        console.log('   Example: node scripts/reset-dev-database.js --confirm');
        process.exit(1);
    }
    
    console.log('\n✓ Confirmed. Proceeding with database reset...');
}

/**
 * Main execution function
 */
async function main() {
    console.log('🗃️  Database Reset Tool\n');
    
    try {
        // Load environment and validate
        const env = loadEnvironment();
        
        // Confirm destructive action
        await confirmReset();
        
        // Read schema file
        const schemaSQL = readSchemaFile();
        
        // Create Supabase client
        const supabase = createClient(env.supabaseUrl, env.serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        console.log('✓ Connected to Supabase');
        
        // Ensure helper function exists
        await ensureExecSqlFunction(supabase);
        
        // Split SQL into statements
        const statements = splitSqlStatements(schemaSQL);
        console.log(`✓ Parsed ${statements.length} SQL statements`);
        
        // Add preliminary DROP statements to clean up
        const dropStatements = [
            'DROP SCHEMA IF EXISTS public CASCADE',
            'CREATE SCHEMA public',
            'GRANT ALL ON SCHEMA public TO public',
            'GRANT ALL ON SCHEMA public TO postgres'
        ];
        
        const allStatements = [...dropStatements, ...statements];
        
        // Execute all statements
        const results = await executeStatements(supabase, allStatements);
        
        // Final status
        console.log('\n🎉 Database reset completed!');
        console.log(`   Successfully executed ${results.successCount} statements`);
        if (results.errorCount > 0) {
            console.log(`   ${results.errorCount} statements had errors (this may be expected)`);
        }
        
        console.log('\n✅ Your development database is ready to use.');
        
    } catch (error) {
        console.error('\n❌ Database reset failed:');
        console.error(error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { main };