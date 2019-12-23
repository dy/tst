import * as assert from './assert.js'

const isNode = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]'
const hasImport = typeof require === 'undefined'
const GREEN = '\u001b[32m', RED = '\u001b[31m', YELLOW = '\u001b[33m', RESET = '\u001b[0m', CYAN = '\u001b[36m'

let summaryTimeout
let assertIndex = 0
let index = 1
let passed = 0
let failed = 0
let skipped = 0
let only = 0

// some bundlers incur async tick (like parcel import().then) - safer to do macrotask
let queue = new Promise(ok => setTimeout(ok))

export default function test(name, fn) {
  if (!fn) return test.todo(name)
  return createTest({ name, fn })
}
test.todo = function (name, fn) {
  return createTest({ name, fn, todo: true, tag: 'todo' })
}
test.fixme = test.fix = function (name, fn) {
  return createTest({ name, fn, todo: true, tag: 'fixme' })
}
test.skip = function (name, fn) {
  return createTest({ name, fn, skip: true, tag: 'skip' })
}
test.only = function (name, fn) {
  only++
  return createTest({ name, fn, only: true, tag: 'only' })
}
test.node = function (name, fn) {
  return createTest({ name, fn, skip: !isNode, tag: 'node' })
}
test.browser = function (name, fn) {
  return createTest({ name, fn, skip: isNode, tag: 'browser' })
}
test.demo = function (name, fn) {
  return createTest({ name, fn, demo: true, tag: 'demo' })
}
test.require = function (name, fn) {
  return createTest({ name, fn, skip: hasImport, tag: 'require' })
}
test.import = function (name, fn) {
  return createTest({ name, fn, skip: !hasImport, tag: 'import' })
}


export function createTest(test) {
  test.index = index++

  if (test.skip) {
    queue = queue.then(() => {
      skipped++
      if (only && !test.only) { return }
      isNode ?
        console.log(`${CYAN}≫ ${test.name}${test.tag ? ` (${test.tag})` : ''}${RESET}`) :
        console.log(`%c${test.name} ≫` + (test.tag ? ` (${test.tag})` : ''), 'color: #dadada')
    })
  }

  else if (test.todo) {
    queue = queue.then(() => {
      if (only && !test.only) { skipped++; return }
      isNode ? console.log(`${CYAN}≫ ${test.name}${test.tag ? ` (${test.tag})` : ''}${RESET}`) :
        console.log(`%c${test.name} 🚧` + (test.tag ? ` (${test.tag})` : ''), 'color: #dadada')
    })
  }

  else {
    test = Object.assign({
      assertion: [],
      skip: false,
      todo: false,
      only: false,
      demo: false,
      end: () => { },
      log: (ok, operator, msg, info = {}) => {
        assertIndex += 1
        if (ok) {
          isNode ?
            console.log(`${GREEN}✔ ${RESET}${assertIndex} — ${msg}`) :
            console.log(`%c✔ ${assertIndex} — ${msg}`, 'color: #229944')
          if (!test.demo) {
            test.assertion.push({ idx: assertIndex, msg })
            passed += 1
          }
        } else {
          isNode ? (console.log(`${RED}✖ ${RESET}${assertIndex} — ${msg}`), console.log(info), console.error(new Error)) :
            console.assert(false, `${assertIndex} — ${msg}`, info, new Error)
          if (!test.demo) {
            test.assertion.push({ idx: assertIndex, msg, info, error: new Error() })
            failed += 1
          }
        }
      }
    }, test, assert)

    queue = queue.then(async () => {
      if (only && !test.only) { skipped++; return }
      clearTimeout(summaryTimeout)

      isNode ? console.log(`▶ ${test.name}` + (test.tag ? ` (${test.tag})` : '')) :
        console.group(test.name + (test.tag ? ` (${test.tag})` : ''))

      let result

      try {
        result = await test.fn(test)
      }
      catch (e) {
        failed += 1
        // FIXME: this syntax is due to chrome not always able to grasp the stack trace from source maps
        console.error(e.stack)
      }
      finally {
        if (!isNode) console.groupEnd()
        summaryTimeout = setTimeout(showSummary)
      }

      return result
    })
  }
}

function showSummary() {
  // summarise
  console.log(`---`)
  const total = passed + failed + skipped
  if (only) console.log(`# only ${only} cases`)
  console.log(`# total ${total}`)
  if (passed) console.log(`# pass ${passed}`)
  if (failed) console.log(`# fail ${failed}`)
  if (skipped) console.log(`# skip ${skipped}`)

  if (isNode) process.exit(failed ? 1 : 0)
}
