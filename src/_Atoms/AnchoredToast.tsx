
import React, { useEffect, useRef } from 'react';
import Tippy from '@tippyjs/react/headless';

type Placement =
  | 'top' | 'bottom' | 'left' | 'right'
  | 'top-start' | 'top-end'
  | 'bottom-start' | 'bottom-end'
  | 'left-start' | 'left-end'
  | 'right-start' | 'right-end';

type AnchoredToastProps = {
  show: boolean;
  message: React.ReactNode;
  onHide: () => void;
  autoHideMs?: number;
  placement?: Placement;
  gapPx?: number;
  children: React.ReactElement;
};

export function AnchoredToast({
  show,
  message,
  onHide,
  autoHideMs = 1100,
  placement = 'top',
  gapPx = 4,
  children
}: AnchoredToastProps) {
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!show) return;

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onHide(), autoHideMs);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [show, autoHideMs, onHide]);

  return (
    <Tippy
      visible={show}
      offset={[0, gapPx]}
      placement={placement}
      arrow={false}
      interactive={false}
      appendTo={() => document.body}
      zIndex={9999}
      duration={[120, 120]}
      render={attrs => (
        <div
          role="status"
          className={[
            // Toast-Style mit Tailwind
            "pointer-events-none select-none",
            "font-normal p-2 text-sm rounded shadow-md border",
            "text-gray-900 bg-white border-gray-200",
            "dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700",
            // kleine Animation (optional, rein CSS)
            "backdrop-blur"
          ].join(" ")}
          {...attrs}
        >
          {message}
        </div>
      )
      }
    >
      {children}
    </Tippy>
  );
}
