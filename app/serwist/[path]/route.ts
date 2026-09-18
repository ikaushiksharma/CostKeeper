import { spawnSync } from 'node:child_process'
import { createSerwistRoute } from '@serwist/turbopack'

// Precache entries need a revision so the offline fallback is re-fetched on
// deploy. Vercel exposes the commit SHA; fall back to git locally.
const revision =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    spawnSync('git', ['rev-parse', 'HEAD'], {
        encoding: 'utf-8',
    }).stdout?.trim() ??
    crypto.randomUUID()

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
    createSerwistRoute({
        additionalPrecacheEntries: [{ url: '/offline', revision }],
        swSrc: 'app/sw.ts',
        // bundle the worker with the native `esbuild` package rather than esbuild-wasm
        useNativeEsbuild: true,
    })
