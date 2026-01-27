# Security Policy

## Supported Versions

We provide security updates for the latest major version only.

| Version | Supported          |
| ------- | ------------------ |
| 9.x     | :white_check_mark: |
| < 9.0   | :x:                |

## Security Model

### Zero Dependencies = Minimal Attack Surface

**tst** has **zero runtime dependencies**. This significantly reduces the attack surface compared to testing frameworks with hundreds of transitive dependencies. You're only trusting:

1. The ~400 lines of code in this repository
2. The JavaScript runtime (Node.js or browser)

### What We Do

- ✓ No dependencies to introduce vulnerabilities
- ✓ Pure JavaScript - no native addons or binaries
- ✓ No network access or file system operations (beyond what Node.js tests naturally do)
- ✓ Minimal code surface (~400 LOC is auditable)
- ✓ Code is open source and reviewable

### What We Don't Do

- No authentication/authorization (not applicable - this is a testing library)
- No data storage or persistence
- No network communication
- No execution of untrusted code (tests are written by developers, not users)

## Reporting a Vulnerability

### When to Report

Please report a security vulnerability if you discover:

1. **Code execution vulnerabilities** - Ability to execute arbitrary code beyond test scope
2. **Prototype pollution** - Pollution of JavaScript prototypes that affects user code
3. **Information disclosure** - Leaking sensitive data from test environment
4. **Denial of service** - Crashes or hangs that can't be caught by normal error handling

### When NOT to Report

The following are NOT security issues:

- Test failures or incorrect assertions (file a bug report)
- Performance issues (file a bug report)
- Errors in test code itself (user error)
- Missing features (file a feature request)

### How to Report

**For security vulnerabilities**, please email the maintainer directly:

📧 **Email**: [Check GitHub profile @dy for current contact]

**Do NOT** open a public GitHub issue for security vulnerabilities.

### What to Include

Please include:

1. **Description** - Clear explanation of the vulnerability
2. **Impact** - What an attacker could do with this vulnerability
3. **Reproduction** - Minimal code to reproduce the issue
4. **Environment** - Node.js version, OS, tst version
5. **Suggested fix** - If you have ideas (optional)

Example:
```
Subject: [SECURITY] Prototype pollution in assertion comparison

Description: The deep equality check in `is()` can be exploited to pollute
Object.prototype when comparing specially crafted objects.

Impact: User test code could have __proto__ polluted, affecting application code.

Reproduction:
import { is } from 'tst/assert.js'
is({}, JSON.parse('{"__proto__":{"polluted":true}}'))
console.log({}.polluted) // should be undefined, but is true

Environment: Node.js 20.10.0, tst 9.2.1, macOS 14

Suggested fix: Add prototype check in deq() function
```

### Response Timeline

- **Acknowledgment**: Within 48-72 hours
- **Initial assessment**: Within 1 week
- **Fix timeline**: Depends on severity
  - Critical: Immediate (hours to days)
  - High: Within 1 week
  - Medium: Within 1 month
  - Low: Best effort

This is a volunteer-maintained project, but security issues are prioritized.

## Disclosure Policy

We follow **coordinated disclosure**:

1. You report the vulnerability privately
2. We confirm and develop a fix
3. We release a patched version
4. We publicly disclose the vulnerability (crediting you, if desired)

### Timeline

- **30 days** - Preferred timeline from report to public disclosure
- **90 days** - Maximum timeline (if fix is complex)

We'll work with you on the disclosure timeline. If you plan to publish, please give us reasonable notice.

## Security Updates

### How We Notify Users

Security fixes are released as:
- **Patch version** (9.2.2) for low severity
- **Minor version** (9.3.0) for medium severity
- **Major version** (10.0.0) for high/critical severity with breaking changes

We announce security releases via:
- GitHub Releases with `[SECURITY]` tag
- npm package update
- Git tags

### Staying Updated

To ensure you have security fixes:

```bash
# Check for updates
npm outdated tst

# Update to latest
npm update tst

# Or specify version
npm install tst@latest
```

Enable **Dependabot** in your repository to get automatic PRs for updates.

## Security Best Practices for Users

### Using tst Safely

1. **Pin versions** in package.json for production:
   ```json
   "devDependencies": {
     "tst": "9.2.1"
   }
   ```

2. **Review updates** before accepting (especially major versions)

3. **Run tests in isolation** if testing untrusted code

4. **Audit the code** - It's only ~400 lines, you can read it all

### Test Security

Remember that **test code runs with full permissions**:

```js
// ⚠️ Tests can access filesystem, network, environment
test('example', () => {
  // This has same permissions as your application
  fetch('https://api.example.com')
  fs.writeFileSync('/etc/passwd', 'bad')
})
```

- Don't run tests from untrusted sources
- Don't include credentials in test files (use environment variables)
- Use `.gitignore` to prevent committing test data with secrets

## Known Security Considerations

### Worker Threads (fork mode)

When using `test.fork()`, code runs in a Node.js Worker thread:
- Workers inherit Node.js permissions
- Workers can access filesystem and network
- Workers are isolated from shared memory but not from system resources

This is **not a security sandbox** - it's for test isolation, not security.

### Eval-like Behavior

The `test.fork()` feature serializes functions to strings and executes them in workers. This is intentional and documented, but be aware:
- Don't fork test code from untrusted sources
- Don't pass user input directly to forked tests

## Questions?

Security questions can be:
- Reported privately via email (for vulnerabilities)
- Asked in [GitHub Discussions](https://github.com/dy/tst/discussions) (for general questions)
- Asked in [GitHub Issues](https://github.com/dy/tst/issues) (for non-sensitive topics)

## Credits

We appreciate security researchers who help keep tst safe:

- *No vulnerabilities reported yet*

If you report a security issue, we'll credit you here (unless you prefer to remain anonymous).

---

**Last updated**: 2026-01-27
**Contact**: See @dy GitHub profile for current contact information
