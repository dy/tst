/**
 * tst - minimal test runner
 *
 * - Standalone assertions (assert.js works anywhere)
 * - Works in Node.js and browser
 * - Async/await support with per-test timeout
 * - Pluggable output formats (pretty, tap)
 */

import * as assert from './assert.js'
import { onPass, Assertion } from './assert.js'

const GREEN = '\x1b[32m',
  RED = '\x1b[31m',
  YELLOW = '\x1b[33m',
  RESET = '\x1b[0m',
  GRAY = '\x1b[90m'
const isNode = typeof process !== 'undefined' && process.versions?.node

// ─────────────────────────────────────────────────────────────────────────────
// Output formats
// ─────────────────────────────────────────────────────────────────────────────

// Helper: log with color (node) or CSS (browser)
const log = (color, text, cssColor) =>
  isNode ? console.log(`${color}${text}${RESET}`) : console.log(`%c${text}`, `color: ${cssColor}`)

export const formats = {
  pretty: {
    testStart(name, type, muted) {
      if (isNode) {
        if (!muted) console.log(`${RESET}► ${name}${type !== 'test' ? ` (${type})` : ''}`)
      } else {
        muted ? console.groupCollapsed(name) : console.group(name)
      }
    },

    testSkip(name, type) {
      if (type === 'todo') log(YELLOW, `🚧 ${name}`, '#cc9900')
      else log(GRAY, `» ${name} (skip)`, 'gainsboro')
    },

    assertion(n, operator, message) {
      log(GREEN, `√ ${n} (${operator}) — ${message}`, '#229944')
    },

    testPass(name, type, assertCount, muted) {
      if (isNode) {
        if (!muted) console.log()
        if (type.includes('mute'))
          console.log(`${GREEN}► ${name} (${assertCount} assertions)${RESET}\n`)
      } else {
        console.groupEnd()
      }
    },

    testFail(name, error, assertCount, muted) {
      if (muted && isNode) console.log(`${RESET}► ${name}`)
      const { message, actual, expected } = error
      if (error instanceof Assertion || error.name === 'Assertion') {
        if (isNode) {
          console.log(`${RED}× ${assertCount} — ${message}`)
          if (actual !== undefined) {
            console.info(
              `actual:${RESET}`,
              typeof actual === 'string' ? JSON.stringify(actual) : actual,
              RED
            )
            console.info(
              `expected:${RESET}`,
              typeof expected === 'string' ? JSON.stringify(expected) : expected,
              RED
            )
            console.error(new Error(), RESET)
          }
        } else {
          console.assert(false, `${assertCount} — ${message}`, { actual, expected })
        }
      } else {
        isNode
          ? (console.log(`${RED}× ${assertCount} — ${error.message}${RESET}`), console.error(error))
          : console.error(error)
      }
      isNode ? console.log() : console.groupEnd()
    },

    summary(state, opts = {}) {
      const { grep, only } = opts
      console.log(`───`)
      const total = state.passed + state.failed.length + state.skipped
      if (grep)
        console.log(
          `${isNode ? GRAY : ''}# grep /${grep.source}/${grep.flags}${isNode ? RESET : ''}`
        )
      if (only) console.log(`# only ${only} cases`)
      console.log(`# total ${total} (${state.assertCount} assertions)`)
      if (state.passed) log(GREEN, `# pass ${state.passed}`, '#229944')
      if (state.failed.length) {
        log(RED, `# fail ${state.failed.length}`, '#cc3300')
        const maxShow = 3,
          truncate = state.failed.length > maxShow + 2
        const shown = truncate ? state.failed.slice(0, maxShow) : state.failed
        for (const [msg, t] of shown) log(RED, `  ✗ ${t.name}: ${msg}`, '#cc3300')
        if (truncate) {
          log(RED, `  ⋮ ${state.failed.length - maxShow - 1} more`, '#cc3300')
          const [msg, t] = state.failed.at(-1)
          log(RED, `  ✗ ${t.name}: ${msg}`, '#cc3300')
        }
      }
      if (state.skipped) log(GRAY, `# skip ${state.skipped}`, 'gray')
    }
  },

  tap: {
    _n: 0,
    testStart() {},
    testSkip(name, type) {
      console.log(`ok ${++this._n} - ${name} # SKIP ${type}`)
    },
    assertion() {},
    testPass(name) {
      console.log(`ok ${++this._n} - ${name}`)
    },
    testFail(name, error) {
      console.log(`not ok ${++this._n} - ${name}`)
      console.log(`  ---`)
      console.log(`  message: ${error.message}`)
      if (error.actual !== undefined) console.log(`  actual: ${JSON.stringify(error.actual)}`)
      if (error.expected !== undefined) console.log(`  expected: ${JSON.stringify(error.expected)}`)
      console.log(`  ...`)
    },
    summary(state) {
      console.log(`1..${this._n}`)
      console.log(`# tests ${state.passed + state.failed.length}`)
      console.log(`# pass ${state.passed}`)
      if (state.failed.length) console.log(`# fail ${state.failed.length}`)
      console.log(`# assertions ${state.assertCount}`)
      if (state.skipped) console.log(`# skip ${state.skipped}`)
      this._n = 0
    }
  }
}

