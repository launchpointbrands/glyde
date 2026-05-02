// Disabled Google OAuth button — the visual treatment lands now,
// real OAuth wires up when the provider is configured.

export function GoogleButton({ disabled = true }: { disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? "Coming soon" : undefined}
      className="flex w-full items-center justify-center gap-2.5 rounded-md border border-border-default bg-bg-card px-3 py-2.5 text-meta font-medium text-text-primary transition-colors hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-bg-card"
    >
      <GoogleIcon className="h-4 w-4" />
      Continue with Google
    </button>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8c1.8-4.4 6.1-7.5 11.1-7.5 3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.6 8.4 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3c-2 1.6-4.6 2.5-7.3 2.5-5.3 0-9.7-3.3-11.3-8L6 33C9.3 39.6 16.1 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5h-1.9V20H24v8h11.3c-.8 2.3-2.2 4.3-4 5.7l6.2 5.3c-.4.4 6.5-4.7 6.5-15-.0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
