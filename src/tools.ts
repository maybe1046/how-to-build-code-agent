import Anthropic from "@anthropic-ai/sdk";

export interface Tool {
  name: string;
  description: string;
  inputSchema: Anthropic.Tool.InputSchema;
  execute: (input: Record<string, unknown>) => Promise<string>;
}

const tools: Tool[] = [];

export function registerTool(tool: Tool): void {
  tools.push(tool);
}

export function getTools(): Tool[] {
  return tools;
}

export function getToolDefinitions(): Anthropic.Tool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  }));
}

export function findTool(name: string): Tool | undefined {
  return tools.find((tool) => tool.name === name);
}
