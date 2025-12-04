import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import OnboardingPage from '@/app/onboarding/page';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useAuth
const mockGetAccessToken = vi.fn();
vi.mock('@/components/AuthContext', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAccessToken.mockReturnValue('mock-token');
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the onboarding page', () => {
    render(<OnboardingPage />);
    
    expect(screen.getByText('Welcome to k.ai')).toBeInTheDocument();
    expect(screen.getByText("Let's personalize your experience")).toBeInTheDocument();
  });

  it('displays step 1 by default', () => {
    render(<OnboardingPage />);
    
    expect(screen.getByText('Do you currently have a release plan?')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('displays progress indicator', () => {
    render(<OnboardingPage />);
    
    const progressBars = document.querySelectorAll('.h-2.rounded-full');
    expect(progressBars).toHaveLength(3);
  });

  it('selects "Yes" for has release plan', () => {
    render(<OnboardingPage />);
    
    const yesButton = screen.getByText('Yes').closest('button');
    fireEvent.click(yesButton!);
    
    expect(yesButton).toHaveClass('border-indigo-600');
  });

  it('selects "No" for has release plan', () => {
    render(<OnboardingPage />);
    
    const noButton = screen.getByText('No').closest('button');
    fireEvent.click(noButton!);
    
    expect(noButton).toHaveClass('border-indigo-600');
  });

  it('disables Continue button when no selection is made', () => {
    render(<OnboardingPage />);
    
    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).toBeDisabled();
  });

  it('enables Continue button when selection is made', () => {
    render(<OnboardingPage />);
    
    const yesButton = screen.getByText('Yes').closest('button');
    fireEvent.click(yesButton!);
    
    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).not.toBeDisabled();
  });

  it('proceeds to step 2 when Continue is clicked', () => {
    render(<OnboardingPage />);
    
    // Step 1
    const yesButton = screen.getByText('Yes').closest('button');
    fireEvent.click(yesButton!);
    
    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);
    
    // Step 2
    expect(screen.getByText('What stage are you at with your release?')).toBeInTheDocument();
    expect(screen.getByText('Not Started')).toBeInTheDocument();
    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Ready to Launch')).toBeInTheDocument();
  });

  it('displays Back button on step 2', () => {
    render(<OnboardingPage />);
    
    // Go to step 2
    const yesButton = screen.getByText('Yes').closest('button');
    fireEvent.click(yesButton!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('goes back to step 1 when Back is clicked', () => {
    render(<OnboardingPage />);
    
    // Go to step 2
    const yesButton = screen.getByText('Yes').closest('button');
    fireEvent.click(yesButton!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    // Go back
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);
    
    expect(screen.getByText('Do you currently have a release plan?')).toBeInTheDocument();
  });

  it('selects progress stage in step 2', () => {
    render(<OnboardingPage />);
    
    // Navigate to step 2
    fireEvent.click(screen.getByText('Yes').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    // Select planning
    const planningButton = screen.getByText('Planning').closest('button');
    fireEvent.click(planningButton!);
    
    expect(planningButton).toHaveClass('border-indigo-600');
  });

  it('proceeds to step 3', () => {
    render(<OnboardingPage />);
    
    // Step 1
    fireEvent.click(screen.getByText('Yes').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    // Step 2
    fireEvent.click(screen.getByText('Planning').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    // Step 3
    expect(screen.getByText('What help do you need most?')).toBeInTheDocument();
    expect(screen.getByText('Select all that apply')).toBeInTheDocument();
  });

  it('displays help options in step 3', () => {
    render(<OnboardingPage />);
    
    // Navigate to step 3
    fireEvent.click(screen.getByText('Yes').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByText('Planning').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    expect(screen.getByText('Project planning or organization')).toBeInTheDocument();
    expect(screen.getByText('Time management')).toBeInTheDocument();
    expect(screen.getByText('Social media promotion')).toBeInTheDocument();
    expect(screen.getByText('Networking with peers')).toBeInTheDocument();
  });

  it('toggles help options on and off', () => {
    render(<OnboardingPage />);
    
    // Navigate to step 3
    fireEvent.click(screen.getByText('Yes').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByText('Planning').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    // Select option
    const timeManagementButton = screen.getByText('Time management').closest('button');
    fireEvent.click(timeManagementButton!);
    expect(timeManagementButton).toHaveClass('border-indigo-600');
    
    // Deselect option
    fireEvent.click(timeManagementButton!);
    expect(timeManagementButton).not.toHaveClass('border-indigo-600');
  });

  it('allows selecting multiple help options', () => {
    render(<OnboardingPage />);
    
    // Navigate to step 3
    fireEvent.click(screen.getByText('Yes').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByText('Planning').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    // Select multiple options
    const option1 = screen.getByText('Time management').closest('button');
    const option2 = screen.getByText('Social media promotion').closest('button');
    
    fireEvent.click(option1!);
    fireEvent.click(option2!);
    
    expect(option1).toHaveClass('border-indigo-600');
    expect(option2).toHaveClass('border-indigo-600');
  });

  it('displays Complete Setup button on step 3', () => {
    render(<OnboardingPage />);
    
    // Navigate to step 3
    fireEvent.click(screen.getByText('Yes').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByText('Planning').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    expect(screen.getByRole('button', { name: /complete setup/i })).toBeInTheDocument();
  });

  it('disables Complete Setup button when no help options selected', () => {
    render(<OnboardingPage />);
    
    // Navigate to step 3
    fireEvent.click(screen.getByText('Yes').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByText('Planning').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    const completeButton = screen.getByRole('button', { name: /complete setup/i });
    expect(completeButton).toBeDisabled();
  });

  it('submits onboarding data and redirects to dashboard', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(<OnboardingPage />);
    
    // Complete all steps
    fireEvent.click(screen.getByText('Yes').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    fireEvent.click(screen.getByText('Planning').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    fireEvent.click(screen.getByText('Time management').closest('button')!);
    
    const completeButton = screen.getByRole('button', { name: /complete setup/i });
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/profile/onboarding',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          }),
          credentials: 'include',
        })
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays loading state during submission', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<OnboardingPage />);
    
    // Complete all steps
    fireEvent.click(screen.getByText('Yes').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByText('Planning').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByText('Time management').closest('button')!);
    
    const completeButton = screen.getByRole('button', { name: /complete setup/i });
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /setting up\.\.\./i })).toBeInTheDocument();
    });
  });

  it('displays error message when submission fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(<OnboardingPage />);
    
    // Complete all steps and submit
    fireEvent.click(screen.getByText('Yes').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByText('Planning').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByText('Time management').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /complete setup/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to save onboarding data')).toBeInTheDocument();
    });
  });

  it('redirects to login when no auth token', async () => {
    mockGetAccessToken.mockReturnValue(null);

    render(<OnboardingPage />);
    
    // Complete all steps and submit
    fireEvent.click(screen.getByText('Yes').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByText('Planning').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByText('Time management').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /complete setup/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Authentication required. Please try logging in again.')).toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('sends correct data structure to API', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(<OnboardingPage />);
    
    // Complete with specific selections
    fireEvent.click(screen.getByText('No').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    fireEvent.click(screen.getByText('In Progress').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    fireEvent.click(screen.getByText('Social media promotion').closest('button')!);
    fireEvent.click(screen.getByText('Networking with peers').closest('button')!);
    
    fireEvent.click(screen.getByRole('button', { name: /complete setup/i }));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/profile/onboarding',
        expect.objectContaining({
          body: JSON.stringify({
            hasReleasePlan: false,
            releaseProgress: 'in_progress',
            helpNeeded: ['social_media_promotion', 'networking'],
          }),
        })
      );
    });
  });

  it('displays copyright notice', () => {
    render(<OnboardingPage />);
    
    expect(screen.getByText('© 2025 k.ai. All rights reserved.')).toBeInTheDocument();
  });

  it('shows checkmark icon for selected help options', () => {
    render(<OnboardingPage />);
    
    // Navigate to step 3
    fireEvent.click(screen.getByText('Yes').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByText('Planning').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    // Select an option
    fireEvent.click(screen.getByText('Time management').closest('button')!);
    
    // Check for checkmark SVG
    const checkmarks = document.querySelectorAll('svg path[d*="M5 13l4 4L19 7"]');
    expect(checkmarks.length).toBeGreaterThan(0);
  });
});
