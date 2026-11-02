import { useEffect } from "react";

export const APP_NAME = "Map Perizinan";

/**
 * Formats a given page or entity name into the standard title pattern:
 * "Nama Halaman – Map Perizinan"
 */
export function formatPageTitle(pageName?: string | null): string {
  if (!pageName || !pageName.trim()) {
    return APP_NAME;
  }
  return `${pageName.trim()} – ${APP_NAME}`;
}

/**
 * React hook to set document.title dynamically.
 * Updates document.title when title parameter changes.
 */
export function useDocumentTitle(title?: string | null, fallbackOnUnmount?: string | null) {
  useEffect(() => {
    if (typeof document !== "undefined" && title && title.trim()) {
      document.title = formatPageTitle(title);
    }

    return () => {
      if (typeof document !== "undefined" && fallbackOnUnmount && fallbackOnUnmount.trim()) {
        document.title = formatPageTitle(fallbackOnUnmount);
      }
    };
  }, [title, fallbackOnUnmount]);
}

