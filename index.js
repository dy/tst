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

function Test(o) {
  Object.assign(this, o)
}
Test.prototype.time = null
Test.prototype.run = async function run () {
  let from = this.startTime = performance.now()
  await this.fn(this)
  this.endTime = performance.now() - from
}
Object.assign(Test.prototype, assert)

export default function test (name, fn) {
  if (!fn) return test.todo(name)
  let t = new Test({ name, fn, skip: false, only: false, shouldRun: false, assert: [] })
  tests.push(t)
  start()
  return t
}

test.todo = function (name, fn) {
  let t = new Test({ name, fn, skip: true, todo: true, only: false, shouldRun: null, assert: [] })
  tests.push(t)
  return t
}

test.skip = function (name, fn) {
  let t = new Test({ name, fn, skip: true, only: false, shouldRun: null, assert: [] })
  tests.push(t)
  start()
  return t
}

test.only = function (name, fn) {
  let t = new Test({ name, fn, skip: false, only: true, shouldRun: null, assert: [] })
  tests.push(t)
  start()
  return t
}

let testIndex = 0
let assertIndex = 0
let running = false

const tests = []
let passed = 0
let failed = 0
let skipped = 0

export let current = null // current test

const isNode = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]'

export function log (ok, operator, msg, info = {}) {
  assertIndex += 1
  if (ok) {
    current.assert.push({ idx: assertIndex, msg })
    console.log(`%c ✔ ${assertIndex} — ${msg}`, 'color: #229944')
    passed += 1
  } else {
    current.assert.push({ idx: assertIndex, msg, info, error: new Error() })
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
      current = test
      console.log(`# ${test.name}`)
      await test.run()
    } catch (err) {
      failed += 1
      // FIXME: this syntax is due to chrome not always able to grasp the stack trace from source maps
      console.error(err.stack)
    }

    dequeue()
  }

  // summarise
  else {
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
