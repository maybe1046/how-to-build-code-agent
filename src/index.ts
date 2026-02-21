import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  userPrompt,
  assistantOutput,
  startSpinner,
  stopSpinner,
  toolInvocation,
  errorDisplay,
} from "./ui.js";
import { getToolDefinitions, findTool } from "./tools.js";
import "./read-file.js";
import "./list-files.js";
import "./edit-file.js";

async function main(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    errorDisplay(
      "ANTHROPIC_API_KEY environment variable is not set. Please set it and try again."
    );
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const messages: Anthropic.MessageParam[] = [];

  const rl = readline.createInterface({ input, output });

  console.log("Code Editing Agent - Ready");
  console.log('Type "exit" or "quit" to end the session.\n');

  while (true) {
    const userInput = await rl.question(userPrompt());

    if (
      userInput.trim().toLowerCase() === "exit" ||
      userInput.trim().toLowerCase() === "quit"
    ) {
      console.log("Goodbye!");
      rl.close();
      break;
    }

    if (!userInput.trim()) {
      continue;
    }

    messages.push({ role: "user", content: userInput });

    startSpinner();

    try {
      let response = await client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 8096,
        system:
          "You are a helpful coding assistant. Help the user with their coding tasks.",
        messages,
        tools: getToolDefinitions(),
      });

      stopSpinner();

      while (response.stop_reason === "tool_use") {
        const assistantContent = response.content;
        messages.push({ role: "assistant", content: assistantContent });

        // Display any text blocks and execute tool calls
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of assistantContent) {
          if (block.type === "text") {
            assistantOutput(block.text);
          } else if (block.type === "tool_use") {
            const tool = findTool(block.name);
            if (tool) {
              toolInvocation(block.name, JSON.stringify(block.input));
              try {
                const result = await tool.execute(
                  block.input as Record<string, unknown>
                );
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: result,
                });
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Tool execution failed";
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: message,
                  is_error: true,
                });
              }
            } else {
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: `Unknown tool: ${block.name}`,
                is_error: true,
              });
            }
          }
        }

        messages.push({ role: "user", content: toolResults });

        startSpinner();

        response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8096,
          system:
            "You are a helpful coding assistant. Help the user with their coding tasks.",
          messages,
          tools: getToolDefinitions(),
        });

        stopSpinner();
      }

      // Final response (text-only, stop_reason is "end_turn")
      const finalContent = response.content;
      messages.push({ role: "assistant", content: finalContent });

      for (const block of finalContent) {
        if (block.type === "text") {
          assistantOutput(block.text);
        }
      }
    } catch (error) {
      stopSpinner();
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      errorDisplay(message);
    }
  }
}

main();
