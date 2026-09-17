# Security Policy

## Supported Versions

| Version                                            | Supported                          |
| -------------------------------------------------- | ---------------------------------- |
| Latest stable release                              | Yes                                |
| Older releases                                     | No                                 |
| Development branches (`develop`, feature branches) | No — not stable supported releases |

We do not publish fixed end-of-life dates for older versions at this time.

## Reporting a Vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

If [Private vulnerability reporting](https://docs.github.com/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
is enabled for this repository, use **GitHub → Security → Report a vulnerability**.

If private reporting is not available, open a minimal public issue asking for
a private contact channel — do not include exploit details in public.

## What to Include

- Affected version or commit
- Steps to reproduce
- Impact assessment
- Relevant environment details (PHP, Laravel, browser, deployment)
- Suggested remediation, if known

## Response Process

Maintainers will acknowledge reports when possible and prioritize confirmed
issues affecting supported releases. Response times depend on severity and
maintainer availability; no specific SLA is guaranteed.

## Consumer Responsibility

Starter kits are starting points, not finished production systems. You remain
responsible for:

- Keeping dependencies updated
- Protecting secrets and environment variables
- HTTPS in production
- Session and cookie configuration
- Sanctum stateful domain and CORS settings
- Mail and infrastructure security
- Application-specific authorization policies
- Security review of code you add on top of the kit
- Running dependency audits (`composer audit`, `npm audit`) in your environment
