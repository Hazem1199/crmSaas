/**
 * تنفيذ supabase/migrations/005_labels_per_campaign.sql على قاعدة البيانات.
 * يقرأ DATABASE_URL من .env ويحوّل pooler :6543 إلى :5432 لدعم DDL.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const envPath = path.join(root, '.env')

const envText = fs.readFileSync(envPath, 'utf8')
let databaseUrl = ''
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^DATABASE_URL=(.+)$/)
  if (m) databaseUrl = m[1].trim()
}

if (!databaseUrl) {
  console.error('DATABASE_URL غير موجود في .env')
  process.exit(1)
}

if (databaseUrl.includes(':6543/')) {
  databaseUrl = databaseUrl.replace(':6543/', ':5432/')
  console.log('استخدام المنفذ 5432 لتنفيذ المايجريشن (DDL).')
}

const sqlPath = path.join(root, 'supabase', 'migrations', '005_labels_per_campaign.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
try {
  await client.query(sql)
  try {
    await client.query("NOTIFY pgrst, 'reload schema'")
  }
  catch {
    // غير حرج إن لم يكن PostgREST يستمع (بيئات محلية)
  }
  console.log('تم تنفيذ 005_labels_per_campaign.sql بنجاح.')
}
catch (e) {
  console.error(e.message)
  process.exit(1)
}
finally {
  await client.end()
}