// Race a promise against a timeout
const withTimeout = (p, ms) =>
  Promise.race([
    p,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms))
  ])

// Parse parallel option: false|0|null → false, "1"|true → true, "4" → 4
const parseParallel = v =>
  v == null || v === '' || v === false ? false : +v > 1 ? +v : +v === 0 ? false : true

// Config from env (node) or URL params (browser)
function getConfig() {
  if (isNode) {
    return {
      grep: process.env.TST_GREP,
      bail: process.env.TST_BAIL === '1',
      mute: process.env.TST_MUTE === '1',
      format: process.env.TST_FORMAT || 'pretty',
      parallel: parseParallel(process.env.TST_PARALLEL)
    }
  }
  if (typeof location !== 'undefined') {
    const params = new URLSearchParams(location.search)
    return {
      grep: params.get('grep'),
      bail: params.has('bail'),
      mute: params.has('mute'),
      format: params.get('format') || 'pretty',
      parallel: params.has('parallel') ? parseParallel(params.get('parallel') || '1') : false
    }
  }
  return {}
}

// State
let tests = [],
  state,
  manual = isNode
    ? process.env.TST_MANUAL === '1'
    : typeof location !== 'undefined'
      ? new URLSearchParams(location.search).has('manual')
      : false

// ─────────────────────────────────────────────────────────────────────────────
// Test registration
// ─────────────────────────────────────────────────────────────────────────────

const register = (name, fn, opts, type) => {
  if (typeof fn === 'object') [fn, opts] = [opts, fn]
  tests.push({ name, fn, opts: { ...opts, [type]: true } })
}

export default function test(name, fn, opts) {
  if (typeof fn === 'object') [fn, opts] = [opts, fn]
  if (!fn) return test.todo(name)
  tests.push({ name, fn, opts })
}

