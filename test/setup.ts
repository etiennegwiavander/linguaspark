// Test setup file
import { vi } from 'vitest'

// Mock environment variables
process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_GOOGLE_AI_BASE_URL = 'https://test-api.com'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}