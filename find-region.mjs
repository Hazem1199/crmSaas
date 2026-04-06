// find-region.mjs - اكتشاف المنطقة الصحيحة للاتصال
import pg from 'pg'
const { Client } = pg

const projectRef = 'gygvrialrarviousdsbe'
const password   = 'FeIvK5OAzQuY5j6P'
const user       = `postgres.${projectRef}`

const regions = [
  'aws-0-us-east-1',
  'aws-0-us-west-2',
  'aws-0-eu-west-1',
  'aws-0-eu-west-2',
  'aws-0-eu-central-1',
  'aws-0-ap-southeast-1',
  'aws-0-ap-northeast-1',
  'aws-0-sa-east-1',
]

for (const region of regions) {
  const host = `${region}.pooler.supabase.com`
  const client = new Client({
    host, port: 6543, user, password, database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  })
  process.stdout.write(`Testing ${region}... `)
  try {
    await client.connect()
    console.log('SUCCESS!')
    await client.end()
    console.log(`\nCORRECT REGION: ${region}`)
    console.log(`Connection string: postgresql://${user}:${password}@${host}:6543/postgres`)
    process.exit(0)
  } catch (e) {
    console.log(`FAIL: ${e.message.slice(0,50)}`)
    try { await client.end() } catch {}
  }
}
console.log('\nNo region found. Check credentials.')
