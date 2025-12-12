# PRD Preparation Checklist

Use this checklist when creating a new PRD to ensure it's ready for implementation.

## Phase 1: Problem Definition

- [ ] Problem statement is clear and specific
- [ ] Target personas identified
- [ ] Current pain points documented
- [ ] Success metrics defined (quantifiable)

## Phase 2: Technical Research

- [ ] Required libraries/frameworks researched
- [ ] API documentation reviewed
- [ ] Compatibility verified (React 19, Astro 5, etc.)
- [ ] Performance implications considered
- [ ] Security review completed (if applicable)

## Phase 3: Dependency Analysis

- [ ] Internal dependencies listed (other PRDs/tasks)
- [ ] External dependencies identified (third-party services)
- [ ] Partnership/legal requirements noted
- [ ] "Requires human" tasks flagged

## Phase 4: Requirements Definition

- [ ] All requirements written in Gherkin format
- [ ] Requirements have @REQ tags
- [ ] Scenarios are testable
- [ ] Edge cases considered
- [ ] Error states defined

## Phase 5: Testing Strategy

- [ ] Unit test requirements defined
- [ ] Integration test requirements defined
- [ ] E2E test requirements defined (for critical flows)
- [ ] Regression test strategy included (for bug fixes)

## Phase 6: Rollback Planning

- [ ] Revert strategy documented
- [ ] Database rollback procedure (if migrations involved)
- [ ] Monitoring plan defined
- [ ] Rollback triggers identified

## Phase 7: Task Breakdown

- [ ] Tasks extracted from requirements
- [ ] Complexity levels assigned (low/medium/high)
- [ ] Task dependencies mapped
- [ ] "Requires human" tasks identified

## Phase 8: Review

- [ ] PRD reviewed by at least one other person
- [ ] Ambiguities resolved
- [ ] Out-of-scope items clearly stated
- [ ] Ready for task generation

## Common Pitfalls to Avoid

- **Vague requirements**: Use Gherkin format to force specificity
- **Missing dependencies**: Check both internal and external deps
- **No rollback plan**: Always plan for failure scenarios
- **Untestable requirements**: Ensure scenarios can be automated
- **Scope creep**: Clearly define out-of-scope items
