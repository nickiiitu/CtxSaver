# CtxSaver 🧠

> *"Git tracks your code history. CtxSaver tracks your intent history."*

**Persistent AI coding context for teams.** Never re-explain your codebase to an AI assistant again.

## The Problem

You're deep in a Cursor session refactoring a payment service. You've explained the architecture, tried 3 approaches, finally found the right one. Session dies. Next morning — or worse, your teammate picks it up — and the AI has **zero memory**. You spend 15 min re-explaining everything. Every. Single. Time.

This is broken across **every** AI coding tool: Cursor, Claude Code, Copilot, Windsurf — none of them persist context across sessions, editors, or team members.

## The Solution

**CtxSaver** is a CLI tool that automatically captures and restores AI coding context, scoped to your repo and branch.

```bash
# Save context after a session
ctxsaver save "Refactoring payment service to use event sourcing"

# Restore context in any editor, any machine
ctxsaver resume
```

## Install

### Prerequisites
- Node.js 16+ and npm

### Setup
> **Note:** Not yet published to npm. Install locally from source:

```bash
git clone git@github.com:nickiiitu/CtxSaver.git
cd CtxSaver
npm install
npm run build
npm link        # makes `ctxsaver` available globally on your machine

# Verify installation
ctxsaver --version
```

Now **navigate to your project repo** to use CtxSaver:

```bash
cd /path/to/your/project
ctxsaver init
```

## Quick Start

```bash
# 1. Initialize in your repo
ctxsaver init

# 2. Work on your code... then save context
ctxsaver save
# → Interactive prompts capture: Task, Approaches, Decisions, Next Steps

# 3. Resume in ANY editor
ctxsaver resume
# → Copies a perfectly formatted prompt to your clipboard
# → Paste into Cursor, Claude, or ChatGPT to restore full context
```

## Features & Commands

### Core (No AI Key Required)
**These commands work locally with zero dependencies.**
| Command | Description |
|---------|-------------|
| `ctxsaver init` | Initialize CtxSaver in current repo |
| `ctxsaver save [msg]` | Save context (interactive or quick mode) |
| `ctxsaver save --auto` | Auto-save context from agent/editor logs (non-interactive) |
| `ctxsaver resume` | Generate AI prompt & copy to clipboard |
| `ctxsaver log` | View context history for current branch |
| `ctxsaver diff` | Show changes since last context save |

### Team & Automation (No AI Key Required)
| Command | Description |
|---------|-------------|
| `ctxsaver handoff @user` | explicit handoff note to a teammate |
| `ctxsaver share` | Commit `.ctxsaver/` folder to git for team sync |
| `ctxsaver watch` | Auto-save context on file changes (using `chokidar`) |
| `ctxsaver hook install` | Install git post-commit hook for auto-capture |

### AI-Powered (Experimental)
**Requires an LLM Provider.** Set via `CTXSAVER_AI_KEY` env var or `ctxsaver config set aiApiKey <key>`. Defaults to OpenAI-compatible API.
| Command | Description |
|---------|-------------|
| `ctxsaver summarize` | AI-generates context from git diff + recent commits |
| `ctxsaver suggest` | AI suggests next steps based on current context |
| `ctxsaver compress` | detailed history into a concise summary |

#### AI Commands Setup
To use `ctxsaver summarize`, `suggest`, or `compress`, configure your AI provider:

**Quick Setup for OpenAI (default):**
```bash
ctxsaver config set aiApiKey "your-openai-api-key"
ctxsaver config set aiModel "gpt-4o-mini"
# Provider defaults to https://api.openai.com/v1
```

**Quick Setup for Google Gemini (via OpenRouter):**
```bash
ctxsaver config set aiProvider "https://openrouter.ai/api/v1"
ctxsaver config set aiApiKey "your-openrouter-api-key"
ctxsaver config set aiModel "google/gemini-flash-1.5"
```

**Quick Setup for ChatGLM (via OpenRouter):**
```bash
ctxsaver config set aiProvider "https://openrouter.ai/api/v1"
ctxsaver config set aiApiKey "your-openrouter-api-key"
ctxsaver config set aiModel "zhipuai/glm-4"
```

