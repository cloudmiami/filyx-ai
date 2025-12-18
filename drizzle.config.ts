import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
}