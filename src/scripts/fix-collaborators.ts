/**
 * @file Fix GitHub Classroom collaborators
 */

// Imports
import { Octokit } from "npm:@octokit/rest@21.0.2";
import {
  checkRepositoryCollaboratorPermission,
  getOrganizationRepositories,
  getRepositoryCollaborators,
} from "../lib/utils.ts";
import {
  RepositoryCollaboratorPermission,
  RepositoryCollaboratorPermissionValues,
} from "../lib/types.ts";
import { getVar, ORGANIZATION_NAME, TOKEN } from "../lib/env.ts";

// Variables

/**
 * Repository username extraction pattern
 *
 * This should be a regular expression with exactly one capturing group that captures the student username
 */
const REPOSITORY_USERNAME_PATTERN = new RegExp(
  getVar("FIX_COLLABORATORS_REPOSITORY_USERNAME_PATTERN")
);

/**
 * Desired repository permission
 *
 * This should be one of the following values:
 * - `pull`
 * - `triage`
 * - `push`
 * - `maintain`
 * - `admin`
 */
const REPOSITORY_PERMISSION = getVar(
  "FIX_COLLABORATORS_REPOSITORY_PERMISSION"
) as RepositoryCollaboratorPermission;

if (!RepositoryCollaboratorPermissionValues.includes(REPOSITORY_PERMISSION)) {
  throw new Error(
    `Invalid repository permission: ${REPOSITORY_PERMISSION} (Must be one of ${RepositoryCollaboratorPermissionValues.join(
      ", "
    )})`
  );
}

// Main

// Initialize Octokit
const octokit = new Octokit({
  auth: TOKEN,
});

// Get all repositories in the organization
const repositories = await getOrganizationRepositories(
  ORGANIZATION_NAME,
  octokit
);

// Fix collaborators
for (const repository of repositories) {
  // Extract the student username from the repository name
  const matches = REPOSITORY_USERNAME_PATTERN.exec(repository.name);

  if (matches === null || matches.length !== 2) {
    // Log
    console.log(`Skipping repository ${repository.full_name}...`);

    continue;
  }

  const username = matches[1];

  // Get collaborators
  const collaborators = await getRepositoryCollaborators(
    ORGANIZATION_NAME,
    repository.name,
    octokit
  );

  // Get the student collaborator
  const collaborator = collaborators.find(
    (collaborator) => collaborator.login === username
  );

  // Skip if the student is already a collaborator with the correct permissions
  if (
    collaborator !== undefined &&
    checkRepositoryCollaboratorPermission(
      collaborator.permissions,
      REPOSITORY_PERMISSION
    )
  ) {
    // Log
    console.log(`Skipping repository ${repository.full_name}...`);

    continue;
  }

  // Add the student as a collaborator
  await octokit.request("PUT /repos/{owner}/{repo}/collaborators/{username}", {
    owner: ORGANIZATION_NAME,
    repo: repository.name,
    username,
    permission: REPOSITORY_PERMISSION,
  });

  // Log
  console.log(`Fixed collaborators for repository ${repository.full_name}...`);
}
