import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import Dashboard from '@/components/Dashboard';

// Mock child components
vi.mock('@/components/OnboardingCheck', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="onboarding-check">{children}</div>,
}));

vi.mock('@/components/Calendar', () => ({
  default: () => <div data-testid="calendar">Calendar Component</div>,
}));

vi.mock('@/components/ReleaseTimeline', () => ({
  default: ({ onReleasesChange }: { onReleasesChange?: () => void }) => (
    <div data-testid="release-timeline">
      <button onClick={onReleasesChange}>Trigger Change</button>
      Release Timeline Component
    </div>
  ),
}));

vi.mock('@/components/SocialMedia', () => ({
  default: () => <div data-testid="social-media">Social Media Component</div>,
}));

vi.mock('@/components/AIChatbot', () => ({
  default: () => <div data-testid="ai-chatbot">AI Chatbot Component</div>,
}));

vi.mock('@/components/ProfileModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="profile-modal">
        <button onClick={onClose}>Close Profile</button>
        Profile Modal
      </div>
    ) : null,
}));

// Mock useAuth
const mockLogout = vi.fn();
const mockGetAccessToken = vi.fn();
vi.mock('@/components/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '123',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    logout: mockLogout,
    getAccessToken: mockGetAccessToken,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAccessToken.mockReturnValue('mock-token');
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the dashboard component', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/k\.ai/i)).toBeInTheDocument();
    });
  });

  it('wraps content with OnboardingCheck', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('onboarding-check')).toBeInTheDocument();
  });

  it('displays tasks section by default', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [{ id: '1', name: 'Release 1' }] }),
    } as Response);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/tasks/i)).toBeInTheDocument();
    });
  });

  it('fetches releases on mount', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/releases',
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });
  });

  it('switches to calendar section when clicked', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/tasks/i)).toBeInTheDocument();
    });

    const calendarButton = screen.getByRole('button', { name: /calendar/i });
    fireEvent.click(calendarButton);

    await waitFor(() => {
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });
  });

  it('switches to releases section when clicked', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/tasks/i)).toBeInTheDocument();
    });

    const releasesButton = screen.getByRole('button', { name: /releases/i });
    fireEvent.click(releasesButton);

    await waitFor(() => {
      expect(screen.getByTestId('release-timeline')).toBeInTheDocument();
    });
  });

  it('switches to social section when clicked', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/tasks/i)).toBeInTheDocument();
    });

    const socialButton = screen.getByRole('button', { name: /social/i });
    fireEvent.click(socialButton);

    await waitFor(() => {
      expect(screen.getByTestId('social-media')).toBeInTheDocument();
    });
  });

  it('switches to chat section when clicked', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/tasks/i)).toBeInTheDocument();
    });

    const chatButton = screen.getByRole('button', { name: /chat|ai/i });
    fireEvent.click(chatButton);

    await waitFor(() => {
      expect(screen.getByTestId('ai-chatbot')).toBeInTheDocument();
    });
  });

  it('opens profile modal when profile button is clicked', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/tasks/i)).toBeInTheDocument();
    });

    // Find the profile button by the user's email
    const profileButton = screen.getByText('test@example.com').closest('button');
    expect(profileButton).toBeTruthy();
    fireEvent.click(profileButton!);

    await waitFor(() => {
      expect(screen.getByTestId('profile-modal')).toBeInTheDocument();
    });
  });

  it('closes profile modal when close is clicked', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/tasks/i)).toBeInTheDocument();
    });

    // Find the profile button by the user's email
    const profileButton = screen.getByText('test@example.com').closest('button');
    expect(profileButton).toBeTruthy();
    fireEvent.click(profileButton!);

    await waitFor(() => {
      expect(screen.getByTestId('profile-modal')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('Close Profile');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('profile-modal')).not.toBeInTheDocument();
    });
  });

  it('calls logout when logout button is clicked', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/tasks/i)).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /logout|sign out/i });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('fetches tasks when a release is selected', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ id: 'release1', name: 'Release 1' }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      } as Response);

    render(<Dashboard />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/releases/release1/tasks',
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch releases:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('displays loading state initially', () => {
    render(<Dashboard />);

    expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeTruthy();
  });

  it('displays user email in dashboard', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/test@example\.com/i)).toBeInTheDocument();
    });
  });
});
