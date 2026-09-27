import { describe, expect, it } from 'vitest';
import { buildMagnetLink, parseTorrentioStream, type TorrentioStream } from './torrentio';

describe('torrentio helper', () => {
  it('builds magnet link properly with hash and trackers', () => {
    const hash = '2849211f150e966ef7924f43aec22727a644e10d';
    const filename = 'Inception.2010.mkv';
    const magnet = buildMagnetLink(hash, filename);

    expect(magnet).toContain(`magnet:?xt=urn:btih:${hash}`);
    expect(magnet).toContain('dn=Inception.2010.mkv');
    expect(magnet).toContain('tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce');
  });

  it('parses Torrentio stream details correctly', () => {
    const mockStream: TorrentioStream = {
      name: 'Torrentio\n4k HDR',
      title:
        'Inception 2010 PROPER Bluray 2160p AV1 HDR10\n👤 284 💾 8.91 GB ⚙️ 1337x\n🇬🇧 / 🇫🇷 / 🇪🇸',
      infoHash: '2849211f150e966ef7924f43aec22727a644e10d',
      behaviorHints: {
        filename: 'Inception.2010.mkv',
      },
    };

    const parsed = parseTorrentioStream(mockStream, 'movie', 'tt1375666');
    expect(parsed.quality).toBe('4k HDR');
    expect(parsed.seeders).toBe(284);
    expect(parsed.size).toBe('8.91 GB');
    expect(parsed.provider).toBe('1337x');
    expect(parsed.releaseTitle).toBe('Inception 2010 PROPER Bluray 2160p AV1 HDR10');
    expect(parsed.languages).toEqual(['🇬🇧', '🇫🇷', '🇪🇸']);
    expect(parsed.magnetLink).toContain('2849211f150e966ef7924f43aec22727a644e10d');
    expect(parsed.stremioLink).toBe('stremio:///detail/movie/tt1375666');
  });
});
