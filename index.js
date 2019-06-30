import * as assert from './assert.js'


let ondone

export const done = new Promise((resolve) => {
  ondone = resolve
})

function start () {
  if (!running) {
    running = true

    Promise.resolve().then(() => {
      const hasOnly = tests.some((test) => test.only)
      tests.forEach((test) => {
        test.shouldRun = true
        if (test.skip) {
          test.shouldRun = false
        } else if (hasOnly) {
          test.shouldRun = test.only
        }
      })

      dequeue()
    })
  }
}

export default function test (name, fn) {
  tests.push({ name, fn, skip: false, only: false, shouldRun: false })
  start()
}

Object.assign(test, {
  skip (name, fn) {
    tests.push({ name, fn, skip: true, only: false, shouldRun: null })
    start()
  },

  only (name, fn) {
    tests.push({ name, fn, skip: false, only: true, shouldRun: null })
    start()
  }
})

let testIndex = 0
let assertIndex = 0
let running = false

const tests = []
let passed = 0
let failed = 0
let skipped = 0

const isNode = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]'


export function log (ok, operator, msg, info = {}) {
  assertIndex += 1
  if (ok) {
    console.log(`ok ${assertIndex} — ${msg}`)
    passed += 1
  } else {
    console.log(`not ok ${assertIndex} — ${msg}`)
    failed += 1

    console.log('  ---')
    console.log(`  operator: ${operator}`)

    if ('expected' in info) {
      console.log(`  expected:`, info.expected)
    }
    if ('actual' in info) {
      console.log(`  actual:`, info.actual)
    }
    let {actual, expected, ...rest} = info
    for (let prop in rest) {
        console.log(`  ${prop}:`, rest[prop])
    }

    // find where the error occurred, and try to clean it up
    let err = new Error()
    Error.captureStackTrace(err, log);
    let lines = err.stack.split('\n').slice(3)

    let cwd = ''

    if (isNode) {
      cwd = process.cwd()
      if (/[/\\]/.test(cwd[0])) cwd += cwd[0]

      const dirname = typeof __dirname === 'string' && __dirname.replace(/dist$/, '')

      for (let i = 0; i < lines.length; i += 1) {
        if (lines[i].indexOf(dirname) !== -1) {
          lines = lines.slice(0, i)
          break
        }
      }
    }

    const stack = lines
      .map((line) => `    ${line.replace(cwd, '').trim()}`)
      .join('\n')

    console.log(`  stack:   \n${stack}`)
    console.log(`  ...`)
  }
}

async function dequeue () {
  const test = tests[testIndex++]

  if (test) {
    if (!test.shouldRun) {
      if (test.skip) {
        // Useless info
        // console.log(`# skip ${test.name}`)
      }
      skipped += 1
      dequeue()
      return
    }

    console.log(`# ${test.name}`)

    try {
      await test.fn(assert)
    } catch (err) {
      failed += 1
      console.log(`not ok ${assertIndex} — ${err.message}`)
      console.error(`  ${err.stack.replace(/^\s+/gm, '    ')}`)
    }

    dequeue()
  } else {
    // summarise
    const total = passed + failed + skipped
    console.log(`\n1..${total}`)
    console.log(`# tests ${total}`)
    if (passed) console.log(`# pass ${passed}`)
    if (failed) console.log(`# fail ${failed}`)
    if (skipped) console.log(`# skip ${skipped}`)

    ondone()
    if (isNode) process.exit(failed ? 1 : 0)
  }
}
