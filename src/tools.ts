import Anthropic from "@anthropic-ai/sdk";

export type ToolFunction<TInput> = (input: TInput) => Promise<string>;

export interface ToolDefinition<TInput extends Record<string, unknown>> {
  name: string;
  description: string;
  inputSchema: Anthropic.Tool.InputSchema;
  execute: ToolFunction<TInput>;
}

export type AnyToolDefinition = ToolDefinition<Record<string, unknown>>;

const tools: AnyToolDefinition[] = [];

export function registerTool<TInput extends Record<string, unknown>>(
  tool: ToolDefinition<TInput>
): void {
  tools.push(tool as AnyToolDefinition);
}

export function getTools(): AnyToolDefinition[] {
  return tools;
}

export function getToolDefinitions(): Anthropic.Tool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  }));
}

export function findTool(name: string): AnyToolDefinition | undefined {
  return tools.find((tool) => tool.name === name);
}
