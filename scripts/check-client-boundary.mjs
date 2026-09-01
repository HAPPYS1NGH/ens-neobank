/**
 * Fails the build if anything server-only reaches the browser bundle.
 *
 * Checks the real API key value, the env var names, and the offchain SDK —
 * the three things that must never ship to a client. Run after `next build`.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const STATIC = '.next/static'
if (!existsSync(STATIC)) {
  console.error('Missing .next/static — run `npm run build` first.')
  process.exit(1)
}

const needles = ['NAMESPACE_API_KEY', '@thenamespace/offchain-manager', 'server-only']
const secret = process.env.NAMESPACE_API_KEY?.trim()
if (secret && secret.length > 8) needles.push(secret)

const files = []
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full)
    else if (/\.(js|mjs|css|json|map)$/.test(entry)) files.push(full)
  }
}
walk(STATIC)

const hits = []
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  for (const needle of needles) {
    if (text.includes(needle)) {
      hits.push(`${file} contains ${needle === secret ? 'THE API KEY' : needle}`)
    }
  }
}

if (hits.length) {
  console.error('Client boundary violated:')
  for (const hit of hits) console.error('  -', hit)
  process.exit(1)
}
console.log(`Client boundary clean — scanned ${files.length} bundle files.`)
