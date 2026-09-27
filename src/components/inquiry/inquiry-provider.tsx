"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { InquiryDialog } from "@/components/inquiry/inquiry-dialog";

const InquiryContext = createContext<() => void>(() => {});

/** Opens the project inquiry modal from anywhere below the provider. */
export function useStartProject() {
  return useContext(InquiryContext);
}

/** The query that /contact redirects to (see next.config.ts); it opens the modal on load. */
export const START_PROJECT_PARAM = "start";

export function InquiryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const start = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(START_PROJECT_PARAM) !== "project") return;
    // Deferred so the dialog mounts first; the param is only dropped once the modal actually opens.
    const frame = requestAnimationFrame(() => {
      setOpen(true);
      url.searchParams.delete(START_PROJECT_PARAM);
      window.history.replaceState(window.history.state, "", url);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <InquiryContext.Provider value={start}>
      {children}
      <InquiryDialog open={open} onClose={() => setOpen(false)} />
    </InquiryContext.Provider>
  );
}
