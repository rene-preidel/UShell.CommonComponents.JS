
import React, {
  isValidElement,
  ReactElement,
  ReactNode,
  RefObject,
} from "react";

import Tippy, { TippyProps } from "@tippyjs/react/headless";

export type TooltipPlacement =
  | "top" | "top-start" | "top-end"
  | "right"
  | "bottom" | "bottom-start" | "bottom-end"
  | "left";

export interface TooltipProps {
  content: ReactNode | string;
  className?: string;
  placement?: TooltipPlacement;
  delay?: number;
  interactive?: boolean;
  children?: ReactElement;
  reference?: RefObject<HTMLElement>;
  maxWidth?: string | number;
  disabled?: boolean;
}

function mapPlacement(p: TooltipPlacement): TippyProps["placement"] {
  switch (p) {
    case "top-start": return "top-start";
    case "top": return "top";
    case "top-end": return "top-end";

    case "bottom-start": return "bottom-start";
    case "bottom": return "bottom";
    case "bottom-end": return "bottom-end";

    case "left": return "left";
    case "right": return "right";
    default: return "top";
  }
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  className,
  placement = "top",
  delay = 400,
  interactive = false,
  children,
  reference,
  maxWidth = "min(70vw, 600px)",
  disabled = false,
}) => {
  
  const tippyPlacement = mapPlacement(placement);

  const renderContent = () => {
    if (typeof content === 'string') {
      return (
        <div key="content" className="px-3 py-2 whitespace-pre-wrap">
          {content.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      );
    }
    return content;
  };

  const render = (attrs: any) => (
    <div
      className={
        "font-normal text-sm rounded shadow-md border"
        + " text-gray-900 bg-white border-gray-200"
        + " dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700"
        + (className ? ` ${className}` : "")
      }
      style={{ maxWidth: maxWidth }}
      tabIndex={-1}
      {...attrs}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {renderContent()}
    </div>
  );

  // ---- Ref-Mode
  if (reference) {
    return (
      <Tippy
        appendTo={document.body}
        placement={tippyPlacement}
        delay={[delay, 0]}
        interactive={interactive}
        maxWidth={maxWidth}
        disabled={disabled}
        reference={reference}
        arrow={false}
        render={render}
        hideOnClick={false}
      />
    );
  }

  // ---- Wrapper-Mode
  if (!children || !isValidElement(children)) {
    console.warn("TooltipWrapper: children missing or invalid in wrapper-mode.");
    return null;
  }

  return (
    <Tippy
      appendTo={document.body}
      placement={tippyPlacement}
      delay={[delay, 0]}
      interactive={interactive}
      maxWidth={maxWidth}
      disabled={disabled}
      arrow={false}
      render={render}
      hideOnClick={false}
    >
      {children}
    </Tippy>
  );
};
