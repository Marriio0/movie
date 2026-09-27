import { parsePositiveInt } from './params';

describe('parsePositiveInt', () => {
  it.each([
    ['1', 1],
    ['693134', 693134],
  ])('accepts %s', (input, expected) => {
    expect(parsePositiveInt(input)).toBe(expected);
  });

  it.each([undefined, '', '0', '-1', '1.5', '007', 'abc', '12abc', ' 12', '9007199254740993'])(
    'rejects %s',
    (input) => {
      expect(parsePositiveInt(input)).toBeNull();
    },
  );
});
