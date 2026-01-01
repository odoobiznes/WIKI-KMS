# WikiSys Coding Standards

## General Principles

1. **DRY (Don't Repeat Yourself)** - Avoid code duplication
2. **KISS (Keep It Simple, Stupid)** - Simple solutions over complex ones
3. **YAGNI (You Aren't Gonna Need It)** - Don't add functionality until needed
4. **Single Responsibility** - Each module/function should do one thing well

## Code Style

### Python
- Follow PEP 8 style guide
- Use type hints for function parameters and return types
- Maximum line length: 120 characters
- Use docstrings for all public functions and classes
- Use f-strings for string formatting

### JavaScript
- Use ES6+ features (const, let, arrow functions, destructuring)
- Prefer async/await over Promise chains
- Use JSDoc comments for documentation
- Use meaningful variable and function names

### CSS
- Use CSS custom properties (variables) for colors and common values
- Mobile-first responsive design
- BEM naming convention for class names
- Avoid !important unless absolutely necessary

## File Organization

```
project/
├── api/           # Backend API code
├── frontend/      # Frontend application
├── docs/          # Documentation
├── tests/         # Test files
├── scripts/       # Utility scripts
└── config/        # Configuration files
```

## Error Handling

- Always handle errors gracefully
- Log errors with appropriate severity levels
- Provide meaningful error messages to users
- Never expose sensitive information in error messages

## Security

- Sanitize all user inputs
- Use parameterized queries for database operations
- Store secrets in environment variables, never in code
- Implement proper authentication and authorization
- Follow the principle of least privilege

