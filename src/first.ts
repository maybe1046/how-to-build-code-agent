import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";
import * as fs from "node:fs/promises";
import process from "process";

export type ToolFunction<TInput> = (input: TInput) => Promise<TInput>;

type UserMessage = [message: string, ok: boolean];
type GetUserMessage = () => UserMessage;

export interface ToolDefinition<TInput extends Record<string, unknown>> {
  name: string;
  description: string;
  inputSchema: Anthropic.Tool.InputSchema;
  function: ToolFunction<TInput>;
}

async function main() {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const getUserMessage: GetUserMessage = () => ["", false];

  const tools: ToolDefinition<Record<string, unknown>>[] = [];
  const agent = newAgent(client, getUserMessage, tools);

  try {
    await agent.run();
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
  } finally {
    rl.close();
  }
}

class Agent {
  client: Anthropic;
  getUserMessage: GetUserMessage;
  tools: ToolDefinition<Record<string, unknown>>[];

  constructor(
    client: Anthropic,
    getUserMessage: GetUserMessage,
    tools: ToolDefinition<Record<string, unknown>>[],
  ) {
    this.client = client;
    this.getUserMessage = getUserMessage;
    this.tools = tools;
  }

  async run(): Promise<void> {
    const conversation: Anthropic.MessageParam[] = [];

    console.log("Chat with Claude (use 'ctrl-c' to quit)");

    while (true) {
      process.stdout.write("\u001b[94mYou\u001b[0m: ");
      const userInput = await this.getUserMessage();
      if (!userInput[1]) break;

      conversation.push({ role: "user", content: userInput[0] });

      const message = await this.runInference(conversation);
      conversation.push({ role: "assistant", content: message.content });

      for (const block of message.content) {
        if (block.type === "text") {
          console.log(`\u001b[93mClaude\u001b[0m: ${block.text}`);
        }
      }
    }
  }

  private async runInference(
    conversation: Anthropic.MessageParam[],
  ): Promise<Anthropic.Message> {
    return this.client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: conversation,
    });
  }
}

function newAgent(
  client: Anthropic,
  getUserMessage: GetUserMessage,
  tools: ToolDefinition<Record<string, unknown>>[],
): Agent {
  return new Agent(client, getUserMessage, tools);
}

type ReadFileInput = {
  path: string;
};

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

const ReadFileDefinition: ToolDefinition<ReadFileInput> = {
  name: "read_file",
  description:
    "Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names.",
  inputSchema: ReadFileInputSchema,
  function: ReadFile,
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







main();
