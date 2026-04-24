# Contributing Guidelines

We welcome contributions! Please follow these strict guidelines to ensure code quality and maintainability.

## Branching Strategy
* `main` - Production-ready code.
* `develop` - Integration branch for features.
* `feature/<name>` - New features.
* `bugfix/<name>` - Bug fixes.

## Conventional Commits
All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification:
* `feat:` A new feature
* `fix:` A bug fix
* `docs:` Documentation only changes
* `style:` Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* `refactor:` A code change that neither fixes a bug nor adds a feature
* `perf:` A code change that improves performance
* `test:` Adding missing tests or correcting existing tests

## Pull Request Expectations
1. Create a branch from `develop`.
2. Ensure all tests pass.
3. Write new tests for new behaviour.
4. Adhere to the established coding standards and typing rules.
5. Use the provided PR template.
6. Await review from a maintainer.
