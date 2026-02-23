import Anthropic from "@anthropic-ai/sdk";
import * as fs from "node:fs/promises";
import { ToolDefinition } from "./tools";


type ReadFileInput = {
  path: string;
};

function generateSchema<T extends Record<string, unknown>>(params: {
  properties: Anthropic.Tool.InputSchema["properties"];
  required?: string[];
}): Anthropic.Tool.InputSchema {
  return {
    type: "object",
    properties: params.properties,
    required: params.required,
  };
}

const ReadFileInputSchema = generateSchema<ReadFileInput>({
  properties: {
    path: {
      type: "string",
      description: "The relative path of a file in the working directory.",
    },
  },
  required: ["path"],
});

async function ReadFile(input: string): Promise<string> {
  const readFileInput = JSON.parse(input) as ReadFileInput;
  const content = await fs.readFile(readFileInput.path, "utf-8");
  return content;
}

const ReadFileDefinition: ToolDefinition = {
  name: "read_file",
  description:
    "Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names.",
  inputSchema: ReadFileInputSchema,
  function: ReadFile,
};

void ReadFileDefinition;
