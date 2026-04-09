/**
 * Test Utilities and Mock Factories
 *
 * This module provides reusable mock factories for testing.
 * Use these to create consistent test data across all test files.
 */

// ============================================
// Type Factories
// ============================================

/**
 * Create a mock user
 */
export const createMockUser = (overrides = {}) => ({
  id: "user-123",
  email: "test@example.com",
  fullName: "Test User",
  role: "user" as const,
  ...overrides,
});

/**
 * Create mock auth tokens
 */
export const createMockAuthTokens = (overrides = {}) => ({
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  ...overrides,
});

/**
 * Create a mock auth response
 */
export const createMockAuthResponse = (overrides = {}) => ({
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  user: createMockUser(),
  ...overrides,
});

/**
 * Create a mock product
 */
export const createMockProduct = (overrides = {}) => ({
  id: "product-123",
  name: "Test Product",
  description: "Test Description",
  price: 100,
  category: "Electronics",
  stock: 10,
  images: [] as string[],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock products list
 */
export const createMockProductsList = (count = 3) =>
  Array.from({ length: count }, (_, i) =>
    createMockProduct({ id: `product-${i + 1}` }),
  );

/**
 * Create a mock cart item
 */
export const createMockCartItem = (overrides = {}) => ({
  id: "cart-item-123",
  userId: "user-123",
  productId: "product-123",
  quantity: 1,
  product: createMockProduct(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock cart items list
 */
export const createMockCartItemsList = (count = 2) =>
  Array.from({ length: count }, (_, i) =>
    createMockCartItem({ id: `cart-item-${i + 1}` }),
  );

/**
 * Create mock cart response
 */
export const createMockCartResponse = (overrides = {}) => ({
  items: createMockCartItemsList(),
  totalItems: 2,
  totalPrice: 200,
  ...overrides,
});

// ============================================
// Mock Repository Factories
// ============================================

/**
 * Create a mock AuthRepository
 */
export const createMockAuthRepository = (overrides = {}) => ({
  register: jest.fn().mockResolvedValue(createMockAuthResponse()),
  login: jest.fn().mockResolvedValue(createMockAuthResponse()),
  refreshSession: jest.fn().mockResolvedValue(createMockAuthTokens()),
  forgotPassword: jest.fn().mockResolvedValue(undefined),
  resetPassword: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn().mockResolvedValue(undefined),
  adminLogout: jest.fn().mockResolvedValue(undefined),
  googleLogin: jest.fn().mockResolvedValue(createMockAuthResponse()),
  listUsers: jest.fn().mockResolvedValue([createMockUser()]),
  getCurrentUser: jest.fn().mockResolvedValue(createMockUser()),
  verifyToken: jest.fn().mockResolvedValue(true),
  findById: jest.fn().mockResolvedValue(createMockUser()),
  updateProfile: jest.fn().mockResolvedValue(createMockUser()),
  ...overrides,
});

/**
 * Create a mock ProductRepository
 */
export const createMockProductRepository = (overrides = {}) => ({
  findAll: jest
    .fn()
    .mockResolvedValue({ products: createMockProductsList(), total: 3 }),
  findById: jest.fn().mockResolvedValue(createMockProduct()),
  findByCategory: jest.fn().mockResolvedValue(createMockProductsList()),
  search: jest.fn().mockResolvedValue(createMockProductsList()),
  create: jest.fn().mockResolvedValue(createMockProduct()),
  update: jest.fn().mockResolvedValue(createMockProduct()),
  delete: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

/**
 * Create a mock CartRepository
 */
export const createMockCartRepository = (overrides = {}) => ({
  getCart: jest.fn().mockResolvedValue(createMockCartResponse()),
  addItem: jest.fn().mockResolvedValue(createMockCartItem()),
  updateItem: jest.fn().mockResolvedValue(createMockCartItem()),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clearCart: jest.fn().mockResolvedValue(undefined),
  findItemById: jest.fn().mockResolvedValue(createMockCartItem()),
  ...overrides,
});

/**
 * Create a mock StockRepository
 */
export const createMockStockRepository = (overrides = {}) => ({
  getAll: jest.fn().mockResolvedValue([]),
  getByProductId: jest
    .fn()
    .mockResolvedValue({ productId: "product-123", quantity: 10 }),
  checkAvailability: jest.fn().mockResolvedValue(true),
  update: jest
    .fn()
    .mockResolvedValue({ productId: "product-123", quantity: 9 }),
  ...overrides,
});

// ============================================
// Express Mock Factories
// ============================================

/**
 * Options for creating mock request
 */
interface MockRequestOptions {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
  user?: unknown;
  headers?: Record<string, string>;
}

/**
 * Create a mock Express Request
 */
export const createMockRequest = (
  options: MockRequestOptions = {},
): unknown => {
  const {
    body = {},
    params = {},
    query = {},
    user = undefined,
    headers = {},
  } = options;

  return {
    body,
    params,
    query,
    headers,
    user,
    get: (name: string) => headers[name] || "",
  };
};

/**
 * Create a mock Express Response
 */
export const createMockResponse = (): unknown => {
  const mockStatus = jest.fn().mockReturnThis();
  const mockJson = jest.fn().mockReturnThis();
  const mockSend = jest.fn().mockReturnThis();
  const mockSet = jest.fn().mockReturnThis();
  const mockCookie = jest.fn().mockReturnThis();
  const mockClearCookie = jest.fn().mockReturnThis();
  const mockRedirect = jest.fn().mockReturnThis();

  return {
    status: mockStatus,
    json: mockJson,
    send: mockSend,
    set: mockSet,
    cookie: mockCookie,
    clearCookie: mockClearCookie,
    redirect: mockRedirect,
    statusCode: 200,
    locals: {},
  };
};

/**
 * Create a mock Express NextFunction
 */
export const createMockNext = (): unknown => jest.fn();

/**
 * Create a mock Express Request with full properties
 */
export const createMockReqRes = (options: MockRequestOptions = {}) => {
  const req = createMockRequest(options) as {
    body: Record<string, unknown>;
    params: Record<string, string>;
    query: Record<string, unknown>;
    user: unknown;
    headers: Record<string, string>;
  };
  const res = createMockResponse() as {
    status: jest.Mock;
    json: jest.Mock;
    send: jest.Mock;
  };
  const next = createMockNext() as jest.Mock;

  return { req, res, next };
};

// ============================================
// Error Mock Factories
// ============================================

/**
 * Create a mock AppError
 */
export const createMockAppError = (message: string, statusCode: number) => {
  class MockAppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(msg: string, code: number) {
      super(msg);
      this.statusCode = code;
      this.isOperational = true;
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }

  return new MockAppError(message, statusCode);
};

/**
 * Create a mock validation error
 */
export const createMockValidationError = (message = "Validation failed") =>
  createMockAppError(message, 422);

/**
 * Create a mock not found error
 */
export const createMockNotFoundError = (message = "Resource not found") =>
  createMockAppError(message, 404);

/**
 * Create a mock unauthorized error
 */
export const createMockUnauthorizedError = (message = "Unauthorized") =>
  createMockAppError(message, 401);

// ============================================
// Helper Functions
// ============================================

/**
 * Make a function return a rejected promise with the given error
 */
export const mockRejectedOnce = (fn: jest.Mock, error: Error) => {
  fn.mockRejectedValueOnce(error);
  return fn;
};

/**
 * Make a function return a resolved promise once
 */
export const mockResolvedOnce = (fn: jest.Mock, value: unknown) => {
  fn.mockResolvedValueOnce(value);
  return fn;
};

/**
 * Reset all mocks in an object
 */
export const resetMocks = (obj: Record<string, unknown>) => {
  Object.values(obj).forEach((value) => {
    if (typeof value === "object" && value !== null && "mockReset" in value) {
      (value as { mockReset: () => void }).mockReset();
    }
  });
};
