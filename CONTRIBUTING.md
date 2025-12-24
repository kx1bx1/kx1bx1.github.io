# Contributing Guidelines

Thank you for your interest in improving this project.

---

## Workflow

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/my-change
   ```

3. Install dependencies:

   ```bash
   npm ci
   ```

4. Make your changes.

5. Run tests & linting:

   ```bash
   npm run lint
   npm run format
   ```

6. Commit using clear messages:

   ```bash
   git commit -m "Add new extension card"
   ```

7. Push and open a Pull Request.

---

## Adding a new extension

1. Create a new folder with your extensions name (i. e. `rubyfs`)
2. Add the folder's name to `./src/extensions.json`

   Example structure:

   ```json
   ["all", "the", "other", "extensions", "yournewextension"]
   ```

   And yes, it's case-sensitive!

3. Import your extension's code to its respective folder and name it `extension.js`
4. Import your extension's icon to its respective folder and name it `icon.svg`

   > If you don't have an icon for your extension, don't worry! Just get an icon from <https://fonts.google.com/> and import that! It must be an icon that relates to your extension, however.

5. Give your extension a `manifest.json`

   Example structure:

   ```json
   {
     "name": "Your New Extension",
     "description": "Give your cool extension a short description.",
     "author": "Your GitHub username",
     "version": "We prefer semantic versioning, but it can be anything you want",
     "category": "Do not introduce new categories without prior approval. Unapproved categories will be removed",
     "unsandboxed": false,
     "entry": "extension.js"
   }
   ```

6. You're done! Now you can create your pull request. Make sure to make it concise, and explain why it should be merged.

   Your folder structure must look exactly like this:

   ```text
   src/
     extensions.json
     yournewextension/
       extension.js
       icon.svg
       manifest.json
   ```

   PRs without this scheme will be closed.

---

## Code Style

- Follow ESLint rules.
- Keep commits focused.
- Do not commit `node_modules`.

---

## Pull Request Checklist

- [ ] Code builds successfully
- [ ] Linting passes
- [ ] No unrelated changes
- [ ] Description clearly explains intent
