/**
 * Meta-tests for tst itself
 *
 * Strategy: spawn tst as subprocess, verify output and exit codes.
 * This "seals" the good parts - if these pass, core behavior is preserved.
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const GREEN = '\u001b[32m', RED = '\u001b[31m', RESET = '\u001b[0m'

let passed = 0, failed = 0

async function run(name, code, expect) {
  const result = await execute(code)

  const checks = []
  if (expect.exitCode !== undefined) {
    checks.push(['exitCode', result.exitCode === expect.exitCode, result.exitCode, expect.exitCode])
  }
  if (expect.stdout) {
    for (const pattern of expect.stdout) {
      const match = pattern instanceof RegExp ? pattern.test(result.stdout) : result.stdout.includes(pattern)
      checks.push(['stdout contains ' + pattern, match, result.stdout.slice(0, 200)])
    }
  }
  if (expect.notStdout) {
    for (const pattern of expect.notStdout) {
      const match = pattern instanceof RegExp ? !pattern.test(result.stdout) : !result.stdout.includes(pattern)
      checks.push(['stdout NOT contains ' + pattern, match, result.stdout.slice(0, 200)])
    }
  }

  const allPassed = checks.every(c => c[1])
  if (allPassed) {
    console.log(`${GREEN}✔ ${name}${RESET}`)
    passed++
  } else {
    console.log(`${RED}✘ ${name}${RESET}`)
    for (const [check, ok, actual, expected] of checks) {
      if (!ok) console.log(`  ${RED}${check}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}${RESET}`)
    }
    failed++
  }
}

function execute(code) {
  return new Promise((resolve) => {
    // Clean env: remove TST_* vars to not affect child processes
    const cleanEnv = { ...process.env, FORCE_COLOR: '0' }
    delete cleanEnv.TST_GREP
    delete cleanEnv.TST_BAIL
    delete cleanEnv.TST_MUTE

    const child = spawn('node', ['--input-type=module', '-e', code], {
      cwd: __dirname,
      env: cleanEnv
    })

    let stdout = '', stderr = ''
    child.stdout.on('data', d => stdout += d)
    child.stderr.on('data', d => stderr += d)
    child.on('close', exitCode => resolve({ exitCode, stdout, stderr }))
  })
}

console.log('Testing tst runner...\n')

// =============================================================================
// CORE: test() function works
// =============================================================================

await run('basic test passes', `
  import test, { ok } from './tst.js'
  test('example', () => { ok(true) })
`, {
  exitCode: 0,
  stdout: ['example', '# pass 1']
})

await run('basic test fails', `
  import test, { ok } from './tst.js'
  test('example', () => { ok(false) })
`, {
  exitCode: 1,
  stdout: ['example', '# fail 1']
})

// =============================================================================
// CORE: async tests
// =============================================================================

await run('async test passes', `
  import test, { ok } from './tst.js'
  test('async', async () => {
    await new Promise(r => setTimeout(r, 10))
    ok(true)
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1']
})

await run('async test rejects', `
  import test from './tst.js'
  test('async fail', async () => {
    throw new Error('boom')
  })
`, {
  exitCode: 1,
  stdout: ['# fail 1', 'boom']
})

// =============================================================================
// CORE: test.skip
// =============================================================================

await run('test.skip skips test', `
  import test, { ok } from './tst.js'
  test.skip('skipped', () => { ok(false) })
  test('runs', () => { ok(true) })
`, {
  exitCode: 0,
  stdout: ['# skip 1', '# pass 1', 'skipped']
})

// =============================================================================
// CORE: test.only
// =============================================================================

await run('test.only runs only marked tests', `
  import test, { ok } from './tst.js'
  test('ignored', () => { ok(false) })
  test.only('focused', () => { ok(true) })
`, {
  exitCode: 0,
  stdout: ['# only 1', '# pass 1'],
  notStdout: ['ignored']
})

// =============================================================================
// CORE: test.todo
// =============================================================================

await run('test.todo marks as todo', `
  import test, { ok } from './tst.js'
  test.todo('wip', () => { ok(true) })
`, {
  exitCode: 0,
  stdout: ['todo', '# skip 1']
})

// =============================================================================
// CORE: test.demo (failures don't affect exit code)
// =============================================================================

await run('test.demo failure does not fail run', `
  import test, { ok } from './tst.js'
  test.demo('demo fail', () => { ok(false) })
  test('normal', () => { ok(true) })
`, {
  exitCode: 0,
  stdout: ['demo fail', 'demo', '# pass 1']  // demo not counted in pass/fail
})

// =============================================================================
// CORE: test without callback = todo
// =============================================================================

await run('test without callback is todo', `
  import test from './tst.js'
  test('future feature')
`, {
  exitCode: 0,
  stdout: ['todo', '# skip 1']
})

// =============================================================================
// ASSERTIONS: ok
// =============================================================================

await run('ok(truthy) passes', `
  import test, { ok } from './tst.js'
  test('ok', () => {
    ok(1)
    ok('str')
    ok([])
    ok({})
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1', '√ 4']  // 1 test passed, 4 assertions
})

await run('ok(falsy) fails', `
  import test, { ok } from './tst.js'
  test('ok', () => { ok(0) })
`, {
  exitCode: 1,
  stdout: ['# fail 1']
})

// =============================================================================
// ASSERTIONS: is (primitives)
// =============================================================================

await run('is() with equal primitives passes', `
  import test, { is } from './tst.js'
  test('is', () => {
    is(1, 1)
    is('a', 'a')
    is(null, null)
    is(undefined, undefined)
    is(true, true)
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1', '√ 5']  // 1 test passed, 5 assertions
})

await run('is() with different primitives fails', `
  import test, { is } from './tst.js'
  test('is', () => { is(1, 2) })
`, {
  exitCode: 1,
  stdout: ['# fail 1']
})

await run('is() uses Object.is semantics', `
  import test, { is } from './tst.js'
  test('is', () => {
    is(NaN, NaN)  // Object.is(NaN, NaN) === true
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1']
})

// =============================================================================
// ASSERTIONS: is (deep equality)
// =============================================================================

await run('is() deep equals arrays', `
  import test, { is } from './tst.js'
  test('is', () => {
    is([1, 2], [1, 2])
    is([{a: 1}], [{a: 1}])
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1', '√ 2']  // 1 test passed, 2 assertions
})

await run('is() deep equals objects', `
  import test, { is } from './tst.js'
  test('is', () => {
    is({a: 1, b: 2}, {a: 1, b: 2})
    is({a: {b: 1}}, {a: {b: 1}})
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1', '√ 2']  // 1 test passed, 2 assertions
})

await run('is() key order does not matter', `
  import test, { is } from './tst.js'
  test('is', () => {
    is({a: 1, b: 2}, {b: 2, a: 1})
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1']
})

// =============================================================================
// ASSERTIONS: not
// =============================================================================

await run('not() with different values passes', `
  import test, { not } from './tst.js'
  test('not', () => {
    not(1, 2)
    not([1], [2])
    not({a: 1}, {a: 2})
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1', '√ 3']  // 1 test passed, 3 assertions
})

await run('not() with equal values fails', `
  import test, { not } from './tst.js'
  test('not', () => { not(1, 1) })
`, {
  exitCode: 1,
  stdout: ['# fail 1']
})

// =============================================================================
// ASSERTIONS: throws
// =============================================================================

await run('throws() passes when fn throws', `
  import test, { throws } from './tst.js'
  test('throws', () => {
    throws(() => { throw new Error('x') })
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1']
})

await run('throws() fails when fn does not throw', `
  import test, { throws } from './tst.js'
  test('throws', () => {
    throws(() => {})
  })
`, {
  exitCode: 1,
  stdout: ['# fail 1']
})

await run('throws() matches regex', `
  import test, { throws } from './tst.js'
  test('throws', () => {
    throws(() => { throw new Error('hello world') }, /hello/)
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1']
})

// =============================================================================
// ASSERTIONS: rejects
// =============================================================================

await run('rejects() passes when async fn rejects', `
  import test, { rejects } from './tst.js'
  test('rejects', async () => {
    await rejects(async () => { throw new Error('x') })
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1']
})

await run('rejects() fails when async fn resolves', `
  import test, { rejects } from './tst.js'
  test('rejects', async () => {
    await rejects(async () => {})
  })
`, {
  exitCode: 1,
  stdout: ['# fail 1']
})

await run('rejects() matches regex', `
  import test, { rejects } from './tst.js'
  test('rejects', async () => {
    await rejects(async () => { throw new Error('hello world') }, /hello/)
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1']
})

// =============================================================================
// ASSERTIONS: any
// =============================================================================

await run('any() passes when value in list', `
  import test, { any } from './tst.js'
  test('any', () => {
    any(2, [1, 2, 3])
    any('b', ['a', 'b', 'c'])
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1', '√ 2']  // 1 test passed, 2 assertions
})

await run('any() fails when value not in list', `
  import test, { any } from './tst.js'
  test('any', () => { any(5, [1, 2, 3]) })
`, {
  exitCode: 1,
  stdout: ['# fail 1']
})

// =============================================================================
// ASSERTIONS: same
// =============================================================================

await run('same() passes with same members different order', `
  import test, { same } from './tst.js'
  test('same', () => {
    same([1, 2, 3], [3, 2, 1])
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1']
})

await run('same() fails with different members', `
  import test, { same } from './tst.js'
  test('same', () => { same([1, 2], [1, 3]) })
`, {
  exitCode: 1,
  stdout: ['# fail 1']
})

// =============================================================================
// EDGE CASES
// =============================================================================

await run('multiple tests run in order', `
  import test, { ok } from './tst.js'
  test('first', () => { console.log('ONE'); ok(true) })
  test('second', () => { console.log('TWO'); ok(true) })
  test('third', () => { console.log('THREE'); ok(true) })
`, {
  exitCode: 0,
  stdout: ['# pass 3', 'ONE', 'TWO', 'THREE']  // 3 tests passed
})

await run('test.mute collapses output', `
  import test, { ok } from './tst.js'
  test.mute('quiet', () => { ok(true) })
`, {
  exitCode: 0,
  stdout: ['# pass 1']
})

// =============================================================================
// NEW: Standalone assertions (no test context needed)
// =============================================================================

await run('assertions work standalone (pass)', `
  import { ok, is } from './assert.js'
  ok(true)
  is(1, 1)
  console.log('standalone ok')
`, {
  exitCode: 0,
  stdout: ['standalone ok']
})

await run('assertions work standalone (throw on fail)', `
  import { ok } from './assert.js'
  try {
    ok(false)
    console.log('should not reach')
  } catch (e) {
    console.log('caught:', e.name)
  }
`, {
  exitCode: 0,
  stdout: ['caught: Assertion'],
  notStdout: ['should not reach']
})

await run('run() is exported', `
  // Check that run is a function by importing and checking type
  const mod = await import('./tst.js')
  console.log('run type:', typeof mod.run)
  // Exit immediately to prevent auto-run from executing
  process.exit(typeof mod.run === 'function' ? 0 : 1)
`, {
  exitCode: 0,
  stdout: ['run type: function']
})

// =============================================================================
// NEW: Test timeout
// =============================================================================

await run('test timeout triggers on slow test', `
  import test, { run } from './tst.js'
  test('slow', { timeout: 50 }, async () => {
    await new Promise(r => setTimeout(r, 200))
  })
`, {
  exitCode: 1,
  stdout: ['timeout after 50ms', '# fail 1']
})

await run('test completes before timeout', `
  import test from './tst.js'
  test('fast', { timeout: 1000 }, async () => {
    await new Promise(r => setTimeout(r, 10))
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1']
})

// =============================================================================
// NEW: Slow imports (auto-run waits for test registration to stabilize)
// =============================================================================

await run('auto-run waits for slow imports', `
  import test, { ok } from './tst.js'

  // Simulate slow import with top-level await
  await new Promise(r => setTimeout(r, 200))

  test('after slow import', () => {
    ok(true)
  })
`, {
  exitCode: 0,
  stdout: ['after slow import', '# pass 1']
})

// =============================================================================
// NEW: Grep filter
// =============================================================================

await run('grep filters tests by name', `
  import test, { ok } from './tst.js'
  test('apple test', () => ok(true))
  test('banana test', () => ok(true))
  test('cherry test', () => ok(true))
  test.run({ grep: /banana/ })
`, {
  exitCode: 0,
  stdout: ['banana', '# pass 1', '# skip 2'],
  notStdout: ['apple', 'cherry']
})

// =============================================================================
// NEW: Mute mode (only show failures)
// =============================================================================

await run('mute mode hides passing tests', `
  import test, { ok } from './tst.js'
  test('pass1', () => ok(true))
  test('pass2', () => ok(true))
  test.run({ mute: true })
`, {
  exitCode: 0,
  stdout: ['# pass 2'],
  notStdout: ['pass1', 'pass2', '√']
})

await run('mute mode shows failures', `
  import test, { ok } from './tst.js'
  test('passes', () => ok(true))
  test('fails', () => ok(false))
  test.run({ mute: true })
`, {
  exitCode: 1,
  stdout: ['fails', '# fail 1'],
  notStdout: ['passes']
})

// =============================================================================
// NEW: Bail (stop on first failure)
// =============================================================================

await run('bail stops on first failure', `
  import test, { ok } from './tst.js'
  test('first', () => ok(false))
  test('second', () => { console.log('SHOULD NOT RUN'); ok(true) })
  test.run({ bail: true })
`, {
  exitCode: 1,
  stdout: ['# fail 1', '# total 1'],
  notStdout: ['SHOULD NOT RUN', 'second']
})

// =============================================================================
// NEW: Mute shows assertion count
// =============================================================================

await run('test.mute shows assertion summary in node', `
  import test, { ok, is } from './tst.js'
  test.mute('quiet test', () => {
    ok(true)
    ok(true)
    is(1, 1)
  })
`, {
  exitCode: 0,
  stdout: ['quiet test (3 assertions)', '# pass 1'],
  notStdout: ['√']
})

// =============================================================================
// NEW: All failures listed in summary
// =============================================================================

await run('summary lists all failures', `
  import test, { ok } from './tst.js'
  test('fail one', () => ok(false))
  test('fail two', () => ok(false))
  test('fail three', () => ok(false))
`, {
  exitCode: 1,
  stdout: ['# fail 3', '✗ fail one', '✗ fail two', '✗ fail three']
})

// =============================================================================
// FORK: isolated worker execution
// =============================================================================

await run('test.fork runs in isolated worker', `
  import test, { ok } from './tst.js'
  test.fork('isolated', ({ ok }) => {
    ok(true)
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1']
})

await run('test.fork receives data from opts', `
  import test from './tst.js'
  test.fork('with data', { data: { baseline: 42 } }, ({ ok, is }, data) => {
    ok(data)
    is(data.baseline, 42)
  })
`, {
  exitCode: 0,
  stdout: ['# pass 1']
})

// =============================================================================
// SUMMARY
// =============================================================================

console.log(`\n───`)
console.log(`# total ${passed + failed}`)
if (passed) console.log(`${GREEN}# pass ${passed}${RESET}`)
if (failed) console.log(`${RED}# fail ${failed}${RESET}`)

process.exit(failed ? 1 : 0)
