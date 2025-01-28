const GREEN = '\u001b[32m', RED = '\u001b[31m', YELLOW = '\u001b[33m', RESET = '\u001b[0m', CYAN = '\u001b[36m', GRAY = '\u001b[30m'
const isNode = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]'

let assertc = 0,
  index = 1,
  passed = 0,
  failed = [],
  skipped = 0,
  only = 0,
  current = null,
  start,
  queue = new Promise(resolve => start = resolve)

export { current }


export default function test(name, run) {
  if (!run) return test.todo(name)
  return createTest({ name, run })
}
test.todo = function (name, run) {
  return createTest({ name, run, todo: true, tag: 'todo' })
}
test.skip = function (name, run) {
  return createTest({ name, run, skip: true, tag: 'skip' })
}
test.only = function (name, run) {
  only++
  return createTest({ name, run, only: true, tag: 'only' })
}
test.demo = function (name, run) {
  return createTest({ name, run, demo: true, tag: 'demo' })
}

function createTest(test) {
  test.index = index++

  if (test.skip || test.todo) {
    queue = queue.then(() => {
      skipped++
      if (only && !test.only) return test
      isNode ?
        console.log(`${test.todo ? YELLOW : CYAN}» ${test.name}${test.tag ? ` (${test.tag})` : ''}${RESET}`) :
        console.log(`%c${test.name} ${test.todo ? '🚧' : '≫'}` + (test.tag ? ` (${test.tag})` : ''), 'color: #dadada')
      return test
    })
  }

  else {
    test = Object.assign({
      assertion: [],
      skip: false,
      todo: false,
      only: false,
      demo: false,
      pass(arg) {
        if (typeof arg === 'string') return isNode ?
          console.log(`${GREEN}(pass) ${arg}${RESET}`) :
          console.log(`%c(pass) ${arg}`, 'color: #229944')

        let { operator: op, message: msg } = arg;

        assertc++
        isNode ?
          console.log(`${GREEN}√ ${assertc} ${op && `(${op})`} — ${msg}${RESET}`) :
          console.log(`%c✔ ${assertc} ${op && `(${op})`} — ${msg}`, 'color: #229944')
        // if (!this.demo) {
        test.assertion.push({ idx: assertc, msg })
        passed += 1
        // }
      },
      fail(arg) {
        assertc++

        // FIXME: this syntax is due to chrome not always able to grasp the stack trace from source maps
        // console.error(RED + arg.stack, RESET)
        if (typeof arg === 'string') return console.error(arg)

        // when error is not assertion
        else if (arg.name !== 'Assertion') return console.error(arg)

        let { operator: op, message: msg, ...info } = arg;

        isNode ? (
          console.log(`${RED}× ${assertc} — ${msg}`),
          (info && 'actual' in info) && (
            console.info(`actual:${RESET}`, typeof info.actual === 'string' ? JSON.stringify(info.actual) : info.actual, RED),
            console.info(`expect:${RESET}`, typeof (info.expect ?? info.expected) === 'string' ? JSON.stringify(info.expect ?? info.expected) : (info.expect ?? info.expected), RED),
            console.error(new Error, RESET)
          )
        ) :
          info ? console.assert(false, `${assertc} — ${msg}${RESET}`, info) :
            console.assert(false, `${assertc} — ${msg}${RESET}`)
        test.assertion.push({ idx: assertc, msg, info, error: new Error() })
      }
    }, test)

    // simple back-compatibility
    test.pass.pass = test.pass, test.pass.fail = test.fail

    queue = queue.then(async (prev) => {
      if (only && !test.only) { skipped++; return test }

      isNode ?
        console.log(`${RESET}${prev && (prev.skip || prev.todo) ? '\n' : ''}► ${test.name}${test.tag ? ` (${test.tag})` : ''}`) :
        console.group(test.name + (test.tag ? ` (${test.tag})` : ''))

      let result
      try {
        current = test
        result = await test.run(test.pass, test.fail)
        // let all planned errors to log
        await new Promise(r => setTimeout(r))
      }
      catch (e) {
        test.fail(e)
        if (!test.demo) failed.push([e.message, test])
      }
      finally {
        current = null
        if (!isNode) console.groupEnd(); else console.log()
      }

      return test
    })
  }
}

// tests called via import() cause network delay, hopefully 100ms is ok
// TODO: do run? with silent=false flag?
Promise.all([
  new Promise(resolve => (typeof setImmediate !== 'undefined' ? setImmediate : requestIdleCallback)(resolve)),
  new Promise(resolve => setTimeout(resolve, 100))
]).then(async () => {
  start()

  await queue

  // summary
  console.log(`───`)
  const total = passed + failed.length + skipped
  if (only) console.log(`# only ${only} cases`)
  console.log(`# total ${total}`)
  if (passed) console.log(`%c# pass ${passed}`, 'color: #229944')
  if (failed.length === 1) {
    let [msg, t] = failed[0]
    console.log(`# fail ${failed.length} (${t.name} → ${msg}) ${failed.length > 1 ? `... ${failed.length} more` : ''}`)
  }
  if (skipped) console.log(`# skip ${skipped}`)

  if (isNode) process.exit(failed ? 1 : 0)
})

export * from './assert.js'
