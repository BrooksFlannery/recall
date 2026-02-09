# Dependabot Secret Not Accessible - Debugging Help Needed

## Context

We're implementing the standard pattern for updating lockfiles on Dependabot PRs. We've followed the recommendations to:
1. Use `github.event.pull_request.user.login == 'dependabot[bot]'` to gate on PR author
2. Pass PAT to checkout with `token: ${{ secrets.DEPENDABOT_PAT }}` and `persist-credentials: false`
3. Use explicit push with PAT in URL

## The Problem

The workflow is failing because `${{ secrets.DEPENDABOT_PAT }}` is evaluating to empty, even though:
- ✅ The secret is definitely set in **Settings → Secrets and variables → Dependabot**
- ✅ The secret name is exactly `DEPENDABOT_PAT` (case-sensitive match)
- ✅ The workflow references it as `${{ secrets.DEPENDABOT_PAT }}`

## Current Workflow

```yaml
name: Update lockfile for dependabot

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: write
  pull-requests: write

jobs:
  update-lockfile:
    name: Update bun.lock for dependabot PRs
    if: github.event.pull_request.user.login == 'dependabot[bot]'
    runs-on: ubuntu-latest
    steps:
      - name: Check for PAT secret
        env:
          PAT: ${{ secrets.DEPENDABOT_PAT }}
        run: |
          if [ -z "$PAT" ]; then
            echo "::error::DEPENDABOT_PAT secret is required..."
            exit 1
          fi
      - name: Checkout repository
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          ref: ${{ github.head_ref }}
          fetch-depth: 0
          token: ${{ secrets.DEPENDABOT_PAT }}
          persist-credentials: false
      # ... rest of workflow
```

## Error Output

```
Run if [ -z "$PAT" ]; then
Error: DEPENDABOT_PAT secret is required to trigger CI workflows after lockfile update.
Error: Please create a Personal Access Token with 'repo' and 'workflow' permissions and add it as a Dependabot secret named 'DEPENDABOT_PAT' (not a regular Actions secret).
Error: Process completed with exit code 1.
```

## What We've Verified

1. ✅ Secret exists in **Dependabot secrets** (not Actions secrets)
2. ✅ Secret name is exactly `DEPENDABOT_PAT`
3. ✅ Workflow is triggered by a Dependabot PR (`github.event.pull_request.user.login == 'dependabot[bot]'`)
4. ✅ Workflow uses `pull_request` event (not `pull_request_target`)

## Questions

1. **Are there any known issues with Dependabot secrets not being accessible in `pull_request` workflows?**
   - Should we be using `pull_request_target` instead?
   - Are there repository settings that need to be enabled?

2. **Is there a delay or propagation time for Dependabot secrets?**
   - The secret was just created - could there be a caching/propagation issue?

3. **Are there any permission or visibility requirements?**
   - Does the repository need to be in an organization with specific settings?
   - Are there any branch protection or workflow permission settings that could block this?

4. **Is the syntax correct?**
   - Should we be using a different way to reference Dependabot secrets?
   - Is there a difference between how Dependabot secrets are accessed vs Actions secrets?

5. **Alternative approaches:**
   - Should we use `pull_request_target` with careful permissions instead?
   - Is there a way to verify the secret is accessible before the workflow runs?
   - Should we use a different event trigger?

## Repository Details

- **Repository type**: Personal repository (not organization)
- **Dependabot version**: v2 (using `.github/dependabot.yml`)
- **Workflow trigger**: `pull_request` event
- **Secret location**: Settings → Secrets and variables → Dependabot → `DEPENDABOT_PAT`

## What We've Tried

- Verified secret is in Dependabot secrets (not Actions)
- Verified exact name match (`DEPENDABOT_PAT`)
- Checked that workflow is triggered by Dependabot PRs
- Used environment variable approach for checking the secret

Any insights into why Dependabot secrets might not be accessible, or alternative approaches that work reliably, would be greatly appreciated!