**Configuration Commands:**
```bash
# View all settings
ctxsaver config list

# Get a specific config value
ctxsaver config get aiModel

# Set via environment variable (temporary)
export CTXSAVER_AI_KEY="your-api-key"
```

**Supported Providers:**
- **OpenAI** (default): `https://api.openai.com/v1`
- **Google Gemini** (via OpenRouter): `https://openrouter.ai/api/v1`
- **ChatGLM** (via OpenRouter): `https://openrouter.ai/api/v1`
- **Ollama** (local): `http://localhost:11434/v1` (no API key needed)
- **LM Studio** (local): `http://localhost:1234/v1` (no API key needed)
- **Together.ai**: `https://api.together.xyz/v1`
- Any OpenAI-compatible API endpoint

**Example: Using Ollama locally**
```bash
ctxsaver config set aiProvider "http://localhost:11434/v1"
ctxsaver config set aiModel "llama3"
# No API key needed for local models
```

**Example: Using Google Gemini via OpenRouter**
```bash
ctxsaver config set aiProvider "https://openrouter.ai/api/v1"
ctxsaver config set aiApiKey "your-openrouter-api-key"

# Try these Gemini model names:
ctxsaver config set aiModel "google/gemini-flash-1.5"
# or
ctxsaver config set aiModel "google/gemini-pro-1.5"
# or
ctxsaver config set aiModel "google/gemini-2.0-flash-exp"

# Check available models at: https://openrouter.ai/models
```

**Example: Using ChatGLM via OpenRouter**
```bash
ctxsaver config set aiProvider "https://openrouter.ai/api/v1"
ctxsaver config set aiApiKey "your-openrouter-api-key"
ctxsaver config set aiModel "zhipuai/glm-4"
# or
ctxsaver config set aiModel "zhipuai/glm-4-plus"
```

### Configuration
| Command | Description |
|---------|-------------|
| `ctxsaver config list` | View all configuration settings |
| `ctxsaver config get <key>` | Get a specific config value |
| `ctxsaver config set <key> <val>` | Set a configuration preference |

**Available Configuration Keys:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `aiApiKey` | string | - | API key for AI provider (or use `CTXSAVER_AI_KEY` env var) |
| `aiProvider` | string | `https://api.openai.com/v1` | OpenAI-compatible API endpoint |
| `aiModel` | string | `gpt-4o-mini` | Model name to use for AI commands |
| `aiMaxTokens` | number | `16384` | Max tokens for AI responses (increase for longer summaries) |
| `defaultOutput` | string | `clipboard` | Output mode for resume: `clipboard` or `stdout` |
| `autoGitCapture` | boolean | `true` | Auto-detect and include git info |
| `recentCommitCount` | number | `5` | Number of recent commits to capture |
| `defaultLogCount` | number | `10` | Default number of log entries to show |
| `watchInterval` | number | `5` | Auto-save interval in minutes for watch mode |
| `autoHook` | boolean | `false` | Auto-install git hook on init |

**Examples:**
```bash
# View all settings
ctxsaver config list

# Configure AI settings
ctxsaver config set aiApiKey "sk-..."
ctxsaver config set aiProvider "https://api.openai.com/v1"
ctxsaver config set aiModel "gpt-4o"
ctxsaver config set aiMaxTokens 16384

# Increase max tokens if summaries are getting truncated
ctxsaver config set aiMaxTokens 32000

# Configure behavior
ctxsaver config set defaultOutput "stdout"
ctxsaver config set recentCommitCount 10
ctxsaver config set watchInterval 3

# Get a specific value
ctxsaver config get aiModel
```

## Integrations

### 💻 Direct CLI Usage
Any AI agent with terminal access (e.g. via `run_command` or similar tools) can directly run `ctxsaver save`, `resume`, and `log`.

## How It Works

CtxSaver stores a `.ctxsaver/` folder in your repo. Each entry captures:
- **Task**: What you are doing
- **Goal**: Why you are doing it
- **Approaches**: What you tried (and what failed)
- **Decisions**: Key architectural choices
- **State**: Where you left off

It works with **every** AI coding tool because it simply manages the *prompt* — the universal interface for LLMs.

