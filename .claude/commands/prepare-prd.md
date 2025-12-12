---
description: "Scan for new PRD files and generate tasks using parallel Sonnet agents"
tags: [prd, tasks, automation]
---

# Prepare PRD - Task Generation Protocol

Scans for untracked PRD*.md files and launches 3-5 parallel Sonnet agents to generate tasks.

## Workflow

### Phase 1: Discovery
1. Read `prd.yml` (create if missing with existing PRDs marked complete)
2. Glob for PRD files in `documentation/PRDs/*.md` (exclude README.md)
3. Identify files not in prd.yml or with status `pending`/`attention-needed`

### Phase 2: Analysis (per PRD)
For each new PRD:
1. Read the PRD file
2. Extract epic sections (look for `## Feature:` or `@REQ-{EPIC}-*` patterns)
3. Group requirements by epic code

### Phase 3: Parallel Task Generation
Launch parallel Task agents with `model: sonnet`:

**Agent Assignment Strategy:**
- Parse PRD into epic groups
- Assign 2-3 epics per agent (max 5 agents)
- Each agent prompt includes:
  - The PRD sections for their assigned epics
  - Existing `tasks/index.yml` structure (for format reference)
  - Example task file from `tasks/` (for format reference)
  - Instructions to create: epic entry + individual task files

**Agent Output:**
Each agent must:
1. Add epic entry to `tasks/index.yml` under `epics:`
2. Create `tasks/{epic}/` directory
3. Create task files: `tasks/{epic}/{task-id}.md`
4. Follow existing format exactly (Description, Acceptance Criteria, Test Criteria in Gherkin, Dependencies, Files, References)

### Phase 4: Update Tracking
After all agents complete:
1. Update `prd.yml`:
   - Set status to `complete`
   - Add `processed_at` timestamp
   - List `epics_created`
2. Commit changes with message: `feat(tasks): generate tasks from {PRD-filename}`

## Error Handling
- If agent fails: mark PRD status as `attention-needed` with error note
- Re-run `/prepare-prd` to retry failed PRDs

## Instructions for Main Assistant

Execute this workflow:

1. **Discovery Phase**
   - Use Read tool on `prd.yml` (handle missing file)
   - Use Glob to find `documentation/PRDs/*.md` (exclude README.md)
   - Identify unprocessed PRDs (not in prd.yml or status is pending/attention-needed)
   - If no unprocessed PRDs found, report "All PRDs are already processed" and exit

2. **For each unprocessed PRD:**
   - Read the PRD file completely
   - Parse into epic sections by finding `@REQ-{EPIC}-*` requirement tags
   - Update prd.yml to mark the PRD as `in-progress`

3. **Launch parallel agents (3-5 agents):**
   Use Task tool with `model: sonnet` and `subagent_type: general-purpose`

   Distribute epics across agents (2-4 epics each). Each agent prompt should:
   - Include the specific PRD sections to process (copy the text)
   - Reference existing task format by reading `tasks/index.yml` and one example task file
   - Specify which epics the agent is responsible for
   - Include clear output expectations:
     - Add epic to tasks/index.yml
     - Create tasks/{epic}/ directory
     - Create task files with: Description, Acceptance Criteria, Test Criteria (Gherkin), Dependencies, Files, References

4. **Finalize:**
   - Update prd.yml status to `complete` with processed_at timestamp
   - Add epics_created list
   - Commit all changes: `feat(tasks): generate tasks from {PRD-filename}`
