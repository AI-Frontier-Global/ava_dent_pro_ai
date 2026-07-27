/*
# Make treatment plan fields optional for easier data entry

## Purpose
Reduces the burden on clinic staff by making most treatment plan fields optional.
The system now accepts partial data and fills in sensible defaults automatically,
so staff can create plans quickly without filling every field manually.

## Changes to treatment_plans table
- `title` is now nullable (was NOT NULL). Defaults to "خطة علاج" when omitted.
- `diagnosis` already nullable — unchanged.

## Changes to treatment_steps table
- `title` is now nullable (was NOT NULL). Defaults to "خطوة علاج" when omitted.
- `description` already nullable — unchanged.
- `cost` already has a default of 0 — unchanged.
- `due_date` already nullable — unchanged.

## Security
- No RLS policy changes. Existing owner-scoped policies remain intact.
- No new tables.

## Notes
1. This is a non-destructive migration — only relaxes NOT NULL constraints.
2. Existing data is unaffected.
3. Frontend will supply defaults when users leave fields blank.
*/

ALTER TABLE treatment_plans ALTER COLUMN title DROP NOT NULL;
ALTER TABLE treatment_steps ALTER COLUMN title DROP NOT NULL;
