/**
 * @REQ-WF-002
 * Tests for automated task generation from PRD
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import {
	extractDescription,
	generateTaskFile,
	inferComplexity,
	inferDependencies,
	parseRequirements,
	updateTaskIndex,
} from './generate-tasks-from-prd';

describe('Task Generation from PRD', () => {
	const testDir = path.join(process.cwd(), 'test-temp');
	const testPrdPath = path.join(testDir, 'test-prd.md');
	const testIndexPath = path.join(testDir, 'index.yml');

	beforeEach(() => {
		// Create test directory
		if (!fs.existsSync(testDir)) {
			fs.mkdirSync(testDir, { recursive: true });
		}
	});

	afterEach(() => {
		// Clean up test directory
		if (fs.existsSync(testDir)) {
			fs.rmSync(testDir, { recursive: true, force: true });
		}
	});

	/**
	 * @REQ-WF-002
	 * Scenario: Generate tasks from Gherkin scenarios
	 */
	describe('parseRequirements', () => {
		it('should parse PRD with Gherkin requirements', () => {
			const prdContent = `# Test PRD

### REQ-TEST-001: User Authentication
\`\`\`gherkin
Feature: User Authentication
  As a user
  I want to log in securely
  So that I can access my account

  Scenario: Successful login
    Given the user is on the login page
    When the user enters valid credentials
    Then the user should be logged in
\`\`\`

### REQ-TEST-002: Dashboard View
\`\`\`gherkin
Feature: Dashboard
  As a user
  I want to see my dashboard
  So that I can view my data

  Scenario: View dashboard
    Given the auth system exists
    When the user navigates to dashboard
    Then the dashboard should be displayed
\`\`\`
`;

			fs.writeFileSync(testPrdPath, prdContent);

			const requirements = parseRequirements(testPrdPath);

			expect(requirements).toHaveLength(2);
			expect(requirements[0].id).toBe('REQ-TEST-001');
			expect(requirements[0].title).toBe('User Authentication');
			expect(requirements[0].gherkin).toContain('Feature: User Authentication');
			expect(requirements[1].id).toBe('REQ-TEST-002');
			expect(requirements[1].title).toBe('Dashboard View');
		});

		it('should handle PRD with no requirements', () => {
			const prdContent = `# Empty PRD

Just some text without any requirements.
`;

			fs.writeFileSync(testPrdPath, prdContent);

			const requirements = parseRequirements(testPrdPath);

			expect(requirements).toHaveLength(0);
		});

		it('should preserve @REQ tags in Gherkin', () => {
			const prdContent = `# Test PRD

### REQ-TEST-001: Feature with Tags
\`\`\`gherkin
Feature: Tagged Feature
  @REQ-TEST-001
  Scenario: Tagged scenario
    Given a precondition
    When an action occurs
    Then a result happens
\`\`\`
`;

			fs.writeFileSync(testPrdPath, prdContent);

			const requirements = parseRequirements(testPrdPath);

			expect(requirements[0].gherkin).toContain('@REQ-TEST-001');
		});
	});

	/**
	 * @REQ-WF-002
	 * Scenario: Infer task dependencies from requirement relationships
	 */
	describe('inferDependencies', () => {
		it('should extract dependencies from Given clauses', () => {
			const gherkin = `
Feature: Test Feature
  Scenario: Test Scenario
    Given the auth system exists
    And the database is configured
    When something happens
    Then result occurs
`;

			const deps = inferDependencies(gherkin);

			expect(deps).toContain('the auth system');
			expect(deps).toContain('the database');
		});

		it('should handle Gherkin with no dependencies', () => {
			const gherkin = `
Feature: Test Feature
  Scenario: Test Scenario
    When something happens
    Then result occurs
`;

			const deps = inferDependencies(gherkin);

			expect(deps).toHaveLength(0);
		});

		it('should handle "is available" pattern', () => {
			const gherkin = `
Feature: Test Feature
  Scenario: Test Scenario
    Given the API is available
    When request is made
    Then response is returned
`;

			const deps = inferDependencies(gherkin);

			expect(deps).toContain('the API');
		});
	});

	/**
	 * @REQ-WF-002
	 * Scenario: Set appropriate complexity levels based on requirement type
	 */
	describe('inferComplexity', () => {
		it('should infer high complexity for auth features', () => {
			const complexity = inferComplexity(
				'User Authentication',
				'Feature: User Authentication',
			);

			expect(complexity).toBe('high');
		});

		it('should infer high complexity for payment features', () => {
			const complexity = inferComplexity(
				'Payment Processing',
				'Feature: Payment',
			);

			expect(complexity).toBe('high');
		});

		it('should infer high complexity for external API integration', () => {
			const complexity = inferComplexity(
				'API Integration',
				'Feature: Integration with external API',
			);

			expect(complexity).toBe('high');
		});

		it('should infer high complexity for webhook features', () => {
			const complexity = inferComplexity(
				'Webhook Handler',
				'Feature: Receive webhook notifications',
			);

			expect(complexity).toBe('high');
		});

		it('should infer low complexity for static pages', () => {
			const complexity = inferComplexity('Static Page', 'Feature: Display page');

			expect(complexity).toBe('low');
		});

		it('should infer low complexity for templates', () => {
			const complexity = inferComplexity(
				'Email Template',
				'Feature: Template for emails',
			);

			expect(complexity).toBe('low');
		});

		it('should infer low complexity for checklists', () => {
			const complexity = inferComplexity(
				'Preparation Checklist',
				'Feature: Documentation checklist',
			);

			expect(complexity).toBe('low');
		});

		it('should infer medium complexity for standard features', () => {
			const complexity = inferComplexity(
				'Dashboard View',
				'Feature: Display dashboard',
			);

			expect(complexity).toBe('medium');
		});
	});

	/**
	 * @REQ-WF-002
	 * Scenario: Extract feature description from Gherkin
	 */
	describe('extractDescription', () => {
		it('should extract description from Feature line', () => {
			const gherkin = `
Feature: User Authentication
  As a user
  I want to log in
`;

			const description = extractDescription(gherkin);

			expect(description).toBe('User Authentication');
		});

		it('should handle Gherkin without Feature line', () => {
			const gherkin = `
Scenario: Test Scenario
  Given something
  When action
  Then result
`;

			const description = extractDescription(gherkin);

			expect(description).toBe('Task implementation');
		});
	});

	/**
	 * @REQ-WF-002
	 * Scenario: Generate proper Gherkin-to-code mapping
	 */
	describe('generateTaskFile', () => {
		it('should generate task markdown with all sections', () => {
			const req = {
				id: 'REQ-TEST-001',
				title: 'User Authentication',
				gherkin: `Feature: User Authentication
  Scenario: Login
    Given user is on login page
    When user enters credentials
    Then user is logged in`,
				complexity: 'high' as const,
				dependencies: ['auth system'],
			};

			const taskFile = generateTaskFile(req, 'auth', 'req-test-001');

			expect(taskFile).toContain('# User Authentication');
			expect(taskFile).toContain('## Description');
			expect(taskFile).toContain('User Authentication');
			expect(taskFile).toContain('## Dependencies');
			expect(taskFile).toContain('- auth system');
			expect(taskFile).toContain('## Acceptance Criteria');
			expect(taskFile).toContain('## Test Criteria');
			expect(taskFile).toContain('```gherkin');
			expect(taskFile).toContain('Feature: User Authentication');
			expect(taskFile).toContain('## Implementation');
			expect(taskFile).toContain('## Files to Create/Modify');
			expect(taskFile).toContain('## References');
			expect(taskFile).toContain('(REQ-TEST-001)');
		});

		it('should handle requirements with no dependencies', () => {
			const req = {
				id: 'REQ-TEST-002',
				title: 'Static Page',
				gherkin: 'Feature: Static Page',
				complexity: 'low' as const,
				dependencies: [],
			};

			const taskFile = generateTaskFile(req, 'pages', 'req-test-002');

			expect(taskFile).toContain('None - foundational task.');
		});

		it('should preserve @REQ tags in test criteria', () => {
			const req = {
				id: 'REQ-TEST-003',
				title: 'Feature with Tags',
				gherkin: `Feature: Tagged Feature
  @REQ-TEST-003
  Scenario: Test
    Given precondition
    When action
    Then result`,
				complexity: 'medium' as const,
				dependencies: [],
			};

			const taskFile = generateTaskFile(req, 'test', 'req-test-003');

			expect(taskFile).toContain('@REQ-TEST-003');
		});
	});

	/**
	 * @REQ-WF-002
	 * Scenario: Update tasks/index.yml with new tasks
	 */
	describe('updateTaskIndex', () => {
		it('should create new epic if it does not exist', () => {
			const initialIndex = {
				version: 4,
				updated: '2025-12-12',
				epics: {},
			};

			fs.writeFileSync(testIndexPath, yaml.stringify(initialIndex));

			const tasks = [
				{
					id: 'test-task-001',
					name: 'Test Task',
					file: 'test/test-task-001.md',
					done: false,
					complexity: 'medium' as const,
					depends_on: [],
				},
			];

			updateTaskIndex('test', tasks, testIndexPath);

			const updatedContent = fs.readFileSync(testIndexPath, 'utf-8');
			const updatedIndex = yaml.parse(updatedContent);

			expect(updatedIndex.epics.test).toBeDefined();
			expect(updatedIndex.epics.test.name).toBe('Test');
			expect(updatedIndex.epics.test.tasks).toHaveLength(1);
			expect(updatedIndex.epics.test.tasks[0].id).toBe('test-task-001');
		});

		it('should add tasks to existing epic', () => {
			const initialIndex = {
				version: 4,
				updated: '2025-12-12',
				epics: {
					test: {
						name: 'Test Epic',
						description: 'Test description',
						priority: 'medium',
						tasks: [
							{
								id: 'existing-task',
								name: 'Existing Task',
								file: 'test/existing-task.md',
								done: false,
								complexity: 'low',
								depends_on: [],
							},
						],
					},
				},
			};

			fs.writeFileSync(testIndexPath, yaml.stringify(initialIndex));

			const tasks = [
				{
					id: 'new-task',
					name: 'New Task',
					file: 'test/new-task.md',
					done: false,
					complexity: 'medium' as const,
					depends_on: [],
				},
			];

			updateTaskIndex('test', tasks, testIndexPath);

			const updatedContent = fs.readFileSync(testIndexPath, 'utf-8');
			const updatedIndex = yaml.parse(updatedContent);

			expect(updatedIndex.epics.test.tasks).toHaveLength(2);
			expect(updatedIndex.epics.test.tasks[1].id).toBe('new-task');
		});

		it('should not duplicate existing tasks', () => {
			const initialIndex = {
				version: 4,
				updated: '2025-12-12',
				epics: {
					test: {
						name: 'Test Epic',
						description: 'Test description',
						priority: 'medium',
						tasks: [
							{
								id: 'existing-task',
								name: 'Existing Task',
								file: 'test/existing-task.md',
								done: false,
								complexity: 'low',
								depends_on: [],
							},
						],
					},
				},
			};

			fs.writeFileSync(testIndexPath, yaml.stringify(initialIndex));

			const tasks = [
				{
					id: 'existing-task',
					name: 'Existing Task',
					file: 'test/existing-task.md',
					done: false,
					complexity: 'low' as const,
					depends_on: [],
				},
			];

			updateTaskIndex('test', tasks, testIndexPath);

			const updatedContent = fs.readFileSync(testIndexPath, 'utf-8');
			const updatedIndex = yaml.parse(updatedContent);

			expect(updatedIndex.epics.test.tasks).toHaveLength(1);
		});
	});

	/**
	 * @REQ-WF-002
	 * Integration test: Full workflow from PRD to task files
	 */
	describe('Full workflow integration', () => {
		it('should generate tasks from PRD and update index', () => {
			const prdContent = `# Workflow PRD

### REQ-WF-001: PRD Preparation Checklist
\`\`\`gherkin
Feature: PRD Preparation Guidelines
  As a product manager
  I want a standardized checklist
  So that PRDs are well-scoped

  Scenario: PRD Preparation
    Given I am preparing a new PRD
    When I follow the checklist
    Then I should have all required items
\`\`\`

### REQ-WF-002: Task Generation
\`\`\`gherkin
Feature: Task Generation from PRD
  As an engineer
  I want to automatically generate tasks
  So that I don't manually extract requirements

  Scenario: Generate tasks
    Given I have a PRD with Gherkin requirements
    When I run the task generation script
    Then tasks should be created in tasks/{epic}/{task}.md
\`\`\`
`;

			fs.writeFileSync(testPrdPath, prdContent);

			const initialIndex = {
				version: 4,
				updated: '2025-12-12',
				epics: {},
			};

			fs.writeFileSync(testIndexPath, yaml.stringify(initialIndex));

			// Parse requirements
			const requirements = parseRequirements(testPrdPath);

			expect(requirements).toHaveLength(2);

			// Generate task files
			const tasks = [];
			for (const req of requirements) {
				const taskId = req.id.toLowerCase().replace(/_/g, '-');
				const taskFile = `workflow/${taskId}.md`;
				const taskPath = path.join(testDir, taskFile);

				// Create directory if needed
				const taskDir = path.dirname(taskPath);
				if (!fs.existsSync(taskDir)) {
					fs.mkdirSync(taskDir, { recursive: true });
				}

				const content = generateTaskFile(req, 'workflow', taskId);
				fs.writeFileSync(taskPath, content);

				tasks.push({
					id: taskId,
					name: req.title,
					file: taskFile,
					done: false,
					complexity: req.complexity,
					depends_on: [],
				});

				// Verify task file was created
				expect(fs.existsSync(taskPath)).toBe(true);
				const taskContent = fs.readFileSync(taskPath, 'utf-8');
				expect(taskContent).toContain(`# ${req.title}`);
				expect(taskContent).toContain('```gherkin');
				expect(taskContent).toContain(req.gherkin);
			}

			// Update index
			updateTaskIndex('workflow', tasks, testIndexPath);

			// Verify index was updated
			const updatedContent = fs.readFileSync(testIndexPath, 'utf-8');
			const updatedIndex = yaml.parse(updatedContent);

			expect(updatedIndex.epics.workflow).toBeDefined();
			expect(updatedIndex.epics.workflow.tasks).toHaveLength(2);
			expect(updatedIndex.epics.workflow.tasks[0].id).toBe('req-wf-001');
			expect(updatedIndex.epics.workflow.tasks[1].id).toBe('req-wf-002');
		});
	});
});
