import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { useTooltip } from "./Tooltip.hook";

type TooltipProps = {
    text: string;
    children: ReactNode;
};


export function Tooltip({ text, children }: TooltipProps) {
    const tooltip = useTooltip();

    return (
        <>
            <span
                ref={tooltip.trigger}
                className="inline-flex"
                onMouseEnter={tooltip.show}
                onMouseLeave={tooltip.hide}
                onFocus={tooltip.onFocus}
                onBlur={tooltip.hide}
            >
                {children}
            </span>

            {tooltip.open && createPortal(
                <div
                    ref={tooltip.bubble}
                    aria-hidden
                    style={{
                        left: tooltip.spot?.left ?? 0,
                        top: tooltip.spot?.top ?? 0,
                        visibility: tooltip.spot ? "visible" : "hidden"
                    }}
                    className="pointer-events-none fixed z-50 max-w-3xs rounded-sm bg-ink px-2 py-1
                        text-xs font-medium text-surface shadow-lg"
                >
                    {text}
                </div>,
                document.body
            )}
        </>
    );
}
