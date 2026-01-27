# Contributing to tst

Thank you for considering contributing to tst! This document provides guidelines and information for contributors.

## Philosophy

tst is designed to be **minimal** - a testing library that gets out of your way. Before contributing, please understand our core principles:

- **Zero runtime dependencies** - We don't add npm packages
- **~400 lines of code** - New features must justify their LOC cost
- **Vanilla ESM** - No build step, no transpilation, no bundlers
- **Cross-platform** - Must work in Node.js AND browsers
- **Tests without efforts** - Simplicity over features

If you're unsure whether a feature fits, open an issue for discussion first.

## Getting Started

### Prerequisites

- Node.js 18+ (we test on 18, 20, 22)
- Git
- A text editor (VS Code recommended with EditorConfig support)

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/tst.git
cd tst

# Run tests
npm test

# Run demo in browser
# Open index.html in a browser
# Or use: python -m http.server 8000
```

That's it! No `npm install`, no build step. This is intentional.

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 2. Make Changes

- Edit the relevant files ([tst.js](tst.js), [assert.js](assert.js), [tst.d.ts](tst.d.ts))
- Follow existing code style (see below)
- Keep changes focused and atomic

### 3. Add Tests

**Every change must include tests.** Add meta-tests to [test.js](test.js):

```js
await run('your test description', `
  import test from './tst.js'
  // Test code here
`, {
  exitCode: 0,  // Expected exit code
  stdout: ['expected output pattern']
})
```

### 4. Run Tests

```bash
npm test
```

All 55+ tests must pass on your machine.

### 5. Test Cross-Platform

If possible, test in:
- Node.js (18, 20, 22)
- Browser (Chrome, Firefox, Safari)

CI will verify Node versions, but manual browser testing is helpful.

### 6. Update Documentation

- Update [README.md](README.md) if you added/changed user-facing features
- Update [tst.d.ts](tst.d.ts) for new APIs
- Add examples to [demo.js](demo.js) if helpful

### 7. Commit

```bash
git add .
git commit -m "feat: add feature X"
# or
git commit -m "fix: resolve issue #123"
```

Use conventional commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `refactor:` for code refactoring
- `test:` for test changes
- `chore:` for tooling/config

### 8. Push and Create PR

```bash
git push origin your-branch-name
```

Then open a Pull Request on GitHub.

## Code Style

### Formatting

We use Prettier (configuration in [.prettierrc](.prettierrc)):

```bash
# Format code (requires prettier installed)
npx prettier --write "*.js"
```

Key style points:
- 2 spaces indentation
- Single quotes
- No semicolons
- Max line length ~100 characters
- Arrow functions for callbacks

### Linting

We use ESLint (configuration in [.eslintrc.json](.eslintrc.json)):

```bash
# Lint code (requires eslint installed)
npx eslint "*.js"
```

### Manual Style Guide

```js
// ✓ Good
export function ok(value, msg = 'should be truthy') {
  if (Boolean(value)) return report('ok', msg)
  throw new Assertion({ operator: 'ok', message: msg, actual: value })
}

