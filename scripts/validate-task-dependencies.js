#!/usr/bin/env node

/**
 * Task Dependency Validator
 *
 * Validates that all task dependencies are satisfied before assigning tasks to agents.
 *
 * Usage:
 *   node scripts/validate-task-dependencies.js                    # Check all tasks
 *   node scripts/validate-task-dependencies.js api/device-crud    # Check specific task
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load tasks/index.yml
const indexPath = path.join(__dirname, '..', 'tasks', 'index.yml');
const indexContent = fs.readFileSync(indexPath, 'utf8');
const index = yaml.load(indexContent);

// Build lookup map: {epic}/{task-id} -> task
const taskMap = new Map();
for (const [epicId, epic] of Object.entries(index.epics)) {
	for (const task of epic.tasks) {
		const taskKey = `${epicId}/${task.id}`;
		taskMap.set(taskKey, { ...task, epicId });
	}
}

function validateTask(taskKey) {
	const task = taskMap.get(taskKey);
	if (!task) {
		return { valid: false, error: `Task not found: ${taskKey}` };
	}

	const issues = [];

	// Check if task is already done
	if (task.done) {
		return { valid: true, message: `✓ Task ${taskKey} is already completed` };
	}

	// Check if task requires human action
	if (task.requires === 'human') {
		return {
			valid: false,
			blocking: true,
			error: `Task requires human action: ${taskKey}`,
			message: `Manual steps needed before agent can work on this task`
		};
	}

	// Check dependencies
	if (!task.depends_on || task.depends_on.length === 0) {
		return { valid: true, message: `✓ Task ${taskKey} has no dependencies` };
	}

	const blockedDependencies = [];
	const completedDependencies = [];

	for (const depKey of task.depends_on) {
		const depTask = taskMap.get(depKey);
		if (!depTask) {
			issues.push(`Unknown dependency: ${depKey}`);
			blockedDependencies.push(depKey);
		} else if (!depTask.done) {
			blockedDependencies.push(depKey);
		} else {
			completedDependencies.push(depKey);
		}
	}

	if (blockedDependencies.length > 0) {
		return {
			valid: false,
			blocking: true,
			error: `Task ${taskKey} has ${blockedDependencies.length} incomplete dependencies:`,
			dependencies: {
				blocked: blockedDependencies,
				completed: completedDependencies
			},
			escalation_reason: task.escalation_reason
		};
	}

	return {
		valid: true,
		message: `✓ Task ${taskKey} can be started (all dependencies satisfied)`,
		dependencies: completedDependencies
	};
}

function listReadyTasks(complexity = null) {
	const ready = [];
	const blocked = [];

	for (const [taskKey, task] of taskMap) {
		if (task.done || task.requires === 'human') continue;
		if (complexity && task.complexity !== complexity) continue;

		const validation = validateTask(taskKey);
		if (validation.valid) {
			ready.push({ taskKey, task, validation });
		} else {
			blocked.push({ taskKey, task, validation });
		}
	}

	return { ready, blocked };
}

function formatOutput(validation, taskKey) {
	const lines = [];

	if (validation.message) {
		lines.push(validation.message);
	}

	if (validation.error) {
		lines.push(`✗ ${validation.error}`);
	}

	if (validation.dependencies) {
		const { blocked, completed } = validation.dependencies;

		if (completed && completed.length > 0) {
			lines.push(`  ✓ Completed dependencies (${completed.length}):`);
			for (const dep of completed) {
				lines.push(`    - ${dep}`);
			}
		}

		if (blocked && blocked.length > 0) {
			lines.push(`  ✗ Blocked dependencies (${blocked.length}):`);
			for (const dep of blocked) {
				lines.push(`    - ${dep}`);
			}
		}
	}

	if (validation.escalation_reason) {
		lines.push(`  Escalation reason: ${validation.escalation_reason}`);
	}

	return lines.join('\n');
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
	// Show summary
	console.log('📋 Task Dependency Validation\n');

	const { ready, blocked } = listReadyTasks();

	console.log(`📊 Summary:`);
	console.log(`  Total tasks: ${taskMap.size}`);
	console.log(`  Ready to assign: ${ready.length}`);
	console.log(`  Blocked by dependencies: ${blocked.length}`);

	if (ready.length > 0) {
		console.log(`\n✅ Ready tasks by complexity:`);
		const byComplexity = {};
		for (const { taskKey, task } of ready) {
			if (!byComplexity[task.complexity]) byComplexity[task.complexity] = [];
			byComplexity[task.complexity].push(taskKey);
		}

		for (const complexity of ['low', 'medium', 'high']) {
			if (byComplexity[complexity]) {
				console.log(`\n  ${complexity.toUpperCase()}:`);
				for (const taskKey of byComplexity[complexity]) {
					const task = taskMap.get(taskKey);
					console.log(`    - ${taskKey} (${task.name})`);
				}
			}
		}
	}

	if (blocked.length > 0) {
		console.log(`\n❌ Blocked tasks:`);
		for (const { taskKey, validation } of blocked.slice(0, 10)) {
			console.log(`  - ${taskKey}`);
			if (validation.dependencies?.blocked) {
				for (const dep of validation.dependencies.blocked) {
					console.log(`    └─ waiting for: ${dep}`);
				}
			}
		}
		if (blocked.length > 10) {
			console.log(`  ... and ${blocked.length - 10} more`);
		}
	}
} else {
	// Validate specific task
	const taskKey = args[0];
	const validation = validateTask(taskKey);

	console.log(`\n🔍 Task: ${taskKey}\n`);
	console.log(formatOutput(validation, taskKey));

	if (!validation.valid && validation.blocking) {
		console.log(`\n⚠️  ESCALATION NEEDED: ${taskKey}`);
		console.log(`   Reason: ${validation.error}`);
		process.exit(1);
	}

	process.exit(validation.valid ? 0 : 1);
}
