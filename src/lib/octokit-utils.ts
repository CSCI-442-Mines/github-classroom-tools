/**
 * @file OctoKit utilities
 */

// Imports
import { Octokit } from "@octokit/rest";
import { components } from "@octokit/openapi-types";
import {
  RepositoryCollaboratorPermission,
  RepositoryCollaboratorPermissionValues,
} from "./octokit-types.ts";

/**
 * Pagination size
 *
 * This should be the maximum number of items to request in a single page
 */
const PAGE_SIZE = 100;

/**
 * Check if a permission satisfies the required permission
 * @param permissions Repository permissions
 * @param requiredPermission Required permission
 * @returns Whether the permission satisfies the required permission
 */
export const checkRepositoryCollaboratorPermission = (
  permissions: components["schemas"]["collaborator"]["permissions"],
  requiredPermission: RepositoryCollaboratorPermission
) => {
  if (permissions === undefined) {
    return false;
  }

  return (
    RepositoryCollaboratorPermissionValues.findLastIndex(
      (permission) => permissions[permission]
    ) >= RepositoryCollaboratorPermissionValues.indexOf(requiredPermission)
  );
};

/**
 * Get all repositories in the organization
 * @param organizationName Organization name
 * @param octokit Octokit instance
 * @returns Repositories
 */
export const getOrganizationRepositories = async (
  organizationName: string,
  octokit: Octokit
) => {
  /**
   * Repositories accumulator
   */
  const repositories = [];

  /**
   * Page number
   */
  let page = 1;

  while (true) {
    const response = await octokit.request("GET /orgs/{org}/repos", {
      org: organizationName,
      per_page: PAGE_SIZE,
      page: page++,
    });

    // Log
    console.debug(
      `Fetched ${response.data.length} repositories... (${repositories.length} total)`
    );

    if (response.data.length === 0) {
      break;
    }

    repositories.push(...response.data);
  }

  return repositories;
};

/**
 * Get all collaborators for a repository
 * @param ownerName Owner name
 * @param repositoryName Repository name
 * @param octokit Octokit instance
 * @returns Collaborators
 */
export const getRepositoryCollaborators = async (
  ownerName: string,
  repositoryName: string,
  octokit: Octokit
) => {
  /**
   * Collaborators accumulator
   */
  const collaborators = [];

  /**
   * Page number
   */
  let page = 1;

  while (true) {
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/collaborators",
      {
        owner: ownerName,
        repo: repositoryName,
        per_page: PAGE_SIZE,
        page: page++,
      }
    );

    // Log
    console.debug(
      `Fetched ${response.data.length} collaborators... (${collaborators.length} total)`
    );

    if (response.data.length === 0) {
      break;
    }

    collaborators.push(...response.data);
  }

  return collaborators;
};
