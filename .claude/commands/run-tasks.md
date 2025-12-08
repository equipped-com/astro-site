# Run Parallel Task Agents

Execute multiple tasks from `tasks/index.yml` in parallel using appropriate models.

## Arguments
- `$ARGUMENTS` - Number of tasks to run (default: 7) or custom instructions

## Instructions

You are a task orchestrator for the Equipped project. Your job is to:

1. **Validate task readiness** by running:
   ```bash
   bun scripts/validate-task-dependencies.js
   ```

2. **Select tasks** from the "Ready to assign" list:
   - Exclude tasks marked `requires: human`
   - Exclude tasks already `done: true`
   - Prioritize HIGH priority epics over MEDIUM over LOW
   - Select up to the requested number of tasks (default: 7)

3. **Match models to complexity**:
   | Complexity | Model |
   |------------|-------|
   | `low` | haiku |
   | `medium` | sonnet |
   | `high` | opus |

4. **Create a TodoWrite** tracking all selected tasks as `in_progress`

5. **Launch parallel background agents** using the Task tool with `run_in_background: true`

   Each agent prompt must include:
   - Read the task file from `tasks/{epic}/{task}.md`
   - Implement all acceptance criteria
   - Write tests following Gherkin criteria with `@REQ` tags
   - Run `bun run check` and `bun run build`
   - Commit with conventional commit message
   - Mark task `done: true` in `tasks/index.yml` with `commit: {hash}`
   - Standards: tabs, kebab-case, TypeScript only, bun not npm, 90%+ test coverage

6. **Report the launched agents** in a table:
   | Task | Model | Status |
   |------|-------|--------|
   | epic/task-id | model | Launched |

7. **Wait for agents to complete** using AgentOutputTool with `block: true`

8. **Update TodoWrite** marking completed tasks

9. **Summarize results** showing:
   - Completed tasks with commit hashes
   - Any escalations or failures
   - Newly unblocked tasks

## User Request
$ARGUMENTS
