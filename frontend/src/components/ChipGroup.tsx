import { cn } from "@/lib/utils";

interface Props {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  testPrefix: string;
}

const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function ChipGroup({ options, value, onChange, testPrefix }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(active ? "" : o)}
            data-testid={`${testPrefix}-${slug(o)}`}
            data-active={active}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-[background-color,color,border-color,transform] duration-200 active:scale-95",
              active
                ? "border-caramel bg-caramel text-white shadow-sm"
                : "border-[#E2D3C4] bg-[#FAF6F0] text-espresso hover:border-caramel/50",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
