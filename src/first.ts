import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

async function main() {
  const client = new Anthropic();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const getUserMessage = (): Promise<string | null> =>
    new Promise((resolve) => {
      rl.question("", (line) => {
        resolve(line ?? null);
      });
      rl.once("close", () => resolve(null));
    });

  const agent = new Agent(client, getUserMessage);

  try {
    await agent.run();
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
  } finally {
    rl.close();
  }
}

class Agent {
  private client: Anthropic;
  private getUserMessage: () => Promise<string | null>;

  constructor(
    client: Anthropic,
    getUserMessage: () => Promise<string | null>
  ) {
    this.client = client;
    this.getUserMessage = getUserMessage;
  }

  async run(): Promise<void> {
    const conversation: Anthropic.MessageParam[] = [];

    console.log("Chat with Claude (use 'ctrl-c' to quit)");

    while (true) {
      process.stdout.write("\u001b[94mYou\u001b[0m: ");
      const userInput = await this.getUserMessage();
      if (userInput === null) break;

      conversation.push({ role: "user", content: userInput });

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
    conversation: Anthropic.MessageParam[]
  ): Promise<Anthropic.Message> {
    return this.client.messages.create({
      model: "claude-3-7-sonnet-latest",
      max_tokens: 1024,
      messages: conversation,
    });
  }
}

main();
