#!/usr/bin/env bash
# GitHub Issue Poller
# Finds issues with TODO + AGENT labels, creates task files, updates to WORKING

set -euo pipefail

TASKS_DIR="tasks/github-tasks"
REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || echo "")

if [[ -z "$REPO" ]]; then
	echo "Error: Not in a GitHub repository" >&2
	exit 1
fi

# Ensure tasks directory exists
mkdir -p "$TASKS_DIR"

# Find issues with both TODO and AGENT labels
issues=$(gh issue list --label "TODO" --label "AGENT" --json number,title,body,url --jq '.[]' 2>/dev/null || echo "")

if [[ -z "$issues" ]]; then
	echo "No issues found with TODO + AGENT labels"
	exit 0
fi

# Process each issue
gh issue list --label "TODO" --label "AGENT" --json number,title,body,url | jq -c '.[]' | while read -r issue; do
	number=$(echo "$issue" | jq -r '.number')
	title=$(echo "$issue" | jq -r '.title')
	body=$(echo "$issue" | jq -r '.body')
	url=$(echo "$issue" | jq -r '.url')

	# Create safe filename from title
	safe_name=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
	filename="${TASKS_DIR}/gh-${number}-${safe_name}.md"

	# Create task file
	cat > "$filename" << EOF
# GitHub Issue #${number}: ${title}

**Source:** ${url}
**Status:** In Progress

## Description

${body}

## Acceptance Criteria

- [ ] Issue requirements met
- [ ] Tests passing
- [ ] Ready for review

## References

- [GitHub Issue #${number}](${url})
EOF

	# Update label: remove TODO, add WORKING
	gh issue edit "$number" --remove-label "TODO" --add-label "WORKING" >/dev/null 2>&1

	# Print the filename (this is what gets used)
	echo "$filename"
done
