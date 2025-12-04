import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import React from 'react';

// Mock Next.js navigation
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useAuth
const mockUser = vi.fn();
const mockLoading = vi.fn();

vi.mock('@/components/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser(),
    loading: mockLoading(),
  }),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.mockReturnValue({ id: '123', email: 'test@example.com' });
    mockLoading.mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders children when user is authenticated', () => {
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows loading state while authentication is loading', () => {
    mockLoading.mockReturnValue(true);

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', async () => {
    mockUser.mockReturnValue(null);
    mockLoading.mockReturnValue(false);

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('does not redirect while still loading', () => {
    mockUser.mockReturnValue(null);
    mockLoading.mockReturnValue(true);

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('renders loading spinner while checking authentication', () => {
    mockLoading.mockReturnValue(true);

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    const spinner = screen.getByText('Loading...').previousElementSibling;
    expect(spinner).toHaveClass('animate-spin');
  });

  it('returns null when user is not authenticated and not loading', async () => {
    mockUser.mockReturnValue(null);
    mockLoading.mockReturnValue(false);

    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('updates when authentication state changes from loading to authenticated', async () => {
    mockUser.mockReturnValue(null);
    mockLoading.mockReturnValue(true);

    const { rerender } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Simulate authentication completing
    mockUser.mockReturnValue({ id: '123', email: 'test@example.com' });
    mockLoading.mockReturnValue(false);

    rerender(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('displays loading state with proper styling', () => {
    mockLoading.mockReturnValue(true);

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    const loadingContainer = screen.getByText('Loading...').parentElement?.parentElement;
    expect(loadingContainer).toHaveClass('min-h-screen');
    expect(loadingContainer).toHaveClass('flex');
    expect(loadingContainer).toHaveClass('items-center');
    expect(loadingContainer).toHaveClass('justify-center');
  });

  it('handles rapid authentication state changes', async () => {
    mockLoading.mockReturnValue(true);

    const { rerender } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Change to not authenticated
    mockUser.mockReturnValue(null);
    mockLoading.mockReturnValue(false);

    rerender(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
