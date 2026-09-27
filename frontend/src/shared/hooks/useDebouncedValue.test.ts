import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('updates only after the value has been stable for the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'd' },
    });

    rerender({ value: 'du' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'dune' });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('d');

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('dune');
  });
});
