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

const GREEN = '\x1b[32m', RED = '\x1b[31m', YELLOW = '\x1b[33m', RESET = '\x1b[0m', GRAY = '\x1b[90m'
const isNode = typeof process !== 'undefined' && process.versions?.node

// ─────────────────────────────────────────────────────────────────────────────
// Output formats
// ─────────────────────────────────────────────────────────────────────────────

// Helper: log with color (node) or CSS (browser)
const log = (color, text, cssColor) => isNode 
  ? console.log(`${color}${text}${RESET}`) 
  : console.log(`%c${text}`, `color: ${cssColor}`)

export const formats = {
  pretty: {
    testStart(name, type, muted) {
      if (muted) return
      if (isNode) console.log(`${RESET}► ${name}${type !== 'test' ? ` (${type})` : ''}`)
      else type === 'mute' ? console.groupCollapsed(name) : console.group(name)
    },

    testSkip(name, type) {
      log(type === 'todo' ? YELLOW : GRAY, `» ${name} (${type})`, 'gainsboro')
    },

    assertion(n, operator, message) {
      log(GREEN, `√ ${n} (${operator}) — ${message}`, '#229944')
    },

    testPass(name, type, assertCount, muted) {
      if (isNode) {
        if (!muted) console.log()
        if (type === 'mute') console.log(`${GREEN}► ${name} (${assertCount} assertions)${RESET}\n`)
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
            console.info(`actual:${RESET}`, typeof actual === 'string' ? JSON.stringify(actual) : actual, RED)
            console.info(`expected:${RESET}`, typeof expected === 'string' ? JSON.stringify(expected) : expected, RED)
            console.error(new Error, RESET)
          }
        } else {
          console.assert(false, `${assertCount} — ${message}`, { actual, expected })
        }
      } else {
        isNode ? (console.log(`${RED}× ${assertCount} — ${error.message}${RESET}`), console.error(error)) : console.error(error)
      }
      isNode ? console.log() : console.groupEnd()
    },

    summary(state, opts = {}) {
      const { grep, only } = opts
      console.log(`───`)
      const total = state.passed + state.failed.length + state.skipped
      if (grep) console.log(`${isNode ? GRAY : ''}# grep /${grep.source}/${grep.flags}${isNode ? RESET : ''}`)
      if (only) console.log(`# only ${only} cases`)
      console.log(`# total ${total}`)
      if (state.passed) log(GREEN, `# pass ${state.passed}`, '#229944')
      if (state.failed.length) {
        log(RED, `# fail ${state.failed.length}`, '#cc3300')
        const maxShow = 3, truncate = state.failed.length > maxShow + 2
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
    testSkip(name, type) { console.log(`ok ${++this._n} - ${name} # SKIP ${type}`) },
    assertion() {},
    testPass(name) { console.log(`ok ${++this._n} - ${name}`) },
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
      console.log(`# pass ${state.passed}`)
      if (state.failed.length) console.log(`# fail ${state.failed.length}`)
      if (state.skipped) console.log(`# skip ${state.skipped}`)
      this._n = 0
    }
  }
}

// Config from env (node) or URL params (browser)
function getConfig() {
  if (isNode) {
    return {
      grep: process.env.TST_GREP,
      bail: process.env.TST_BAIL === '1',
      mute: process.env.TST_MUTE === '1',
      format: process.env.TST_FORMAT || 'pretty'
    }
  }
  if (typeof location !== 'undefined') {
    const params = new URLSearchParams(location.search)
    return {
      grep: params.get('grep'),
      bail: params.has('bail'),
      mute: params.has('mute'),
      format: params.get('format') || 'pretty'
    }
  }
  return {}
}

// State
let tests = [], state

// ─────────────────────────────────────────────────────────────────────────────
// Test registration
// ─────────────────────────────────────────────────────────────────────────────

const register = (name, fn, opts, type) => {
  if (typeof fn === 'object') [fn, opts] = [opts, fn]
  tests.push({ name, fn, opts, type })
}

