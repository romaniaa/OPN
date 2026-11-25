"use client";

import { useCallback, useEffect, useRef } from "react";

// Opening and closing for a modal <dialog> drawn as a sliding sheet.
//
// Opening slides in from CSS alone: the dialog's @starting-style puts it off
// screen, so it transitions in as soon as showModal() adds it to the top layer.
//
// Closing is the hard half. dialog.close() pulls it from the top layer at once,
// and only Chromium (with transition-behavior and `overlay`) can keep it there
// while it slides out; Safari and Firefox drop the sheet and its backdrop in a
// single frame. So closing marks the dialog data-closing instead, which CSS
// slides out and fades, and calls close() once that transition ends. Escape is
// routed the same way, through the dialog's cancel event.
export function useSheet() {
  const ref = useRef<HTMLDialogElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const finish = useCallback(() => {
    const dialog = ref.current;
    clearTimeout(timer.current);
    if (!dialog) return;
    delete dialog.dataset.closing;
    dialog.close();
  }, []);

  const close = useCallback(() => {
    const dialog = ref.current;
    if (!dialog?.open || dialog.dataset.closing != null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dialog.close();
      return;
    }
    dialog.dataset.closing = "";
    // The sheet's own slide ends it; the backdrop's fade and transitions inside
    // the sheet bubble up here too, so they're ignored. The timer covers a
    // transition that never runs, as when the tab is in the background.
    const done = (e: TransitionEvent) => {
      if (e.target !== dialog || e.propertyName !== "translate") return;
      dialog.removeEventListener("transitionend", done);
      finish();
    };
    dialog.addEventListener("transitionend", done);
    timer.current = setTimeout(() => {
      dialog.removeEventListener("transitionend", done);
      finish();
    }, 500);
  }, [finish]);

  const open = useCallback(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Reopened mid-close: stop closing and slide back from where it is.
    if (dialog.dataset.closing != null) {
      clearTimeout(timer.current);
      delete dialog.dataset.closing;
      return;
    }
    if (!dialog.open) dialog.showModal();
  }, []);

  // Escape fires cancel before the browser closes the dialog. Chromium only
  // lets a page hold that off once per user gesture, so pressing Escape twice
  // quickly can still close it at once, which is fine.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      close();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => {
      dialog.removeEventListener("cancel", onCancel);
      clearTimeout(timer.current);
    };
  }, [close]);

  return { ref, open, close };
}
