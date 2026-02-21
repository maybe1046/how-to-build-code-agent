import chalk from "chalk";
import ora, { type Ora } from "ora";

let spinner: Ora | null = null;

/** Display a styled user input prompt and return the symbol */
export function userPrompt(): string {
  return chalk.green.bold("> ");
}

/** Display a styled assistant response */
export function assistantOutput(text: string): void {
  console.log(chalk.cyan(text));
}

/** Start a loading spinner with an optional message */
export function startSpinner(message = "Thinking..."): void {
  spinner = ora(message).start();
}

/** Stop the current spinner */
export function stopSpinner(): void {
  if (spinner) {
    spinner.stop();
    spinner = null;
  }
}

/** Display a tool invocation (tool name + brief summary) */
export function toolInvocation(toolName: string, summary: string): void {
  console.log(chalk.yellow(`⚡ ${toolName}: ${summary}`));
}

/** Display an error message in red */
export function errorDisplay(message: string): void {
  console.error(chalk.red(`Error: ${message}`));
}
