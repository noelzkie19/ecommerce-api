/**
 * Integration Test Setup
 *
 * Provides utilities for integration testing with the Express app.
 * Uses supertest for HTTP testing and mocks Supabase.
 */

import express, { Express } from "express";
import request, { SuperAgentTest } from "supertest";
import cookieParser from "cookie-parser";
import cors from "cors";

// Create a mock Supabase client
const createMockSupabaseClient = () => ({
  auth: {
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { session: { access_token: "test-token", user: { id: "user-1" } } },
      error: null,
    }),
    signUp: jest
      .fn()
      .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getSession: jest
      .fn()
      .mockResolvedValue({ data: { session: null }, error: null }),
    getUser: jest
      .fn()
      .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest
        .fn()
        .mockReturnValue({ single: jest.fn().mockResolvedValue({ data: {} }) }),
      order: jest
        .fn()
        .mockReturnValue({ limit: jest.fn().mockResolvedValue({ data: [] }) }),
    }),
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: {} }),
      }),
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: {} }),
        }),
      }),
    }),
    delete: jest
      .fn()
      .mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
  }),
  storage: { from: jest.fn() },
  rpc: jest.fn().mockResolvedValue({ data: null }),
});

// Export mock client for tests
export const mockSupabaseClient = createMockSupabaseClient();

// Mock the @supabase/supabase-js module
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

/**
 * Create a test Express application
 */
export const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors());

  // Bypass rate limiter for tests by adding a skipper middleware
  app.use((req, res, next) => {
    // For test environment, skip rate limiting
    next();
  });

  return app;
};

/**
 * Create a SuperTest agent
 */
export const createTestClient = (app: Express): SuperAgentTest => {
  return request.agent(app) as unknown as SuperAgentTest;
};

/**
 * Setup default mock responses
 */
export const setupDefaultMocks = () => {
  // Reset all mocks
  jest.clearAllMocks();

  // Setup default successful responses
  mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
    data: {
      session: {
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        user: { id: "user-123" },
      },
    },
    error: null,
  });

  mockSupabaseClient.auth.signUp.mockResolvedValue({
    data: { user: { id: "user-new" }, session: null },
    error: null,
  });

  mockSupabaseClient.from.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null }),
      }),
      order: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      }),
    }),
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: {} }),
      }),
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: {} }),
        }),
      }),
    }),
    delete: jest
      .fn()
      .mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
  });
};

/**
 * Create auth headers
 */
export const createAuthHeaders = (token = "test-token") => ({
  Authorization: `Bearer ${token}`,
});

/**
 * Create guest headers
 */
export const createGuestHeaders = (guestId = "guest-123") => ({
  "x-guest-id": guestId,
});
