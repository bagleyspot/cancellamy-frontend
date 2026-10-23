import { vi } from 'vitest';

/** jsdom has no object URLs and does not navigate: records the file names of "downloaded" blobs instead. */
export function mockDownloads() {
  const files: string[] = [];
  URL.createObjectURL = vi.fn(() => 'blob:test');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    files.push(this.download);
  });
  return files;
}
