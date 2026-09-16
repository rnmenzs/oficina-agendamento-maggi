import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";

export type NotificationTone = "success" | "info" | "warning" | "error";

const TONE = {
    success: { classes: "border-done text-done", Icon: CircleCheck },
    info: { classes: "border-info text-info", Icon: Info },
    warning: { classes: "border-warning text-warning", Icon: TriangleAlert },
    error: { classes: "border-error text-error", Icon: CircleAlert }
};

type NotificationProps = {
    tone?: NotificationTone;
    children: ReactNode;
    onClose: () => void;
};

export function Notification({ tone = "success", children, onClose }: NotificationProps) {
    const { classes, Icon } = TONE[tone];

    return (
        <div className={`flex items-center gap-2 rounded-card bg-surface border-l-4 p-3 shadow-lg ${classes}`}>
            <Icon size={18} aria-hidden className="shrink-0" />
            <p className="flex-1 text-sm text-ink">{children}</p>

            <button
                type="button"
                aria-label="Fechar aviso"
                onClick={onClose}
                className="shrink-0 cursor-pointer rounded-sm p-0.5 text-muted transition-colors
                    hover:bg-surface-alt hover:text-ink"
            >
                <X size={16} aria-hidden />
            </button>
        </div>
    );
}
