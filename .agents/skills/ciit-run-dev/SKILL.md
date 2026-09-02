---
name: ciit-run-dev
description: Start or check the CIIT template local development server for vibe coders, PSI Team members, and developers. Use when the user asks to run, start, open, boot, preview, or verify the dev server for this repository.
---

# CIIT Run Dev

Start the local Next.js development server for this repository. This skill is shared by vibe coders, PSI Team members, and developers.

## Workflow

1. Check whether a dev server is already running on `http://localhost:3000` when practical.
2. If no server is running, start the dev server with:

   ```bash
   npm run dev
   ```

   On Windows PowerShell, use `npm.cmd run dev` if the `npm.ps1` shim is blocked by execution policy.

3. Keep the server process running. Use a background terminal/session when available.
4. Report the local URL: `http://localhost:3000`.

## Failure Handling

- If dependencies are missing, tell the user to run `npm install` or use Docker setup from `docs/setup.md`.
- If port `3000` is busy, report the conflict. Do not change ports unless the user approves.
- If the app fails because `.env` is missing, tell the user to copy `.env.example` to `.env` and fill in required values.
- Do not modify application files as part of this skill.
