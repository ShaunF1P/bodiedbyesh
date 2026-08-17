<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git & Deployment Standards
* **GitHub User Default:** Default Git remote user is `ShaunF1P` on `main` branch.
* **Large Push Safety:** Git `http.postBuffer` is set to 500MB (`524288000`) to prevent Windows RPC curl 55 packet drops.
* **Vercel Automation:** `VERCEL_TOKEN` is configured in the environment for instant automated deployments via `npx vercel --prod --yes`.
* **Zero Secret Exposure:** Never hardcode API tokens or secret strings into source files; always read dynamically from environment variables or `.env.local`.

