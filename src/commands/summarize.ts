import chalk from "chalk";
import { v4 as uuid } from "uuid";
import { isInitialized, saveContext } from "../core/context";
import {
    getCurrentBranch,
    getRepoName,
    getChangedFiles,
    getStagedFiles,
    getRecentCommits,
    getAuthor,
} from "../core/git";
import { callAI } from "../core/ai";
import { extractFullTranscript } from "../core/parser";
import { ContextEntry } from "../core/types";
import simpleGit from "simple-git";

const git = simpleGit();

export async function summarizeCommand(options?: { verbose?: boolean }) {
    const verbose = options?.verbose ?? false;
    if (!(await isInitialized())) {
        console.log(chalk.red("✗ CtxSaver not initialized. Run `ctxsaver init` first."));
        return;
    }

    try {
        console.log(chalk.gray("  Analyzing git changes..."));

        const cwd = process.cwd();

        const [branch, repo, filesChanged, filesStaged, recentCommits, author] =
            await Promise.all([
                getCurrentBranch(),
                getRepoName(),
                getChangedFiles(),
                getStagedFiles(),
                getRecentCommits(10),
                getAuthor(),
            ]);

        // Get git diff for context
        let diffSummary = "";
        try {
            const diff = await git.diff(["--stat"]);
            diffSummary = diff.slice(0, 2000);
        } catch {
            diffSummary = "No diff available";
        }

        // Try to extract full Claude session transcript
        console.log(chalk.gray("  Looking for Claude session transcript..."));
        const transcript = await extractFullTranscript(cwd);
        if (transcript) {
            console.log(chalk.gray(`  Found session transcript (${Math.round(transcript.length / 1000)}k chars) — including in summary`));
            if (verbose) {
                console.log(chalk.bold.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                console.log(chalk.bold.cyan("  EXTRACTED JSONL TRANSCRIPT"));
                console.log(chalk.bold.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));
                console.log(transcript);
                console.log(chalk.bold.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));
            }
        } else {
            console.log(chalk.gray("  No Claude session found — summarizing from git only"));
        }

        const transcriptSection = transcript
            ? `## Full Claude Session Transcript\nThe following is the complete conversation from the last Claude session. It includes [USER] messages, [CLAUDE] replies, and [CLAUDE used tools] lines showing every file read, command run, or task spawned.\n\n${transcript}\n\n`
            : "";

        const prompt = `You are a developer assistant producing a precise session handoff summary. The next AI session will have ONLY this summary as context — so accuracy and specificity are critical.

${transcriptSection}## Git Activity
Repository: ${repo}
Branch: ${branch}
Author: ${author}

Recent commits:
${recentCommits.map((c) => `- ${c}`).join("\n")}

Files changed on disk: ${filesChanged.join(", ") || "none"}
Files staged: ${filesStaged.join(", ") || "none"}

Diff summary:
${diffSummary}

## Instructions
${transcript ? `
### Reading the transcript
- The transcript is the PRIMARY source. Git activity is secondary evidence.
- [CLAUDE used tools] lines show exactly which files were read, commands run, and tasks spawned — use these to populate approaches with specific file paths.
- PAY SPECIAL ATTENTION to the LAST 10 lines of the transcript — they show where the session ended.
- If the transcript ends with "[Request interrupted by user for tool use]" or "[Request interrupted]", the session was CUT before completion. The currentState MUST reflect this explicitly.
- Cross-reference "Files changed on disk" with what was discussed — files that exist on disk but weren't confirmed completed in the transcript likely came from a spawned Task that may or may not have fully run.

### Field-by-field rules
- task: One sentence. Include the specific goal AND the tool/command being used (e.g. "Implement X using /gsd:plan-phase to produce PLAN.md files").
- approaches: List each concrete step taken WITH specific file paths and exact findings (e.g. "Read libs/shared/hooks/unit-convert.tsx — confirmed useUnitConverter hook with reverseTransform support"). Include tool calls as evidence.
- decisions: Capture every explicit architectural or implementation decision. Be specific (e.g. "reverseTransform: true for converting user input back to SI for store", not just "use the hook").
- currentState: Describe EXACTLY where things are right now based on the last transcript lines + git evidence. If interrupted: state clearly what ran, what was spawned, what files exist on disk, and what verification steps may have been skipped. Never assume completion if the transcript was interrupted.
- nextSteps: Ordered, actionable commands the next session should run. Start with reviewing what exists on disk if the session was interrupted.
` : "Based on the git activity alone, infer what was being worked on."}

Generate ONLY a valid JSON response (no markdown, no explanation) with this exact shape:
{
  "task": "...",
  "approaches": ["..."],
  "decisions": ["..."],
  "currentState": "...",
  "nextSteps": ["..."]
}`;

        if (verbose) {
            console.log(chalk.bold.yellow("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
            console.log(chalk.bold.yellow("  FULL PROMPT BEING SENT TO LLM"));
            console.log(chalk.bold.yellow("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));
            console.log(prompt);
            console.log(chalk.bold.yellow("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));
        }

        console.log(chalk.gray("  Sending to LLM for summarization..."));

        const result = await callAI([
            { role: "system", content: "You are a precise developer session summarizer. You output ONLY valid JSON — no markdown fences, no explanation text, no preamble. Your summaries are used as handoff context for AI coding sessions, so accuracy about what was completed vs interrupted is critical." },
            { role: "user", content: prompt },
        ]);

        if (result.error) {
            console.log(chalk.red(`✗ ${result.error}`));
            return;
        }

        if (verbose) {
            console.log(chalk.bold.green("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
            console.log(chalk.bold.green("  RAW LLM RESPONSE"));
            console.log(chalk.bold.green("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));
            console.log(result.content);
            console.log(chalk.bold.green("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));
        }

        // Parse AI response
        let parsed: any;
        try {
            // Extract JSON from potential markdown code blocks
            const jsonMatch = result.content.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                [null, result.content];
            parsed = JSON.parse(jsonMatch[1]!.trim());
        } catch {
            console.log(chalk.yellow("⚠ Could not parse AI response. Saving raw summary."));
            parsed = {
                task: result.content.slice(0, 200),
                approaches: [],
                decisions: [],
                currentState: result.content,
                nextSteps: [],
            };
        }

        const entry: ContextEntry = {
            id: uuid(),
            timestamp: new Date().toISOString(),
            branch,
            repo,
            author,
            task: parsed.task || "AI-generated summary",
            approaches: parsed.approaches || [],
            decisions: parsed.decisions || [],
            currentState: parsed.currentState || "",
            nextSteps: parsed.nextSteps || [],
            filesChanged,
            filesStaged,
            recentCommits,
        };

        await saveContext(entry);

        console.log(chalk.green(`\n✓ AI-generated context saved for branch: ${chalk.bold(branch)}`));
        console.log(chalk.cyan(`\n  Task: ${entry.task}`));
        if (entry.currentState) {
            console.log(chalk.gray(`  State: ${entry.currentState}`));
        }
        if (entry.decisions.length > 0) {
            entry.decisions.forEach((d) => console.log(chalk.gray(`  Decision: ${d}`)));
        }
        if (entry.nextSteps.length > 0) {
            console.log(chalk.gray(`  Next steps: ${entry.nextSteps.join(", ")}`));
        }
        console.log();
    } catch (err: any) {
        console.log(chalk.red(`✗ Error: ${err.message}`));
    }
}
