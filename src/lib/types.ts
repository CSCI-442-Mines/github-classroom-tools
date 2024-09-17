/**
 * @file Types
 */

// Imports
import { components } from "npm:@octokit/openapi-types@22.2.0";

/**
 * GitHub repository permissions
 */
export type RepositoryCollaboratorPermission = keyof Required<
  components["schemas"]["collaborator"]
>["permissions"];

/**
 * GitHub repository permission values (in order of increasing permissions)
 */
export const RepositoryCollaboratorPermissionValues = [
  "pull",
  "triage",
  "push",
  "maintain",
  "admin",
] as RepositoryCollaboratorPermission[];
