import { config } from 'dotenv'
import { documentCategories } from '../src/lib/schema'
import { db } from '../src/lib/db'
import { nanoid } from 'nanoid'

// Load environment variables
config({ path: '.env.local' })

// System categories to pre-populate
const systemCategories = [
  {
    name: 'Invoices',
    description: 'Bills and invoices from vendors and suppliers',
    color: '#10B981', // Green
    icon: 'receipt',
  },
  {
    name: 'Contracts',
    description: 'Legal agreements and contracts',
    color: '#8B5CF6', // Purple
    icon: 'file-contract',
  },
  {
    name: 'Receipts',
    description: 'Purchase receipts and expense documentation',
    color: '#F59E0B', // Amber
    icon: 'shopping-bag',
  },
  {
    name: 'Tax Documents',
    description: 'Tax forms, returns, and related documentation',
    color: '#EF4444', // Red
    icon: 'calculator',
  },
  {
    name: 'Legal Documents',
    description: 'Legal papers, agreements, and official documents',
    color: '#1F2937', // Gray
    icon: 'scale',
  },
  {
    name: 'Financial Statements',
    description: 'Bank statements, financial reports, and accounting documents',
    color: '#059669', // Emerald
    icon: 'chart-line',
  },
  {
    name: 'Insurance',
    description: 'Insurance policies, claims, and related documents',
    color: '#0EA5E9', // Sky
    icon: 'shield-check',
  },
  {
    name: 'Personal Documents',
    description: 'Personal identification and important personal papers',
    color: '#6366F1', // Indigo
    icon: 'user',
  },
  {
    name: 'Business Documents',
    description: 'General business correspondence and documentation',
    color: '#3B6AC7', // Professional blue (default)
    icon: 'briefcase',
  },
  {
    name: 'Other',
    description: 'Uncategorized or miscellaneous documents',
    color: '#6B7280', // Gray
    icon: 'folder',
  },
]

async function seedSystemCategories() {
  console.log('🌱 Seeding system categories...')
  
  try {
    // Insert system categories
    for (const category of systemCategories) {
      await db.insert(documentCategories).values({
        id: nanoid(),
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        isSystem: true,
        userId: null, // System categories don't belong to any user
      })
      console.log(`✅ Created system category: ${category.name}`)
    }
    
    console.log('🎉 System categories seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding system categories:', error)
    throw error
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedSystemCategories()
    .then(() => {
      console.log('✨ Seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}

export { seedSystemCategories }