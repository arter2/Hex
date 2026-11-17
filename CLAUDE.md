# Notes for Claude

## Testing

- Do not run regression tests constantly. No test suites, art checks or 100-floor sweeps after every task or change.
- Run them only when the user asks. The user will say when to test.
- Pictures are different: keep taking and sending a picture after each art or visual change. They are how the artwork implementation is checked.

## Shortcuts

- **mnz**: merge, number up and zip, in this order:
  1. Number up: bump `<title>` and `application-version` in `game/index.html` by one, commit and push.
  2. Merge: open a pull request from the working branch into `main` and merge it.
  3. Zip: run `python3 tools/package-itch-packed.py builds/` and send the zip.
