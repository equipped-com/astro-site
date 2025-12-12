# Automated Task Generation from PRD

## Description

Build a script that automatically extracts tasks from PRD requirements and generates task files in the proper format. This eliminates manual task extraction and ensures consistency.

## Dependencies

- `workflow/prd-preparation` - PRD template must exist first

## Acceptance Criteria

- [ ] Script can parse PRD Gherkin scenarios
- [ ] Automatically generates task files in tasks/{epic}/{task}.md
- [ ] Updates tasks/index.yml with new tasks
- [ ] Infers task dependencies from requirement relationships
- [ ] Sets appropriate complexity levels based on requirement type
- [ ] Preserves @REQ tags in generated test criteria
- [ ] Generates proper Gherkin-to-code mapping
- [ ] Script is executable via `bun scripts/generate-tasks-from-prd.ts`

## Test Criteria

```gherkin
Feature: Task Generation from PRD
	As an engineer
	I want to automatically generate tasks from PRD requirements
	So that I don't manually extract requirements into task files

	@REQ-WF-002
	Scenario: Generate tasks from Gherkin scenarios
		Given I have a PRD with Gherkin requirements
		When I run the task generation script
		Then tasks should be created in tasks/{epic}/{task}.md
		And tasks/index.yml should be updated
		And dependencies should be inferred from requirements
```

## Implementation

### 1. Create Task Generation Script

Create `scripts/generate-tasks-from-prd.ts`:

```typescript
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

/**
 * Parse PRD markdown to extract requirements
 */
function parseRequirements(prdPath: string): Requirement[] {
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
function inferComplexity(
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
function inferDependencies(gherkin: string): string[] {
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
function generateTaskFile(
	req: Requirement,
	epic: string,
	taskId: string,
): string {
	return `# ${req.title}

## Description

${extractDescription(req.gherkin)}

## Dependencies

${req.dependencies.length > 0 ? req.dependencies.map(d => `- ${d}`).join('\n') : 'None - foundational task.'}

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
function extractDescription(gherkin: string): string {
	const lines = gherkin.split('\n');
	const featureLine = lines.find(line => line.trim().startsWith('Feature:'));

	if (featureLine) {
		return featureLine.replace('Feature:', '').trim();
	}

	return 'Task implementation';
}

/**
 * Update tasks/index.yml with new tasks
 */
function updateTaskIndex(
	epic: string,
	tasks: Task[],
	indexPath: string,
): void {
	const content = fs.readFileSync(indexPath, 'utf-8');
	const index = yaml.parse(content);

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
		console.error('Example: bun scripts/generate-tasks-from-prd.ts documentation/PRDs/workflow.md workflow');
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

main();
```

### 2. Add Script to package.json

```json
{
	"scripts": {
		"generate:tasks": "bun scripts/generate-tasks-from-prd.ts"
	}
}
```

### 3. Install Dependencies

```bash
bun add -d yaml
```

### 4. Usage Example

```bash
# Generate tasks from workflow PRD
bun scripts/generate-tasks-from-prd.ts documentation/PRDs/workflow.md workflow

# Generate tasks from product PRD
bun scripts/generate-tasks-from-prd.ts documentation/PRDs/product.md auth
```

### 5. Manual Refinement Process

After generation:

1. Review each generated task file
2. Add specific implementation guidance
3. Refine acceptance criteria
4. Update dependencies in tasks/index.yml
5. Verify complexity levels
6. Add "requires: human" flag where needed

## Files to Create/Modify

**Create:**
- `scripts/generate-tasks-from-prd.ts` - Task generation script

**Modify:**
- `package.json` - Add generate:tasks script
- `package.json` - Add yaml dependency

## References

- documentation/PRDs/workflow.md (REQ-WF-002)
- scripts/validate-task-dependencies.js (existing validation script)
- tasks/index.yml (target for updates)
