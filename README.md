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

```bash
npm install -g ctxsaver
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
### AI-Powered (Experimental)
**Requires an LLM Provider.** Set via `CTXSAVER_AI_KEY` env var or `ctxsaver config set aiApiKey <key>`. Defaults to OpenAI-compatible API.
| Command | Description |
|---------|-------------|
| `ctxsaver summarize` | AI-generates context from git diff + recent commits |
| `ctxsaver suggest` | AI suggests next steps based on current context |
| `ctxsaver compress` | detailed history into a concise summary |

### Configuration
| Command | Description |
|---------|-------------|
| `ctxsaver config set <key> <val>` | Set preferences (e.g. `aiProvider`, `watchInterval`) |
| `ctxsaver config list` | View all configuration |

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

## License
MIT
# CtxSaver
