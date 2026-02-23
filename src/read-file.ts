import * as fs from "node:fs/promises";
import * as path from "node:path";
import { registerTool } from "./tools.js";

type ReadFileInput = {
  file_path: string;
};

registerTool<ReadFileInput>({
  name: "read_file",
  description:
    "Read the contents of a file at the given path. The path is resolved relative to the current working directory.",
  inputSchema: {
    type: "object",
    properties: {
      file_path: {
        type: "string",
        description: "The relative path of the file to read",
      },
    },
    required: ["file_path"],
  },
  async execute(input) {
    const filePath = path.resolve(process.cwd(), input.file_path);

    let stat;
    try {
      stat = await fs.stat(filePath);
    } catch {
      return `Error: File not found: ${input.file_path}`;
    }

    if (stat.isDirectory()) {
      return `Error: Path is a directory, not a file: ${input.file_path}`;
    }

    const content = await fs.readFile(filePath, "utf-8");
    return content;
  },
});
