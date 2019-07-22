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
  if (!fn) return test.todo(name)
  tests.push({ name, fn, skip: false, only: false, shouldRun: false })
  start()
}

test.todo = function (name, fn) {
  tests.push({ name, fn, skip: true, todo: true, only: false, shouldRun: null })
}

test.skip = function (name, fn) {
  tests.push({ name, fn, skip: true, only: false, shouldRun: null })
  start()
}

test.only = function (name, fn) {
  tests.push({ name, fn, skip: false, only: true, shouldRun: null })
  start()
}

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
    console.log(`%c ✔ ${assertIndex} — ${msg}`, 'color: #229944')
    passed += 1
  } else {
    failed += 1
    console.assert(false, `${assertIndex} — ${msg}`, info, (new Error()))
  }
}

async function dequeue () {
  const test = tests[testIndex++]

  if (test) {
    if (!test.shouldRun) {
      if (test.todo) {
        console.log(`# todo ${test.name}`)
      }
      else if (test.skip) {
        console.log(`%c# skip ${test.name}`, 'color: #ddd')
        skipped += 1
      }
      dequeue()
      return
    }


    try {
      let from = new Date()
      await test.fn(assert)
      let time = new Date() - from
      console.log(`# ${test.name} (${time}ms)`)
    } catch (err) {
      console.log(`# ${test.name}`)
      failed += 1
      // FIXME: this syntax is due to chrome not always able to grasp the stack trace from source maps
      console.error(err.stack)
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
