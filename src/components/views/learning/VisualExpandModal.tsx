"use client";

/**
 * VisualExpandModal — fullscreen SVG overlay modal.
 *
 * Triggered by the expand button in SlideCanvas.
 * Renders the SVG diagram (or placeholder image) in a fullscreen overlay.
 * Closes on Escape key or clicking outside the content area.
 *
 * Validates: Requirements 5.12
 */

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface VisualExpandModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /**
   * The SVG markup string to display inline (from renderSvgDiagram).
   * If null/undefined, falls back to the dataUrl.
   */
  svgMarkup: string | null;
  /**
   * Fallback image data URL (from generateVisualPlaceholderDataUrl).
   * Used when svgMarkup is null.
   */
  dataUrl?: string | null;
  /** Alt text / visual description */
  alt?: string;
  /** Called when the modal should close */
  onClose: () => void;
  /** Arabic locale flag */
  ar?: boolean;
}

// ---------------------------------------------------------------------------
// VisualExpandModal
// ---------------------------------------------------------------------------
export function VisualExpandModal({
  isOpen,
  svgMarkup,
  dataUrl,
  alt = "Expanded visual",
  onClose,
  ar = false,
}: VisualExpandModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="visual-expand-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8 backdrop-blur-md"
          // Click outside the content → close
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={ar ? "عرض المخطط بالشاشة الكاملة" : "Diagram fullscreen view"}
        >
          <div
            className="relative max-w-5xl w-full flex flex-col items-center"
            // Stop propagation so clicking on content doesn't bubble to backdrop
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label={ar ? "إغلاق (Escape)" : "Close (Escape)"}
              title={ar ? "إغلاق (Escape)" : "Close (Escape)"}
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Visual content */}
            <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white dark:bg-slate-900">
              {svgMarkup ? (
                <div
                  className="w-full"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: svgMarkup }}
                  aria-label={alt}
                />
              ) : dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dataUrl}
                  alt={alt}
                  className="w-full max-h-[80vh] object-contain"
                />
              ) : null}
            </div>

            {/* Hint text */}
            <p className="mt-4 text-white/50 text-xs font-mono text-center">
              {ar ? "انقر في أي مكان خارج الصورة أو اضغط Escape للإغلاق" : "Click outside or press Escape to close"}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
