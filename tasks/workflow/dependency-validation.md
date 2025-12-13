# Enhanced Task Dependency Validation

## Description

Enhance the existing `scripts/validate-task-dependencies.js` script to provide better dependency validation, visualization, and readiness reporting for task selection.

## Dependencies

- `workflow/task-generation` - Task generation creates dependencies to validate

## Acceptance Criteria

- [ ] Validates all task dependencies are satisfied before marking task as ready
- [ ] Shows which specific dependencies are blocking a task
- [ ] Groups ready tasks by complexity (low/medium/high)
- [ ] Provides clear error messages for circular dependencies
- [ ] Validates that dependency task IDs exist
- [ ] Can check a specific task's readiness
- [ ] Reports missing or invalid dependencies
- [ ] Exit code 1 if validation errors found

## Test Criteria

```gherkin
Feature: Task Dependency Management
	As an engineer
	I want automated dependency validation
	So that I know which tasks are ready to work on

	@REQ-WF-003
	Scenario: Validate task is ready
		Given a task has dependencies listed
		When I check task readiness
		Then the system should verify all dependencies are complete
		And show which dependencies are blocking
```

## Implementation

### 1. Enhance Existing Script

Update `scripts/validate-task-dependencies.js`:

```javascript
#!/usr/bin/env node

import fs from 'node:fs';
import yaml from 'yaml';

const COLORS = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	gray: '\x1b[90m',
};

/**
 * Load task index
 */
function loadTaskIndex() {
	const content = fs.readFileSync('tasks/index.yml', 'utf-8');
	return yaml.parse(content);
}

/**
 * Flatten all tasks with epic prefix
 */
function flattenTasks(index) {
	const tasks = new Map();

	for (const [epicName, epic] of Object.entries(index.epics)) {
		for (const task of epic.tasks || []) {
			const fullId = `${epicName}/${task.id}`;
			tasks.set(fullId, {
				...task,
				epic: epicName,
				fullId,
			});
		}
	}

	return tasks;
}

/**
 * Validate dependencies exist
 */
function validateDependencies(tasks) {
	const errors = [];

	for (const [taskId, task] of tasks) {
		for (const depId of task.depends_on || []) {
			if (!tasks.has(depId)) {
				errors.push({
					task: taskId,
					error: `Dependency not found: ${depId}`,
				});
			}
		}
	}

	return errors;
}

/**
 * Detect circular dependencies
 */
function detectCircularDeps(tasks) {
	const errors = [];
	const visiting = new Set();
	const visited = new Set();

	function visit(taskId, path = []) {
		if (visiting.has(taskId)) {
			errors.push({
				task: taskId,
				error: `Circular dependency: ${path.join(' → ')} → ${taskId}`,
			});
			return;
		}

		if (visited.has(taskId)) {
			return;
		}

		visiting.add(taskId);
		const task = tasks.get(taskId);

		if (task) {
			for (const depId of task.depends_on || []) {
				visit(depId, [...path, taskId]);
			}
		}

		visiting.delete(taskId);
		visited.add(taskId);
	}

	for (const taskId of tasks.keys()) {
		visit(taskId);
	}

	return errors;
}

/**
 * Check if task is ready (all dependencies complete)
 */
function isTaskReady(task, tasks) {
	if (task.done) {
		return { ready: false, reason: 'already complete' };
	}

	if (task.requires === 'human') {
		return { ready: false, reason: 'requires human action' };
	}

	const blockedBy = [];

	for (const depId of task.depends_on || []) {
		const dep = tasks.get(depId);
		if (!dep) {
			blockedBy.push(`${depId} (NOT FOUND)`);
		} else if (!dep.done) {
			blockedBy.push(depId);
		}
	}

	if (blockedBy.length > 0) {
		return {
			ready: false,
			reason: 'blocked by dependencies',
			blockedBy,
		};
	}

	return { ready: true };
}

/**
 * Find ready tasks grouped by complexity
 */
function findReadyTasks(tasks) {
	const ready = {
		low: [],
		medium: [],
		high: [],
	};

	for (const [taskId, task] of tasks) {
		const status = isTaskReady(task, tasks);
		if (status.ready) {
			ready[task.complexity || 'medium'].push(taskId);
		}
	}

	return ready;
}

/**
 * Check specific task
 */
function checkTask(taskId, tasks) {
	const task = tasks.get(taskId);

	if (!task) {
		console.log(`${COLORS.red}✗ Task not found: ${taskId}${COLORS.reset}\n`);
		return false;
	}

	console.log(`${COLORS.blue}Task: ${taskId}${COLORS.reset}`);
	console.log(`  Name: ${task.name}`);
	console.log(`  Complexity: ${task.complexity}`);
	console.log(`  Done: ${task.done}`);

	if (task.requires === 'human') {
		console.log(`  ${COLORS.yellow}Requires: Human action${COLORS.reset}`);
	}

	console.log(`\nDependencies:`);
	if (!task.depends_on || task.depends_on.length === 0) {
		console.log(`  ${COLORS.gray}None${COLORS.reset}`);
	} else {
		for (const depId of task.depends_on) {
			const dep = tasks.get(depId);
			if (!dep) {
				console.log(`  ${COLORS.red}✗ ${depId} (NOT FOUND)${COLORS.reset}`);
			} else if (dep.done) {
				console.log(`  ${COLORS.green}✓ ${depId}${COLORS.reset}`);
			} else {
				console.log(`  ${COLORS.yellow}○ ${depId} (pending)${COLORS.reset}`);
			}
		}
	}

	const status = isTaskReady(task, tasks);
	console.log(`\nStatus:`);

	if (task.done) {
		console.log(`  ${COLORS.green}✓ Complete${COLORS.reset}`);
		if (task.commit) {
			console.log(`  Commit: ${task.commit}`);
		}
	} else if (status.ready) {
		console.log(`  ${COLORS.green}✓ Ready to work on${COLORS.reset}`);
	} else {
		console.log(`  ${COLORS.yellow}○ ${status.reason}${COLORS.reset}`);
		if (status.blockedBy) {
			console.log(`\nBlocked by:`);
			for (const blocker of status.blockedBy) {
				console.log(`  - ${blocker}`);
			}
		}
	}

	console.log();
	return status.ready;
}

/**
 * Main validation
 */
function main() {
	const args = process.argv.slice(2);

	console.log('Loading tasks/index.yml...\n');
	const index = loadTaskIndex();
	const tasks = flattenTasks(index);

	console.log(`Found ${tasks.size} tasks across ${Object.keys(index.epics).length} epics\n`);

	// If specific task requested, check it
	if (args.length > 0) {
		const taskId = args[0];
		const ready = checkTask(taskId, tasks);
		process.exit(ready ? 0 : 1);
	}

	// Validate dependencies exist
	console.log('Validating dependencies...');
	const depErrors = validateDependencies(tasks);

	if (depErrors.length > 0) {
		console.log(`${COLORS.red}✗ Found ${depErrors.length} dependency errors:${COLORS.reset}\n`);
		for (const err of depErrors) {
			console.log(`  ${err.task}: ${err.error}`);
		}
		console.log();
	} else {
		console.log(`${COLORS.green}✓ All dependencies exist${COLORS.reset}\n`);
	}

	// Check for circular dependencies
	console.log('Checking for circular dependencies...');
	const circularErrors = detectCircularDeps(tasks);

	if (circularErrors.length > 0) {
		console.log(`${COLORS.red}✗ Found ${circularErrors.length} circular dependencies:${COLORS.reset}\n`);
		for (const err of circularErrors) {
			console.log(`  ${err.error}`);
		}
		console.log();
	} else {
		console.log(`${COLORS.green}✓ No circular dependencies${COLORS.reset}\n`);
	}

	// Find ready tasks
	const ready = findReadyTasks(tasks);
	const totalReady = ready.low.length + ready.medium.length + ready.high.length;

	console.log(`${COLORS.green}Ready tasks: ${totalReady}${COLORS.reset}\n`);

	if (ready.low.length > 0) {
		console.log(`${COLORS.green}Low complexity (${ready.low.length}):${COLORS.reset}`);
		for (const taskId of ready.low) {
			console.log(`  - ${taskId}`);
		}
		console.log();
	}

	if (ready.medium.length > 0) {
		console.log(`${COLORS.blue}Medium complexity (${ready.medium.length}):${COLORS.reset}`);
		for (const taskId of ready.medium) {
			console.log(`  - ${taskId}`);
		}
		console.log();
	}

	if (ready.high.length > 0) {
		console.log(`${COLORS.yellow}High complexity (${ready.high.length}):${COLORS.reset}`);
		for (const taskId of ready.high) {
			console.log(`  - ${taskId}`);
		}
		console.log();
	}

	// Summary
	const hasErrors = depErrors.length > 0 || circularErrors.length > 0;
	if (hasErrors) {
		console.log(`${COLORS.red}✗ Validation failed${COLORS.reset}`);
		process.exit(1);
	} else {
		console.log(`${COLORS.green}✓ Validation passed${COLORS.reset}`);
		console.log(`\nUsage:`);
		console.log(`  bun scripts/validate-task-dependencies.js                 # Show all ready tasks`);
		console.log(`  bun scripts/validate-task-dependencies.js workflow/prd-preparation  # Check specific task`);
	}
}

