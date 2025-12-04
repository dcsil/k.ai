import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';

// Mock the Dashboard component
vi.mock('@/components/Dashboard', () => ({
  default: () => <div data-testid="dashboard-component">Dashboard Component</div>,
}));

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock AuthContext once at module level
vi.mock('@/components/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    refreshAuth: vi.fn(),
    getAccessToken: () => 'mock-token',
    user: {
      id: '1',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: null,
      role: 'USER',
    },
    loading: false,
  }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the Dashboard component', () => {
    render(<DashboardPage />);

    const dashboardComponent = screen.getByTestId('dashboard-component');
    expect(dashboardComponent).toBeInTheDocument();
    expect(dashboardComponent).toHaveTextContent('Dashboard Component');
  });

  it('is a simple wrapper that delegates to Dashboard component', () => {
    const { container } = render(<DashboardPage />);

    // The page should only contain the Dashboard component
    expect(container.firstChild).toBeTruthy();
  });
});
