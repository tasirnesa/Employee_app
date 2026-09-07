# ERP Data Migration Checklist

Generated from coop_erp_latest.sql on 2026-07-17. This pack includes 198 physical-table CSV templates and matching Excel worksheets. Each template has a schema-aligned header plus one illustrative sample row.

## Recommended sequence

1. **Set up migration rules** — decide cutover date, source ownership, ID cross-reference strategy, duplicate policy, and reconciliation tolerances.
2. **Load master/configuration data** — load the objects shown in the Master Data worksheet, following dependency order; validate codes before records that reference them.
3. **Load core masters** — accounts, business partners, materials, employees, bank accounts, fixed assets, and organisational assignments.
4. **Load opening balances** — stock, AP/AR, GR/IR, asset, and GL balances as at the agreed cutover date.
5. **Load open documents** — procurement documents, service/inventory movements, and financial open documents, keeping source document references.
6. **Load security/workflow selectively** — normally recreate users/roles/workflow configuration; do not bulk-load audit logs or generated histories unless specifically required.
7. **Reconcile and sign off** — record counts, key totals, stock quantities/value, AP/AR aging, GL trial balance, and exception disposition by object.

## CSV conventions

- Headers reproduce the physical table columns in the SQL schema.
- Required columns are marked Y in the Excel templates and Schema Catalog.
- Values like REF-... in samples are placeholders for a valid referenced record; map actual legacy keys to target UUIDs/keys before import.
- Exclude database-generated audit columns (created_at, updated_at, etc.) only if your import service supplies them; retain them when doing direct database loads.
- Prefer business codes in your staging/cross-reference process, then resolve to system IDs during import.

## Load controls

- Validate required fields, data types, code uniqueness, and foreign-key references before load.
- Load parent objects before child objects shown in Depends on.
- Test in a non-production environment, reconcile, then repeat with final cutover data.
- Retain the source extract, load log, rejected-row file, and reconciliation evidence for each run.

## Scope note

The pack exposes every physical table so the technical migration team has full coverage. Tables labelled **Derived / transactional history** are usually not initial-load candidates; confirm their inclusion with the business process owner and technical lead.
