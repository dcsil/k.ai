import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import SignupPage from '@/app/signup/page';

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

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the signup form', () => {
    render(<SignupPage />);

    expect(screen.getByText('k.ai')).toBeInTheDocument();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your artist name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders the login link', () => {
    render(<SignupPage />);

    const loginLink = screen.getByText('Sign in');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('updates form fields on input', () => {
    render(<SignupPage />);

    const nameInput = screen.getByPlaceholderText('Your artist name') as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('john@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('validates password length before submission', async () => {
    render(<SignupPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('calls signup function with valid inputs', async () => {
    mockSignup.mockResolvedValue(undefined);
    render(<SignupPage />);

    const nameInput = screen.getByPlaceholderText('Your artist name');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('john@example.com', 'password123', 'John Doe');
    });
  });

  it('calls signup with undefined displayName when empty', async () => {
    mockSignup.mockResolvedValue(undefined);
    render(<SignupPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('john@example.com', 'password123', undefined);
    });
  });

  it('displays loading state during signup', async () => {
    mockSignup.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 10))
    );
    render(<SignupPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Creating account...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Create account')).toBeInTheDocument();
    });
  });

  it('displays error message on signup failure', async () => {
    mockSignup.mockRejectedValue(new Error('Email already exists'));
    render(<SignupPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('displays generic error message when error is not an Error instance', async () => {
    mockSignup.mockRejectedValue('Unknown error');
    render(<SignupPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Signup failed')).toBeInTheDocument();
    });
  });

  it('clears error message on new submission attempt', async () => {
    mockSignup.mockRejectedValueOnce(new Error('Email already exists'));
    render(<SignupPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // First submission with error
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    // Second submission should clear error
    mockSignup.mockResolvedValue(undefined);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('Email already exists')).not.toBeInTheDocument();
    });
  });

  it('displays password requirement hint', () => {
    render(<SignupPage />);

    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
  });

  it('has required attributes on email and password inputs', () => {
    render(<SignupPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('required');
  });

  it('does not require display name input', () => {
    render(<SignupPage />);

    const nameInput = screen.getByPlaceholderText('Your artist name');
    expect(nameInput).not.toHaveAttribute('required');
  });
});
