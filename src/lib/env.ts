/**
 * @file Environment variables
 */

// Imports
import "jsr:@std/dotenv/load";

/**
 * Get an environment variable
 * @param name Environment variable name
 * @returns Environment variable value
 */
const getVar = (name: string): string => {
  const value = Deno.env.get(name);

  if (value === undefined) {
    throw new Error(`${name} is not set`);
  }

  return value;
};

/**
 * GitHub organization name
 */
const ORGANIZATION_NAME = getVar("ORGANIZATION_NAME");

/**
 * GitHub token
 */
const TOKEN = getVar("TOKEN");

export { getVar, ORGANIZATION_NAME, TOKEN };
