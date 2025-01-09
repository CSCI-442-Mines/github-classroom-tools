/**
 * @file Tool to create GitHub Classroom roster CSV by scraping Canvas
 */

// Imports
import "@std/dotenv/load";
import { Command } from "@cliffy/command";
import { parse, stringify } from "@std/csv";
import { CanvasApi } from "@kth/canvas-api";

/**
 * Name column identifier
 */
const NAME_COLUMN = "name";

await new Command()
  .name("create-roster")
  .description("Tool to create GitHub Classroom roster CSV by scraping Canvas")
  .env("CANVAS_URL=<url:string>", "Canvas API URL")
  .env("CANVAS_TOKEN=<token:string>", "Canvas API URL")
  .env("CANVAS_COURSE_ID=<course_id:string>", "Canvas course ID")
  .env(
    "CANVAS_ENROLLMENT_TYPES=<enrollment_types:string[]>",
    "Canvas enrollment types"
  )
  .env(
    "CANVAS_ENROLLMENT_STATES=<enrollment_states:string[]>",
    "Canvas enrollment states"
  )
  .env(
    "EXISTING_ROSTER=<existing_roster:string>",
    "Existing roster CSV file path"
  )
  .env("OUTPUT_ROSTER=<output_roster:string>", "Output roster CSV file path")
  .option("--canvas-url <url:string>", "Canvas instance URL")
  .option("--canvas-token <token:string>", "Canvas token")
  .option("--canvas-course-id <course_id:string>", "Canvas course ID")
  .option(
    "--canvas-enrollment-types [enrollment_types:string[]]",
    "Canvas enrollment types"
  )
  .option(
    "--canvas-enrollment-states [enrollment_states:string[]]",
    "Canvas enrollment states"
  )
  .option(
    "--existing-roster [existing_roster:string]",
    "Existing roster CSV file path"
  )
  .option(
    "--output-roster [output_roster:string]",
    "Output roster CSV file path"
  )
  .action(async function (rawArgs) {
    // Defaults
    rawArgs.canvasEnrollmentStates ??= ["active"];
    rawArgs.canvasEnrollmentTypes ??= ["student"];
    rawArgs.outputRoster ??= "roster.csv";

    // Parse and validate the options
    for (const [key, value] of Object.entries({
      canvasUrl: rawArgs.canvasUrl,
      canvasToken: rawArgs.canvasToken,
      canvasCourseId: rawArgs.canvasCourseId,
      canvasEnrollmentTypes: rawArgs.canvasEnrollmentTypes,
      canvasEnrollmentStates: rawArgs.canvasEnrollmentStates,
      outputRoster: rawArgs.outputRoster,
    })) {
      if (value === undefined) {
        console.error(`Missing required option: ${key}`);
        this.showHelp();
        Deno.exit(1);
      }
    }

    const {
      canvasUrl,
      canvasToken,
      canvasCourseId,
      canvasEnrollmentTypes,
      canvasEnrollmentStates,
      existingRoster,
      outputRoster,
    } = rawArgs as {
      canvasUrl: string;
      canvasToken: string;
      canvasCourseId: string;
      canvasEnrollmentTypes: string[];
      canvasEnrollmentStates: string[];
      existingRoster?: string;
      outputRoster: string;
    };

    // Get the existing names
    const existingNames = new Set<string>();

    if (existingRoster !== undefined) {
      const rawExistingRoster = await Deno.readTextFile(existingRoster);
      const parsedExistingRoster = parse(rawExistingRoster, {
        skipFirstRow: false,
      });

      if (parsedExistingRoster.length === 0) {
        throw new Error("The existing roster is empty");
      }

      // Find the name column
      const nameColumnIndex = parsedExistingRoster[0].findIndex(
        (column) => column.toLowerCase().trim() === NAME_COLUMN
      );

      if (nameColumnIndex === -1) {
        throw new Error(
          `The existing roster does not have a "${NAME_COLUMN}" column`
        );
      }

      // Extract the names
      for (let i = 1; i < parsedExistingRoster.length; i++) {
        existingNames.add(parsedExistingRoster[i][nameColumnIndex]);
      }
    }

    // Initialize the Canvas API instance
    const canvasApi = new CanvasApi(canvasUrl, canvasToken);

    // Get all users in the course (See https://canvas.instructure.com/doc/api/courses.html#method.courses.users)
    const getCourseUsersResponse = (
      await canvasApi
        .listItems(`/api/v1/courses/${canvasCourseId}/users`, {
          enrollment_type: canvasEnrollmentTypes,
          enrollment_state: canvasEnrollmentStates,
        })
        .toArray()
    ).toSorted() as {
      created_at: string;
      email: string;
      id: number;
      name: string;
      short_name: string;
      sortable_name: string;
    }[];

    // Create the CSV
    const csv = [];

    for (const user of getCourseUsersResponse) {
      // Check if the user is already in the roster
      if (
        existingNames.has(user.name) ||
        existingNames.has(user.short_name) ||
        existingNames.has(user.sortable_name)
      ) {
        // Log
        console.debug(
          `Skipping user: ${user.name}/${user.short_name}/${user.sortable_name} (Already in roster)...`
        );

        continue;
      }

      // Add the user to the roster
      csv.push({
        [NAME_COLUMN]: user.name,
      });

      // Log
      console.info(`Added user: ${user.name}`);
    }

    // Stringify the CSV
    const stringifiedCsv = stringify(csv, {
      columns: [NAME_COLUMN],
      headers: false,
    });

    // Save the CSV
    await Deno.writeTextFile(outputRoster, stringifiedCsv);
  })
  .parse(Deno.args);
