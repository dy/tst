import * as assert from './assert.js'

function Test(o) {
  Object.assign(this, o)
  this.assertion = []
}
Test.prototype.run = async function run () {
  let from = this.startTime = performance.now()
  await this.fn(this)
  this.endTime = performance.now() - from
}
Object.assign(Test.prototype, {
  skip: false,
  todo: false,
  only: false,
  fn: null
}, assert)

export default function test (name, fn) {
  if (!fn) return test.todo(name)
  let t = new Test({ name, fn })
  tests.push(t)
  start()
  return t
}
test.todo = function (name, fn) {
  let t = new Test({ name, fn, todo: true })
  tests.push(t)
  start()
  return t
}
test.skip = function (name, fn) {
  let t = new Test({ name, fn, skip: true })
  tests.push(t)
  start()
  return t
}
test.only = function (name, fn) {
  let t = new Test({ name, fn, only: true })
  tests.push(t)
  start()
  return t
}

let assertIndex = 0

const tests = []
let passed = 0
let failed = 0
let skipped = 0

export let current = null // current test

const isNode = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]'

export function log (ok, operator, msg, info = {}) {
  assertIndex += 1
  if (ok) {
    current.assertion.push({ idx: assertIndex, msg })
    console.log(`%c ✔ ${assertIndex} — ${msg}`, 'color: #229944')
    passed += 1
  } else {
    current.assertion.push({ idx: assertIndex, msg, info, error: new Error() })
    failed += 1
    console.assert(false, `${assertIndex} — ${msg}`, info, (new Error()))
  }
}


let ondone, hasOnly = false, running = false


function start() {
  if (!running) {
    running = true

    Promise.resolve().then(() => {
      hasOnly = tests.some(test => test.only)

      dequeue()
    })
  }
}

async function dequeue () {
  if (tests.length) {
    const test = tests.shift()

    if (hasOnly && !test.only) {
      // in only-run - ignore tests
      skipped += 1
      return dequeue()
    }

    if (test.skip) {
      console.log(`%c# skip ${test.name}`, 'color: #ddd')
      skipped += 1
      return dequeue()
    }
    if (test.todo) {
      console.log(`# todo ${test.name}`)
      return dequeue()
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

    return dequeue()
  }

  // summarise
  const total = passed + failed + skipped
  console.log(`---\n# tests ${total}`)
  if (hasOnly) console.log(`# only ${total - skipped}`)
  if (passed) console.log(`# pass ${passed}`)
  if (failed) console.log(`# fail ${failed}`)
  if (skipped) console.log(`# skip ${skipped}`)

  ondone()
  if (isNode) process.exit(failed ? 1 : 0)
}


export const done = new Promise((resolve) => {
  ondone = resolve
})
