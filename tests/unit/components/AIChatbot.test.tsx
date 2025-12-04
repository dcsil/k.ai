import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import AIChatbot from '@/components/AIChatbot';

// Mock useAuth
const mockGetAccessToken = vi.fn();
vi.mock('@/components/AuthContext', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('AIChatbot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAccessToken.mockReturnValue('mock-token');
    
    // Mock scrollIntoView which is not implemented in jsdom
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the chatbot interface', () => {
    render(<AIChatbot />);

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Ask me anything about your music releases')).toBeInTheDocument();
    expect(screen.getByText('How can I help you today?')).toBeInTheDocument();
  });

  it('displays empty state when no messages', () => {
    render(<AIChatbot />);

    expect(screen.getByText('How can I help you today?')).toBeInTheDocument();
    expect(
      screen.getByText(
        /I have access to your releases and tasks/i
      )
    ).toBeInTheDocument();
  });

  it('allows user to type a message', () => {
    render(<AIChatbot />);

    const input = screen.getByPlaceholderText(/Ask me anything about your music release/i);
    fireEvent.change(input, { target: { value: 'Hello AI' } });

    expect(input).toHaveValue('Hello AI');
  });

  it('sends a message when form is submitted', async () => {
    // Mock context fetch on mount
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      } as Response)
      // Mock AI response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: 'AI response' }),
      } as Response);

    render(<AIChatbot />);

    const input = screen.getByPlaceholderText(/Ask me anything about your music release/i);
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText('Hello AI')).toBeInTheDocument();
    });

    await waitFor(() => {
      // Check document body contains the text since ReactMarkdown wraps in tags
      expect(document.body.textContent).toContain('AI response');
    });
  });

  it('clears input after sending message', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'AI response' }),
    } as Response);

    render(<AIChatbot />);

    const input = screen.getByPlaceholderText(/Ask me anything about your music release/i) as HTMLInputElement;
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('shows loading state while waiting for response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ text: 'AI response' }),
              } as Response),
            50
          )
        )
    );

    render(<AIChatbot />);

    const input = screen.getByPlaceholderText(/Ask me anything about your music release/i);
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(form!);

    await waitFor(() => {
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });
  });

  it('displays error message when API call fails', async () => {
    // Mock context fetch on mount
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      } as Response)
      // Mock AI API error
      .mockRejectedValueOnce(
        new Error('Network error')
      );

    render(<AIChatbot />);

    const input = screen.getByPlaceholderText(/Ask me anything about your music release/i);
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(form!);

    await waitFor(() => {
      // Check document body contains the error text
      expect(document.body.textContent).toContain('Network error');
    });
  });

  it('clears chat when clear button is clicked', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'AI response' }),
    } as Response);

    render(<AIChatbot />);

    const input = screen.getByPlaceholderText(/Ask me anything about your music release/i);
    const form = input.closest('form');

    // Send a message
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    // Clear chat
    const clearButton = screen.getByText('Clear Chat');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.queryByText('Hello')).not.toBeInTheDocument();
      expect(screen.getByText('How can I help you today?')).toBeInTheDocument();
    });
  });

  it('does not send empty messages', () => {
    render(<AIChatbot />);

    const input = screen.getByPlaceholderText(/Ask me anything about your music release/i);
    const form = input.closest('form');

    const initialCallCount = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    fireEvent.submit(form!);

    // Should not make additional API call for empty message
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(initialCallCount);
  });

  it('fetches user context on mount', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      } as Response);

    render(<AIChatbot />);

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

  it('includes authorization header in API calls', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'Response' }),
    } as Response);

    render(<AIChatbot />);

    const input = screen.getByPlaceholderText(/Ask me anything about your music release/i);
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/genai',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });
  });
});
