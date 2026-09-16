import { formatPlate, isMercosulPlate } from "~/utils/plate";

const BASE = `
    inline-block align-middle rounded-sm border border-line-strong bg-surface-alt
    px-2 py-0.5 font-mono text-sm font-medium tracking-widest
    uppercase whitespace-nowrap
`;

const MERCOSUL = "border-t-4 border-t-primary-strong";

export function BadgePlate({ plate }: { plate: string }) {
    return (
        <span className={`${BASE} ${isMercosulPlate(plate) ? MERCOSUL : ""}`}>
            {formatPlate(plate)}
        </span>
    );
}
