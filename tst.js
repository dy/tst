/**
 * tst - minimal test runner
 *
 * - Standalone assertions (assert.js works anywhere)
 * - Works in Node.js and browser
 * - Async/await support with per-test timeout
 * - Pluggable output formats (pretty, tap)
 */

import { setReporter, Assertion } from './assert.js'

const GREEN = '\x1b[32m', RED = '\x1b[31m', YELLOW = '\x1b[33m', RESET = '\x1b[0m', CYAN = '\x1b[36m', GRAY = '\x1b[90m'
const isNode = typeof process !== 'undefined' && process.versions?.node

// ─────────────────────────────────────────────────────────────────────────────
// Output formats
// ─────────────────────────────────────────────────────────────────────────────

export const formats = {
  pretty: {
    testStart(name, type, muted) {
      if (muted) return
      if (isNode) {
        console.log(`${RESET}► ${name}${type !== 'test' ? ` (${type})` : ''}`)
      } else {
        type === 'mute' ? console.groupCollapsed(name) : console.group(name)
      }
    },

    testSkip(name, type) {
      isNode
        ? console.log(`${type === 'todo' ? YELLOW : CYAN}» ${name} (${type})${RESET}`)
        : console.log(`%c${name} ${type === 'todo' ? '🚧' : '≫'} (${type})`, 'color: gainsboro')
    },

    assertion(n, operator, message) {
      isNode
        ? console.log(`${GREEN}√ ${n} (${operator}) — ${message}${RESET}`)
        : console.log(`%c✔ ${n} (${operator}) — ${message}`, 'color: #229944')
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
        isNode ? (
          console.log(`${RED}× ${assertCount} — ${message}`),
          actual !== undefined && (
            console.info(`actual:${RESET}`, typeof actual === 'string' ? JSON.stringify(actual) : actual, RED),
            console.info(`expected:${RESET}`, typeof expected === 'string' ? JSON.stringify(expected) : expected, RED),
            console.error(new Error, RESET)
          )
        ) : console.assert(false, `${assertCount} — ${message}`, { actual, expected })
      } else {
        isNode
          ? (console.log(`${RED}× ${assertCount} — ${error.message}${RESET}`), console.error(error))
          : console.error(error)
      }
      if (isNode) console.log()
      else console.groupEnd()
    },

    summary(state, opts = {}) {
      const { grep, only } = opts
      console.log(`───`)
      const total = state.passed + state.failed.length + state.skipped
      if (grep) console.log(`${isNode ? GRAY : ''}# grep /${grep.source}/${grep.flags}${isNode ? RESET : ''}`)
      if (only) console.log(`# only ${only} cases`)
      console.log(`# total ${total}`)
      if (state.passed) isNode ? console.log(`${GREEN}# pass ${state.passed}${RESET}`) : console.log(`%c# pass ${state.passed}`, 'color: #229944')

      if (state.failed.length) {
        isNode ? console.log(`${RED}# fail ${state.failed.length}${RESET}`) : console.log(`%c# fail ${state.failed.length}`, 'color: #cc3300')
        const maxShow = 3
        const truncate = state.failed.length > maxShow + 2
        const shown = truncate ? state.failed.slice(0, maxShow) : state.failed
        for (const [msg, t] of shown) {
          isNode ? console.log(`${RED}  ✗ ${t.name}: ${msg}${RESET}`) : console.log(`%c  ✗ ${t.name}: ${msg}`, 'color: #cc3300')
        }
        if (truncate) {
          const skipped = state.failed.length - maxShow - 1
          isNode ? console.log(`${RED}  ⋮ ${skipped} more${RESET}`) : console.log(`%c  ⋮ ${skipped} more`, 'color: #cc3300')
          const [msg, t] = state.failed[state.failed.length - 1]
          isNode ? console.log(`${RED}  ✗ ${t.name}: ${msg}${RESET}`) : console.log(`%c  ✗ ${t.name}: ${msg}`, 'color: #cc3300')
        }
      }
      if (state.skipped) isNode ? console.log(`${GRAY}# skip ${state.skipped}${RESET}`) : console.log(`%c# skip ${state.skipped}`, 'color: gray')
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

export default function test(name, fn, opts) {
  if (typeof fn === 'object') [fn, opts] = [opts, fn]
  if (!fn) return test.todo(name)
  tests.push({ name, fn, opts, type: 'test' })
}

test.skip = (name, fn) => tests.push({ name, fn, type: 'skip' })
test.todo = (name, fn) => tests.push({ name, fn, type: 'todo' })
test.only = (name, fn, opts) => tests.push({ name, fn, opts, type: 'only' })
test.demo = (name, fn, opts) => tests.push({ name, fn, opts, type: 'demo' })
test.mute = (name, fn, opts) => tests.push({ name, fn, opts, type: 'mute' })
test.run = (opts) => run(opts)

// ─────────────────────────────────────────────────────────────────────────────
// Test execution
// ─────────────────────────────────────────────────────────────────────────────

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
    // Skip non-only tests if there are .only tests
    if (only && t.type !== 'only' && t.type !== 'skip' && t.type !== 'todo') {
      state.skipped++
      continue
    }

    // Grep filter
    if (grep && !grep.test(t.name)) {
      state.skipped++
      continue
    }

    if (t.type === 'skip' || t.type === 'todo') {
      state.skipped++
      if (!mute) fmt.testSkip(t.name, t.type)
      continue
    }

    // Mute mode: suppress assertion output
    const muted = mute || (isNode && t.type === 'mute')
    let testAssertCount = 0

    if (!mute) fmt.testStart(t.name, t.type, muted)

    // Format captures assertion passes
    setReporter(({ operator, message }) => {
      state.assertCount++
      testAssertCount++
      if (!muted) fmt.assertion(testAssertCount, operator, message)
    })

    // Backward-compat pass/fail callbacks
    const pass = msg => msg && !muted && (isNode ? console.log(`${GREEN}(pass) ${msg}${RESET}`) : console.log(`%c(pass) ${msg}`, 'color: #229944'))
    const fail = msg => msg && console.error(msg)

    const testTimeout = t.opts?.timeout ?? globalTimeout
    let error = null

    try {
      await Promise.race([
        t.fn(pass, fail),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout after ${testTimeout}ms`)), testTimeout))
      ])
      state.passed++
      fmt.testPass(t.name, t.type, testAssertCount, muted)
      await new Promise(r => setTimeout(r))
    } catch (e) {
      error = e
      state.assertCount++
      testAssertCount++
      state.failed.push([e.message, t])
      fmt.testFail(t.name, e, testAssertCount, muted)

      if (bail) break
    } finally {
      setReporter(null)
    }
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
