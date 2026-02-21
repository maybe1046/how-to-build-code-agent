import * as fs from "node:fs/promises";
import * as path from "node:path";
import { registerTool } from "./tools.js";

registerTool({
  name: "edit_file",
  description:
    "Edit a file by replacing the first occurrence of old_string with new_string. If old_string is empty and the file does not exist, creates the file with new_string as content. The file path is resolved relative to the current working directory.",
  inputSchema: {
    type: "object",
    properties: {
      file_path: {
        type: "string",
        description: "The relative path of the file to edit",
      },
      old_string: {
        type: "string",
        description:
          "The string to find and replace. If empty and the file does not exist, the file will be created.",
      },
      new_string: {
        type: "string",
        description: "The string to replace old_string with, or the content for a new file",
      },
    },
    required: ["file_path", "old_string", "new_string"],
  },
  async execute(input) {
    const filePath = path.resolve(process.cwd(), input.file_path as string);
    const oldString = input.old_string as string;
    const newString = input.new_string as string;

    // If old_string is empty, this is a file creation request
    if (oldString === "") {
      let exists = true;
      try {
        await fs.stat(filePath);
      } catch {
        exists = false;
      }

      if (exists) {
        return `Error: old_string is empty but file already exists: ${input.file_path}`;
      }

      // Create parent directories if needed
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, newString, "utf-8");
      return `Created file: ${input.file_path}`;
    }

    // Read existing file
    let content: string;
    try {
      content = await fs.readFile(filePath, "utf-8");
    } catch {
      return `Error: File not found: ${input.file_path}`;
    }

    // Check how many times old_string appears
    const occurrences = content.split(oldString).length - 1;

    if (occurrences === 0) {
      return `Error: old_string not found in file: ${input.file_path}`;
    }

    if (occurrences > 1) {
      return `Error: old_string appears ${occurrences} times in file. The edit must be unambiguous — provide a more specific old_string.`;
    }

    // Replace the single occurrence
    const newContent = content.replace(oldString, newString);
    await fs.writeFile(filePath, newContent, "utf-8");

    return `Successfully edited ${input.file_path}: replaced 1 occurrence of the specified string.`;
  },
});
