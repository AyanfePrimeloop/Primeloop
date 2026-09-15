# Moving to a Real Development Workflow with Claude Code

Everything so far has worked like this: Claude writes code in a sandbox → zips it → you
download → manually re-upload to GitHub → Vercel rebuilds → you test on the live site. It
works, but every step is slow and every bug gets found in production, with real money moving.

Claude Code fixes this. It's a separate app (not this chat) that can edit files directly in a
real folder on your computer, run the actual `npm install`/`npm run build` commands to catch
errors immediately, and push changes straight to GitHub — which Vercel is already watching, so
a push deploys automatically. No more zip files.

## Step 1 — Install the prerequisites

You'll need two things on your computer that you haven't needed until now:

1. **Node.js** — go to [nodejs.org](https://nodejs.org), download the "LTS" version, run the
   installer, click through with defaults. This lets your computer actually run the app locally.
2. **Git** — Mac usually already has it. On Windows, get it from
   [git-scm.com](https://git-scm.com/downloads), install with defaults. This is what lets code
   move between your computer and GitHub.

## Step 2 — Install Claude Code

Follow the setup at [claude.com/product/claude-code](https://claude.com/product/claude-code) —
it offers a desktop app and editor extensions (VS Code, JetBrains). The desktop app is the
simplest starting point if you're not already using a code editor.

## Step 3 — Get the project onto your computer

1. Open a terminal (Mac: Terminal app. Windows: search "Command Prompt" or use the one built
   into Claude Code / VS Code).
2. Pick a folder to work in, e.g. `Documents`, then run:
   ```
   cd Documents
   git clone https://github.com/YOUR-USERNAME/Primeloop.git
   ```
   (Use your actual repo URL — find it on your GitHub repo page, green "Code" button, copy
   the HTTPS link.)
3. This downloads a real, git-tracked copy of everything — this is now the "source of truth"
   copy going forward, not the chat sandbox.

## Step 4 — Set up your local environment file

1. Inside the cloned `primeloop` folder, copy `.env.example` to a new file named `.env.local`.
2. Fill in the same values you already put into Vercel's Environment Variables — copy them
   from there so both places match.
3. This file is already excluded from git (see the new `.gitignore`), so it stays private on
   your machine.

## Step 5 — Verify it runs locally

In the terminal, inside the `primeloop` folder:
```
npm install
npm run dev
```
This should start the app at `http://localhost:3000` — open that in your browser. If it loads,
everything's wired up correctly.

## Step 6 — The new day-to-day workflow

From now on, instead of coming back to this chat for every fix:

1. Open Claude Code in the `primeloop` folder.
2. Describe what you want changed or fixed, same as you would here.
3. Claude Code edits the actual files, and can run `npm run build` itself to confirm nothing's
   broken *before* anything goes live.
4. Once you're happy, ask it to commit and push — this is the same as the "re-upload to
   GitHub" step you've been doing manually, just automatic and instant.
5. Vercel notices the push and redeploys on its own, exactly like before.

This chat is still useful for bigger strategic conversations (like this one), planning new
features, or anything you'd rather talk through before touching code. For fast iteration and
catching bugs before they reach production, Claude Code is the better tool from here on.
