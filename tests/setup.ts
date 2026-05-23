import { vi } from 'vitest'

// Mock 'server-only' globally so Vitest tests can import server modules safely
vi.mock('server-only', () => ({}))
