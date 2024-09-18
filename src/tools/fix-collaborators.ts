/**
 * @file Tool to fix GitHub Classroom collaborators
 */

// Imports
import "@std/dotenv/load";
import { Command, EnumType } from "@cliffy/command";
import { Octokit } from "@octokit/rest";
import {
  RepositoryCollaboratorPermission,
  RepositoryCollaboratorPermissionValues,
} from "../lib/types.ts";
import {
  checkRepositoryCollaboratorPermission,
  getOrganizationRepositories,
  getRepositoryCollaborators,
} from "../lib/utils.ts";

await new Command()
  .name("fix-collaborators")
  .description("Tool to fix GitHub Classroom collaborators")
  .type("permission", new EnumType(RepositoryCollaboratorPermissionValues))
  .env("GITHUB_TOKEN=<token:string>", "GitHub token")
  .env("ORGANIZATION_NAME=<name:string>", "GitHub organization name")
  .env(
    "REPOSITORY_USERNAME_PATTERN=<pattern:string>",
    "Repository username extraction pattern"
  )
  .env(
    "REPOSITORY_PERMISSION=<permission:permission>",
    "Desired repository permission"
  )
  .option("--github-token <token:string>", "GitHub token")
  .option("--organization-name <name:string>", "GitHub organization name")
  .option(
    "--repository-username-pattern <pattern:string>",
    "Repository username extraction pattern"
  )
  .option(
    "--repository-permission <permission:permission>",
    "Desired repository permission"
  )
  .action(async function (rawArgs) {
    // Parse and validate the options
    for (const [key, value] of Object.entries({
      githubToken: rawArgs.githubToken,
      organizationName: rawArgs.organizationName,
      repositoryUsernamePattern: rawArgs.repositoryUsernamePattern,
      repositoryPermission: rawArgs.repositoryPermission,
    })) {
      if (value === undefined) {
        console.error(`Missing required option: ${key}`);
        this.showHelp();
        Deno.exit(1);
      }
    }

    const {
      githubToken,
      organizationName,
      repositoryUsernamePattern,
      repositoryPermission,
    } = rawArgs as Required<typeof rawArgs>;

    const compiledRepositoryUsernamePattern = new RegExp(
      repositoryUsernamePattern!
    );

    // Initialize Octokit
    const octokit = new Octokit({
      auth: githubToken,
    });

    // Get all repositories in the organization
    const repositories = await getOrganizationRepositories(
      organizationName,
      octokit
    );

    // Fix collaborators
    for (const repository of repositories) {
      // Extract the student username from the repository name
      const matches = compiledRepositoryUsernamePattern.exec(repository.name);

      if (matches === null || matches.length !== 2) {
        // Log
        console.debug(
          `Skipping repository ${repository.full_name} (no match)...`
        );

        continue;
      }

      const username = matches[1];

      // Get collaborators
      const collaborators = await getRepositoryCollaborators(
        organizationName,
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
          repositoryPermission as RepositoryCollaboratorPermission
        )
      ) {
        // Log
        console.debug(
          `Skipping repository ${repository.full_name} (user ${username} already has the desired permission ${repositoryPermission})...`
        );

        continue;
      }

      // Add the student as a collaborator
      await octokit.request(
        "PUT /repos/{owner}/{repo}/collaborators/{username}",
        {
          owner: organizationName,
          repo: repository.name,
          username,
          permission: repositoryPermission,
        }
      );

      // Log
      console.info(
        `Fixed collaborators for repository ${repository.full_name}...`
      );
    }
  })
  .parse(Deno.args);
