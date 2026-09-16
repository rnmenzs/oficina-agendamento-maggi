import type { ReactNode } from "react";
import { Link } from "react-router";

export type ButtonVariant = "primary" | "plain" | "danger" | "dangerStrong";

const BASE = `
    inline-flex items-center justify-center gap-2 min-h-10 px-3.5 py-2
    rounded-sm border text-sm font-semibold whitespace-nowrap
    cursor-pointer no-underline transition-colors
    disabled:cursor-not-allowed disabled:opacity-55
`;

const VARIANT: Record<ButtonVariant, string> = {
    primary: "bg-primary text-on-primary border-transparent hover:bg-primary-strong",
    plain: "bg-surface text-ink border-line-strong hover:bg-surface-alt",
    danger: "bg-surface text-error border-line-strong hover:bg-error-bg hover:border-error",
    dangerStrong: "bg-error text-white border-error hover:brightness-110"
};

type ButtonProps = {
    variant?: ButtonVariant;
    to?: string;
    type?: "button" | "submit";
    disabled?: boolean;
    title?: string;
    className?: string;
    onClick?: () => void;
    children: ReactNode;
};

export function Button({
    variant = "plain", to, type = "button", disabled, title, className, onClick, children
}: ButtonProps) {
    const styles = `${BASE} ${VARIANT[variant]}${className ? ` ${className}` : ""}`;

    if (to) return <Link to={to} title={title} className={styles}>{children}</Link>;

    return (
        <button type={type} disabled={disabled} title={title} onClick={onClick} className={styles}>
            {children}
        </button>
    );
}
