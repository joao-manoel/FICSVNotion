import { Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type CategoryComboboxProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function CategoryCombobox({
  onChange,
  options,
  placeholder = "Selecione a categoria",
  value,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const closeTimer = useRef<number | null>(null);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => option.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  function cancelClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  return (
    <div className="relative min-w-44">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
          size={14}
        />
        <input
          className="h-9 w-full rounded-md border border-line bg-white pl-8 pr-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          onBlur={() => {
            closeTimer.current = window.setTimeout(() => {
              setOpen(false);
              onChange(query.trim() || value);
            }, 140);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            cancelClose();
            setQuery(value);
            setOpen(true);
          }}
          placeholder={placeholder}
          value={query}
        />
      </div>

      {open ? (
        <div
          className="absolute left-0 top-10 z-30 max-h-52 w-56 overflow-auto rounded-md border border-line bg-white p-1 shadow-soft"
          onMouseDown={cancelClose}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                className={`block h-8 w-full rounded px-3 text-left text-sm transition ${
                  option === value ? "bg-neutral-100 text-ink" : "text-ink hover:bg-neutral-100"
                }`}
                key={option}
                onClick={() => {
                  onChange(option);
                  setQuery(option);
                  setOpen(false);
                }}
                type="button"
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted">Criar "{query}" ao importar</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