test.skip = (name, fn, opts) => register(name, fn, opts, 'skip')
test.todo = (name, fn, opts) => register(name, fn, opts, 'todo')
test.only = (name, fn, opts) => register(name, fn, opts, 'only')
test.demo = (name, fn, opts) => register(name, fn, opts, 'demo')
test.mute = (name, fn, opts) => register(name, fn, opts, 'mute')
test.fork = (name, fn, opts) => register(name, fn, opts, 'fork')
test.run = opts => run(opts)
Object.defineProperty(test, 'manual', {
  get: () => manual,
  set: v => {
    manual = v
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Test execution
// ─────────────────────────────────────────────────────────────────────────────

// Serialize data with function support
const FN_MARKER = '__tst_fn__'
function serialize(obj) {
  return JSON.stringify(obj, (_, v) =>
    typeof v === 'function' ? { [FN_MARKER]: v.toString() } : v
  )
}
const deserializerCode = `
  const revive = v => {
    if (v && typeof v === 'object') {
      if ('${FN_MARKER}' in v) return eval('(' + v['${FN_MARKER}'] + ')')
      for (const k in v) v[k] = revive(v[k])
    }
    return v
  }
`

// Fork execution: run test in isolated worker thread
async function runForked(t, testTimeout, onAssertion) {
  const fnStr = t.fn.toString()
  const baseUrl = import.meta.url
  const rawData = t.opts?.data
  const data = typeof rawData === 'function' ? rawData() : rawData
  const dataStr = serialize(data)

  if (isNode) {
    const { Worker } = await import('worker_threads')
    const { writeFileSync, unlinkSync } = await import('fs')
    const { join } = await import('path')

    const code = `
      import { parentPort } from 'worker_threads'
      import * as assert from '${new URL('./assert.js', baseUrl).href}'

      let assertCount = 0
      assert.onPass(({ operator, message }) => {
        assertCount++
        parentPort.postMessage({ type: 'assertion', operator, message, n: assertCount })
      })

      ${deserializerCode}
      const fn = (${fnStr})
      const data = revive(${dataStr})
      const start = performance.now()
      ;(async () => fn(assert, data))().then(
        () => parentPort.postMessage({ type: 'done', ok: true, time: performance.now() - start, assertCount }),
        e => parentPort.postMessage({ type: 'done', ok: false, error: e.message, time: performance.now() - start, assertCount })
      )
    `

    // Write to cwd for proper module resolution (bare specifiers + relative imports)
    const tmpFile = join(
      process.cwd(),
      `.tst-fork-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`
    )
    writeFileSync(tmpFile, code)

    return new Promise((resolve, reject) => {
      // Inherit --import flags from parent (e.g., tsx loaders), clear others to avoid --input-type issues
      const importFlags = process.execArgv.filter(
        (arg, i, arr) => arg === '--import' || arr[i - 1] === '--import'
      )
      const worker = new Worker(tmpFile, { execArgv: importFlags })

      const cleanup = () => {
        try {
          unlinkSync(tmpFile)
        } catch {
          /* ignore */
        }
      }
      const timer = setTimeout(() => {
        worker.terminate()
        cleanup()
        reject(new Error(`timeout after ${testTimeout}ms`))
      }, testTimeout)

      worker.on('message', msg => {
        if (msg.type === 'assertion') {
          onAssertion?.(msg.n, msg.operator, msg.message)
        } else if (msg.type === 'done') {
          clearTimeout(timer)
          worker.terminate()
          cleanup()
          msg.ok
            ? resolve(msg)
            : reject(
                Object.assign(new Error(msg.error), {
                  time: msg.time,
                  assertCount: msg.assertCount
                })
              )
        }
      })
      worker.on('error', err => {
        clearTimeout(timer)
        worker.terminate()
        cleanup()
        reject(err)
      })
    })
  } else {
    // Browser: Web Worker via Blob — data passed via initial message
    return new Promise((resolve, reject) => {
      const blob = new Blob(
        [
          `
        import * as assert from '${new URL('./assert.js', baseUrl).href}'

        let assertCount = 0
        assert.onPass(({ operator, message }) => {
          assertCount++
          postMessage({ type: 'assertion', operator, message, n: assertCount })
        })

        ${deserializerCode}
        const fn = (${fnStr})

        // Wait for data message, then run
        self.onmessage = ({ data: raw }) => {
          const data = revive(raw)
          const start = performance.now()
          ;(async () => fn(assert, data))().then(
            () => postMessage({ type: 'done', ok: true, time: performance.now() - start, assertCount }),
            e => postMessage({ type: 'done', ok: false, error: e.message, time: performance.now() - start, assertCount })
          )
        }
      `
        ],
        { type: 'application/javascript' }
      )
      const worker = new Worker(URL.createObjectURL(blob), { type: 'module' })

      // Send serialized data to worker (parsed JSON, functions as markers)
      worker.postMessage(data !== undefined ? JSON.parse(dataStr) : undefined)

      const timer = setTimeout(() => {
        worker.terminate()
        reject(new Error(`timeout after ${testTimeout}ms`))
      }, testTimeout)

      worker.onmessage = ({ data }) => {
        if (data.type === 'assertion') {
          onAssertion?.(data.n, data.operator, data.message)
        } else if (data.type === 'done') {
          clearTimeout(timer)
          worker.terminate()
          data.ok
            ? resolve(data)
            : reject(
                Object.assign(new Error(data.error), {
                  time: data.time,
                  assertCount: data.assertCount
                })
              )
        }
      }
      worker.onerror = err => {
        clearTimeout(timer)
        worker.terminate()
        reject(err)
      }
    })
  }
}

// Buffered formatter — captures calls for ordered replay in parallel mode
function bufFmt(fmt) {
  const buf = []
  const p = {}
  for (const k of ['testStart', 'testSkip', 'assertion', 'testPass', 'testFail'])
    p[k] = (...a) => buf.push(() => fmt[k](...a))
  p.log = (...a) => buf.push(() => console.log(...a))
  p.flush = () => buf.forEach(fn => fn())
  return p
}

// Per-test assert wrapper — tracks assertions without global onPass (parallel-safe)
function wrapAssert(onAssertion) {
  let n = 0
  const w = {}
  for (const [k, v] of Object.entries(assert)) {
    if (typeof v !== 'function' || k === 'onPass') {
      w[k] = v
      continue
    }
    if (k === 'rejects') {
      w[k] = async (...a) => {
        const r = await v(...a)
        onAssertion(
          ++n,
          'rejects',
          typeof a[2] === 'string' ? a[2] : typeof a[1] === 'string' ? a[1] : 'should reject'
        )
        return r
      }
    } else {
      w[k] = (...a) => {
        let info
        onPass(i => {
          info = i
        })
        try {
          return v(...a)
        } finally {
          onPass(null)
          if (info) onAssertion(++n, info.operator, info.message)
        }
      }
    }
  }
  return w
}

export async function run(opts = {}) {
  const config = getConfig()
  const {
    timeout: globalTimeout = 5000,
    grep = config.grep ? new RegExp(config.grep, 'i') : null,
    bail = config.bail,
    mute = config.mute,
    format = config.format,
    parallel = config.parallel
  } = opts

  // Resolve format: string name or format object
  const fmt = typeof format === 'string' ? formats[format] : format
  if (!fmt) throw new Error(`Unknown format: ${format}`)

  state = { assertCount: 0, passed: 0, failed: [], skipped: 0 }
  const only = tests.filter(t => t.opts?.only).length

  // Filter skips/todos (shared by both paths)
  const runnable = []
  for (const t of tests) {
    const o = t.opts || {}
    const skipReason =
      only && !o.only && !o.skip && !o.todo
        ? null
        : grep && !grep.test(t.name)
          ? null
          : o.skip
            ? 'skip'
            : o.todo
              ? 'todo'
              : false
    if (skipReason !== false) {
      state.skipped++
      if (skipReason && !mute) fmt.testSkip(t.name, skipReason)
    } else {
      runnable.push(t)
    }
  }

  // Run a single test, returns result object
  // useWrapper: true for parallel mode (per-test assert wrapper, buffered output)
  const runOne = async (t, f, useWrapper) => {
    const o = t.opts || {}
    const muted = mute || o.mute
    const typeLabel =
      [o.fork && 'fork', o.demo && 'demo', o.only && 'only', o.mute && 'mute']
        .filter(Boolean)
        .join('+') || 'test'
    if (!mute) f.testStart(t.name, typeLabel, muted)

    const testTimeout = o.timeout ?? globalTimeout
    const maxRetries = o.retry ?? 0
    let testAssertCount = 0,
      lastError = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      testAssertCount = 0
      lastError = null
      try {
        if (o.fork) {
          const onA = muted
            ? null
            : (n, op, msg) => {
                testAssertCount = n
                f.assertion(n, op, msg)
              }
          const result = await runForked(t, testTimeout, onA)
          testAssertCount = result.assertCount
        } else if (useWrapper) {
          // Parallel: per-test wrapper tracks assertions (requires t.ok() not bare ok())
          const ta = wrapAssert((n, op, msg) => {
            testAssertCount = n
            if (!muted) f.assertion(n, op, msg)
          })
          await withTimeout(t.fn(ta, t.opts?.data), testTimeout)
        } else {
          // Sequential: global onPass tracks all assertions (including bare ok() calls)
          onPass(({ operator, message }) => {
            testAssertCount++
            if (!muted) f.assertion(testAssertCount, operator, message)
          })
          await withTimeout(t.fn(assert, t.opts?.data), testTimeout)
        }
        break
      } catch (e) {
        lastError = e
        if (o.fork && typeof e.assertCount === 'number') {
          testAssertCount = e.assertCount + 1
        } else {
          testAssertCount++
        }
        if (attempt < maxRetries) {
          const msg = `${YELLOW}↻ retry ${attempt + 1}/${maxRetries}${RESET}`
          if (f.log) f.log(msg)
          else if (isNode) console.log(msg)
          else console.log(`%c↻ retry ${attempt + 1}/${maxRetries}`, 'color: orange')
        }
      }
    }

    if (!useWrapper && !o.fork) onPass(null)

    if (lastError) {
      f.testFail(t.name, lastError, testAssertCount, muted)
      return { error: lastError, test: t, demo: !!o.demo, assertCount: testAssertCount }
    }
    f.testPass(t.name, typeLabel, testAssertCount, muted)
    return { assertCount: testAssertCount }
  }

  if (parallel) {
    onPass(null)
    const concurrency = parallel === true ? runnable.length : Math.min(parallel, runnable.length)
    let bailed = false

    const tasks = runnable.map(t => async () => {
      const bf = bufFmt(fmt)
      const r = await runOne(t, bf, true)
      r.bf = bf
      return r
    })

    // Concurrency pool with bail support
    let i = 0
    const results = new Array(tasks.length)
    await Promise.all(
      Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
        while (i < tasks.length && !bailed) {
          const j = i++
          results[j] = await tasks[j]()
          if (bail && results[j]?.error && !results[j]?.demo) bailed = true
        }
      })
    )

    // Replay buffered output in registration order
    for (const r of results) {
      if (!r) continue
      state.assertCount += r.assertCount
      r.bf.flush()
      if (r.error) {
        if (!r.demo) state.failed.push([r.error.message, r.test])
      } else {
        state.passed++
      }
    }
  } else {
    for (const t of runnable) {
      const r = await runOne(t, fmt, false)
      state.assertCount += r.assertCount
      if (r.error) {
        if (!r.demo) state.failed.push([r.error.message, r.test])
        if (bail && !r.demo) break
      } else {
        state.passed++
      }
      await new Promise(r => setTimeout(r))
    }
  }

  fmt.summary(state, { grep, only })

  if (!manual) tests = []
  hasRun = true
  if (!manual && isNode) process.exit(state.failed.length ? 1 : 0)
  return state
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-run: wait for imports to settle, then run (skips if run() called manually)
// ─────────────────────────────────────────────────────────────────────────────

let hasRun = false

function scheduleAutoRun() {
  let lastCount = 0,
    waited = 0
  const check = () => {
    if (hasRun || manual) return
    waited += 10
    if (tests.length === 0 && waited > 200) return // No tests, exit
    if (tests.length > 0 && tests.length === lastCount) {
      run()
      return
    } // Stable, run
    lastCount = tests.length
    if (waited < 5000) setTimeout(check, 10)
    else if (tests.length > 0) run()
  }
  setTimeout(check, 10)
}

scheduleAutoRun()

export * from './assert.js'