export default function test(name, fn, opts) {
  if (typeof fn === 'object') [fn, opts] = [opts, fn]
  if (!fn) return test.todo(name)
  tests.push({ name, fn, opts, type: 'test' })
}

test.skip = (name, fn) => tests.push({ name, fn, type: 'skip' })
test.todo = (name, fn) => tests.push({ name, fn, type: 'todo' })
test.only = (name, fn, opts) => register(name, fn, opts, 'only')
test.demo = (name, fn, opts) => register(name, fn, opts, 'demo')
test.mute = (name, fn, opts) => register(name, fn, opts, 'mute')
test.fork = (name, fn, opts) => register(name, fn, opts, 'fork')
test.run = (opts) => run(opts)

// ─────────────────────────────────────────────────────────────────────────────
// Test execution
// ─────────────────────────────────────────────────────────────────────────────

// Fork execution: run test in isolated worker thread
async function runForked(t, testTimeout) {
  const fnStr = t.fn.toString()
  const baseUrl = import.meta.url
  const data = t.opts?.data
  const dataStr = JSON.stringify(data)

  if (isNode) {
    const { Worker } = await import('worker_threads')
    return new Promise((resolve, reject) => {
      const code = `
        import { parentPort } from 'worker_threads'
        import * as assert from '${new URL('./assert.js', baseUrl).href}'

        let assertCount = 0
        assert.onPass(() => assertCount++)

        const fn = (${fnStr})
        const data = ${dataStr}
        const start = performance.now()
        ;(async () => fn(assert, data))().then(
          () => parentPort.postMessage({ ok: true, time: performance.now() - start, assertCount }),
          e => parentPort.postMessage({ ok: false, error: e.message, time: performance.now() - start, assertCount })
        )
      `
      const worker = new Worker(code, { eval: true })

      const timer = setTimeout(() => {
        worker.terminate()
        reject(new Error(`timeout after ${testTimeout}ms`))
      }, testTimeout)

      worker.on('message', msg => {
        clearTimeout(timer)
        worker.terminate()
        msg.ok ? resolve(msg) : reject(Object.assign(new Error(msg.error), { time: msg.time, assertCount: msg.assertCount }))
      })
      worker.on('error', err => { clearTimeout(timer); worker.terminate(); reject(err) })
    })
  } else {
    // Browser: Web Worker via Blob — data passed via initial message
    return new Promise((resolve, reject) => {
      const blob = new Blob([`
        import * as assert from '${new URL('./assert.js', baseUrl).href}'

        let assertCount = 0
        assert.onPass(() => assertCount++)

        const fn = (${fnStr})

        // Wait for data message, then run
        self.onmessage = ({ data }) => {
          const start = performance.now()
          ;(async () => fn(assert, data))().then(
            () => postMessage({ ok: true, time: performance.now() - start, assertCount }),
            e => postMessage({ ok: false, error: e.message, time: performance.now() - start, assertCount })
          )
        }
      `], { type: 'application/javascript' })
      const worker = new Worker(URL.createObjectURL(blob), { type: 'module' })

      // Send data to worker
      worker.postMessage(data)

      const timer = setTimeout(() => {
        worker.terminate()
        reject(new Error(`timeout after ${testTimeout}ms`))
      }, testTimeout)

      worker.onmessage = ({ data }) => {
        clearTimeout(timer)
        worker.terminate()
        data.ok ? resolve(data) : reject(Object.assign(new Error(data.error), { time: data.time, assertCount: data.assertCount }))
      }
      worker.onerror = err => { clearTimeout(timer); worker.terminate(); reject(err) }
    })
  }
}

