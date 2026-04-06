/**
 * يُرسل NOTIFY لـ PostgREST لإعادة تحميل الـ schema بعد DDL
 * (يقلل خطأ "Could not find column ... in the schema cache" في Supabase)
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
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
})
await client.connect()
try {
  await client.query("NOTIFY pgrst, 'reload schema'")
  console.log('تم إرسال reload schema لـ PostgREST.')
}
finally {
  await client.end()
}
