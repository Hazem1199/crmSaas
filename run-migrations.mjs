// run-migrations.mjs - يُشغَّل مرة واحدة فقط لإنشاء قاعدة البيانات
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const client = new Client({
  connectionString: 'postgresql://postgres.gygvrialrarviousdsbe:FeIvK5OAzQuY5j6P@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
})

const migrations = [
  'supabase/migrations/001_init_schema.sql',
  'supabase/migrations/002_rls_helpers.sql',
  'supabase/migrations/003_rls_policies.sql',
]

async function run() {
  console.log('Connecting to Supabase...')
  await client.connect()
  console.log('Connected!')

  for (const file of migrations) {
    const filePath = path.join(__dirname, file)
    const sql = fs.readFileSync(filePath, 'utf8')
    console.log(`\nRunning: ${file}`)
    try {
      await client.query(sql)
      console.log(`  Done!`)
    } catch (err) {
      // Skip "already exists" errors
      if (err.message.includes('already exists') || err.code === '42P07' || err.code === '42710') {
        console.log(`  Skipped (already exists): ${err.message.slice(0, 80)}`)
      } else {
        console.error(`  ERROR: ${err.message}`)
        // Continue with next migration
      }
    }
  }

  await client.end()
  console.log('\nMigrations complete!')
}

run().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
