/**
 * Domain Layer Index
 *
 * The domain layer contains all business entities, value objects, and interfaces.
 * This is the core of clean architecture - it has no external dependencies.
 *
 * Architecture Principles:
 * - Entities represent core business concepts
 * - Value objects are immutable and represent descriptive aspects
 * - Interfaces define contracts for data access (implemented by infrastructure)
 */

// Entities
export * from "./entities";

// Value Objects
export * from "./value-objects";

// Interfaces
export * from "./interfaces";
