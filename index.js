import * as assert from './assert.js'

const isNode = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]'
let assertIndex = 0
const tests = []
let passed = 0
let failed = 0
let skipped = 0
let current = null // current test
let ondone, only = 0, running = false

class Test extends Promise {
  constructor (o) {
    let resolve, reject
    super((ok, nok) => {
      resolve = ok
      reject = nok
    })
    this.resolve = resolve
    this.reject = reject
    this.assertion = []
    this.skip = false
    this.todo = false
    this.only = false
    this.demo = false
    this.fn = null

    Object.assign(this, o)
    tests.push(this)
    start()
  }
  async run() {
    let result
    try {
      this.resolve(result = await this.fn(this))
    }
    catch (e) {
      this.reject()
    }
    finally {
      this.end()
    }
    return result
  }
  end() {
    this.done = true
  }
  log(ok, operator, msg, info = {}) {
    assertIndex += 1

    if (ok) {
      isNode ?
        console.log(`  ✔ ${assertIndex} — ${msg}`) :
        console.log(`%c✔ ${assertIndex} — ${msg}`, 'color: #229944')
      if (!this.demo) {
        current.assertion.push({ idx: assertIndex, msg })
        passed += 1
      }
    } else {
      console.assert(false, `${assertIndex} — ${msg}`, info, (new Error()))
      if (!this.demo) {
        current.assertion.push({ idx: assertIndex, msg, info, error: new Error() })
        failed += 1
      }
    }
  }
}
Object.assign(Test.prototype, assert)

export default function test (name, fn) {
  if (!fn) return test.todo(name)
  return new Test({ name, fn })
}
test.todo = function (name, fn) {
  return new Test({ name: name + ' [todo]', fn, todo: true })
}
test.fixme = test.fix = function (name, fn) {
  return new Test({ name: name + ' [fixme]', fn, todo: true })
}
test.skip = function (name, fn) {
  return new Test({ name: name + ' [skip]', fn, skip: true })
}
test.only = function (name, fn) {
  return new Test({ name: name + ' [only]', fn, only: true })
}
test.node = function (name, fn) {
  return new Test({ name: name + ' [node]', fn, skip: !isNode })
}
test.browser = function (name, fn) {
  return new Test({ name: name + ' [browser]', fn, skip: isNode })
}
test.demo = function (name, fn) {
  return new Test({ name: name + ' [demo]', fn, demo: true })
}

function start() {
  if (!running) {
    running = true

    Promise.resolve().then(() => {
      tests.forEach(test => test.only && only++)
      dequeue()
    })
  }
}

async function dequeue () {
  if (tests.length) {
    const test = tests.shift()

    if (only && !test.only) {
      // in only-run - ignore tests
      skipped += 1
      return dequeue()
    }

    if (test.skip) {
      isNode ?
        console.log(`× skip ${test.name}`) :
      console.log(`%c↪️ ${test.name}`, 'color: #ddd')
      skipped += 1
      return dequeue()
    }
    if (test.todo) {
      console.log(`🚧 ${test.name}`)
      return dequeue()
    }

    try {
      current = test
      isNode ? console.log(`▶ ${test.name}`) :
      console.group(test.name)
      await test.run()
      console.groupEnd()
    } catch (err) {
      failed += 1
      // FIXME: this syntax is due to chrome not always able to grasp the stack trace from source maps
      console.error(err.stack)
    }

    return dequeue()
  }

  // summarise
  console.log(`---`)
  const total = passed + failed + skipped
  if (only) console.log(`# only ${only} cases`)
  console.log(`# total ${ total }`)
  if (passed) console.log(`# pass ${passed}`)
  if (failed) console.log(`# fail ${failed}`)
  if (skipped) console.log(`# skip ${skipped}`)

  ondone()
  if (isNode) process.exit(failed ? 1 : 0)
}


let done = new Promise((resolve) => {
  ondone = resolve
})
