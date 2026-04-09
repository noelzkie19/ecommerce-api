/**
 * Auth Use Cases Unit Tests
 *
 * Tests for LoginUserUseCase, RegisterUserUseCase, and LogoutUserUseCase.
 * Each test covers both happy and sad paths.
 */

import { LoginUserUseCase } from "../../../src/application/use-cases/auth/LoginUser";
import { RegisterUserUseCase } from "../../../src/application/use-cases/auth/RegisterUser";
import { LogoutUserUseCase } from "../../../src/application/use-cases/auth/LogoutUser";
import {
  createMockAuthRepository,
  createMockAuthResponse,
} from "../../__mocks__";

describe("LoginUserUseCase", () => {
  describe("Happy Path", () => {
    it("login_withValidCredentials_returnsTokens", async () => {
      // Arrange
      const mockRepo = createMockAuthRepository({
        login: jest.fn().mockResolvedValue(createMockAuthResponse()),
      });
      const useCase = new LoginUserUseCase(mockRepo);

      // Act
      const result = await useCase.execute({
        email: "test@example.com",
        password: "password123",
      });

      // Assert
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe("test@example.com");
      expect(mockRepo.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("login_withValidCredentials_includesUserData", async () => {
      // Arrange
      const mockUser = {
        id: "user-456",
        email: "john@example.com",
        fullName: "John Doe",
        role: "user",
      };
      const mockRepo = createMockAuthRepository({
        login: jest.fn().mockResolvedValue(
          createMockAuthResponse({
            user: mockUser,
          }),
        ),
      });
      const useCase = new LoginUserUseCase(mockRepo);

      // Act
      const result = await useCase.execute({
        email: "john@example.com",
        password: "secret123",
      });

      // Assert
      expect(result.user.id).toBe("user-456");
      expect(result.user.fullName).toBe("John Doe");
      expect(result.user.role).toBe("user");
    });
  });

  describe("Sad Path", () => {
    it("login_withInvalidPassword_throwsError", async () => {
      // Arrange
      const error = new Error("Invalid email or password");
      const mockRepo = createMockAuthRepository({
        login: jest.fn().mockRejectedValue(error),
      });
      const useCase = new LoginUserUseCase(mockRepo);

      // Act & Assert
      await expect(
        useCase.execute({
          email: "test@example.com",
          password: "wrongpassword",
        }),
      ).rejects.toThrow("Invalid email or password");
    });

    it("login_withNonExistentUser_throwsError", async () => {
      // Arrange
      const error = new Error("User not found");
      const mockRepo = createMockAuthRepository({
        login: jest.fn().mockRejectedValue(error),
      });
      const useCase = new LoginUserUseCase(mockRepo);

      // Act & Assert
      await expect(
        useCase.execute({
          email: "nonexistent@example.com",
          password: "password123",
        }),
      ).rejects.toThrow("User not found");
    });

    it("login_withEmptyEmail_throwsError", async () => {
      // Arrange
      const mockRepo = createMockAuthRepository();
      const useCase = new LoginUserUseCase(mockRepo);

      // Act & Assert
      await expect(
        useCase.execute({
          email: "",
          password: "password123",
        }),
      ).rejects.toThrow();
    });

    it("login_withNetworkError_throwsError", async () => {
      // Arrange
      const error = new Error("Network error");
      const mockRepo = createMockAuthRepository({
        login: jest.fn().mockRejectedValue(error),
      });
      const useCase = new LoginUserUseCase(mockRepo);

      // Act & Assert
      await expect(
        useCase.execute({
          email: "test@example.com",
          password: "password123",
        }),
      ).rejects.toThrow("Network error");
    });
  });
});

describe("RegisterUserUseCase", () => {
  describe("Happy Path", () => {
    it("register_withValidData_returnsTokens", async () => {
      // Arrange
      const mockRepo = createMockAuthRepository({
        register: jest.fn().mockResolvedValue(createMockAuthResponse()),
      });
      const useCase = new RegisterUserUseCase(mockRepo);

      // Act
      const result = await useCase.execute({
        email: "newuser@example.com",
        password: "SecurePass123",
        fullName: "New User",
      });

      // Assert
      expect(result).toHaveProperty("accessToken");
      expect(mockRepo.register).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "SecurePass123",
        fullName: "New User",
        referralCode: undefined,
      });
    });

    it("register_withReferralCode_passesReferralCode", async () => {
      // Arrange
      const mockRepo = createMockAuthRepository({
        register: jest.fn().mockResolvedValue(createMockAuthResponse()),
      });
      const useCase = new RegisterUserUseCase(mockRepo);

      // Act
      await useCase.execute({
        email: "newuser@example.com",
        password: "SecurePass123",
        fullName: "New User",
        referralCode: "REF123",
      });

      // Assert
      expect(mockRepo.register).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "SecurePass123",
        fullName: "New User",
        referralCode: "REF123",
      });
    });
  });

  describe("Sad Path", () => {
    it("register_withExistingEmail_throwsError", async () => {
      // Arrange
      const error = new Error("Email already registered");
      const mockRepo = createMockAuthRepository({
        register: jest.fn().mockRejectedValue(error),
      });
      const useCase = new RegisterUserUseCase(mockRepo);

      // Act & Assert
      await expect(
        useCase.execute({
          email: "existing@example.com",
          password: "SecurePass123",
          fullName: "Existing User",
        }),
      ).rejects.toThrow("Email already registered");
    });

    it("register_withWeakPassword_throwsError", async () => {
      // Arrange
      const error = new Error("Password too weak");
      const mockRepo = createMockAuthRepository({
        register: jest.fn().mockRejectedValue(error),
      });
      const useCase = new RegisterUserUseCase(mockRepo);

      // Act & Assert
      await expect(
        useCase.execute({
          email: "test@example.com",
          password: "123",
          fullName: "Test User",
        }),
      ).rejects.toThrow("Password too weak");
    });

    it("register_withInvalidEmailFormat_throwsError", async () => {
      // Arrange
      const error = new Error("Invalid email format");
      const mockRepo = createMockAuthRepository({
        register: jest.fn().mockRejectedValue(error),
      });
      const useCase = new RegisterUserUseCase(mockRepo);

      // Act & Assert
      await expect(
        useCase.execute({
          email: "notanemail",
          password: "SecurePass123",
          fullName: "Test User",
        }),
      ).rejects.toThrow("Invalid email format");
    });

    it("register_withMissingFullName_throwsError", async () => {
      // Arrange
      const error = new Error("Full name is required");
      const mockRepo = createMockAuthRepository({
        register: jest.fn().mockRejectedValue(error),
      });
      const useCase = new RegisterUserUseCase(mockRepo);

      // Act & Assert
      await expect(
        useCase.execute({
          email: "test@example.com",
          password: "SecurePass123",
          fullName: "",
        }),
      ).rejects.toThrow("Full name is required");
    });
  });
});

describe("LogoutUserUseCase", () => {
  describe("Happy Path", () => {
    it("logout_withValidSession_succeeds", async () => {
      // Arrange
      const mockRepo = createMockAuthRepository({
        logout: jest.fn().mockResolvedValue(undefined),
      });
      const useCase = new LogoutUserUseCase(mockRepo);

      // Act
      await useCase.execute();

      // Assert
      expect(mockRepo.logout).toHaveBeenCalled();
    });
  });

  describe("Sad Path", () => {
    it("logout_withExpiredToken_throwsError", async () => {
      // Arrange
      const error = new Error("Session expired");
      const mockRepo = createMockAuthRepository({
        logout: jest.fn().mockRejectedValue(error),
      });
      const useCase = new LogoutUserUseCase(mockRepo);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow("Session expired");
    });

    it("logout_withNetworkError_throwsError", async () => {
      // Arrange
      const error = new Error("Network error");
      const mockRepo = createMockAuthRepository({
        logout: jest.fn().mockRejectedValue(error),
      });
      const useCase = new LogoutUserUseCase(mockRepo);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow("Network error");
    });
  });
});
