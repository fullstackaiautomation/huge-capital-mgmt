# Deal Pipeline Fix Notes – 2025-11-13

## Summary
- Ensured Google Drive uploads run for both OpenAI and Anthropic parsing paths without double-execution.
- Hardened deal persistence by validating extracted data, handling partial owner/address data, and linking stored Drive folder URLs.
- Wrapped lender matching invocation in granular error handling so deal saves succeed even if recommendations fail, with user-facing warnings.

## Key Changes
- Updated `parse-deal-documents` edge function to normalize responses, persist uploads once, and propagate Drive metadata.
- Refined `NewDealModal` workflow to surface agent log IDs, auto-link Drive folders, and gracefully handle matching failures.
- Added optional warnings for unmatched lender recommendations in the modal success state.

## Validation
- `npm run build`
