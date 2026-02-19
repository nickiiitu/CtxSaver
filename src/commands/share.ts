import fs from "fs";
import path from "path";
import chalk from "chalk";
import simpleGit from "simple-git";
import { getRepoRoot } from "../core/git";

const git = simpleGit();

export async function shareCommand(options?: { stop?: boolean }) {
    try {
        const root = await getRepoRoot();
        const gitignorePath = path.join(root, ".gitignore");
        const ctxsaverDir = path.join(root, ".ctxsaver");

        if (!fs.existsSync(ctxsaverDir)) {
            console.log(chalk.red("✗ CtxSaver not initialized. Run `ctxsaver init` first."));
            return;
        }

        if (options?.stop) {
            // Add .ctxsaver/ back to .gitignore
            const gitignoreContent = fs.existsSync(gitignorePath)
                ? fs.readFileSync(gitignorePath, "utf-8")
                : "";

            if (!gitignoreContent.includes(".ctxsaver/")) {
                fs.appendFileSync(gitignorePath, "\n.ctxsaver/\n");
            }

            console.log(chalk.green("✓ Stopped sharing CtxSaver"));
            console.log(chalk.gray("  .ctxsaver/ added back to .gitignore"));
            console.log(
                chalk.gray("  Note: Existing .ctxsaver/ files remain in git history.")
            );
            return;
        }

        // Remove .ctxsaver/ from .gitignore
        if (fs.existsSync(gitignorePath)) {
            let content = fs.readFileSync(gitignorePath, "utf-8");
            content = content
                .split("\n")
                .filter(
                    (line) =>
                        line.trim() !== ".ctxsaver/" &&
                        line.trim() !== ".ctxsaver" &&
                        line.trim() !== "# CtxSaver - AI coding context"
                )
                .join("\n");
            fs.writeFileSync(gitignorePath, content);
        }

        // Stage .ctxsaver/ and commit
        await git.add([".ctxsaver/", ".gitignore"]);
        await git.commit("chore: share CtxSaver with team");

        console.log(chalk.green("✓ CtxSaver is now shared with your team!"));
        console.log(chalk.gray("  .ctxsaver/ removed from .gitignore"));
        console.log(chalk.gray("  Committed: \"chore: share CtxSaver with team\""));
        console.log(chalk.gray("\n  Push to share: git push"));
        console.log(chalk.gray("  Stop sharing: ctxsaver share --stop"));
    } catch (err: any) {
        console.log(chalk.red(`✗ Error: ${err.message}`));
    }
}
