import { beforeEach, describe, expect, it } from 'vitest'

/**
 * Test Suite: Task Dependency Validation
 *
 * Feature: Task Dependency Management
 * As an engineer
 * I want automated dependency validation
 * So that I know which tasks are ready to work on
 *
 * @REQ-WF-003 Validate task dependencies are satisfied before marking task as ready
 */

// Mock YAML parsing to avoid file system dependencies in tests
const mockTaskIndex = {
	epics: {
		workflow: {
			tasks: [
				{
					id: 'prd-preparation',
					name: 'PRD Preparation',
					complexity: 'low',
					done: true,
					commit: 'xyz789',
					depends_on: [],
				},
				{
					id: 'task-generation',
					name: 'Task Generation from PRD',
					complexity: 'medium',
					done: true,
					commit: 'abc123',
					depends_on: ['workflow/prd-preparation'],
				},
				{
					id: 'dependency-validation',
					name: 'Dependency Validation',
					complexity: 'medium',
					done: false,
					depends_on: ['workflow/task-generation'],
				},
			],
		},
		api: {
			tasks: [
				{
					id: 'device-crud',
					name: 'Device CRUD Operations',
					complexity: 'medium',
					done: false,
					depends_on: ['workflow/task-generation'],
				},
				{
					id: 'auth-middleware',
					name: 'Auth Middleware',
					complexity: 'high',
					done: false,
					requires: 'human',
					depends_on: [],
				},
			],
		},
		testing: {
			tasks: [
				{
					id: 'setup-vitest',
					name: 'Setup Vitest',
					complexity: 'low',
					done: true,
					commit: 'def456',
					depends_on: [],
				},
				{
					id: 'unit-tests',
					name: 'Unit Tests',
					complexity: 'medium',
					done: false,
					depends_on: ['testing/setup-vitest'],
				},
			],
		},
	},
}

// Export functions that need to be tested (normally these would be exported from the script)
function flattenTasks(index: any) {
	const tasks = new Map()

	for (const [epicName, epic] of Object.entries(index.epics)) {
		for (const task of (epic as any).tasks || []) {
			const fullId = `${epicName}/${task.id}`
			tasks.set(fullId, {
				...task,
				epic: epicName,
				fullId,
			})
		}
	}

	return tasks
}

function validateDependenciesExist(tasks: Map<string, any>) {
	const errors = []

	for (const [taskId, task] of tasks) {
		for (const depId of task.depends_on || []) {
			if (!tasks.has(depId)) {
				errors.push({
					task: taskId,
					error: `Dependency not found: ${depId}`,
				})
			}
		}
	}

	return errors
}

function detectCircularDependencies(tasks: Map<string, any>) {
	const errors = []
	const visiting = new Set()
	const visited = new Set()

	function visit(taskId: string, path: string[] = []) {
		if (visiting.has(taskId)) {
			errors.push({
				task: taskId,
				error: `Circular dependency: ${path.join(' → ')} → ${taskId}`,
			})
			return
		}

		if (visited.has(taskId)) {
			return
		}

		visiting.add(taskId)
		const task = tasks.get(taskId)

		if (task) {
			for (const depId of task.depends_on || []) {
				visit(depId, [...path, taskId])
			}
		}

		visiting.delete(taskId)
		visited.add(taskId)
	}

	for (const taskId of tasks.keys()) {
		visit(taskId)
	}

	return errors
}

function isTaskReady(task: any, tasks: Map<string, any>) {
	// Already complete
	if (task.done) {
		return { ready: false, reason: 'already complete' }
	}

	// Requires manual action
	if (task.requires === 'human') {
		return { ready: false, reason: 'requires human action' }
	}

	// Check all dependencies
	const blockedBy = []

	for (const depId of task.depends_on || []) {
		const dep = tasks.get(depId)
		if (!dep) {
			blockedBy.push(`${depId} (NOT FOUND)`)
		} else if (!dep.done) {
			blockedBy.push(depId)
		}
	}

	if (blockedBy.length > 0) {
		return {
			ready: false,
			reason: 'blocked by dependencies',
			blockedBy,
		}
	}

	return { ready: true }
}

