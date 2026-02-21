import * as fs from "node:fs/promises";
import * as path from "node:path";
import { registerTool } from "./tools.js";

registerTool({
  name: "list_files",
  description:
    "List the contents of a directory. Returns a JSON array of file and directory names. Directories have a trailing /. Path is resolved relative to the current working directory. Defaults to the current working directory if no path is provided.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description:
          "The relative path of the directory to list (optional, defaults to current working directory)",
      },
    },
  },
  async execute(input) {
    const dirPath = path.resolve(
      process.cwd(),
      (input.path as string) || "."
    );

    let stat;
    try {
      stat = await fs.stat(dirPath);
    } catch {
      return `Error: Path does not exist: ${input.path || "."}`;
    }

    if (!stat.isDirectory()) {
      return `Error: Path is not a directory: ${input.path || "."}`;
    }

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const names = entries.map((entry) =>
      entry.isDirectory() ? `${entry.name}/` : entry.name
    );

    return JSON.stringify(names);
  },
});
