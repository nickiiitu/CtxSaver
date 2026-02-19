import fs from "fs";
import path from "path";
import chalk from "chalk";
import { getRepoRoot, getRepoName } from "../core/git";
import { CtxSaverConfig } from "../core/types";

export async function initCommand() {
  try {
    const root = await getRepoRoot();
    const ctxsaverDir = path.join(root, ".ctxsaver");

    if (fs.existsSync(ctxsaverDir)) {
      console.log(chalk.yellow("⚠ CtxSaver already initialized in this repo."));
      return;
    }

    // Create directory structure
    fs.mkdirSync(path.join(ctxsaverDir, "sessions"), { recursive: true });
    fs.mkdirSync(path.join(ctxsaverDir, "branches"), { recursive: true });

    // Write config
    const config: CtxSaverConfig = {
      version: "0.1.0",
      createdAt: new Date().toISOString(),
      repo: await getRepoName(),
    };
    fs.writeFileSync(path.join(ctxsaverDir, "config.json"), JSON.stringify(config, null, 2));

    // Add to .gitignore
    const gitignorePath = path.join(root, ".gitignore");
    const gitignoreContent = fs.existsSync(gitignorePath)
      ? fs.readFileSync(gitignorePath, "utf-8")
      : "";

    if (!gitignoreContent.includes(".ctxsaver/")) {
      fs.appendFileSync(gitignorePath, "\n# CtxSaver - AI coding context\n.ctxsaver/\n");
      console.log(chalk.gray("  Added .ctxsaver/ to .gitignore"));
    }

    console.log(chalk.green(`✓ Initialized CtxSaver in ${root}`));
    console.log(chalk.gray("  Run `ctxsaver save` to capture your first context."));
  } catch (err: any) {
    if (err.message?.includes("not a git repository")) {
      console.log(chalk.red("✗ Not a git repository. Run `git init` first."));
    } else {
      console.log(chalk.red(`✗ Error: ${err.message}`));
    }
  }
}
