#!/usr/bin/env bash
#
# Check that all-jobs-succeed depends on all jobs in pull request workflows.
# This ensures that the "all checks pass" rule works correctly.

set -euo pipefail

which yq > /dev/null || {
  echo "yq is required but not installed. Install it with: go install github.com/mikefarah/yq/v4@latest" >&2
  exit 1
}

jobs=$(for i in $(find .github/workflows -iname '*.yaml' -or -iname '*.yml' 2>/dev/null || true)
  do
    # Select jobs that are triggered by pull request.
    if yq -e '.on | has("pull_request")' "$i" 2>/dev/null >/dev/null
    then
      # Skip reusable workflows (those with workflow_call) as their jobs
      # don't need to be direct dependencies of all-jobs-succeed
      if yq -e '.on | has("workflow_call")' "$i" 2>/dev/null >/dev/null
      then
        continue
      fi
      
      # Skip workflows that only run on PR closed/merged (post-merge workflows)
      # These are not part of the PR review process and shouldn't be dependencies
      # Check if types only contains "closed" and no other PR event types
      if grep -qE 'types:\s*\[.*closed.*\]' "$i" 2>/dev/null
      then
        # Check if it also has other PR event types - if so, don't skip
        if ! grep -qE 'types:\s*\[.*(opened|synchronize|labeled|unlabeled|edited|ready_for_review|locked|unlocked|reopened|assigned|unassigned|review_requested|review_request_removed|auto_merge_enabled|auto_merge_disabled|converted_to_draft)' "$i" 2>/dev/null
        then
          # Only has "closed" type, skip this workflow
          continue
        fi
      fi
      
      # This gets the list of jobs that all-jobs-succeed does not depend on.
      comm -23 \
        <(yq -r '.jobs | keys | .[]' "$i" | sort | uniq) \
        <(yq -r '.jobs.all-jobs-succeed.needs[]' "$i" | sort | uniq)
    fi

  # The grep call here excludes all-jobs-succeed from the list of jobs that
  # all-jobs-succeed does not depend on.  If all-jobs-succeed does
  # not depend on itself, we do not care about it.
  done | sort | uniq | (grep -v '^all-jobs-succeed$' || true)
)

if [ -n "$jobs" ]
then
  missing_jobs="$(echo "$jobs" | tr ' ' '\n')"
  echo "all-jobs-succeed missing dependencies on some jobs: $missing_jobs" | tee -a $GITHUB_STEP_SUMMARY >&2
  exit 1
fi
