import { parseApiBaseUrl } from './env';

describe('parseApiBaseUrl', () => {
  it.each([undefined, '', '   '])('treats %j as same-origin', (input) => {
    expect(parseApiBaseUrl(input)).toBe('');
  });

  it.each(['http://localhost:8080', 'https://api.example.com', 'https://example.com/backend'])(
    'accepts %s',
    (input) => {
      expect(parseApiBaseUrl(input)).toBe(input);
    },
  );

  it('trims surrounding whitespace', () => {
    expect(parseApiBaseUrl('  https://api.example.com ')).toBe('https://api.example.com');
  });

  it.each([
    ['api.example.com', /absolute URL/],
    ['/api', /absolute URL/],
    ['ftp://example.com', /http and https/],
    ['https://api.example.com/', /must not end with/],
    ['https://api.example.com?x=1', /query string/],
  ])('rejects %s', (input, message) => {
    expect(() => parseApiBaseUrl(input)).toThrow(message);
  });
});
