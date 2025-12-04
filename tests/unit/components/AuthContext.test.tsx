import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import React from 'react';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

// Test component to access useAuth
function TestComponent() {
  const { user, loading, login, signup, logout, refreshAuth, getAccessToken } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="token">{getAccessToken() || 'no-token'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => signup('test@example.com', 'password', 'Test User')}>
        Signup
      </button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => refreshAuth()}>Refresh</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within AuthProvider');

    consoleSpy.mockRestore();
  });

  it('provides initial loading state', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });
  });

  it('calls refresh auth on mount', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });
  });

  it('sets user and token on successful refresh', async () => {
    const mockToken = 'header.' + btoa(JSON.stringify({
      sub: '123',
      email: 'user@example.com',
      role: 'USER',
    })) + '.signature';

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: mockToken }),
    } as Response);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user@example.com');
      expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
    });
  });

  it('handles login successfully', async () => {
    // Mock refresh call on mount
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    const mockToken = 'header.' + btoa(JSON.stringify({
      sub: '123',
      email: 'test@example.com',
      role: 'USER',
    })) + '.signature';

    // Mock login call
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: mockToken,
        user: {
          id: '123',
          email: 'test@example.com',
          displayName: null,
          emailVerified: null,
          role: 'USER',
        },
      }),
    } as Response);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    const loginButton = screen.getByText('Login');
    loginButton.click();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
        })
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles signup successfully', async () => {
    // Mock refresh call on mount
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    const mockToken = 'header.' + btoa(JSON.stringify({
      sub: '123',
      email: 'test@example.com',
      role: 'USER',
    })) + '.signature';

    // Mock signup call
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: mockToken,
        user: {
          id: '123',
          email: 'test@example.com',
          displayName: 'Test User',
          emailVerified: null,
          role: 'USER',
        },
      }),
    } as Response);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    const signupButton = screen.getByText('Signup');
    signupButton.click();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/signup',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password',
            displayName: 'Test User',
          }),
        })
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('handles logout successfully', async () => {
    // Mock refresh with logged in user
    const mockToken = 'header.' + btoa(JSON.stringify({
      sub: '123',
      email: 'user@example.com',
      role: 'USER',
    })) + '.signature';

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: mockToken }),
    } as Response);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user@example.com');
    });

    // Mock logout call
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
    } as Response);

    const logoutButton = screen.getByText('Logout');
    logoutButton.click();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/logout',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('handles login error', async () => {
    // Mock refresh call on mount
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    // Mock failed login
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'Invalid credentials' } }),
    } as Response);

    const { useAuth } = await import('@/components/AuthContext');
    
    // Create a test component that catches errors
    function TestComponentWithErrorHandling() {
      const { login, loading } = useAuth();
      const [error, setError] = React.useState<string | null>(null);

      const handleLogin = async () => {
        try {
          await login('test@example.com', 'password');
        } catch (err) {
          setError((err as Error).message);
        }
      };

      return (
        <div>
          <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
          <div data-testid="error">{error || 'no-error'}</div>
          <button onClick={handleLogin}>Login</button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <TestComponentWithErrorHandling />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    const loginButton = screen.getByText('Login');
    loginButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    });
  });

  it('handles signup error', async () => {
    // Mock refresh call on mount
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    // Mock failed signup
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'Email already exists' } }),
    } as Response);

    const { useAuth } = await import('@/components/AuthContext');
    
    // Create a test component that catches errors
    function TestComponentWithErrorHandling() {
      const { signup, loading } = useAuth();
      const [error, setError] = React.useState<string | null>(null);

      const handleSignup = async () => {
        try {
          await signup('test@example.com', 'password', 'Test User');
        } catch (err) {
          setError((err as Error).message);
        }
      };

      return (
        <div>
          <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
          <div data-testid="error">{error || 'no-error'}</div>
          <button onClick={handleSignup}>Signup</button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <TestComponentWithErrorHandling />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    const signupButton = screen.getByText('Signup');
    signupButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Email already exists');
    });
  });

  it('returns null token when not authenticated', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('no-token');
    });
  });
});