main();
```

### 2. Add Script Aliases

Update `package.json`:

```json
{
	"scripts": {
		"tasks:validate": "bun scripts/validate-task-dependencies.js",
		"tasks:check": "bun scripts/validate-task-dependencies.js"
	}
}
```

### 3. Usage Examples

```bash
# Validate all tasks and show ready tasks
bun run tasks:validate

# Check if specific task is ready
bun run tasks:validate workflow/prd-preparation

# Use in CI/CD
bun run tasks:validate || echo "Task dependencies invalid!"
```

### 4. Integration with Task Selection

Before starting work on a task:

```bash
# Check task readiness
bun run tasks:validate invitations/invitation-api

# Output shows:
# - Task status (done/ready/blocked)
# - Dependency tree with status
# - Specific blockers if any
```

## Files to Create/Modify

**Modify:**
- `scripts/validate-task-dependencies.js` - Enhanced validation logic
- `package.json` - Add convenience scripts

## Notes

- This enhances the existing script, doesn't replace it
- Maintains backward compatibility with current usage
- Color output makes status clear at a glance
- Exit codes enable CI/CD integration

## References

- documentation/PRDs/workflow.md (REQ-WF-003)
- scripts/validate-task-dependencies.js (current implementation)
- tasks/index.yml (dependency source of truth)
