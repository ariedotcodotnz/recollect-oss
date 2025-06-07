# Contributing to Recollect OSS

Thank you for your interest in contributing to Recollect OSS! We welcome contributions from the community and are grateful for any help you can provide.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/recollect-oss/issues)
2. If not, create a new issue with:
    - Clear, descriptive title
    - Steps to reproduce
    - Expected vs actual behavior
    - Screenshots if applicable
    - Your environment details

### Suggesting Features

1. Check existing issues and discussions
2. Open a new issue with the "enhancement" label
3. Describe the feature and its use case
4. Explain why it would benefit users

### Pull Requests

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Write or update tests as needed
5. Update documentation
6. Commit with clear messages: `git commit -m "Add: feature description"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

#### PR Guidelines

- Keep PRs focused - one feature/fix per PR
- Include tests for new functionality
- Update documentation as needed
- Ensure all tests pass
- Follow the existing code style
- Add yourself to CONTRIBUTORS.md

## Development Setup

### Prerequisites

- Node.js 16+
- Cloudflare account
- Wrangler CLI

### Local Development

```bash
# Clone your fork
git clone https://github.com/yourusername/recollect-oss.git
cd recollect-oss

# Install dependencies
npm install

# Create local database
npx wrangler d1 create recollect-db --local

# Run migrations
npm run db:migrate

# Start dev server
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/api/collections.test.js

# Run with coverage
npm run test:coverage
```

## Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Add trailing commas in multi-line objects/arrays
- Use meaningful variable names
- Add comments for complex logic

### File Structure

```
src/
├── api/        # API endpoints
├── db/         # Database schemas
├── middleware/ # Request middleware
└── utils/      # Helper functions

frontend/
├── public/     # Public interface
├── admin/      # Admin dashboard
└── shared/     # Shared components
```

## Testing

- Write unit tests for utilities and helpers
- Write integration tests for API endpoints
- Test edge cases and error conditions
- Aim for >80% code coverage

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for functions
- Update API documentation for endpoint changes
- Include examples where helpful

## Commit Messages

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process/auxiliary changes

Example: `feat: add bulk import functionality`

## Release Process

1. Features are merged to `main`
2. Releases are tagged with semantic versioning
3. Changelog is updated
4. GitHub Release is created

## Getting Help

- Check the [documentation](https://github.com/yourusername/recollect-oss/wiki)
- Ask in [Discussions](https://github.com/yourusername/recollect-oss/discussions)
- Join our community chat (if available)

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- GitHub contributors page
- Release notes for significant contributions

Thank you for contributing to Recollect OSS!