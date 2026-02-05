# AI Agent Guidelines 

**tst** is a minimal testing library. The core philosophy is "tests without efforts":

- **Zero dependencies** - No npm packages, no build step, no tooling required
- **Minimal footprint** - Target ~400 LOC total (currently: tst.js ~435, assert.js ~160)
- **Vanilla ESM** - Pure JavaScript modules, no transpilation
- **Cross-platform** - Works identically in Node.js and browsers
- **No magic** - Explicit, predictable behavior

### What This Means for AI Assistance

❌ **DO NOT:**
- Add any npm dependencies (even dev dependencies should be minimal)
- Introduce build steps, bundlers, or transpilation
- Add frameworks, abstractions, or "enterprise patterns"
- Create configuration that requires tooling to run tests
- Add features that only work in Node.js OR browsers (must work in both)
- Increase LOC significantly without removing equivalent code elsewhere

✅ **DO:**
- Keep code minimal and readable
- Preserve zero-dependency runtime
- Maintain cross-platform compatibility
- Use vanilla JavaScript features (ES2022+)
- Prefer simplicity over features
- Match existing code style

## Codebase Architecture

### File Structure

```
tst/
├── tst.js         # Test runner + formatters (~435 LOC)
├── assert.js      # Standalone assertions (~160 LOC)
├── tst.d.ts       # TypeScript definitions
├── test.js        # Meta-tests (tests for tst itself)
├── demo.js        # Usage examples
└── index.html     # Browser demo page
```

### Module Boundaries

1. **assert.js** - Completely standalone, no dependencies on tst.js
   - Exports: `ok`, `is`, `not`, `any`, `same`, `throws`, `rejects`, `almost`, `pass`, `fail`
   - Hook: `onPass(fn)` for test runner integration
   - Each assertion returns `true` or throws `Assertion` error

2. **tst.js** - Test runner and output formatters
   - Imports all assertions from assert.js
   - Exports: `test` (default), `run`, `formats`
   - Auto-runs tests after 100ms idle (can be disabled with explicit `run()`)
   - Formats: `pretty` (default, colored), `tap` (parseable)

3. **tst.d.ts** - TypeScript definitions (maintain in sync with JS)

### Design Patterns

- **Stateless assertions** - Work anywhere (inside/outside tests)
- **Functional style** - Minimal side effects, pure functions where possible
- **Hook-based integration** - `onPass()` hook instead of tight coupling
- **Progressive enhancement** - Core works, formats add presentation

## Common Tasks

### Adding a New Assertion

1. Add to [assert.js](assert.js) (keep standalone, return true or throw)
2. Add type definition to [tst.d.ts](tst.d.ts)
3. Add meta-tests to [test.js](test.js)
4. Add example to [demo.js](demo.js)
5. Document in [README.md](README.md)

Example:
```js
// In assert.js
export function myAssertion(value, msg = 'should pass') {
  if (condition) return report('myAssertion', msg)
  throw new Assertion({ operator: 'myAssertion', message: msg, actual: value })
}
```

### Modifying Test Runner Behavior

- Edit [tst.js](tst.js) - look for the `run()` function
- Ensure changes work in both Node.js and browser
- Add tests in [test.js](test.js) that spawn subprocess to verify

### Adding Output Formats

- Add to `formats` object in [tst.js](tst.js)
- Implement interface: `testStart`, `testSkip`, `assertion`, `testPass`, `testFail`, `summary`
- Test with `TST_FORMAT=yourformat npm test`

## Testing Strategy

### Meta-Testing Approach

We test tst by spawning it as a subprocess and verifying:
- Exit codes (0 = pass, 1 = fail)
- Output format (stdout matches expected patterns)
- Behavior (async, timeout, modifiers work correctly)

See [test.js](test.js:18-68) for the `run()` helper that spawns tests.

### Test Coverage

- Every assertion must have pass and fail tests
- Every modifier (`skip`, `only`, `todo`, `mute`, `demo`, `fork`) must be tested
- Every configuration option must be tested
- Cross-platform: tests must pass on Node 18, 20, 22

**No coverage tools** - We use comprehensive manual test cases instead of coverage metrics. If you can think of an edge case, add a test.

## Code Style

### Formatting

- 2 spaces, no tabs
- Single quotes for strings
- No semicolons
- Max line length ~100 chars
- Use arrow functions for callbacks

### Naming Conventions

- Functions: camelCase (`ok`, `is`, `runTest`)
- Constants: UPPER_SNAKE_CASE for colors (`GREEN`, `RED`)
- Private helpers: camelCase without prefix (just don't export)
- Types: PascalCase (`Assertion`, `TestOptions`)

### Comments

- Use JSDoc for public APIs
- Explain "why" not "what" in comments
- Comment non-obvious behavior (e.g., browser vs Node differences)

## Platform Differences

Handle Node.js vs browser:
```js
const isNode = typeof process !== 'undefined' && process.versions?.node

if (isNode) {
  // Node-specific code
} else {
  // Browser-specific code
}
```

Common differences:
- **Logging**: Node uses ANSI colors, browser uses console CSS
- **Imports**: Node can use Worker threads, browser uses Web Workers
- **Process**: Node has `process.exit()`, browser doesn't
- **Env vars**: Node has `process.env`, browser uses URL params

## Questions?

When unsure:
1. Check [todo.md](todo.md) for architectural decisions and history
2. Look at similar existing functionality
3. Ask via GitHub issue before implementing large changes
4. Default to simpler solution

## Version History Context

- v7.x: Major refactor to decouple assertions from runner
- v8.x: Added fork mode for worker thread isolation
- v9.x: Added retry option, improved import flag inheritance

The library is considered feature-complete. New features should be rare and well-justified.
