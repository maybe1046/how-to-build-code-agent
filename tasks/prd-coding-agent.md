# PRD: Code-Editing Agent

## Introduction

Build a minimal code-editing agent in TypeScript as a learning project to understand how LLM-powered coding agents work. The agent follows the architecture described in [How to Build an Agent](https://ampcode.com/notes/how-to-build-an-agent): an LLM, a loop, and enough tokens. It connects to the Anthropic Claude API, maintains a conversation history, and exposes three core tools (read file, list files, edit file) that Claude can invoke to interact with the local filesystem. The CLI uses a rich terminal UI with colors and spinners for a polished experience.

## Goals

- Understand the core architecture of an LLM-powered coding agent (loop, tools, context)
- Implement a working agent that can read, list, and edit files via Claude
- Learn how tool-use works with the Anthropic API (tool definitions, tool_use responses, tool_result messages)
- Provide a rich CLI experience with colored output and loading indicators
- Keep the codebase small and readable (target: under 500 lines of core logic)

## User Stories

### US-001: Set up project scaffolding
**Description:** As a developer, I want a properly configured TypeScript project so that I can build the agent with type safety and modern tooling.

**Acceptance Criteria:**
- [ ] `package.json` with project name, scripts (`build`, `start`, `dev`), and dependencies
- [ ] TypeScript configured with `tsconfig.json` (strict mode, ES modules)
- [ ] Anthropic SDK (`@anthropic-ai/sdk`) installed as a dependency
- [ ] A terminal UI library installed (e.g., `chalk` for colors, `ora` for spinners)
- [ ] Entry point file `src/index.ts` exists and runs without errors
- [ ] Typecheck passes with `tsc --noEmit`

### US-002: Implement the conversation loop
**Description:** As a user, I want to type messages and get responses from Claude so that I can have an interactive coding session.

**Acceptance Criteria:**
- [ ] Agent reads user input from stdin (using `readline` or similar)
- [ ] User input is appended to a `messages` array as a `user` role message
- [ ] Full conversation history is sent to the Anthropic API on each turn
- [ ] Claude's response is displayed in the terminal with distinct styling (e.g., colored text)
- [ ] Loop continues until the user types `exit` or `quit`
- [ ] API key is read from the `ANTHROPIC_API_KEY` environment variable
- [ ] Graceful error message if the API key is missing

### US-003: Implement the tool execution framework
**Description:** As a developer, I want a tool registry system so that Claude can invoke tools and receive results.

**Acceptance Criteria:**
- [ ] Tools are defined with: name, description, input schema (JSON Schema), and an execute function
- [ ] Tool definitions are passed to the Anthropic API in the correct format
- [ ] When Claude responds with a `tool_use` content block, the agent finds the matching tool by name
- [ ] Tool input parameters are passed to the execute function
- [ ] Tool results are sent back to Claude as a `tool_result` message with the correct `tool_use_id`
- [ ] If Claude responds with multiple `tool_use` blocks, all are executed and results returned
- [ ] The loop continues after tool results so Claude can respond with its final answer
- [ ] Typecheck passes

### US-004: Implement the `read_file` tool
**Description:** As a user, I want Claude to read files from my project so that it can understand my code.

**Acceptance Criteria:**
- [ ] Tool name: `read_file`
- [ ] Input schema: `{ file_path: string }` (relative path)
- [ ] Reads file contents from disk and returns them as a string
- [ ] Returns a clear error message if the file does not exist
- [ ] Returns a clear error message if the path is a directory
- [ ] Typecheck passes

### US-005: Implement the `list_files` tool
**Description:** As a user, I want Claude to list directory contents so that it can discover project structure.

**Acceptance Criteria:**
- [ ] Tool name: `list_files`
- [ ] Input schema: `{ path?: string }` (optional, defaults to current working directory)
- [ ] Returns a JSON array of file and directory names
- [ ] Directories are indicated with a trailing `/`
- [ ] Returns a clear error message if the path does not exist
- [ ] Typecheck passes

### US-006: Implement the `edit_file` tool
**Description:** As a user, I want Claude to edit files so that it can make code changes for me.

**Acceptance Criteria:**
- [ ] Tool name: `edit_file`
- [ ] Input schema: `{ file_path: string, old_string: string, new_string: string }`
- [ ] Replaces the first occurrence of `old_string` with `new_string` in the file
- [ ] If `old_string` is empty and the file does not exist, creates the file with `new_string` as content
- [ ] Returns an error if `old_string` is not found in the file
- [ ] Returns an error if `old_string` appears more than once (ambiguous edit)
- [ ] Returns a success message describing what was changed
- [ ] Typecheck passes

### US-007: Add rich terminal UI
**Description:** As a user, I want a polished CLI experience with colors and spinners so that the agent feels responsive and easy to use.

**Acceptance Criteria:**
- [ ] User input prompt is visually distinct (e.g., `>` with color)
- [ ] Claude's text responses are styled differently from user input (e.g., different color)
- [ ] A spinner/loading indicator is shown while waiting for the API response
- [ ] Tool invocations are displayed with the tool name and a brief summary (e.g., "Reading file: src/index.ts")
- [ ] Errors are displayed in red
- [ ] Typecheck passes

## Functional Requirements

- FR-1: The agent must maintain a `messages` array containing the full conversation history and send it with every API call
- FR-2: The agent must use the Anthropic SDK to call the Claude API with model `claude-sonnet-4-20250514` (or similar current model)
- FR-3: The agent must set `max_tokens` to 4096 per API response
- FR-4: The agent must include a system prompt that instructs Claude it is a helpful coding assistant with access to file tools
- FR-5: The agent must detect `tool_use` content blocks in Claude's response and execute the corresponding tool
- FR-6: The agent must send `tool_result` messages back to Claude with the tool output and the matching `tool_use_id`
- FR-7: The agent must continue the loop after tool results until Claude produces a text response (no more tool calls)
- FR-8: All file paths must be resolved relative to the current working directory
- FR-9: The agent must handle API errors gracefully and display them to the user without crashing

## Non-Goals

- No streaming responses (batch responses only for simplicity)
- No support for multiple LLM providers — Anthropic Claude only
- No persistent conversation history across sessions
- No configuration file or settings
- No shell command execution tool (security concern, out of learning scope)
- No context window management or conversation truncation
- No automated tests (this is a learning project)
- No support for image or non-text file reading

## Technical Considerations

- **Runtime:** Node.js 18+ with ES modules
- **Key dependency:** `@anthropic-ai/sdk` for the Claude API
- **Terminal UI:** `chalk` for colors, `ora` for spinners (lightweight choices)
- **Input handling:** Node.js built-in `readline` module
- **File operations:** Node.js built-in `fs/promises` module
- **Project structure:**
  ```
  src/
    index.ts        — Entry point, conversation loop, input handling
    tools.ts        — Tool definitions and execution functions
    ui.ts           — Terminal UI helpers (colors, spinners, formatting)
  ```

## Success Metrics

- The agent can read a file, understand its contents, and answer questions about it
- The agent can list files in a directory and navigate the project structure
- The agent can create a new file from scratch when asked
- The agent can make targeted edits to existing files (find-and-replace)
- The full codebase is under 500 lines of TypeScript (excluding config files)
- A developer new to agents can read and understand the code in one sitting

## Open Questions

- Should the agent support streaming responses in a future iteration for better UX?
- Should there be a `--verbose` flag to show raw API request/response for learning purposes?
- What model version string should be used — a fixed version or `latest` alias?
