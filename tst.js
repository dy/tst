/**
 * tst - minimal test runner
 *
 * - Standalone assertions (assert.js works anywhere)
 * - Works in Node.js and browser
 * - Async/await support with per-test timeout
 */

import { setReporter, Assertion } from './assert.js'

const GREEN = '\x1b[32m', RED = '\x1b[31m', YELLOW = '\x1b[33m', RESET = '\x1b[0m', CYAN = '\x1b[36m', GRAY = '\x1b[90m'
const isNode = typeof process !== 'undefined' && process.versions?.node

// Config from env (node) or URL params (browser)
function getConfig() {
  if (isNode) {
    return {
      grep: process.env.TST_GREP,
      bail: process.env.TST_BAIL === '1',
      quiet: process.env.TST_QUIET === '1'
    }
  }
  if (typeof location !== 'undefined') {
    const params = new URLSearchParams(location.search)
    return {
      grep: params.get('grep'),
      bail: params.has('bail'),
      quiet: params.has('quiet')
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
    quiet = config.quiet
  } = opts

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
      if (!quiet) {
        isNode
          ? console.log(`${t.type === 'todo' ? YELLOW : CYAN}» ${t.name} (${t.type})${RESET}`)
          : console.log(`%c${t.name} ${t.type === 'todo' ? '🚧' : '≫'} (${t.type})`, 'color: gainsboro')
      }
      continue
    }

    // Mute mode: suppress assertion output, show summary
    const muted = t.type === 'mute' || quiet
    let testAssertCount = 0
    let groupOpened = false

    // Header (skip in quiet mode unless it fails - we'll print retroactively)
    if (!quiet) {
      if (isNode) {
        console.log(`${RESET}► ${t.name}${t.type !== 'test' ? ` (${t.type})` : ''}`)
      } else {
        t.type === 'mute' ? console.groupCollapsed(t.name) : console.group(t.name)
        groupOpened = true
      }
    }

    // Reporter captures assertion passes
    setReporter(({ operator, message }) => {
      state.assertCount++
      testAssertCount++
      if (!muted) {
        isNode
          ? console.log(`${GREEN}√ ${state.assertCount} (${operator}) — ${message}${RESET}`)
          : console.log(`%c✔ ${state.assertCount} (${operator}) — ${message}`, 'color: #229944')
      }
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
      await new Promise(r => setTimeout(r))
    } catch (e) {
      error = e
      state.assertCount++
      state.failed.push([e.message, t])
    } finally {
      setReporter(null)
    }

    // Output handling
    if (error) {
      // Print test name if we were quiet
      if (quiet && isNode) console.log(`${RESET}► ${t.name}`)

      const { message, actual, expected } = error
      if (error instanceof Assertion || error.name === 'Assertion') {
        isNode ? (
          console.log(`${RED}× ${state.assertCount} — ${message}`),
          actual !== undefined && (
            console.info(`actual:${RESET}`, typeof actual === 'string' ? JSON.stringify(actual) : actual, RED),
            console.info(`expected:${RESET}`, typeof expected === 'string' ? JSON.stringify(expected) : expected, RED),
            console.error(new Error, RESET)
          )
        ) : console.assert(false, `${state.assertCount} — ${message}`, { actual, expected })
      } else {
        isNode ? console.log(`${RED}× ${state.assertCount} — ${error.message}${RESET}`) : console.error(error)
      }

      // Bail on first failure
      if (bail) {
        if (!isNode && groupOpened) console.groupEnd()
        break
      }
    }

    // Close group in browser, newline in node
    if (isNode) {
      if (!quiet || error) console.log()
      // Show mute summary only for explicit test.mute, not quiet mode
      if (t.type === 'mute' && !error) console.log(`${GREEN}► ${t.name} (${testAssertCount} assertions)${RESET}\n`)
    } else if (groupOpened) {
      console.groupEnd()
    }
  }

  // Summary
  console.log(`───`)
  const total = state.passed + state.failed.length + state.skipped
  if (grep) console.log(`${isNode ? GRAY : ''}# grep /${grep.source}/${grep.flags}${isNode ? RESET : ''}`)
  if (only) console.log(`# only ${only} cases`)
  console.log(`# total ${total}`)
  if (state.passed) isNode ? console.log(`${GREEN}# pass ${state.passed}${RESET}`) : console.log(`%c# pass ${state.passed}`, 'color: #229944')

  // Show ALL failures
  if (state.failed.length) {
    isNode ? console.log(`${RED}# fail ${state.failed.length}${RESET}`) : console.log(`%c# fail ${state.failed.length}`, 'color: #cc3300')
    for (const [msg, t] of state.failed) {
      isNode ? console.log(`${RED}  ✗ ${t.name}: ${msg}${RESET}`) : console.log(`%c  ✗ ${t.name}: ${msg}`, 'color: #cc3300')
    }
  }
  if (state.skipped) isNode ? console.log(`${GRAY}# skip ${state.skipped}${RESET}`) : console.log(`%c# skip ${state.skipped}`, 'color: gray')

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
    waited += 50
    if (tests.length === 0 && waited > 500) return  // No tests, exit
    if (tests.length > 0 && tests.length === lastCount) { run(); return }  // Stable, run
    lastCount = tests.length
    if (waited < 5000) setTimeout(check, 50)
    else if (tests.length > 0) run()
  }
  setTimeout(check, 50)
}

scheduleAutoRun()

export * from './assert.js'
