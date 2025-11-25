# Architecture Decisions Log

## 2025-11-25

### ADR-001: Content Ideas Table Structure

**Context**: Need to store AI-generated content ideas for each person based on their content pillars.

**Decision**: Created `content_ideas` table with:
- `id` (UUID, primary key)
- `person_name` (TEXT) - Links to content profile
- `platform` (TEXT) - Target platform for the idea
- `idea_title` (TEXT) - Short hook/title
- `idea_description` (TEXT) - Longer description
- `content_pillar` (TEXT) - Which pillar this maps to
- `status` (TEXT) - pending/approved/dismissed/used
- `generated_by` (TEXT) - 'ai' or 'manual'
- `post_id` (UUID, FK) - Links to post if idea was used
- Timestamps for created, updated, dismissed, used

**Rationale**:
- Separate table allows tracking idea lifecycle independently
- Status field enables filtering by approval state
- `post_id` foreign key creates traceability from idea to published post
- `content_pillar` enables grouping ideas by topic area

---

### ADR-002: Idea Generation Strategy

**Context**: User wants AI to auto-generate 10 content ideas per person.

**Decision**: Pre-defined idea templates mapped to content pillars:
- Each content pillar has 5 template ideas
- Ideas are distributed across pillars proportionally
- Templates use placeholders like `[Client]`, `[Industry]` for customization

**Rationale**:
- Provides consistent, high-quality idea suggestions
- Templates aligned with proven content strategies
- Placeholders encourage personalization
- Future enhancement: Can be replaced with actual AI API calls

---

### ADR-003: Two-Column Editor Layout

**Context**: Users wanted to see platform previews while editing content.

**Decision**: Implemented responsive two-column grid layout:
- Left column: Content editor, metadata, scheduling
- Right column: Live platform preview
- Mobile: Single column (stacked)
- Desktop: Side-by-side (`lg:grid-cols-2`)

**Rationale**:
- Immediate visual feedback reduces post-publish surprises
- Platform-specific previews show character limits, formatting
- Responsive design ensures usability on all devices

---

*Add new decisions above this line*