// ✗ Bad - semicolons, double quotes, 4 spaces
export function ok(value, msg = "should be truthy") {
    if (Boolean(value)) return report("ok", msg);
    throw new Assertion({ operator: "ok", message: msg, actual: value });
}
```

## Project Structure

```
tst/
├── tst.js              # Test runner (~435 LOC)
│   ├── formats         # Output formatters (pretty, TAP)
│   └── run()           # Test execution engine
│
├── assert.js           # Assertions (~160 LOC)
│   └── Standalone, no dependency on tst.js
│
├── tst.d.ts            # TypeScript definitions
├── test.js             # Meta-tests (tests for tst)
├── demo.js             # Usage examples
└── index.html          # Browser demo
```

## Adding Features

### New Assertion

1. Add function to [assert.js](assert.js):
```js
export function myCheck(value, msg = 'should meet condition') {
  if (checkCondition(value)) return report('myCheck', msg)
  throw new Assertion({
    operator: 'myCheck',
    message: msg,
    actual: value,
    expected: 'description of expected'
  })
}
```

2. Add type to [tst.d.ts](tst.d.ts):
```ts
export function myCheck(value: unknown, msg?: string): true
```

3. Add to Assert interface in [tst.d.ts](tst.d.ts):
```ts
export interface Assert {
  // ... existing
  myCheck: typeof myCheck
}
```

4. Add tests to [test.js](test.js):
```js
await run('myCheck passes when condition met', ...)
await run('myCheck fails when condition not met', ...)
```

5. Add example to [demo.js](demo.js)

6. Document in [README.md](README.md)

### New Test Modifier

1. Add to [tst.js](tst.js):
```js
test.myModifier = (name, opts, fn) => {
  if (!fn) (fn = opts, opts = {})
  return test(name, { ...opts, myModifier: true }, fn)
}
```

2. Handle in run logic

3. Add tests, types, docs

## Testing Guidelines

### Meta-Testing Pattern

We test tst by running it as a subprocess:

```js
await run('test description', `
  import test from './tst.js'
  test('example', ({ ok }) => ok(true))
`, {
  exitCode: 0,
  stdout: ['pattern to match', /regex/],
  notStdout: ['should not contain']
})
```

This verifies:
- Exit codes (0 = pass, 1 = fail)
- Output formatting
- Actual runtime behavior

### What to Test

- ✓ Passing cases
- ✓ Failing cases
- ✓ Edge cases (empty arrays, null, undefined, NaN)
- ✓ Async behavior
- ✓ Error messages
- ✓ Cross-platform differences (Node vs browser)

### Coverage

We don't use coverage tools. Instead:
- **Think through edge cases** - What could break?
- **Test error paths** - Not just happy paths
- **Verify output** - Exit codes, error messages, formatting

If you can imagine a scenario, write a test for it.

## Pull Request Process

1. **Open an issue first** (for large changes)
2. **Keep PRs focused** - One feature/fix per PR
3. **Write descriptive commits**
4. **Update tests** - All tests must pass
5. **Update docs** - README, types, examples
6. **CI must pass** - GitHub Actions runs tests on Node 18, 20, 22

### PR Checklist

Use the [PR template](.github/pull_request_template.md):

- [ ] Tests pass locally (`npm test`)
- [ ] New tests added
- [ ] Type definitions updated
- [ ] README updated (if needed)
- [ ] Works in Node.js and browser
- [ ] Follows minimalist philosophy (0 deps, ~400 LOC)

## Review Process

1. Maintainer reviews within ~1 week
2. May request changes or discussion
3. Once approved, maintainer merges
4. Changes typically released in next version

## Common Questions

**Q: Can I add dependency X?**
A: No runtime dependencies. Dev dependencies (eslint, prettier) are ok but should be optional (not required to run tests).

**Q: Why no coverage tool?**
A: Adds complexity and dependencies. We prefer comprehensive manual test cases.

**Q: Can I use TypeScript/Babel/webpack?**
A: No. We're vanilla JavaScript (ES2022+). Users love that tst "just works" without tooling.

**Q: My feature is useful but adds 100 LOC. Is that ok?**
A: Probably not. tst is intentionally minimal. Consider if the feature is essential, or if there's a simpler approach. Large features need strong justification.

**Q: How do I handle Node vs browser differences?**
A: Use feature detection:
```js
const isNode = typeof process !== 'undefined' && process.versions?.node
if (isNode) { /* Node code */ } else { /* Browser code */ }
```

## Getting Help

- **Questions**: Open a [discussion](https://github.com/dy/tst/discussions)
- **Bugs**: Open an [issue](https://github.com/dy/tst/issues)
- **AI assistance**: See [AGENTS.md](AGENTS.md) for guidelines

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](LICENSE)).

## Recognition

Contributors are listed in GitHub's contributor graph. Thank you for making tst better! 🎉
