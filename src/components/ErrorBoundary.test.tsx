import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws on render
function ThrowOnRender({ error }: { error: Error }) {
  throw error;
}

// Component that throws on click
function ThrowOnClick({ error }: { error: Error }) {
  const [shouldThrow, setShouldThrow] = useState(false);
  if (shouldThrow) throw error;
  return <button onClick={() => setShouldThrow(true)}>Trigger Error</button>;
}

import React, { useState } from 'react';

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Reset window.location.hash
    window.location.hash = '';
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('catches errors and displays error UI', () => {
    const error = new Error('Test error message');
    render(
      <ErrorBoundary>
        <ThrowOnRender error={error} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText(/test error message/i)).toBeInTheDocument();
  });

  it('displays "Tentar Novamente" and "Dashboard" buttons on error', () => {
    const error = new Error('Test');
    render(
      <ErrorBoundary>
        <ThrowOnRender error={error} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('resets error state when "Tentar Novamente" is clicked', async () => {
    const user = userEvent.setup();
    const error = new Error('Test');

    // Use a controlled error approach
    let shouldThrow = true;
    function ConditionalThrow() {
      if (shouldThrow) throw error;
      return <div>Recovered Content</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();

    // Fix the error and click retry
    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: /tentar novamente/i }));

    // After reset, children should re-render
    expect(screen.getByText('Recovered Content')).toBeInTheDocument();
    expect(screen.queryByText('Ops! Algo deu errado')).not.toBeInTheDocument();
  });

  it('navigates to dashboard when "Dashboard" button is clicked', async () => {
    const user = userEvent.setup();
    const error = new Error('Test');
    render(
      <ErrorBoundary>
        <ThrowOnRender error={error} />
      </ErrorBoundary>
    );

    await user.click(screen.getByRole('button', { name: /dashboard/i }));
    expect(window.location.hash).toBe('#/dashboard');
  });

  it('calls onError callback when error is caught', () => {
    const error = new Error('Callback test');
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowOnRender error={error} />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error, expect.objectContaining({
      componentStack: expect.stringContaining('ThrowOnRender'),
    }));
  });

  it('renders custom fallback when provided', () => {
    const error = new Error('Test');
    render(
      <ErrorBoundary fallback={<div>Custom Fallback UI</div>}>
        <ThrowOnRender error={error} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom Fallback UI')).toBeInTheDocument();
    expect(screen.queryByText('Ops! Algo deu errado')).not.toBeInTheDocument();
  });

  it('renders error message in monospace font', () => {
    const error = new Error('Specific error details');
    render(
      <ErrorBoundary>
        <ThrowOnRender error={error} />
      </ErrorBoundary>
    );
    const errorText = screen.getByText('Specific error details');
    expect(errorText.className).toContain('font-mono');
  });

  it('handles errors in deeply nested children', () => {
    function DeepChild() {
      throw new Error('Deep error');
    }
    render(
      <ErrorBoundary>
        <div>
          <div>
            <DeepChild />
          </div>
        </div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
  });

  it('displays "Erro desconhecido" when error has no message', () => {
    const error = new Error('');
    render(
      <ErrorBoundary>
        <ThrowOnRender error={error} />
      </ErrorBoundary>
    );
    // Empty string is falsy, so it should show the fallback
    expect(screen.getByText('Erro desconhecido')).toBeInTheDocument();
  });
});