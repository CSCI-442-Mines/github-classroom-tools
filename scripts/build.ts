#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run=deno

/**
 * @file Build script
 */

import { ArgumentValue, Command } from "@cliffy/command";
import { emptyDir, expandGlob } from "@std/fs";
import { basename, join } from "@std/path";

/**
 * Supported build targets
 */
const TARGETS = [
  "x86_64-unknown-linux-gnu",
  "aarch64-unknown-linux-gnu",
  "x86_64-pc-windows-msvc",
  "x86_64-apple-darwin",
  "aarch64-apple-darwin",
];

/**
 * The absolute path of the directory containing the current module
 */
const dirname = import.meta.dirname;

if (dirname === undefined) {
  throw new Error("Run this script using `deno run`");
}

/**
 * The absolute path of the root directory
 */
const root = join(dirname, "..");

await new Command()
  .name("build")
  .description("Build script")
  .type("targets", ({ label, name, value }: ArgumentValue) => {
    if (TARGETS.includes(value)) {
      return [value];
    }

    if (value === "all") {
      return TARGETS;
    }

    throw new Error(
      `${label} "${name}" must be a valid target, but got "${value} Possible values are: ${TARGETS.join(
        ", "
      )}, or all (to build for all targets)`
    );
  })
  .option("--input-glob <input:string>", "Input glob", {
    default: "src/tools/**/*.ts",
    required: true,
  })
  .option("--output-dir <output-dir:string>", "Output directory", {
    default: "dist",
    required: true,
  })
  .option("--targets <targets:targets>", "Targets")
  .action(async function (rawArgs) {
    // Parse and validate the options
    if (rawArgs.targets === undefined) {
      rawArgs.targets = [Deno.build.target];
    }

    for (const [key, value] of Object.entries({
      inputGlob: rawArgs.inputGlob,
      outputDir: rawArgs.outputDir,
      targets: rawArgs.targets,
    })) {
      if (value === undefined) {
        console.error(`Missing required option: ${key}`);
        this.showHelp();
        Deno.exit(1);
      }
    }

    const { inputGlob, outputDir, targets } = rawArgs as Required<
      typeof rawArgs
    >;

    // Ensure the output directory exists and is empty
    await emptyDir(join(root, outputDir));

    // Get all tools
    const toolEntries = await Array.fromAsync(
      expandGlob(join(root, inputGlob))
    );

    // Compute every tool-target pair
    const toolTargetEntries = toolEntries.flatMap((toolEntry) =>
      targets.map((target) => ({ toolEntry, target }))
    );

    // Compile each tool
    for (const { toolEntry, target } of toolTargetEntries) {
      // Log
      console.info(`Compiling ${toolEntry.name} for ${target ?? "host"}...`);

      // Generate the arguments
      const args = ["compile", "--allow-env", "--allow-net", "--allow-read"];

      if (target !== undefined) {
        args.push("--target", target);
      }

      args.push(
        "--output",
        join(
          root,
          outputDir,
          `${basename(toolEntry.name, ".ts")}${
            target !== undefined ? `.${target}` : ""
          }`
        )
      );
      args.push(toolEntry.path);

      // Compile the tool
      const command = new Deno.Command("deno", {
        args,
        cwd: root,
        stdout: "inherit",
        stderr: "inherit",
      });

      // Run the command
      const subprocess = await command.spawn();
      const status = await subprocess.status;

      // Check the status
      if (!status.success) {
        throw new Error(`Failed to compile ${toolEntry.name}`);
      }
    }
  })
  .parse(Deno.args);
