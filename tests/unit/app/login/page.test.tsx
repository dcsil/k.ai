import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import LoginPage from '@/app/login/page';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock AuthContext once at module level
const mockLogin = vi.fn();
const mockSignup = vi.fn();
const mockLogout = vi.fn();
const mockRefreshAuth = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock('@/components/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    signup: mockSignup,
    logout: mockLogout,
    refreshAuth: mockRefreshAuth,
    getAccessToken: mockGetAccessToken,
    user: null,
    loading: false,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the login form', () => {
    render(<LoginPage />);

    expect(screen.getByText('k.ai')).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders the signup link', () => {
    render(<LoginPage />);

    const signupLink = screen.getByText('Sign up');
    expect(signupLink).toBeInTheDocument();
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
  });

  it('updates email and password fields on input', () => {
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('calls login function on form submission', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays loading state during login', async () => {
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 10))
    );
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });
  });

  it('displays error message on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('displays generic error message when error is not an Error instance', async () => {
    mockLogin.mockRejectedValue('Unknown error');
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Login failed')).toBeInTheDocument();
    });
  });

  it('clears error message on new submission attempt', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // First submission with error
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Second submission should clear error
    mockLogin.mockResolvedValue(undefined);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
    });
  });

  it('has required attributes on form inputs', () => {
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('required');
  });
});
