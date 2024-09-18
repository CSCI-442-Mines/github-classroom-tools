# GitHub Classroom Fixes

[![Release Status](https://img.shields.io/github/actions/workflow/status/CSCI-442-Mines/github-classroom-fixes/release.yml?label=Release&style=flat-square)](https://github.com/CSCI-442-Mines/github-classroom-fixes/actions/workflows/release.yml)

## Documentation

### Setup

1. Download the [lastest pre-built binary](https://github.com/CSCI-442-Mines/github-classroom-fixes/releases/latest) (if running as an end user) or install [Deno](https://deno.land/) (if running as a developer)
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

### Global Options

| CLI Option            | Environment Variable | Description                               | Required |
| --------------------- | -------------------- | ----------------------------------------- | -------- |
| `--github-token`      | `GITHUB_TOKEN`       | GitHub Fine-Grained Personal Access Token | Yes      |
| `--organization-name` | `ORGANIZATION_NAME`  | GitHub organization name                  | Yes      |

5. Run the tool
   - Pre-built binary: `./dist/<tool name>.<target platform triple>` (e.g.: `./dist/fix-collaborators.x86_64-unknown-linux-gnu`)
   - With Deno: `deno run --allow-env --allow-net --allow-read src/tools/<tool name>.ts` (e.g.: `deno run --allow-env --allow-net src/tools/fix-collaborators.ts`)

## Tools

### `fix-collaborators`

This tool ensures that every student is a collaborator on their own repository. On September 17, 2024, [GitHub Classroom experienced a bug where students were not added as collaborators to their own repositories](https://github.com/orgs/community/discussions/138929). This tool fixes that issue.

### Tool-Specific Options

| CLI Option                      | Environment Variable          | Description                                                                                                                                                         | Required |
| ------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `--repository-username-pattern` | `REPOSITORY_USERNAME_PATTERN` | Repository username extraction pattern (This should be a JavaScript regular expression pattern with exactly one capturing group that captures the student username) | Yes      |
| `--repository-permission`       | `REPOSITORY_PERMISSION`       | Desired repository permission (This should be one of the following values: `pull`, `triage`, `push`, `maintain`, `admin`)                                           | Yes      |
