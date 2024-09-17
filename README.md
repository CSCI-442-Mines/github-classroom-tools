# GitHub Classroom Fixes

## Documentation

### Setup

1. Install [Deno](https://deno.land/)
2. Ensure the [GitHub organization allows for Fine-Grained Personal Access Tokens](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/setting-a-personal-access-token-policy-for-your-organization)
3. Create a [GitHub Fine-Grained Personal Access Token](https://github.com/settings/tokens?type=beta) for the organization
   - Token name: `GitHub Classroom Fix`
   - Expiration: next day (or as desired, but no longer than necessary)
   - Resource owner: [organization name]
   - Repository access: `All repositories`
   - Repository permissions
     - Administration: `Read and write`
     - Metadata: `Read-only`
   - Organization permissions (none)
4. Create a `.env` file like the following:

   ```ini
   ORGANIZATION_NAME = "CSCI-442-Mines"
   TOKEN = "github_pat_xyz"

   # Only required for fix-collaborators.ts
   FIX_COLLABORATORS_REPOSITORY_USERNAME_PATTERN = "^f24-project-2-(.+)$"
   FIX_COLLABORATORS_REPOSITORY_PERMISSION = "push"
   ```

### Global Variables

- `ORGANIZATION_NAME`: GitHub organization name
- `TOKEN`: GitHub Fine-Grained Personal Access Token

5. Run the script with Deno: `deno run --allow-env --allow-net src/scripts/<script name>` (e.g.: `deno run --allow-env --allow-net src/fix-collaborators.ts`)

## Scripts

### `fix-collaborators.ts`

This script ensures that every student is a collaborator on their own repository. In September 2024, GitHub Classroom experienced a bug where students were not added as collaborators to their own repositories. This script fixes that issue.

### Variables

- `FIX_COLLABORATORS_REPOSITORY_USERNAME_PATTERN`: repository username extraction pattern (This should be a JavaScript regular expression pattern with exactly one capturing group that captures the student username)
- `FIX_COLLABORATORS_REPOSITORY_PERMISSION`: desired repository permission (This should be one of the following values: `pull`, `triage`, `push`, `maintain`, `admin`)