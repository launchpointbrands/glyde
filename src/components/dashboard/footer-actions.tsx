"use client";

import { Calendar, Download, Send } from "lucide-react";

// Footer actions are intentionally no-op stubs for the partner demo.
// The CTAs need to look right and feel present; behavior follows later.
function noop(label: string) {
  return () => alert(`${label} — coming soon.`);
}

export function FooterActions() {
  return (
    <div className="mt-12 flex flex-wrap items-center gap-3 border-t pt-6">
      <button
        type="button"
        onClick={noop("Send to client")}
        className="inline-flex items-center gap-2 rounded-md bg-brand-fg px-4 py-2 text-small font-medium text-white transition-opacity hover:opacity-90"
      >
        <Send className="h-4 w-4" />
        Send to client
      </button>
      <button
        type="button"
        onClick={noop("Export PDF")}
        className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-small font-medium hover:bg-muted/40"
      >
        <Download className="h-4 w-4" />
        Export PDF
      </button>
      <button
        type="button"
        onClick={noop("Schedule follow-up")}
        className="ml-auto inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground"
      >
        <Calendar className="h-4 w-4" />
        Schedule follow-up
      </button>
    </div>
  );
}
