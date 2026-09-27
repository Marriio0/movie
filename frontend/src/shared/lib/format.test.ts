import { formatRating, formatRuntime, languageName, yearOf } from './format';

describe('yearOf', () => {
  it('reads the year of an ISO date', () => {
    expect(yearOf('2024-02-27')).toBe(2024);
  });
  it.each([null, undefined, '', '2024', 'soon'])('returns null for %j', (input) => {
    expect(yearOf(input)).toBeNull();
  });
});

describe('formatRuntime', () => {
  it.each([
    [165, '2h 45m'],
    [120, '2h'],
    [45, '45m'],
  ])('formats %i minutes as %s', (input, expected) => {
    expect(formatRuntime(input)).toBe(expected);
  });
  it.each([null, undefined, 0, -5])('returns null for %j', (input) => {
    expect(formatRuntime(input)).toBeNull();
  });
});

describe('formatRating', () => {
  it('rounds to one decimal', () => {
    expect(formatRating(8.137)).toBe('8.1');
    expect(formatRating(7)).toBe('7.0');
  });
});

describe('languageName', () => {
  it('names ISO 639-1 codes in English', () => {
    expect(languageName('en')).toBe('English');
    expect(languageName('fr')).toBe('French');
  });
});