export async function run(opts = {}) {
  const config = getConfig()
  const {
    timeout: globalTimeout = 5000,
    grep = config.grep ? new RegExp(config.grep, 'i') : null,
    bail = config.bail,
    mute = config.mute,
    format = config.format
  } = opts

  // Resolve format: string name or format object
  const fmt = typeof format === 'string' ? formats[format] : format
  if (!fmt) throw new Error(`Unknown format: ${format}`)

  state = { assertCount: 0, passed: 0, failed: [], skipped: 0 }
  const only = tests.filter(t => t.type === 'only').length

  for (const t of tests) {
    // Skip: .only filter, grep filter, skip type, skip option
    const skipReason = 
      (only && t.type !== 'only' && t.type !== 'skip' && t.type !== 'todo') ? null :  // silent skip for .only
      (grep && !grep.test(t.name)) ? null :  // silent skip for grep
      t.opts?.skip ? 'skip' :
      (t.type === 'skip' || t.type === 'todo') ? t.type : 
      false

    if (skipReason !== false) {
      state.skipped++
      if (skipReason && !mute) fmt.testSkip(t.name, skipReason)
      continue
    }

    // Mute mode: suppress assertion output
    const muted = mute || (isNode && (t.type === 'mute' || t.type === 'fork'))
    let testAssertCount = 0

    if (!mute) fmt.testStart(t.name, t.type, muted)

    // Hook assertion passes (skipped for fork - runs in isolate)
    if (t.type !== 'fork') {
      onPass(({ operator, message }) => {
        state.assertCount++
        testAssertCount++
        if (!muted) fmt.assertion(testAssertCount, operator, message)
      })
    }

    const testTimeout = t.opts?.timeout ?? globalTimeout
    const maxRetries = t.opts?.retry ?? 0
    let lastError = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      testAssertCount = 0
      lastError = null

      try {
        if (t.type === 'fork') {
          const result = await runForked(t, testTimeout)
          state.assertCount += result.assertCount
          testAssertCount = result.assertCount
          // Show timing + assertion count for fork tests
          const timeStr = result.time < 1000 ? `${result.time.toFixed(2)}ms` : `${(result.time / 1000).toFixed(2)}s`
          if (isNode) console.log(`${GREEN}√ fork (${result.assertCount} assertions) — ${timeStr}${RESET}`)
          else console.log(`%c✔ fork (${result.assertCount} assertions) — ${timeStr}`, 'color: #229944')
        } else {
          await Promise.race([
            t.fn(assert, t.opts?.data),
            new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout after ${testTimeout}ms`)), testTimeout))
          ])
        }
        break  // Success, exit retry loop
      } catch (e) {
        lastError = e
        // Fork tests: count assertions from worker
        if (t.type === 'fork' && typeof e.assertCount === 'number') {
          state.assertCount += e.assertCount + 1
          testAssertCount = e.assertCount + 1
        } else {
          state.assertCount++
          testAssertCount++
        }
        if (attempt < maxRetries) {
          if (isNode) console.log(`${YELLOW}↻ retry ${attempt + 1}/${maxRetries}${RESET}`)
          else console.log(`%c↻ retry ${attempt + 1}/${maxRetries}`, 'color: orange')
        }
      }
    }

    if (lastError) {
      if (t.type !== 'demo') state.failed.push([lastError.message, t])
      fmt.testFail(t.name, lastError, testAssertCount, muted)
      if (bail && t.type !== 'demo') break
    } else {
      state.passed++
      fmt.testPass(t.name, t.type, testAssertCount, muted)
    }

    await new Promise(r => setTimeout(r))
    onPass(null)
  }

  fmt.summary(state, { grep, only })

  tests = []
  hasRun = true
  if (isNode) process.exit(state.failed.length ? 1 : 0)
  return state
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-run: wait for imports to settle, then run (skips if run() called manually)
// ─────────────────────────────────────────────────────────────────────────────

let hasRun = false

function scheduleAutoRun() {
  let lastCount = 0, waited = 0
  const check = () => {
    if (hasRun) return  // Manual run() was called, skip auto-run
    waited += 10
    if (tests.length === 0 && waited > 200) return  // No tests, exit
    if (tests.length > 0 && tests.length === lastCount) { run(); return }  // Stable, run
    lastCount = tests.length
    if (waited < 5000) setTimeout(check, 10)
    else if (tests.length > 0) run()
  }
  setTimeout(check, 10)
}

scheduleAutoRun()

export * from './assert.js'
