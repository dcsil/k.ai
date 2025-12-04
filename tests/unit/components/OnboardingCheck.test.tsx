import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import OnboardingCheck from '@/components/OnboardingCheck';
import React from 'react';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockPathname = vi.fn(() => '/dashboard');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname(),
}));

// Mock useAuth
const mockUser = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock('@/components/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser(),
    getAccessToken: mockGetAccessToken,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('OnboardingCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/dashboard');
    mockUser.mockReturnValue({ id: '123', email: 'test@example.com' });
    mockGetAccessToken.mockReturnValue('mock-token');
  });

  afterEach(() => {
    cleanup();
  });

  it('renders children when onboarding is completed', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ onboardingCompleted: true }),
    } as Response);

    const { unmount } = render(
      <OnboardingCheck>
        <div>Protected Content</div>
      </OnboardingCheck>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    // Wait for state updates to complete
    await new Promise(resolve => setTimeout(resolve, 10));
    unmount();
  });

  it('redirects to onboarding when not completed', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ onboardingCompleted: false }),
    } as Response);

    const { unmount } = render(
      <OnboardingCheck>
        <div>Protected Content</div>
      </OnboardingCheck>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });

    // Wait for state updates to complete
    await new Promise(resolve => setTimeout(resolve, 10));
    unmount();
  });

  it('shows loading state while checking onboarding status', async () => {
    let resolvePromise: (() => void) | undefined;
    const mockPromise = new Promise<Response>((resolve) => {
      resolvePromise = () => resolve({
        ok: true,
        json: async () => ({ onboardingCompleted: true }),
      } as Response);
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => mockPromise);

    const { unmount } = render(
      <OnboardingCheck>
        <div>Protected Content</div>
      </OnboardingCheck>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Resolve the promise and wait for state updates to complete
    resolvePromise?.();
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
    
    unmount();
  });

  it('does not check onboarding when user is not authenticated', async () => {
    mockUser.mockReturnValue(null);

    const { unmount } = render(
      <OnboardingCheck>
        <div>Protected Content</div>
      </OnboardingCheck>
    );

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    // Wait for any potential state updates
    await new Promise(resolve => setTimeout(resolve, 10));
    unmount();
  });

  it('skips check when already on onboarding page', async () => {
    mockPathname.mockReturnValue('/onboarding');

    const { unmount } = render(
      <OnboardingCheck>
        <div>Onboarding Content</div>
      </OnboardingCheck>
    );

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
      expect(screen.getByText('Onboarding Content')).toBeInTheDocument();
    });

    // Wait for any potential state updates
    await new Promise(resolve => setTimeout(resolve, 10));
    unmount();
  });

  it('includes authorization header in API call', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ onboardingCompleted: true }),
    } as Response);

    const { unmount } = render(
      <OnboardingCheck>
        <div>Protected Content</div>
      </OnboardingCheck>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/profile',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
          credentials: 'include',
        })
      );
    });

    // Wait for state updates to complete
    await new Promise(resolve => setTimeout(resolve, 10));
    unmount();
  });

  it('handles API errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    );

    const { unmount } = render(
      <OnboardingCheck>
        <div>Protected Content</div>
      </OnboardingCheck>
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to check onboarding status:',
        expect.any(Error)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    // Wait a bit to ensure all state updates complete
    await new Promise(resolve => setTimeout(resolve, 10));
    
    unmount();
    consoleErrorSpy.mockRestore();
  });

  it('does not check when token is not available', async () => {
    mockGetAccessToken.mockReturnValue(null);

    const { unmount } = render(
      <OnboardingCheck>
        <div>Protected Content</div>
      </OnboardingCheck>
    );

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    // Wait for any potential state updates
    await new Promise(resolve => setTimeout(resolve, 10));
    unmount();
  });

  it('renders loading spinner while checking', () => {
    let resolvePromise: (() => void) | undefined;
    const mockPromise = new Promise<Response>((resolve) => {
      resolvePromise = () => resolve({
        ok: true,
        json: async () => ({ onboardingCompleted: true }),
      } as Response);
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => mockPromise);

    const { unmount } = render(
      <OnboardingCheck>
        <div>Protected Content</div>
      </OnboardingCheck>
    );

    const spinner = screen.getByText('Loading...').previousElementSibling;
    expect(spinner).toHaveClass('animate-spin');

    // Resolve the promise and unmount to prevent memory leaks
    resolvePromise?.();
    unmount();
  });
});
