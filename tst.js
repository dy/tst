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
let tests = [],
  state

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
  const only = tests.filter(t => t.opts?.only).length

  for (const t of tests) {
    const o = t.opts || {}

    // Skip: .only filter, grep filter, skip/todo
    const skipReason =
      only && !o.only && !o.skip && !o.todo
        ? null // silent skip for .only
        : grep && !grep.test(t.name)
          ? null // silent skip for grep
          : o.skip
            ? 'skip'
            : o.todo
              ? 'todo'
              : false

    if (skipReason !== false) {
      state.skipped++
      if (skipReason && !mute) fmt.testSkip(t.name, skipReason)
      continue
    }

    // Mute mode: suppress assertion output
    const muted = mute || o.mute
    let testAssertCount = 0

    // Build type label for display
    const typeLabel =
      [o.fork && 'fork', o.demo && 'demo', o.only && 'only', o.mute && 'mute']
        .filter(Boolean)
        .join('+') || 'test'
    if (!mute) fmt.testStart(t.name, typeLabel, muted)

    // Hook assertion passes
    if (!o.fork) {
      onPass(({ operator, message }) => {
        state.assertCount++
        testAssertCount++
        if (!muted) fmt.assertion(testAssertCount, operator, message)
      })
    }

    const testTimeout = o.timeout ?? globalTimeout
    const maxRetries = o.retry ?? 0
    let lastError = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      testAssertCount = 0
      lastError = null

      try {
        if (o.fork) {
          // Fork streams assertions live via callback
          const onAssertion = muted
            ? null
            : (n, operator, message) => {
                testAssertCount = n
                fmt.assertion(n, operator, message)
              }
          const result = await runForked(t, testTimeout, onAssertion)
          state.assertCount += result.assertCount
          testAssertCount = result.assertCount
        } else {
          await Promise.race([
            t.fn(assert, t.opts?.data),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`timeout after ${testTimeout}ms`)), testTimeout)
            )
          ])
        }
        break // Success, exit retry loop
      } catch (e) {
        lastError = e
        // Fork tests: count assertions from worker
        if (o.fork && typeof e.assertCount === 'number') {
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
      if (!o.demo) state.failed.push([lastError.message, t])
      fmt.testFail(t.name, lastError, testAssertCount, muted)
      if (bail && !o.demo) break
    } else {
      state.passed++
      fmt.testPass(t.name, typeLabel, testAssertCount, muted)
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
  let lastCount = 0,
    waited = 0
  const check = () => {
    if (hasRun) return // Manual run() was called, skip auto-run
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
