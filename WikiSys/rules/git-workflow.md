# WikiSys Git Workflow

## Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes
- `release/*` - Release preparation

## Commit Messages

Use conventional commits format:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

### Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples:
```
feat(auth): add OAuth2 login support
fix(api): resolve timeout issue in database queries
docs(readme): update installation instructions
```

## Pull Request Guidelines

1. Create PR from feature branch to develop
2. Include description of changes
3. Link related issues
4. Request review from at least one team member
5. Ensure all tests pass
6. Squash commits before merge

## Repository Structure

Each project should have:
- `README.md` - Project overview and setup
- `CHANGELOG.md` - Version history
- `.gitignore` - Ignored files
- `LICENSE` - Project license

