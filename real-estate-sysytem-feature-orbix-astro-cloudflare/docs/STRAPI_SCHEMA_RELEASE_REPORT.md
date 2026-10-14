# Orbix Strapi Schema Release Report

## Production Source Proof

The Railway-linked project was inspected with the local Railway CLI from `orbix-cms`:

- Project: `orbix-development`
- Environment: `production`
- Service: `orbix-cms`
- Service URL: `https://orbix-cms-production.up.railway.app`
- Status: Online
- Database: Railway Postgres
- Git remote: `https://gitlab.com/rivia-llc-group/real-estate-sysytem.git`

Railway CLI verification on 2026-09-10 returned `source: null`,
`rootDirectory: null`, and `watchPatterns: []` for the latest `orbix-cms`
deployment. Therefore the service branch and Strapi root directory cannot be
proven from the linked Railway service as currently configured. The deployed
service appears to have been uploaded as a snapshot rather than being
connected to a Git branch. No local Cloudflare Pages configuration exposes the
requested watch path `astrowind-main/astrowind-main/*`; it remains unverified
until confirmed in the Pages project settings.

The PostgreSQL resource is online and has a ready volume, but Railway CLI
exposes no backup/snapshot record for it. A recent database backup is therefore
not confirmed.

The excluded `*backup*` and experimental directories were not used. This local
`orbix-cms` directory is the only schema source prepared for that linked service.

## Production-to-Local Diff

Production schema metadata is not exposed through the public content API or the
read-only token. The comparison therefore uses the live API response contract,
the Railway-linked service, and the local Strapi schema files. The live Homepage
response confirmed the existing generic section fields and `sections.generic-section`
as the dynamic-zone component.

| Area | Production observed | Local release change | Compatibility |
| --- | --- | --- | --- |
| Homepage/Page sections | `sections.generic-section` dynamic zone | No component replacement; Page also gains optional `path` | Additive |
| Generic section | Existing copy, media, items, pattern, animation and CTA fields | Adds colors, separator, speed enum, direction, pause, mobile behavior, aria label, watermark controls | Additive |
| Generic section animation | `none`, `fade`, `slide`, `scale` | Retains all four and adds `static`, `marquee` | Additive |
| Section item | Existing title, copy, URL, string icon and image fields | Adds non-repeatable `iconData: shared.icon` and single-image `iconMedia`; retains string icon | Additive |
| Shared icon | Not present in the local/production contract | Adds `name`, `key`, single-image `asset`, `alternativeText`, `category` | Additive |
| Media constraints | Existing media relations unchanged | New icon/watermark relations are single image; watermark opacity is decimal `0..1` | Additive |

No fields were deleted, renamed, or removed from an existing enumeration. No
published Production record was modified by this schema preparation.

## Files For Publication

- `orbix-cms/src/components/sections/generic-section.json`
- `orbix-cms/src/components/sections/section-item.json`
- `orbix-cms/src/components/shared/icon.json`
- `orbix-cms/src/api/page/content-types/page/schema.json`

The `orbix-cms/package-lock.json` change is dependency-install metadata only and
does not alter the schema contract.

## Local Verification

- JSON schema parsing: passed, including BOM-safe parsing.
- Strapi admin build: passed with direct Strapi CLI invocation.
- TypeScript check: passed with `tsc --noEmit`.
- Node environment: `F:\node.exe` is Node 24.18.0; no Node 22 executable was
  available on the host. The build passed, but publication must be rerun with
  the declared Node 22 runtime before release.
- `npm install` initially failed while compiling `better-sqlite3`; dependencies
  were then installed with `--ignore-scripts` for the admin build/check. This is
  a local tooling limitation and is not a Railway deployment result.

## Proposed Publication Plan

1. Create a Railway Postgres backup/snapshot and record its timestamp and restore point.
2. Publish only the four schema files listed above through the verified `orbix-cms` service source.
3. Run the Strapi schema/admin build in the deployment environment using Node 22.
4. Restart the `orbix-cms` service and rebuild the Astro consumer after schema availability is confirmed.
5. Verify API health, Dynamic Zone loading, single-image constraints, and existing published content.
6. Roll back by restoring the Railway Postgres snapshot and redeploying the previous known-good `orbix-cms` revision if migration or startup checks fail.

This report prepares the release only. No Railway deployment, restart, database
backup, commit, or push was executed. Release is blocked until the Railway Git
source/branch/root directory, recent PostgreSQL backup, and Node 22 runner are
confirmed.
