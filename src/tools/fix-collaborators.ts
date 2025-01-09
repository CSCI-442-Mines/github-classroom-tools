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
} from "../lib/octokit-types.ts";
import {
  checkRepositoryCollaboratorPermission,
  getOrganizationRepositories,
  getRepositoryCollaborators,
} from "../lib/octokit-utils.ts";

await new Command()
  .name("fix-collaborators")
  .description("Tool to fix GitHub Classroom collaborators")
  .type("permission", new EnumType(RepositoryCollaboratorPermissionValues))
  .env("GITHUB_TOKEN=<token:string>", "GitHub token")
  .env("GITHUB_ORGANIZATION_NAME=<name:string>", "GitHub organization name")
  .env(
    "GITHUB_REPOSITORY_USERNAME_PATTERN=<pattern:string>",
    "Repository username extraction pattern"
  )
  .env(
    "GITHUB_REPOSITORY_PERMISSION=<permission:permission>",
    "Desired repository permission"
  )
  .option("--github-token <token:string>", "GitHub token")
  .option(
    "--github-organization-name <name:string>",
    "GitHub organization name"
  )
  .option(
    "--github-repository-username-pattern <pattern:string>",
    "GitHub repository username extraction pattern"
  )
  .option(
    "--github-repository-permission <permission:permission>",
    "GitHub desired repository permission"
  )
  .action(async function (rawArgs) {
    // Parse and validate the options
    for (const [key, value] of Object.entries({
      githubToken: rawArgs.githubToken,
      githubOrganizationName: rawArgs.githubOrganizationName,
      githubRepositoryUsernamePattern: rawArgs.githubRepositoryUsernamePattern,
      githubRepositoryPermission: rawArgs.githubRepositoryPermission,
    })) {
      if (value === undefined) {
        console.error(`Missing required option: ${key}`);
        this.showHelp();
        Deno.exit(1);
      }
    }

    const {
      githubToken,
      githubOrganizationName,
      githubRepositoryUsernamePattern,
      githubRepositoryPermission,
    } = rawArgs as Required<typeof rawArgs>;

    const compiledRepositoryUsernamePattern = new RegExp(
      githubRepositoryUsernamePattern!
    );

    // Initialize Octokit
    const octokit = new Octokit({
      auth: githubToken,
    });

    // Get all repositories in the organization
    const repositories = await getOrganizationRepositories(
      githubOrganizationName,
      octokit
    );

    // Fix collaborators
    for (const repository of repositories) {
      // Extract the student username from the repository name
      const matches = compiledRepositoryUsernamePattern.exec(repository.name);

      if (matches === null || matches.length !== 2) {
        // Log
        console.debug(
          `Skipping repository ${repository.full_name} (No match)...`
        );

        continue;
      }

      const username = matches[1];

      // Get collaborators
      const collaborators = await getRepositoryCollaborators(
        githubOrganizationName,
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
          githubRepositoryPermission as RepositoryCollaboratorPermission
        )
      ) {
        // Log
        console.debug(
          `Skipping repository ${repository.full_name} (User ${username} already has the desired permission ${githubRepositoryPermission})...`
        );

        continue;
      }

      // Add the student as a collaborator
      await octokit.request(
        "PUT /repos/{owner}/{repo}/collaborators/{username}",
        {
          owner: githubOrganizationName,
          repo: repository.name,
          username,
          permission: githubRepositoryPermission,
        }
      );

      // Log
      console.info(
        `Fixed collaborators for repository ${repository.full_name}...`
      );
    }
  })
  .parse(Deno.args);
