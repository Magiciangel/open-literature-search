# Security Policy

## Reporting Security Issues

Please do not open a public issue for sensitive security reports.

Send a private report to the repository owner on GitHub:

```txt
https://github.com/Magiciangel
```

Include:

- A clear description of the issue
- Steps to reproduce
- Potential impact
- Suggested mitigation if you have one

## Secrets

API keys should be stored in `.env.local` or deployment environment variables. They should never be committed to the repository or exposed to browser-side code.
