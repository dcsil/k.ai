import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Providers } from '@/components/Providers';
import { useAuth } from '@/components/AuthContext';
import React from 'react';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

// Test component that uses useAuth
function TestConsumer() {
  const { user, loading, login } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-available">Auth Context Available</div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
    </div>
  );
}

describe('Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders children wrapped in providers', () => {
    render(
      <Providers>
        <div>Test Content</div>
      </Providers>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('provides AuthContext to children', async () => {
    render(
      <Providers>
        <TestConsumer />
      </Providers>
    );

    expect(screen.getByTestId('auth-available')).toBeInTheDocument();
  });

  it('provides working authentication context', async () => {
    render(
      <Providers>
        <TestConsumer />
      </Providers>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('allows multiple children', () => {
    render(
      <Providers>
        <div>First Child</div>
        <div>Second Child</div>
        <div>Third Child</div>
      </Providers>
    );

    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
    expect(screen.getByText('Third Child')).toBeInTheDocument();
  });

  it('provides auth state to nested components', async () => {
    function NestedComponent() {
      const { user } = useAuth();
      return <div>User: {user ? user.email : 'none'}</div>;
    }

    render(
      <Providers>
        <div>
          <div>
            <NestedComponent />
          </div>
        </div>
      </Providers>
    );

    expect(screen.getByText(/User:/)).toBeInTheDocument();
  });

  it('initializes authentication on mount', async () => {
    render(
      <Providers>
        <TestConsumer />
      </Providers>
    );

    // AuthProvider should call refresh on mount
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });
  });

  it('handles fragment children', () => {
    render(
      <Providers>
        <>
          <div>Fragment Child 1</div>
          <div>Fragment Child 2</div>
        </>
      </Providers>
    );

    expect(screen.getByText('Fragment Child 1')).toBeInTheDocument();
    expect(screen.getByText('Fragment Child 2')).toBeInTheDocument();
  });

  it('wraps application with AuthProvider', () => {
    const { container } = render(
      <Providers>
        <div id="test-child">Test</div>
      </Providers>
    );

    // The child should be rendered
    expect(container.querySelector('#test-child')).toBeInTheDocument();
  });
});
