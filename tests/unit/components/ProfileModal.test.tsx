import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import ProfileModal from '@/components/ProfileModal';

// Mock useAuth
const mockGetAccessToken = vi.fn();
vi.mock('@/components/AuthContext', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('ProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAccessToken.mockReturnValue('mock-token');
  });

  afterEach(() => {
    cleanup();
  });

  it('does not render when isOpen is false', () => {
    render(<ProfileModal isOpen={false} onClose={vi.fn()} />);
    
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByText('Profile')).toBeInTheDocument();
    // Loading spinner should be present
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('fetches and displays profile data', async () => {
    const mockProfile = {
      userId: 'user-123',
      hasReleasePlan: true,
      releaseProgress: 'in_progress',
      helpNeeded: '["social_media_promotion", "networking"]',
      onboardingCompleted: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile,
    } as Response);

    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    expect(screen.getByText('in progress')).toBeInTheDocument();
    expect(screen.getByText('social media promotion')).toBeInTheDocument();
    expect(screen.getByText('networking')).toBeInTheDocument();
  });

  it('displays "No" when hasReleasePlan is false', async () => {
    const mockProfile = {
      userId: 'user-123',
      hasReleasePlan: false,
      releaseProgress: 'not_started',
      helpNeeded: '[]',
      onboardingCompleted: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile,
    } as Response);

    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  it('displays "Not set" when releaseProgress is empty', async () => {
    const mockProfile = {
      userId: 'user-123',
      hasReleasePlan: true,
      releaseProgress: '',
      helpNeeded: '[]',
      onboardingCompleted: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile,
    } as Response);

    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Not set')).toBeInTheDocument();
    });
  });

  it('displays "None specified" when helpNeeded is empty', async () => {
    const mockProfile = {
      userId: 'user-123',
      hasReleasePlan: true,
      releaseProgress: 'planning',
      helpNeeded: '[]',
      onboardingCompleted: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile,
    } as Response);

    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('None specified')).toBeInTheDocument();
    });
  });

  it('handles helpNeeded as array instead of JSON string', async () => {
    const mockProfile = {
      userId: 'user-123',
      hasReleasePlan: true,
      releaseProgress: 'planning',
      helpNeeded: ['time_management', 'project_planning'],
      onboardingCompleted: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile,
    } as Response);

    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('time management')).toBeInTheDocument();
      expect(screen.getByText('project planning')).toBeInTheDocument();
    });
  });

  it('displays "No profile data found" when profile is null', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('No profile data found')).toBeInTheDocument();
    });
  });

  it('handles fetch errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load profile:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();

    render(<ProfileModal isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking backdrop', () => {
    const onClose = vi.fn();

    render(<ProfileModal isOpen={true} onClose={onClose} />);

    const backdrop = document.querySelector('.fixed.inset-0');
    fireEvent.click(backdrop!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking modal content', () => {
    const onClose = vi.fn();

    render(<ProfileModal isOpen={true} onClose={onClose} />);

    const modalContent = document.querySelector('.bg-white');
    fireEvent.click(modalContent!);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('includes authorization header in API call', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/profile',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });
  });

  it('does not fetch profile when modal is closed', () => {
    render(<ProfileModal isOpen={false} onClose={vi.fn()} />);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refetches profile when modal is reopened', async () => {
    const { rerender } = render(<ProfileModal isOpen={false} onClose={vi.fn()} />);

    expect(global.fetch).not.toHaveBeenCalled();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    rerender(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
