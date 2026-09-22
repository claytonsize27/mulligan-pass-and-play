# Free deployment

## Current status

**Live:** https://claytonsize27.github.io/mulligan-pass-and-play/

**Source:** https://github.com/claytonsize27/mulligan-pass-and-play

GitHub Pages is enabled with GitHub Actions. The initial deployment succeeded: https://github.com/claytonsize27/mulligan-pass-and-play/actions/runs/35787653096. Public mobile gameplay was verified after deployment.

## Cost basis

[GitHub's Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) confirms Pages is available for public repositories with GitHub Free. Use a public repository and its default `https://OWNER.github.io/REPOSITORY/` domain. No paid plan, purchased domain, API key, database or server is required. This design has no metered backend. Hosting remains subject to GitHub's terms and service limits.

## Preferred automated route

Publishing is already configured. Future pushes to main automatically run the 16 tests, package only dist/, and publish through GitHub Pages. Research downloads, local game saves and repository internals are excluded. The GitHub connector could read the repository but could not write Git trees; authenticated Git via the installed credential manager successfully pushed the source. Browser sign-in was used only for repository creation and Pages settings.

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



