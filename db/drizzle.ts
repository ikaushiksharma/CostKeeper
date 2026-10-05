import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

// Local development (see docker-compose.yml): the Neon HTTP driver is sent to
// the local neon-proxy container instead of Neon's cloud endpoint. Only hosts
// on db.localtest.me (which resolves to 127.0.0.1) are redirected.
if (new URL(process.env.DATABASE_URL).hostname === 'db.localtest.me') {
    neonConfig.fetchEndpoint = (host) => `http://${host}:4444/sql`
}

export const sql = neon(process.env.DATABASE_URL)
export const db = drizzle(sql)
