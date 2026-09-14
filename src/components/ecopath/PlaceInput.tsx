import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchPlaces } from "@/lib/ecopath.functions";
import type { NamedPlace } from "@/lib/ecopath/types";

interface PlaceInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: NamedPlace | null;
  onChange: (place: NamedPlace | null) => void;
}

export function PlaceInput({ id, label, placeholder, value, onChange }: PlaceInputProps) {
  const search = useServerFn(searchPlaces);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 350);
    return () => clearTimeout(t);
  }, [term]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const enabled = debounced.length >= 3 && !value;
  const { data, isFetching, isError } = useQuery({
    queryKey: ["places", debounced],
    queryFn: () => search({ data: { query: debounced } }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  if (value) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <div className="flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-soft">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
          <span className="line-clamp-2 flex-1 text-sm">{value.label}</span>
          <button
            type="button"
            aria-label={`Clear ${label}`}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onClick={() => {
              onChange(null);
              setTerm("");
              setDebounced("");
            }}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          value={term}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {isFetching && (
          <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && enabled && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lift">
          {isError && <p className="px-3 py-3 text-sm text-destructive">Location search failed. Try again.</p>}
          {!isError && !isFetching && data?.length === 0 && (
            <p className="px-3 py-3 text-sm text-muted-foreground">No matching places found.</p>
          )}
          <ul className="max-h-64 overflow-y-auto">
            {data?.map((place, index) => (
              <li key={`${place.lat},${place.lon},${index}`}>

                <button
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary"
                  onClick={() => {
                    onChange(place);
                    setOpen(false);
                  }}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2">{place.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}