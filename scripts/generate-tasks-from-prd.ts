#!/usr/bin/env bun

/**
 * Task Generation from PRD
 *
 * Automatically extracts tasks from PRD requirements and generates task files.
 *
 * Usage:
 *   bun scripts/generate-tasks-from-prd.ts <prd-file> <epic>
 *   bun scripts/generate-tasks-from-prd.ts documentation/PRDs/workflow.md workflow
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

interface Requirement {
	id: string;
	title: string;
	gherkin: string;
	complexity: 'low' | 'medium' | 'high';
	dependencies: string[];
}

interface Task {
	id: string;
	name: string;
	file: string;
	done: boolean;
	complexity: 'low' | 'medium' | 'high';
	depends_on: string[];
	requires?: 'human';
}

interface Epic {
	name: string;
	description: string;
	priority: 'low' | 'medium' | 'high';
	tasks: Task[];
}

interface TaskIndex {
	version: number;
	updated: string;
	epics: Record<string, Epic>;
}

/**
 * Parse PRD markdown to extract requirements
 */
export function parseRequirements(prdPath: string): Requirement[] {
	const content = fs.readFileSync(prdPath, 'utf-8');
	const requirements: Requirement[] = [];

	// Match ### REQ-XXX-NNN: Title followed by ```gherkin block
	const reqPattern = /### (REQ-[A-Z]+-\d+): (.+?)\n```gherkin\n([\s\S]+?)```/g;

	let match: RegExpExecArray | null;
	while ((match = reqPattern.exec(content)) !== null) {
		const [, id, title, gherkin] = match;

		requirements.push({
			id,
			title: title.trim(),
			gherkin: gherkin.trim(),
			complexity: inferComplexity(title, gherkin),
			dependencies: inferDependencies(gherkin),
		});
	}

	return requirements;
}

/**
 * Infer task complexity from requirement content
 */
export function inferComplexity(
	title: string,
	gherkin: string,
): 'low' | 'medium' | 'high' {
	const lowerTitle = title.toLowerCase();
	const lowerGherkin = gherkin.toLowerCase();

	// High complexity indicators
	if (
		lowerTitle.includes('auth') ||
		lowerTitle.includes('payment') ||
		lowerTitle.includes('security') ||
		lowerTitle.includes('integration') ||
		lowerGherkin.includes('external api') ||
		lowerGherkin.includes('webhook')
	) {
		return 'high';
	}

	// Low complexity indicators
	if (
		lowerTitle.includes('static') ||
		lowerTitle.includes('template') ||
		lowerTitle.includes('checklist') ||
		lowerGherkin.includes('documentation')
	) {
		return 'low';
	}

	// Default to medium
	return 'medium';
}

/**
 * Infer task dependencies from Gherkin scenarios
 */
export function inferDependencies(gherkin: string): string[] {
	const deps: string[] = [];

	// Look for "Given X exists" or "Given X is configured"
	const givenPattern = /Given (.+?) (exists?|is configured|is available)/gi;

	let match: RegExpExecArray | null;
	while ((match = givenPattern.exec(gherkin)) !== null) {
		// This is a simplification - in practice you'd map these to actual task IDs
		deps.push(match[1].trim());
	}

	return deps;
}

/**
 * Generate task markdown file
 */
export function generateTaskFile(
	req: Requirement,
	epic: string,
	taskId: string,
): string {
	return `# ${req.title}

## Description

${extractDescription(req.gherkin)}

## Dependencies

${req.dependencies.length > 0 ? req.dependencies.map((d) => `- ${d}`).join('\n') : 'None - foundational task.'}

## Acceptance Criteria

- [ ] Implementation complete
- [ ] Tests passing
- [ ] Documentation updated

## Test Criteria

\`\`\`gherkin
${req.gherkin}
\`\`\`

## Implementation

### 1. [Implementation Step]

[Provide specific implementation guidance]

### 2. [Next Step]

[Additional guidance]

## Files to Create/Modify

**Create:**
- [List files to create]

**Modify:**
- [List files to modify]

## References

- documentation/PRDs/[prd-name].md (${req.id})
`;
}

/**
 * Extract feature description from Gherkin
 */
export function extractDescription(gherkin: string): string {
	const lines = gherkin.split('\n');
	const featureLine = lines.find((line) => line.trim().startsWith('Feature:'));

	if (featureLine) {
		return featureLine.replace('Feature:', '').trim();
	}

	return 'Task implementation';
}

/**
 * Update tasks/index.yml with new tasks
 */
export function updateTaskIndex(
	epic: string,
	tasks: Task[],
	indexPath: string,
): void {
	const content = fs.readFileSync(indexPath, 'utf-8');
	const index = yaml.parse(content) as TaskIndex;

	// Find or create epic
	if (!index.epics[epic]) {
		index.epics[epic] = {
			name: epic.charAt(0).toUpperCase() + epic.slice(1),
			description: 'Generated epic',
			priority: 'medium',
			tasks: [],
		};
	}

	// Add tasks
	for (const task of tasks) {
		const existing = index.epics[epic].tasks.find((t: Task) => t.id === task.id);
		if (!existing) {
			index.epics[epic].tasks.push(task);
		}
	}

	// Write back
	fs.writeFileSync(indexPath, yaml.stringify(index));
}

/**
 * Main script
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.length < 2) {
		console.error('Usage: bun scripts/generate-tasks-from-prd.ts <prd-file> <epic>');
		console.error(
			'Example: bun scripts/generate-tasks-from-prd.ts documentation/PRDs/workflow.md workflow',
		);
		process.exit(1);
	}

	const [prdPath, epic] = args;

	if (!fs.existsSync(prdPath)) {
		console.error(`PRD file not found: ${prdPath}`);
		process.exit(1);
	}

	console.log(`Parsing requirements from ${prdPath}...`);
	const requirements = parseRequirements(prdPath);

	console.log(`Found ${requirements.length} requirements`);

	// Create tasks directory if needed
	const tasksDir = path.join('tasks', epic);
	if (!fs.existsSync(tasksDir)) {
		fs.mkdirSync(tasksDir, { recursive: true });
	}

	const tasks: Task[] = [];

	// Generate task files
	for (const req of requirements) {
		const taskId = req.id.toLowerCase().replace(/_/g, '-');
		const taskFile = `${epic}/${taskId}.md`;
		const taskPath = path.join('tasks', taskFile);

		console.log(`Generating ${taskPath}...`);

		const content = generateTaskFile(req, epic, taskId);
		fs.writeFileSync(taskPath, content);

		tasks.push({
			id: taskId,
			name: req.title,
			file: taskFile,
			done: false,
			complexity: req.complexity,
			depends_on: [], // Manual refinement needed
		});
	}

	// Update index
	console.log('Updating tasks/index.yml...');
	updateTaskIndex(epic, tasks, 'tasks/index.yml');

	console.log('✓ Task generation complete!');
	console.log(`  Generated ${tasks.length} tasks in tasks/${epic}/`);
	console.log('  Updated tasks/index.yml');
	console.log('\nNext steps:');
	console.log('  1. Review generated task files');
	console.log('  2. Refine dependencies in tasks/index.yml');
	console.log('  3. Add implementation details to task files');
}

if (import.meta.main) {
	main();
}
