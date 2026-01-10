"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

// Global state for "one tooltip at a time" behavior
let activeTooltipId: string | undefined;
let closeActiveTooltip: (() => void) | undefined;

interface UseTooltipReturn {
  isVisible: boolean;
  triggerRef: <T extends HTMLElement>(node: T | null) => void;
  triggerRect: DOMRect | undefined;
}

export const useTooltip = (): UseTooltipReturn => {
  const tooltipId = useId();
  const [isVisible, setIsVisible] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | undefined>(
    undefined,
  );
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const hide = useCallback(() => {
    setIsVisible(false);
    if (activeTooltipId === tooltipId) {
      activeTooltipId = undefined;
      closeActiveTooltip = undefined;
    }
  }, [tooltipId]);

  const show = useCallback(() => {
    // Close any other open tooltip instantly
    if (activeTooltipId !== tooltipId && closeActiveTooltip !== undefined) {
      closeActiveTooltip();
    }

    // Register this tooltip as active
    activeTooltipId = tooltipId;
    closeActiveTooltip = hide;

    // Capture trigger element's position
    if (triggerElementRef.current !== null) {
      setTriggerRect(triggerElementRef.current.getBoundingClientRect());
    }

    setIsVisible(true);
  }, [hide, tooltipId]);

  // Refs to always have access to latest callbacks without re-attaching listeners
  const showRef = useRef(show);
  const hideRef = useRef(hide);

  // Keep refs in sync with latest callbacks
  useEffect(() => {
    showRef.current = show;
    hideRef.current = hide;
  }, [show, hide]);

  // Stable handlers that read from refs - initialized synchronously
  const handlersRef = useRef({
    handleMouseEnter: () => {
      showRef.current();
    },
    handleMouseLeave: () => {
      hideRef.current();
    },
  });

  const triggerRef = useCallback(<T extends HTMLElement>(node: T | null) => {
    // Clean up old element
    if (triggerElementRef.current !== null) {
      triggerElementRef.current.removeEventListener(
        "mouseenter",
        handlersRef.current.handleMouseEnter,
      );
      triggerElementRef.current.removeEventListener(
        "mouseleave",
        handlersRef.current.handleMouseLeave,
      );
    }

    // Set up new element
    triggerElementRef.current = node;
    if (node !== null) {
      node.addEventListener("mouseenter", handlersRef.current.handleMouseEnter);
      node.addEventListener("mouseleave", handlersRef.current.handleMouseLeave);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeTooltipId === tooltipId) {
        activeTooltipId = undefined;
        closeActiveTooltip = undefined;
      }
    };
  }, [tooltipId]);

  return { isVisible, triggerRef, triggerRect };
};
