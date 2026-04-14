/**
 * تطبيق migrations 010 و 011 و 012 على قاعدة البيانات (دعوات الأعضاء + نوع المدعو).
 * يقرأ DATABASE_URL من env.local أو متغير البيئة DATABASE_URL.
 */
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function loadEnvLocal() {
  const p = path.join(root, 'env.local')
  if (!fs.existsSync(p)) return {}
  const text = fs.readFileSync(p, 'utf8')
  const out = {}
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    out[key] = val
  }
  return out
}

const envFile = loadEnvLocal()
const connectionString = process.env.DATABASE_URL || envFile.DATABASE_URL

if (!connectionString) {
  console.error('Missing DATABASE_URL (set env or add to env.local)')
  process.exit(1)
}

const files = [
  'supabase/migrations/010_workspace_invitations.sql',
  'supabase/migrations/011_invites_helpers.sql',
  'supabase/migrations/012_invitation_invitee_kind.sql',
]

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

async function run() {
  console.log('Connecting...')
  await client.connect()
  console.log('Connected.')

  for (const rel of files) {
    const filePath = path.join(root, rel)
    const sql = fs.readFileSync(filePath, 'utf8')
    console.log(`\nApplying: ${rel}`)
    await client.query(sql)
    console.log('  OK')
  }

  await client.end()
  console.log('\nDone: 010 + 011 + 012 applied successfully.')
}

run().catch((err) => {
  console.error('Error:', err.message)
  if (/Tenant or user not found|password authentication failed/i.test(String(err.message))) {
    console.error(`
Hint: انسخ DATABASE_URL من Supabase → Project Settings → Database
(يفضّل "Session mode" أو الاتصال المباشر :5432 وليس pooler إذا استمر الخطأ).
ثم شغّل: npm run migrate:invites
أو نفّذ يدوياً في SQL Editor الملفات بالترتيب:
  supabase/migrations/010_workspace_invitations.sql
  supabase/migrations/011_invites_helpers.sql
  supabase/migrations/012_invitation_invitee_kind.sql
`)
  }
  process.exit(1)
})
