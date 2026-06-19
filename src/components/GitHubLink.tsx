// Set this to hardcode the repo (e.g. with a custom domain); otherwise it's
// derived from a GitHub Pages URL, where the path's first segment is the repo.
const REPO_URL_OVERRIDE = 'https://github.com/Tree4Free/tml-lineup';

function repoUrl(): string {
  if (REPO_URL_OVERRIDE) return REPO_URL_OVERRIDE;
  const m = location.host.match(/^([^.]+)\.github\.io$/);
  if (m) {
    const repo = location.pathname.split('/').filter(Boolean)[0];
    return `https://github.com/${m[1]}/${repo ?? `${m[1]}.github.io`}`;
  }
  return 'https://github.com';
}

interface Props {
  className?: string;
  /** Render a text label next to the mark (used in the sidebar). */
  withLabel?: boolean;
}

export function GitHubLink({ className, withLabel = false }: Props) {
  return (
    <a
      className={className}
      href={repoUrl()}
      target="_blank"
      rel="noreferrer"
      title="View source on GitHub"
      aria-label="View source on GitHub"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
      {withLabel && <span>View source on GitHub</span>}
    </a>
  );
}
