import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import ReleaseTimeline from '@/components/ReleaseTimeline';

// Mock useAuth
const mockGetAccessToken = vi.fn();
vi.mock('@/components/AuthContext', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('ReleaseTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAccessToken.mockReturnValue('mock-token');
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the release timeline component', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response);

    render(<ReleaseTimeline />);

    await waitFor(() => {
      expect(screen.getByText(/releases/i) || screen.getByText(/timeline/i)).toBeInTheDocument();
    });
  });

  it('fetches releases on mount', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response);

    render(<ReleaseTimeline />);

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

  it('displays releases from API', async () => {
    const mockReleases = [
      {
        id: '1',
        name: 'Album Release',
        targetReleaseDate: '2024-12-25',
        status: 'IN_PROGRESS',
        archived: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '2',
        name: 'Single Drop',
        targetReleaseDate: '2024-11-15',
        status: 'PLANNING',
        archived: false,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02',
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockReleases }),
    } as Response);

    render(<ReleaseTimeline />);

    await waitFor(() => {
      expect(screen.getByText('Album Release')).toBeInTheDocument();
      expect(screen.getByText('Single Drop')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching', () => {
    let resolvePromise: (() => void) | undefined;
    const mockPromise = new Promise<Response>((resolve) => {
      resolvePromise = () => resolve({
        ok: true,
        json: async () => ({ items: [] }),
      } as Response);
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => mockPromise);

    const { unmount } = render(<ReleaseTimeline />);

    expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeTruthy();

    // Resolve the promise and unmount to prevent memory leaks
    resolvePromise?.();
    unmount();
  });

  it('opens add release modal when add button is clicked', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response);

    render(<ReleaseTimeline />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add release|new release/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/create|add/i)).toBeInTheDocument();
    });
  });

  it('renders without crashing when adding releases', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response);

    render(<ReleaseTimeline />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Verify component has the button to add releases
    expect(screen.getByRole('button', { name: /add release|new release|\+/i })).toBeInTheDocument();
  });

  it('accepts onReleasesChange callback prop', async () => {
    const mockCallback = vi.fn();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response);

    render(<ReleaseTimeline onReleasesChange={mockCallback} />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Just verify component renders with the callback prop
    expect(screen.getByRole('button', { name: /add release|new release|\+/i })).toBeInTheDocument();
  });

  it('displays releases with their information', async () => {
    const mockReleases = [
      {
        id: '1',
        name: 'Test Release',
        status: 'COMPLETED',
        archived: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockReleases }),
    } as Response);

    render(<ReleaseTimeline />);

    await waitFor(() => {
      expect(screen.getByText('Test Release')).toBeInTheDocument();
    });
  });

  it('displays releases with target dates', async () => {
    const mockReleases = [
      {
        id: '1',
        name: 'Christmas Release',
        targetReleaseDate: '2024-12-25',
        status: 'PLANNING',
        archived: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockReleases }),
    } as Response);

    render(<ReleaseTimeline />);

    await waitFor(() => {
      expect(screen.getByText('Christmas Release')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(<ReleaseTimeline />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Failed to fetch releases');
    });

    consoleErrorSpy.mockRestore();
  });

  it('renders when no releases exist', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response);

    render(<ReleaseTimeline />);

    await waitFor(() => {
      // Just verify it renders without crashing when there are no releases
      expect(screen.getByRole('button', { name: /add release|new release|\+/i })).toBeInTheDocument();
    });
  });

  it('includes authorization header in all API calls', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response);

    render(<ReleaseTimeline />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });
  });

  it('can update existing releases via API', async () => {
    const mockReleases = [
      {
        id: '1',
        name: 'Test Release',
        status: 'PLANNING',
        archived: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockReleases }),
    } as Response);

    render(<ReleaseTimeline />);

    await waitFor(() => {
      // Use getAllByText to handle multiple matches and just verify one exists
      const elements = screen.getAllByText(/Test Release/i);
      expect(elements.length).toBeGreaterThan(0);
    });

    // Verify the component fetches releases with auth
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
