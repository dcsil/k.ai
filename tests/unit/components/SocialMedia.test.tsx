import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import SocialMedia from '@/components/SocialMedia';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

describe('SocialMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the social media component', () => {
    render(<SocialMedia />);
    
    expect(screen.getByText('Social Media')).toBeInTheDocument();
    expect(screen.getByText('Create Post')).toBeInTheDocument();
  });

  it('displays stats cards', () => {
    render(<SocialMedia />);
    
    // Check stats cards exist by looking for the numbers
    const statsCards = screen.getAllByText('0');
    expect(statsCards.length).toBeGreaterThanOrEqual(3); // At least 3 stats cards with 0
    
    // Check the main sections are present
    expect(screen.getByText('Social Media')).toBeInTheDocument();
    expect(screen.getByText('No posts found')).toBeInTheDocument();
  });

  it('displays filter buttons', () => {
    render(<SocialMedia />);
    
    expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^drafts$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^scheduled$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^published$/i })).toBeInTheDocument();
  });

  it('displays "No posts found" when there are no posts', () => {
    render(<SocialMedia />);
    
    expect(screen.getByText('No posts found')).toBeInTheDocument();
  });

  it('opens post composer when Create Post is clicked', () => {
    render(<SocialMedia />);
    
    const createButton = screen.getByRole('button', { name: /create post/i });
    fireEvent.click(createButton);
    
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Platforms')).toBeInTheDocument();
  });

  it('adds a new draft post', async () => {
    render(<SocialMedia />);
    
    // Open composer
    const createButton = screen.getByRole('button', { name: /create post/i });
    fireEvent.click(createButton);
    
    // Fill in form
    const textarea = screen.getByPlaceholderText('');
    fireEvent.change(textarea, { target: { value: 'Test post content' } });
    
    // Select platform
    const instagramButton = screen.getByRole('button', { name: /instagram/i });
    fireEvent.click(instagramButton);
    
    // Submit form
    const forms = document.querySelectorAll('form');
    const form = forms[0];
    fireEvent.submit(form);
    
    // Check post appears
    await waitFor(() => {
      expect(screen.getByText('Test post content')).toBeInTheDocument();
    });
  });

  it('displays character count', () => {
    render(<SocialMedia />);
    
    const createButton = screen.getByRole('button', { name: /create post/i });
    fireEvent.click(createButton);
    
    const textarea = screen.getByPlaceholderText('');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    
    expect(screen.getByText('5 characters')).toBeInTheDocument();
  });

  it('filters posts by status', async () => {
    // Pre-populate localStorage with posts
    localStorageMock.setItem('k_ai_social_posts_v1', JSON.stringify([
      {
        id: '1',
        content: 'Draft post',
        platforms: ['instagram'],
        status: 'draft',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        content: 'Published post',
        platforms: ['facebook'],
        status: 'published',
        createdAt: '2024-01-02T00:00:00Z',
      },
    ]));
    
    render(<SocialMedia />);
    
    // Should show both posts initially
    expect(screen.getByText('Draft post')).toBeInTheDocument();
    expect(screen.getByText('Published post')).toBeInTheDocument();
    
    // Filter by drafts
    const draftsButton = screen.getByRole('button', { name: /^drafts$/i });
    fireEvent.click(draftsButton);
    
    expect(screen.getByText('Draft post')).toBeInTheDocument();
    expect(screen.queryByText('Published post')).not.toBeInTheDocument();
  });

  it('expands and collapses post details', () => {
    localStorageMock.setItem('k_ai_social_posts_v1', JSON.stringify([
      {
        id: '1',
        content: 'Test post',
        platforms: ['instagram'],
        status: 'draft',
        title: 'Post Title',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]));
    
    render(<SocialMedia />);
    
    // Click to expand
    const postCard = screen.getByText('Test post').closest('div');
    fireEvent.click(postCard!);
    
    // Should show title
    expect(screen.getByText('Post Title')).toBeInTheDocument();
  });

  it('deletes a post', async () => {
    localStorageMock.setItem('k_ai_social_posts_v1', JSON.stringify([
      {
        id: '1',
        content: 'Post to delete',
        platforms: ['instagram'],
        status: 'draft',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]));
    
    render(<SocialMedia />);
    
    // Expand post
    const postCard = screen.getByText('Post to delete').closest('div');
    fireEvent.click(postCard!);
    
    // Click delete
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    // Post should be removed
    await waitFor(() => {
      expect(screen.queryByText('Post to delete')).not.toBeInTheDocument();
    });
  });

  it('schedules a draft post', async () => {
    localStorageMock.setItem('k_ai_social_posts_v1', JSON.stringify([
      {
        id: '1',
        content: 'Draft to schedule',
        platforms: ['instagram'],
        status: 'draft',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]));
    
    render(<SocialMedia />);
    
    // Expand post
    const postCard = screen.getByText('Draft to schedule').closest('div');
    fireEvent.click(postCard!);
    
    // Click schedule
    const scheduleButton = screen.getByRole('button', { name: /^schedule$/i });
    fireEvent.click(scheduleButton);
    
    await waitFor(() => {
      const scheduledBadge = screen.getByText((content, element) => {
        return !!(element?.classList.contains('bg-blue-100') && content === 'Scheduled');
      });
      expect(scheduledBadge).toBeInTheDocument();
    });
  });

  it('unschedules a scheduled post', async () => {
    localStorageMock.setItem('k_ai_social_posts_v1', JSON.stringify([
      {
        id: '1',
        content: 'Scheduled post',
        platforms: ['instagram'],
        status: 'scheduled',
        scheduledFor: '2024-12-25T10:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]));
    
    render(<SocialMedia />);
    
    // Expand post
    const postCard = screen.getByText('Scheduled post').closest('div');
    fireEvent.click(postCard!);
    
    // Click unschedule
    const unscheduleButton = screen.getByRole('button', { name: /unschedule/i });
    fireEvent.click(unscheduleButton);
    
    // Status should change to draft
    await waitFor(() => {
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });
  });

  it('displays scheduled date and time', () => {
    localStorageMock.setItem('k_ai_social_posts_v1', JSON.stringify([
      {
        id: '1',
        content: 'Scheduled post',
        platforms: ['instagram'],
        status: 'scheduled',
        scheduledFor: '2024-12-25T10:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]));
    
    render(<SocialMedia />);
    
    // Should show date
    expect(document.body.textContent).toContain('12/25/2024');
  });

  it('updates stats correctly', () => {
    localStorageMock.setItem('k_ai_social_posts_v1', JSON.stringify([
      {
        id: '1',
        content: 'Draft 1',
        platforms: ['instagram'],
        status: 'draft',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        content: 'Draft 2',
        platforms: ['instagram'],
        status: 'draft',
        createdAt: '2024-01-02T00:00:00Z',
      },
      {
        id: '3',
        content: 'Published 1',
        platforms: ['instagram'],
        status: 'published',
        createdAt: '2024-01-03T00:00:00Z',
      },
    ]));
    
    render(<SocialMedia />);
    
    // Check stats show correct counts
    const stats = document.querySelectorAll('.text-3xl');
    expect(stats[0].textContent).toBe('2'); // Drafts
    expect(stats[1].textContent).toBe('0'); // Scheduled
    expect(stats[2].textContent).toBe('1'); // Published
  });

  it('saves posts to localStorage', async () => {
    render(<SocialMedia />);
    
    // Open composer and create post
    const createButton = screen.getByRole('button', { name: /create post/i });
    fireEvent.click(createButton);
    
    const textarea = screen.getByPlaceholderText('');
    fireEvent.change(textarea, { target: { value: 'Test post' } });
    
    const instagramButton = screen.getByRole('button', { name: /instagram/i });
    fireEvent.click(instagramButton);
    
    const forms = document.querySelectorAll('form');
    fireEvent.submit(forms[0]);
    
    // Wait for state to update
    await waitFor(() => {
      const stored = localStorageMock.getItem('k_ai_social_posts_v1');
      expect(stored).toBeTruthy();
      if (stored) {
        const posts = JSON.parse(stored);
        expect(posts).toHaveLength(1);
        expect(posts[0].content).toBe('Test post');
      }
    });
  });

  it('loads posts from localStorage on mount', () => {
    localStorageMock.setItem('k_ai_social_posts_v1', JSON.stringify([
      {
        id: '1',
        content: 'Saved post',
        platforms: ['instagram'],
        status: 'draft',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]));
    
    render(<SocialMedia />);
    
    expect(screen.getByText('Saved post')).toBeInTheDocument();
  });

  it('displays platform icons', () => {
    localStorageMock.setItem('k_ai_social_posts_v1', JSON.stringify([
      {
        id: '1',
        content: 'Multi-platform post',
        platforms: ['instagram', 'facebook', 'x'],
        status: 'draft',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]));
    
    render(<SocialMedia />);
    
    expect(screen.getByTitle('instagram')).toBeInTheDocument();
    expect(screen.getByTitle('facebook')).toBeInTheDocument();
    expect(screen.getByTitle('x')).toBeInTheDocument();
  });

  it('closes composer modal', () => {
    render(<SocialMedia />);
    
    const createButton = screen.getByRole('button', { name: /create post/i });
    fireEvent.click(createButton);
    
    expect(screen.getByText('Content')).toBeInTheDocument();
    
    // Find and click close/cancel button
    const cancelButtons = screen.getAllByRole('button');
    const cancelButton = cancelButtons.find(btn => btn.textContent === 'Cancel');
    if (cancelButton) {
      fireEvent.click(cancelButton);
      
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    }
  });

  it('displays media preview when mediaUrl is present', () => {
    localStorageMock.setItem('k_ai_social_posts_v1', JSON.stringify([
      {
        id: '1',
        content: 'Post with media',
        platforms: ['instagram'],
        status: 'draft',
        mediaUrl: 'https://example.com/image.jpg',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]));
    
    render(<SocialMedia />);
    
    // Expand post
    const postCard = screen.getByText('Post with media').closest('div');
    fireEvent.click(postCard!);
    
    // Check for media section
    expect(screen.getByText('Media')).toBeInTheDocument();
    const image = screen.getByAltText('Post media');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('displays video URL when present', () => {
    localStorageMock.setItem('k_ai_social_posts_v1', JSON.stringify([
      {
        id: '1',
        content: 'Post with video',
        platforms: ['youtube'],
        status: 'draft',
        videoUrl: 'https://youtube.com/watch?v=123',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]));
    
    render(<SocialMedia />);
    
    // Expand post
    const postCard = screen.getByText('Post with video').closest('div');
    fireEvent.click(postCard!);
    
    // Check for video URL
    expect(screen.getByText('Video URL')).toBeInTheDocument();
    expect(screen.getByText('https://youtube.com/watch?v=123')).toBeInTheDocument();
  });
});
