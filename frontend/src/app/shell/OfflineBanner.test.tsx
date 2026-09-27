import { act, render, screen } from '@testing-library/react';
import { OfflineBanner } from './OfflineBanner';

const MESSAGE = /You’re offline/;

describe('OfflineBanner', () => {
  it('renders an empty live region while online', () => {
    render(<OfflineBanner />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('announces going offline and clears when back online', () => {
    render(<OfflineBanner />);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByRole('status')).toHaveTextContent(MESSAGE);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument();
  });
});
