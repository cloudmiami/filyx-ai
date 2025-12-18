// Quick environment validation script
// Run with: node scripts/validate-env.js

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Filyx.ai Environment Validation\n');

const requiredVars = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL', 
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'NEXTAUTH_SECRET'
];

let allGood = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value !== `your-${varName.toLowerCase().replace(/_/g, '-')}-here`) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing or placeholder`);
    allGood = false;
  }
});

console.log('\n📋 Validation Summary:');
if (allGood) {
  console.log('🎉 All environment variables are configured!');
  console.log('🚀 Ready to run: npm run db:migrate');
} else {
  console.log('⚠️  Please configure the missing environment variables');
  console.log('📖 Check SUPABASE-SETUP.md for detailed instructions');
}

// Additional validations
if (process.env.DATABASE_URL) {
  if (process.env.DATABASE_URL.includes('supabase.com')) {
    console.log('✅ Using Supabase database');
  } else if (process.env.DATABASE_URL.includes('localhost')) {
    console.log('ℹ️  Using local database');
  }
}

if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) {
  console.log('⚠️  OpenAI API key should start with "sk-"');
}