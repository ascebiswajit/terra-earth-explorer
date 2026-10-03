# Contributing to Terra

Terra is public and welcomes bug reports, documentation, accessibility fixes, translations and focused feature proposals. Be respectful and discuss substantial changes in an issue first.

## Run locally

1. Fork `ascebiswajit/terra-earth-explorer` and clone your fork.
2. Create a branch: `git switch -c fix/short-description`.
3. Install Node.js 22 and Python 3.
4. Run `npm ci`, then `npm start`.
5. Open http://localhost:8080 in a WebGL-capable browser.

The application is static. Files in `dist` are editable source files; no application build is required. Development tools are optional for viewing the application but required before submitting code.

## Submit a pull request

1. Make a focused change on your branch.
2. Run `npm run format` and `npm run check`.
3. Test the affected flow in a browser and on a narrow viewport.
4. Commit and push to your fork.
5. Open a pull request targeting `main`, describing the problem, change and verification.
6. Address review comments and wait for required checks and approval.

Do not push directly to `main`. Do not bypass branch protection or force-push over another person's work. Repository administrators must configure enforcement in GitHub; this document itself cannot protect a branch. Authors cannot approve their own PRs.

## What to test

For map changes, test road and satellite views, zoom and navigation controls, layer switching, search, location permission denial and slow or failed map requests. For sharing changes, open the generated link in a fresh tab and check centre, zoom and layer. Keep attribution readable. Attach screenshots for visual changes, removing personal coordinates first.

## Code and data rules

Use Prettier and the shared ESLint configuration. Keep external API content in `textContent`, validate coordinates and avoid unnecessary dependencies. Do not add secrets, credentials or private hosting metadata. Public map configuration belongs in `dist/config.js`. Keep provider attribution and respect imagery/data terms. Never use generated detail to imply genuine geographic data.

## Starter tasks

- Improve keyboard controls and focus handling.
- Test local-language place names and ambiguous addresses.
- Improve mobile controls on small screens.
- Add sourced destinations and improve documentation.

See [the release notes](docs/PUBLIC_RELEASE.md) for architecture, current limits and the release process.