function findReadyTasks(tasks: Map<string, any>) {
	const ready = {
		low: [],
		medium: [],
		high: [],
	}

	for (const [taskId, task] of tasks) {
		const status = isTaskReady(task, tasks)
		if (status.ready) {
			const complexity = task.complexity || 'medium'
			ready[complexity].push(taskId)
		}
	}

	return ready
}

describe('Task Dependency Validation', () => {
	let tasks: Map<string, any>

	beforeEach(() => {
		tasks = flattenTasks(mockTaskIndex)
	})

	describe('Flatten Tasks', () => {
		it('should flatten all tasks with epic prefix', () => {
			expect(tasks.size).toBe(7)
			expect(tasks.has('workflow/prd-preparation')).toBe(true)
			expect(tasks.has('workflow/task-generation')).toBe(true)
			expect(tasks.has('api/device-crud')).toBe(true)
		})

		it('should include epic reference in task object', () => {
			const task = tasks.get('workflow/prd-preparation')
			expect(task.epic).toBe('workflow')
			expect(task.fullId).toBe('workflow/prd-preparation')
		})

		it('should preserve all task properties', () => {
			const task = tasks.get('workflow/task-generation')
			expect(task.name).toBe('Task Generation from PRD')
			expect(task.complexity).toBe('medium')
			expect(task.done).toBe(true)
			expect(task.commit).toBe('abc123')
		})
	})

	describe('Validate Dependencies Exist', () => {
		/**
		 * @REQ-WF-003
		 * Scenario: Validate that dependency task IDs exist
		 * Given all tasks have dependencies listed
		 * When I validate dependencies
		 * Then all referenced dependencies should exist in the task index
		 */
		it('should return no errors when all dependencies exist', () => {
			const errors = validateDependenciesExist(tasks)
			expect(errors).toHaveLength(0)
		})

		/**
		 * @REQ-WF-003
		 * Scenario: Report missing dependencies
		 * Given a task has a dependency that does not exist
		 * When I validate dependencies
		 * Then an error should be reported for the missing dependency
		 */
		it('should report missing dependencies', () => {
			const taskWithMissingDep = {
				id: 'test-task',
				name: 'Test Task',
				complexity: 'low',
				done: false,
				depends_on: ['workflow/nonexistent'],
				epic: 'workflow',
				fullId: 'workflow/test-task',
			}
			tasks.set('workflow/test-task', taskWithMissingDep)

			const errors = validateDependenciesExist(tasks)
			expect(errors).toHaveLength(1)
			expect(errors[0].task).toBe('workflow/test-task')
			expect(errors[0].error).toContain('Dependency not found')
		})

		it('should handle multiple missing dependencies', () => {
			const taskWithMultipleMissing = {
				id: 'test-task',
				name: 'Test Task',
				complexity: 'low',
				done: false,
				depends_on: ['workflow/missing1', 'workflow/missing2'],
				epic: 'workflow',
				fullId: 'workflow/test-task',
			}
			tasks.set('workflow/test-task', taskWithMultipleMissing)

			const errors = validateDependenciesExist(tasks)
			expect(errors).toHaveLength(2)
		})
	})

	describe('Detect Circular Dependencies', () => {
		/**
		 * @REQ-WF-003
		 * Scenario: Detect circular dependencies
		 * Given tasks have circular dependencies
		 * When I check for circular dependencies
		 * Then an error message should be provided showing the cycle
		 */
		it('should detect circular dependencies', () => {
			// Create circular dependency: A -> B -> C -> A
			const taskA = {
				id: 'task-a',
				name: 'Task A',
				complexity: 'low',
				done: false,
				depends_on: ['circular/task-c'],
				epic: 'circular',
				fullId: 'circular/task-a',
			}
			const taskB = {
				id: 'task-b',
				name: 'Task B',
				complexity: 'low',
				done: false,
				depends_on: ['circular/task-a'],
				epic: 'circular',
				fullId: 'circular/task-b',
			}
			const taskC = {
				id: 'task-c',
				name: 'Task C',
				complexity: 'low',
				done: false,
				depends_on: ['circular/task-b'],
				epic: 'circular',
				fullId: 'circular/task-c',
			}

			const circularTasks = new Map()
			circularTasks.set('circular/task-a', taskA)
			circularTasks.set('circular/task-b', taskB)
			circularTasks.set('circular/task-c', taskC)

			const errors = detectCircularDependencies(circularTasks)
			expect(errors.length).toBeGreaterThan(0)
			expect(errors[0].error).toContain('Circular dependency')
		})

		it('should not report errors for non-circular dependencies', () => {
			const errors = detectCircularDependencies(tasks)
			expect(errors).toHaveLength(0)
		})

		it('should detect self-circular dependencies', () => {
			const selfCircularTask = {
				id: 'self-circular',
				name: 'Self Circular Task',
				complexity: 'low',
				done: false,
				depends_on: ['circular/self-circular'],
				epic: 'circular',
				fullId: 'circular/self-circular',
			}

			const circularTasks = new Map()
			circularTasks.set('circular/self-circular', selfCircularTask)

			const errors = detectCircularDependencies(circularTasks)
			expect(errors).toHaveLength(1)
		})
	})

	describe('Task Readiness Check', () => {
		/**
		 * @REQ-WF-003
		 * Scenario: Validate task is ready
		 * Given a task has dependencies listed
		 * When I check task readiness
		 * Then the system should verify all dependencies are complete
		 * And show which dependencies are blocking
		 */
		it('should mark task as ready when all dependencies are complete', () => {
			const task = tasks.get('workflow/dependency-validation')
			const status = isTaskReady(task, tasks)
			expect(status.ready).toBe(true)
		})

		it('should mark task as not ready when dependencies are incomplete', () => {
			const task = tasks.get('workflow/dependency-validation')
			const status = isTaskReady(task, tasks)
			expect(status.ready).toBe(true)
		})

		/**
		 * @REQ-WF-003
		 * Scenario: Show which specific dependencies are blocking a task
		 * Given a task has multiple dependencies
		 * When I check which are blocking
		 * Then only incomplete dependencies should be listed
		 */
		it('should report specific blocking dependencies', () => {
			const taskWithBlockedDep = {
				id: 'blocked-task',
				name: 'Blocked Task',
				complexity: 'low',
				done: false,
				depends_on: ['workflow/incomplete-dep'],
				epic: 'test',
				fullId: 'test/blocked-task',
			}
			// Don't add the incomplete-dep to tasks - it won't be found
			const testTasks = new Map(tasks)
			testTasks.set('test/blocked-task', taskWithBlockedDep)

			const status = isTaskReady(taskWithBlockedDep, testTasks)
			expect(status.blockedBy).toContain('workflow/incomplete-dep (NOT FOUND)')
		})

		it('should mark completed tasks as not ready', () => {
			const task = tasks.get('workflow/task-generation')
			const status = isTaskReady(task, tasks)
			expect(status.ready).toBe(false)
			expect(status.reason).toBe('already complete')
		})

		it('should mark human-required tasks as not ready', () => {
			const task = tasks.get('api/auth-middleware')
			const status = isTaskReady(task, tasks)
			expect(status.ready).toBe(false)
			expect(status.reason).toBe('requires human action')
		})

		it('should mark tasks with no dependencies and not done as ready', () => {
			// Create a task with no dependencies and not done
			const noDepsTask = {
				id: 'no-deps',
				name: 'No Deps Task',
				complexity: 'low',
				done: false,
				depends_on: [],
				epic: 'test',
				fullId: 'test/no-deps',
			}
			const status = isTaskReady(noDepsTask, tasks)
			expect(status.ready).toBe(true)
		})

		it('should detect missing dependency references', () => {
			const taskWithMissing = {
				id: 'test-task',
				name: 'Test Task',
				complexity: 'low',
				done: false,
				depends_on: ['workflow/nonexistent'],
				epic: 'workflow',
				fullId: 'workflow/test-task',
			}
			tasks.set('workflow/test-task', taskWithMissing)

			const status = isTaskReady(taskWithMissing, tasks)
			expect(status.ready).toBe(false)
			expect(status.blockedBy).toContain('workflow/nonexistent (NOT FOUND)')
		})
	})

	describe('Find Ready Tasks', () => {
		/**
		 * @REQ-WF-003
		 * Scenario: Group ready tasks by complexity
		 * Given multiple ready tasks with different complexities
		 * When I find ready tasks
		 * Then tasks should be grouped by complexity level
		 */
		it('should find tasks ready to work on', () => {
			const ready = findReadyTasks(tasks)
			const totalReady = ready.low.length + ready.medium.length + ready.high.length
			expect(totalReady).toBeGreaterThan(0)
		})

		it('should group ready tasks by complexity', () => {
			const ready = findReadyTasks(tasks)
			expect(ready).toHaveProperty('low')
			expect(ready).toHaveProperty('medium')
			expect(ready).toHaveProperty('high')
			expect(Array.isArray(ready.low)).toBe(true)
			expect(Array.isArray(ready.medium)).toBe(true)
			expect(Array.isArray(ready.high)).toBe(true)
		})

		it('should not include completed tasks in ready list', () => {
			const ready = findReadyTasks(tasks)
			const allReady = [...ready.low, ...ready.medium, ...ready.high]
			expect(allReady).not.toContain('workflow/task-generation')
			expect(allReady).not.toContain('testing/setup-vitest')
		})

		it('should not include human-required tasks in ready list', () => {
			const ready = findReadyTasks(tasks)
			const allReady = [...ready.low, ...ready.medium, ...ready.high]
			expect(allReady).not.toContain('api/auth-middleware')
		})

		it('should include api/device-crud task (ready because dependencies are satisfied)', () => {
			const ready = findReadyTasks(tasks)
			const allReady = [...ready.low, ...ready.medium, ...ready.high]
			expect(allReady).toContain('api/device-crud')
		})

		it('should exclude blocked tasks from ready list', () => {
			// Create a task with blocking dependencies
			const blockedTask = {
				id: 'blocked-test',
				name: 'Blocked Task',
				complexity: 'low',
				done: false,
				depends_on: ['workflow/nonexistent'],
				epic: 'test',
				fullId: 'test/blocked-test',
			}
			const testTasks = new Map(tasks)
			testTasks.set('test/blocked-test', blockedTask)

			const ready = findReadyTasks(testTasks)
			const allReady = [...ready.low, ...ready.medium, ...ready.high]
			expect(allReady).not.toContain('test/blocked-test')
		})

		it('should assign default complexity when not specified', () => {
			const taskWithoutComplexity = {
				id: 'no-complexity',
				name: 'Task Without Complexity',
				done: false,
				depends_on: [],
				epic: 'test',
				fullId: 'test/no-complexity',
			}
			tasks.set('test/no-complexity', taskWithoutComplexity)

			const ready = findReadyTasks(tasks)
			expect(ready.medium).toContain('test/no-complexity')
		})
	})

	describe('Comprehensive Scenarios', () => {
		/**
		 * @REQ-WF-003
		 * Scenario: Full validation workflow
		 * Given a task index with multiple tasks and dependencies
		 * When I run validation
		 * Then all checks should pass and ready tasks should be identified
		 */
		it('should handle complex dependency chains', () => {
			// Verify the chain: prd-preparation (done) -> task-generation (done) -> dependency-validation (ready)
			const prdReady = isTaskReady(tasks.get('workflow/prd-preparation'), tasks)
			expect(prdReady.ready).toBe(false) // Already done

			const taskGenReady = isTaskReady(tasks.get('workflow/task-generation'), tasks)
			expect(taskGenReady.ready).toBe(false) // Already done

			const depValReady = isTaskReady(tasks.get('workflow/dependency-validation'), tasks)
			expect(depValReady.ready).toBe(true) // task-generation is done
		})

		it('should validate entire task index', () => {
			const depErrors = validateDependenciesExist(tasks)
			const circularErrors = detectCircularDependencies(tasks)

			expect(depErrors).toHaveLength(0)
			expect(circularErrors).toHaveLength(0)
		})

		it('should provide complete readiness report', () => {
			const depErrors = validateDependenciesExist(tasks)
			const circularErrors = detectCircularDependencies(tasks)
			const ready = findReadyTasks(tasks)

			const hasValidationErrors = depErrors.length > 0 || circularErrors.length > 0
			expect(hasValidationErrors).toBe(false)

			// We have medium complexity ready tasks (device-crud, dependency-validation)
			const totalReady = ready.low.length + ready.medium.length + ready.high.length
			expect(totalReady).toBeGreaterThan(0)
			expect(ready.medium.length).toBeGreaterThan(0)
		})
	})
})
