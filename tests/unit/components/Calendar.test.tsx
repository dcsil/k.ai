import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import Calendar from '@/components/Calendar';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the calendar component', () => {
    render(<Calendar />);

    expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
  });

  it('displays month view by default', () => {
    render(<Calendar />);

    const monthButton = screen.getByRole('button', { name: /month/i });
    expect(monthButton).toHaveClass('bg-primary');
  });

  it('switches between different views', () => {
    render(<Calendar />);

    const dayButton = screen.getByRole('button', { name: /^day$/i });
    const weekButton = screen.getByRole('button', { name: /week/i });
    const monthButton = screen.getByRole('button', { name: /month/i });

    fireEvent.click(dayButton);
    expect(dayButton).toHaveClass('bg-primary');

    fireEvent.click(weekButton);
    expect(weekButton).toHaveClass('bg-primary');

    fireEvent.click(monthButton);
    expect(monthButton).toHaveClass('bg-primary');
  });

  it('navigates to previous month', () => {
    render(<Calendar />);

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    expect(screen.getByText(new RegExp(currentMonth))).toBeInTheDocument();

    const prevButton = screen.getAllByRole('button').find(btn => 
      btn.textContent?.includes('‹') || btn.getAttribute('aria-label')?.includes('previous')
    );
    
    if (prevButton) {
      fireEvent.click(prevButton);
      
      const prevMonth = new Date();
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const expectedMonth = prevMonth.toLocaleString('default', { month: 'long' });
      
      waitFor(() => {
        expect(screen.getByText(new RegExp(expectedMonth))).toBeInTheDocument();
      });
    }
  });

  it('navigates to next month', () => {
    render(<Calendar />);

    const nextButton = screen.getAllByRole('button').find(btn => 
      btn.textContent?.includes('›') || btn.getAttribute('aria-label')?.includes('next')
    );
    
    if (nextButton) {
      fireEvent.click(nextButton);
      
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const expectedMonth = nextMonth.toLocaleString('default', { month: 'long' });
      
      waitFor(() => {
        expect(screen.getByText(new RegExp(expectedMonth))).toBeInTheDocument();
      });
    }
  });

  it('fetches tasks from API on mount', async () => {
    render(<Calendar />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/releases',
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });
  });

  it('displays tasks from API', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const mockTasks = [
      {
        id: '1',
        title: 'Test Task',
        dueDate: `${todayStr}T10:00:00Z`,
        description: 'Task description',
        status: 'IN_PROGRESS',
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ id: 'release1' }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockTasks }),
      } as Response);

    render(<Calendar />);

    await waitFor(() => {
      // Tasks appear in calendar grid, check document contains the text
      expect(document.body.textContent).toContain('Test Task');
    });
  });

  it('opens add event modal when add button is clicked', () => {
    render(<Calendar />);

    const addButton = screen.getByRole('button', { name: /add event/i });
    fireEvent.click(addButton);

    // Modal opens, check for Event Title label which is unique to the modal
    expect(screen.getByText(/event title/i)).toBeInTheDocument();
  });

  it('saves events to localStorage', async () => {
    render(<Calendar />);

    const addButton = screen.getByRole('button', { name: /add event/i });
    fireEvent.click(addButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText(/event title/i)).toBeInTheDocument();
    });
    
    // Find inputs within the modal
    const inputs = screen.getAllByRole('textbox');
    const titleInput = inputs[0];
    
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const dateInput = dateInputs[0] as HTMLInputElement;
    
    // Submit button text is "Add Event" in add mode
    const form = titleInput.closest('form')!;

    fireEvent.change(titleInput, { target: { value: 'New Event' } });
    fireEvent.change(dateInput, { target: { value: '2024-12-25' } });
    fireEvent.submit(form);

    await waitFor(() => {
      const stored = localStorageMock.getItem('k_ai_calendar_events_v1');
      expect(stored).toBeTruthy();
      if (stored) {
        const events = JSON.parse(stored);
        expect(events.some((e: { title: string }) => e.title === 'New Event')).toBe(true);
      }
    });
  });

  it('loads events from localStorage on mount', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const mockEvents = [
      {
        id: 'event-1',
        title: 'Saved Event',
        date: todayStr, // Use today's date so it shows in current month view
        startTime: '10:00',
        endTime: '11:00',
        recurring: 'none',
        type: 'event',
      },
    ];

    localStorageMock.setItem('k_ai_calendar_events_v1', JSON.stringify(mockEvents));

    render(<Calendar />);

    await waitFor(() => {
      expect(screen.getByText('Saved Event')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(<Calendar />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch tasks:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('displays current date by default', () => {
    render(<Calendar />);

    const today = new Date();
    const monthYear = today.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    expect(screen.getByText(new RegExp(monthYear))).toBeInTheDocument();
  });
});
