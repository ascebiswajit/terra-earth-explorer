# Contributing to Terra

Everyone is welcome to contribute. Please be respectful and keep discussions focused on improving the explorer.

## Get started

1. Fork this repository on GitHub and clone your fork.
2. Create a branch: `git switch -c fix/short-description`.
3. Start the local server using the README instructions.
4. Make a focused change and verify the affected behavior.
5. Commit, push your branch and open a pull request against `main`.

For a substantial feature, open an issue first to discuss its behavior and scope. Small bug fixes and documentation improvements can go directly to a pull request.

## Good first contributions

- Improve keyboard navigation and focus behavior.
- Improve empty, loading and network-error states.
- Add well-sourced featured destinations using the existing place structure.
- Improve mobile usability and contributor documentation.

## Guidelines

- Use plain JavaScript, HTML and CSS consistent with the existing project.
- Keep changes small and explain why they are needed.
- Never commit secrets, personal data or private hosting configuration.
- Preserve all map-provider attribution and respect third-party licenses.
- Treat remote API content as untrusted; use `textContent` for displayed text.
- Add dependencies only when they solve a concrete problem.

## Verify your change

Run `node --check dist/app.js`. In a WebGL-capable browser, check the changed flow and any related controls. For interface changes, test a narrow mobile viewport and keyboard focus, and attach before/after screenshots to your pull request.

Cover relevant failures: unavailable services, no search results, invalid coordinates and denied location permission. State what you tested and any known limitations in the pull request.

## Report a bug

Include reproduction steps, expected and actual behavior, browser/device information and screenshots where useful. Remove personal coordinates or other private data before sharing.
