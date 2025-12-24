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
