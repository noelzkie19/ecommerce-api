# Test Plan: Scalable Unit Tests with Happy and Sad Paths

## Overview

This document outlines the comprehensive testing strategy for the ecommerce API, implementing best practices for both unit and integration tests.

## Testing Architecture

### 1. Test Structure

```
tests/
├── __mocks__/              # Mock implementations
│   ├── repositories/       # Repository mocks
│   └── services/           # Service mocks
├── utils/                  # Test utilities and helpers
├── unit/                   # Unit tests
│   ├── auth/              # Auth module tests
│   ├── products/         # Products module tests
│   └── cart/             # Cart module tests
└── integration/           # Integration tests
    ├── auth/             # Auth endpoint tests
    ├── products/         # Products endpoint tests
    └── cart/            # Cart endpoint tests
```

### 2. Test Categories

#### Unit Tests

- **Purpose**: Test individual use cases and controllers in isolation
- **Dependencies**: Mocked repositories and external services
- **Execution**: Fast, no external dependencies
- **Coverage**: Happy paths, sad paths, edge cases, error handling

#### Integration Tests

- **Purpose**: Test full HTTP request/response flow
- **Dependencies**: Test server with mocked Supabase
- **Execution**: Slower but tests real-world scenarios
- **Coverage**: End-to-end workflows, middleware, routing

### 3. Test Naming Convention

Use descriptive names following this pattern:

```
[Method]_[Scenario]_[ExpectedResult]

Examples:
- login_withValidCredentials_returnsTokens
- login_withInvalidPassword_throwsAuthError
- getProduct_withInvalidId_returns404
```

### 4. Test Data Management

#### Mock Factories

Create reusable mock data factories:

```typescript
// utils/mockFactories.ts
export const createMockUser = (overrides = {}) => ({
  id: "user-123",
  email: "test@example.com",
  fullName: "Test User",
  role: "user",
  ...overrides,
});
```

#### Test Fixtures

- Use `beforeEach` to reset mocks
- Use `beforeAll` for expensive setup
- Use `afterEach` to clean up

### 5. Happy Path Test Structure

Each happy path test should include:

1. **Arrange**: Set up test data and mocks
2. **Act**: Execute the function/method
3. **Assert**: Verify the expected result

```typescript
describe("LoginUserUseCase", () => {
  it("login_withValidCredentials_returnsTokens", async () => {
    // Arrange
    const mockRepo = createMockAuthRepository({
      login: jest.fn().mockResolvedValue(mockAuthResponse),
    });
    const useCase = new LoginUserUseCase(mockRepo);

    // Act
    const result = await useCase.execute({
      email: "test@example.com",
      password: "password123",
    });

    // Assert
    expect(result.accessToken).toBeDefined();
    expect(result.user.email).toBe("test@example.com");
  });
});
```

### 6. Sad Path Test Structure

Each sad path test should include:

1. **Arrange**: Set up test data that triggers error
2. **Act**: Execute the function expecting error
3. **Assert**: Verify error type and message

```typescript
describe("LoginUserUseCase", () => {
  it("login_withInvalidPassword_throwsError", async () => {
    // Arrange
    const mockRepo = createMockAuthRepository({
      login: jest.fn().mockRejectedValue(new AuthError("Invalid credentials")),
    });
    const useCase = new LoginUserUseCase(mockRepo);

    // Act & Assert
    await expect(
      useCase.execute({
        email: "test@example.com",
        password: "wrongpassword",
      }),
    ).rejects.toThrow("Invalid credentials");
  });
});
```

### 7. Common Sad Paths to Cover

| Module   | Sad Paths                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------- |
| Auth     | Invalid email format, weak password, user not found, wrong password, token expired, network error |
| Products | Product not found, invalid category, out of stock, unauthorized access                            |
| Cart     | Invalid product ID, insufficient stock, cart item not found, invalid quantity                     |

### 8. Testing Best Practices

1. **AAA Pattern**: Always use Arrange-Act-Assert
2. **One Assertion per Test**: Each test should verify one behavior
3. **Descriptive Names**: Test names should describe what they test
4. **Isolation**: Each test should be independent
5. **Mock External Dependencies**: Never call real databases or APIs
6. **Test Edge Cases**: Null values, empty arrays, boundary values
7. **Error Handling**: Test both success and failure paths

### 9. Test Coverage Goals

- **Unit Tests**: 80% coverage on use cases
- **Integration Tests**: All API endpoints covered
- **Critical Paths**: 100% coverage

### 10. Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### 11. Jest Configuration

Key configurations for this project:

- `testEnvironment`: node
- `preset`: ts-jest
- `setupFilesAfterEnv`: tests/setup.ts
- `moduleNameMapper`: Path aliases for @/\*

### 12. Supabase Mocking Strategy

For integration tests, we mock the Supabase client:

```typescript
// __mocks__/supabase.ts
const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    // ...
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({ data: [] }),
    insert: jest.fn().mockReturnValue({ data: [] }),
    // ...
  }),
};
```

### 13. Controller Testing Pattern

Test controllers by:

1. Creating mock request/response objects
2. Calling the controller function
3. Verifying response status and body

```typescript
const mockReq = {
  body: { email: "test@example.com", password: "password123" },
} as Request;

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
} as unknown as Response;
```

### 14. Next Steps

1. Set up Jest configuration
2. Create mock factories
3. Implement unit tests for auth module
4. Implement unit tests for products module
5. Implement unit tests for cart module
6. Set up integration test infrastructure
7. Implement integration tests for core endpoints
