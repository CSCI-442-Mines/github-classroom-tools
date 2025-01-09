# GitHub Classroom Tools

[![Release Status](https://img.shields.io/github/actions/workflow/status/CSCI-442-Mines/github-classroom-tools/release.yml?label=Release&style=flat-square)](https://github.com/CSCI-442-Mines/github-classroom-tools/actions/workflows/release.yml)

## Documentation

### Setup

1. Download the [lastest pre-built binary](https://github.com/CSCI-442-Mines/github-classroom-tools/releases/latest) (if running as an end user) or install [Deno](https://deno.land/) (if running as a developer)
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
4. Run the tool
   - Pre-built binary: `./dist/<tool name>.<target platform triple>` (e.g.: `./dist/fix-collaborators.x86_64-unknown-linux-gnu`)
   - With Deno: `deno run --allow-env --allow-net --allow-read src/tools/<tool name>.ts` (e.g.: `deno run --allow-env --allow-net src/tools/fix-collaborators.ts`)

## Tools

### `create-roster`

This tool creates a [GitHub-classroom-compatible roster CSV file](https://docs.github.com/en/education/manage-coursework-with-github-classroom/teach-with-github-classroom/manage-classrooms#adding-students-to-the-roster-for-your-classroom) by scraping student information from Canvas and (optionally) de-duplicating it with an existing roster CSV file. While GitHub classroom has [native support for Canvas](https://docs.github.com/en/education/manage-coursework-with-github-classroom/teach-with-github-classroom/connect-a-learning-management-system-course-to-a-classroom#linking-a-canvas-course-with-a-classroom), it requires the Canvas administrator to perform certain actions. This tool works around this limitation.

#### Tool-Specific Options

| CLI Option                   | Environment Variable       | Description                                                                                                                                | Required/Default |
| ---------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| `--canvas-url`               | `CANVAS_URL`               | Canvas instance URL (e.g.: `https://canvas.instructure.com`)                                                                               | Required         |
| `--canvas-token`             | `CANVAS_TOKEN`             | [Canvas API token](https://canvas.instructure.com/doc/api/file.oauth.html#manual-token-generation)                                         | Required         |
| `--canvas-course-id`         | `CANVAS_COURSE_ID`         | Canvas course ID (e.g.: the `12345` in `https://canvas.instructure.com/courses/12345`)                                                     | Required         |
| `--canvas-enrollment-types`  | `CANVAS_ENROLLMENT_TYPES`  | Canvas enrollment types (one or more of `teacher`, `student`, `student_view`, `ta`, `observer`, or `designer`)                             | [`student`]      |
| `--canvas-enrollment-states` | `CANVAS_ENROLLMENT_STATES` | Canvas enrollment states (one or more of `active`, `invited`, `rejected`, `completed`, or `inactive`)                                      | [`active`]       |
| `--existing-roster`          | `EXISTING_ROSTER`          | Existing roster CSV file path. Note that this can either be in the `"name"` or `"identifier","github_username","github_id","name"` format. | Optional         |
| --`output-roster`            | `OUTPUT_ROSTER`            | Output roster CSV file path                                                                                                                | `roster.csv`     |

### `fix-collaborators`

This tool ensures that every student is a collaborator on their own repository. On September 17, 2024, [GitHub Classroom experienced a bug where students were not added as collaborators to their own repositories](https://github.com/orgs/community/discussions/138929). This tool tools that issue.

#### Tool-Specific Options

| CLI Option                             | Environment Variable                 | Description                                                                                                                                                         | Required |
| -------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `--github-token`                       | `GITHUB_TOKEN`                       | GitHub Fine-Grained Personal Access Token                                                                                                                           | Required |
| `--github-organization-name`           | `GITHUB_ORGANIZATION_NAME`           | GitHub organization name                                                                                                                                            | Required |
| `--github-repository-username-pattern` | `GITHUB_REPOSITORY_USERNAME_PATTERN` | Repository username extraction pattern (This should be a JavaScript regular expression pattern with exactly one capturing group that captures the student username) | Required |
| `--github-repository-permission`       | `GITHUB_REPOSITORY_PERMISSION`       | Desired repository permission (This should be one of the following values: `pull`, `triage`, `push`, `maintain`, `admin`)                                           | Required |
