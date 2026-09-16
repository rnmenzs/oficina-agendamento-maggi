import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";

export type IconTone = "neutral" | "primary" | "done" | "danger";

const BASE = `
    inline-flex size-8 items-center justify-center
    rounded-sm border border-transparent
    cursor-pointer no-underline transition-colors
    disabled:cursor-not-allowed disabled:opacity-55
`;

const TONE: Record<IconTone, string> = {
    neutral: "text-muted hover:bg-surface-alt hover:border-line-strong hover:text-ink",
    primary: "text-primary hover:bg-primary-soft hover:border-primary",
    done: "text-done hover:bg-done-bg hover:border-done",
    danger: "text-muted hover:bg-error-bg hover:border-error hover:text-error"
};

type ButtonIconProps = {
    label: string;
    icon: LucideIcon;
    tone?: IconTone;
    size?: 16 | 18;
    to?: string;
    disabled?: boolean;
    onClick?: () => void;
};

export function ButtonIcon({
    label, icon: Icon, tone = "neutral", size = 16, to, disabled, onClick
}: ButtonIconProps) {
    const styles = `${BASE} ${TONE[tone]}`;
    const glyph = <Icon size={size} aria-hidden />;

    // Desabilitado vence o "to": <a> ignora o atributo disabled, e o link ficaria clicável.
    if (to && !disabled) {
        return <Link to={to} title={label} aria-label={label} className={styles}>{glyph}</Link>;
    }

    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={styles}
        >
            {glyph}
        </button>
    );
}
