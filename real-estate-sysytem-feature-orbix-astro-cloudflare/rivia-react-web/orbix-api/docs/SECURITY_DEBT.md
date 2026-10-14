# Security Debt

Recorded during Phase 2 of the Orbix Modular Monolith migration.

## npm audit --omit=dev

- 16 moderate vulnerabilities.
- 4 high vulnerabilities.

These issues are deferred temporarily and must be reviewed before Staging.
Production deployment is blocked until the vulnerabilities are closed or a documented mitigation is approved.
Staging deployment is also blocked until these vulnerabilities are reviewed.

Do not use `npm audit fix --force` without an explicit dependency upgrade plan because the suggested fixes include breaking framework upgrades.

The Firebase environment separation work in Phase 3-B1 does not close this debt.
