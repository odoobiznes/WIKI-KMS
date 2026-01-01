# WikiSys Documentation Standards

## Code Documentation

### Python Docstrings

```python
def function_name(param1: str, param2: int) -> bool:
    """
    Brief description of function.

    Args:
        param1: Description of param1
        param2: Description of param2

    Returns:
        Description of return value

    Raises:
        ValueError: When param1 is invalid
    """
```

### JavaScript JSDoc

```javascript
/**
 * Brief description of function.
 * @param {string} param1 - Description of param1
 * @param {number} param2 - Description of param2
 * @returns {boolean} Description of return value
 */
```

## Project Documentation

Every project should have:

1. **README.md**
   - Project description
   - Installation instructions
   - Usage examples
   - Configuration options
   - Contributing guidelines

2. **API Documentation**
   - All endpoints documented
   - Request/response examples
   - Error codes and messages

3. **Architecture Documentation**
   - System overview
   - Component diagrams
   - Data flow descriptions

## Documentation Updates

- Update docs when changing functionality
- Keep examples up to date
- Version documentation with code
- Review docs in pull requests

