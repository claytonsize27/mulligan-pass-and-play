# Free deployment

## Current status

Repository created at https://github.com/claytonsize27/mulligan-pass-and-play. GitHub Pages deployment is configured by the included workflow; check its latest successful run for live status. Expected site address: https://claytonsize27.github.io/mulligan-pass-and-play/.

## Cost basis

[GitHub's Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) confirms Pages is available for public repositories with GitHub Free. Use a public repository and its default `https://OWNER.github.io/REPOSITORY/` domain. No paid plan, purchased domain, API key, database or server is required. This design has no metered backend. Hosting remains subject to GitHub's terms and service limits.

## Preferred automated route

Once GitHub access is connected, create a public repository named `mulligan-pass-and-play`, push this project, set Pages source to **GitHub Actions**, and run the included `Deploy Pages` workflow. This is the only external account step left for the agent to perform. The workflow tests first, packages only `dist/`, and publishes through GitHub's Pages actions. It does not publish `.firecrawl/`, local game saves, or repository internals.

## Manual fallback

1. Create a public GitHub repository and push these source files.
2. In repository Settings → Pages → Build and deployment, select **GitHub Actions**.
3. In Actions, run **Deploy Pages**. The environment output contains the actual published URL.
4. Open that URL on a phone. Play a round and use Add to Home Screen / Install app.

There is no mandatory npm install. The workflow uses Node 22 and the built-in test runner. Future pushes to `main` test and redeploy. The workflow is also manually runnable.

## Portable hosting

Any HTTPS static host can serve the contents of `dist/`. No server-side rewrites or root-path assumption is needed. Do not serve the entire source repository from a general-purpose development server on the public internet. Only `dist/` is the public artifact.

## Release checklist

- Run `npm test` and `npm run build`.
- Increment service-worker `CACHE` for changed app assets.
- If state schema changes, add a migration or bump save version/key and explain the reset.
- Confirm public URL and repository subpath behavior after deployment.
- Confirm install/offline behavior on actual iOS Safari and Android Chrome (desktop emulation is not equivalent to those devices).


