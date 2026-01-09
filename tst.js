/**
 * tst - test runner
 *
 * Architecture:
 * - No global mutable state (all state in closure)
 * - Decoupled from assertions (assertions work standalone)
 * - Explicit run() trigger (no magic timeouts)
 * - Works in Node.js and browser
 */

import { setReporter, Assertion } from './assert.js'

const GREEN = '\u001b[32m', RED = '\u001b[31m', YELLOW = '\u001b[33m', RESET = '\u001b[0m', CYAN = '\u001b[36m'
const isNode = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]'

// ─────────────────────────────────────────────────────────────────────────────
// State (encapsulated, reset on each run)
// ─────────────────────────────────────────────────────────────────────────────

let tests = []
let state = null

function resetState() {
  state = {
    assertCount: 0,
    passed: 0,
    failed: [],
    skipped: 0,
    only: 0
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test registration
// ─────────────────────────────────────────────────────────────────────────────

export default function test(name, fn) {
  if (!fn) return test.todo(name)
  tests.push({ name, fn, type: 'test' })
}

test.skip = (name, fn) => tests.push({ name, fn, type: 'skip' })
test.todo = (name, fn) => tests.push({ name, fn, type: 'todo' })
test.only = (name, fn) => { tests.push({ name, fn, type: 'only' }); state && state.only++ }
test.demo = (name, fn) => tests.push({ name, fn, type: 'demo' })
test.mute = (name, fn) => tests.push({ name, fn, type: 'mute' })

// ─────────────────────────────────────────────────────────────────────────────
// Test execution
// ─────────────────────────────────────────────────────────────────────────────

export async function run(opts = {}) {
  resetState()

  // Count only tests
  state.only = tests.filter(t => t.type === 'only').length

  let prev = null

  for (const t of tests) {
    // Skip non-only tests if there are only tests
    if (state.only && t.type !== 'only' && t.type !== 'skip' && t.type !== 'todo') {
      state.skipped++
      continue
    }

    if (t.type === 'skip' || t.type === 'todo') {
      state.skipped++
      const icon = t.type === 'todo' ? (isNode ? YELLOW : '🚧') : (isNode ? CYAN : '≫')
      isNode
        ? console.log(`${t.type === 'todo' ? YELLOW : CYAN}» ${t.name} (${t.type})${RESET}`)
        : console.log(`%c${t.name} ${t.type === 'todo' ? '🚧' : '≫'} (${t.type})`, 'color: gainsboro')
      prev = t
      continue
    }

    // Print test header
    isNode
      ? console.log(`${RESET}${prev && (prev.type === 'skip' || prev.type === 'todo') ? '\n' : ''}► ${t.name}${t.type !== 'test' ? ` (${t.type})` : ''}`)
      : t.type === 'mute'
        ? console.groupCollapsed(t.name)
        : console.group(t.name)

    // Set up reporter to capture passes
    const testState = { assertCount: 0 }
    setReporter(({ operator, message }) => {
      testState.assertCount++
      state.assertCount++
      isNode
        ? console.log(`${GREEN}√ ${state.assertCount} (${operator}) — ${message}${RESET}`)
        : console.log(`%c✔ ${state.assertCount} (${operator}) — ${message}`, 'color: #229944')
    })

    // Create pass/fail callbacks for backward compatibility
    const pass = (msg) => {
      if (typeof msg === 'string') {
        isNode
          ? console.log(`${GREEN}(pass) ${msg}${RESET}`)
          : console.log(`%c(pass) ${msg}`, 'color: #229944')
      }
    }
    const fail = (msg) => {
      if (typeof msg === 'string') console.error(msg)
    }

    try {
      await t.fn(pass, fail)
      state.passed++
      // Let any scheduled errors log
      await new Promise(r => setTimeout(r))
    } catch (e) {
      state.assertCount++

      if (e instanceof Assertion || e.name === 'Assertion') {
        const { operator, message, actual, expected } = e
        isNode ? (
          console.log(`${RED}× ${state.assertCount} — ${message}`),
          actual !== undefined && (
            console.info(`actual:${RESET}`, typeof actual === 'string' ? JSON.stringify(actual) : actual, RED),
            console.info(`expected:${RESET}`, typeof expected === 'string' ? JSON.stringify(expected) : expected, RED),
            console.error(new Error, RESET)
          )
        ) : (
          console.assert(false, `${state.assertCount} — ${message}`, { actual, expected })
        )
      } else {
        isNode
          ? console.log(`${RED}× ${state.assertCount} — ${e.message}${RESET}`)
          : console.error(e)
      }

      if (t.type !== 'demo') {
        state.failed.push([e.message, t])
      }
    } finally {
      setReporter(null)
      if (!isNode) console.groupEnd()
      else console.log()
    }

    prev = t
  }

  // Summary
  console.log(`───`)
  const total = state.passed + state.failed.length + state.skipped
  if (state.only) console.log(`# only ${state.only} cases`)
  console.log(`# total ${total}`)
  if (state.passed) console.log(`%c# pass ${state.passed}`, 'color: #229944')
  if (state.failed.length) {
    const [msg, t] = state.failed[0]
    console.log(`# fail ${state.failed.length} (${t.name} → ${msg})${state.failed.length > 1 ? `, ${state.failed.length - 1} more...` : ''}`)
  }
  if (state.skipped) console.log(`# skip ${state.skipped}`)

  // Clear tests for potential re-run
  tests = []

  if (isNode) process.exit(state.failed.length ? 1 : 0)

  return state
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-run (preserves backward compatibility)
// Waits for imports to settle, then runs if tests were registered
// ─────────────────────────────────────────────────────────────────────────────

Promise.all([
  new Promise(resolve => (typeof setImmediate !== 'undefined' ? setImmediate : requestIdleCallback)(resolve)),
  new Promise(resolve => setTimeout(resolve, 100))
]).then(() => {
  if (tests.length > 0) run()
})

// Re-export assertions for convenience
export * from './assert.js'
