/** Full-page navigation to another origin (OAuth consent). A function of its own so tests can replace it. */
export function redirectTo(url: string): void {
  window.location.assign(url);
}
