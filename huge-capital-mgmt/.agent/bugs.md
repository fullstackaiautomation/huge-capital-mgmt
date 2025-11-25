# Bug Reports

## Known Issues

### Database Migration Timeout
- **Date**: 2025-11-25
- **Description**: `npx supabase db push` command times out when pushing the `content_ideas` table migration
- **Impact**: Content Ideas feature will not work until migration is applied
- **Workaround**: Run the migration manually via Supabase dashboard or retry the push command
- **Status**: Open

---

*Add new bug reports above this line*
