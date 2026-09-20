/**
 * Deletes names this demo created, identified by its metadata tag.
 *
 * Deletion is irreversible and the tag matches every name the app has ever
 * issued — including ones a real person claimed while trying the demo. So the
 * default is a dry run, and `--apply` alone is not enough: you must either name
 * the labels to delete or opt into `--all` explicitly.
 *
 *   node scripts/cleanup-demo-names.mjs                 # list what is there
 *   node scripts/cleanup-demo-names.mjs --apply demo123 # delete just that one
 *   node scripts/cleanup-demo-names.mjs --apply --all   # delete every tagged name
 */
const DEMO_TAG = 'ninza-kit' // must match brand.demoTag in src/config/brands.ts

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(Boolean).map((line) => {
    const i = line.indexOf('=')
    return [line.slice(0, i), line.slice(i + 1)]
  }),
)
const KEY = env.NAMESPACE_API_KEY
const PARENT = env.NAMESPACE_PARENT_NAME
const BASE = 'https://offchain-manager.namespace.ninja'

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const all = args.includes('--all')
const labels = args.filter((a) => !a.startsWith('--'))

const res = await fetch(`${BASE}/api/v1/subnames/search`, {
  method: 'POST',
  headers: { 'x-auth-token': KEY, 'content-type': 'application/json' },
  body: JSON.stringify({ parentName: PARENT, size: 200 }),
})
const { items = [] } = await res.json()
const tagged = items.filter((i) => i.metadata?.demo === DEMO_TAG)

console.log(`registry holds ${items.length} names; ${tagged.length} tagged ${DEMO_TAG}`)
for (const item of tagged) console.log(`  ${item.fullName}`)

if (!apply) {
  console.log('\nDry run. Pass --apply with either specific labels or --all.')
  process.exit(0)
}

const targets = all ? tagged : tagged.filter((i) => labels.includes(i.label))

if (!all && labels.length === 0) {
  console.error('\nRefusing to delete: --apply needs labels to delete, or --all.')
  console.error('Deletion cannot be undone, and the tag also matches names real')
  console.error('people claimed while trying the demo.')
  process.exit(1)
}
if (targets.length === 0) {
  console.log('\nNothing matched those labels.')
  process.exit(0)
}

console.log(`\nDeleting ${targets.length} name(s):`)
for (const item of targets) {
  const del = await fetch(`${BASE}/api/v1/subnames/${encodeURIComponent(item.fullName)}`, {
    method: 'DELETE',
    headers: { 'x-auth-token': KEY },
  })
  console.log(`  ${item.fullName} -> ${del.status}`)
}
