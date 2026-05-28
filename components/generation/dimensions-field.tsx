"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DIMENSION_UNITS, type DimensionUnit } from "@/lib/projects/types";

/**
 * Поле размеров продукта.
 *
 *  ☑ Это НЕ одежда и НЕ обувь   →  раскрывается форма с L/W/H/Weight + unit.
 *
 * Если чекбокс снят, в формдату уходит hasDimensions="0" и размеры не пишутся.
 */

interface DimensionsFieldProps {
  error?: string;
}

export function DimensionsField({ error }: DimensionsFieldProps) {
  const [enabled, setEnabled] = React.useState(false);
  const [unit, setUnit] = React.useState<DimensionUnit>("cm");

  return (
    <div className="flex flex-col gap-3">
      <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className={cn(
            "size-4 appearance-none rounded border border-border-strong bg-surface transition-all",
            "checked:bg-foreground checked:border-foreground",
            "checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22><path d=%22M3 8l3.5 3.5L13 5%22 stroke=%22%23000%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')]",
            "checked:bg-no-repeat checked:bg-center cursor-pointer"
          )}
        />
        <span className="text-sm text-foreground">
          Это НЕ одежда и НЕ обувь — указать размеры продукта
        </span>
      </label>
      <input
        type="hidden"
        name="hasDimensions"
        value={enabled ? "1" : "0"}
      />

      {enabled && (
        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <p className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            Реальные размеры
          </p>

          <div className="grid grid-cols-3 gap-3">
            <DimField label="Длина" name="dimensionLength" placeholder="20" />
            <DimField label="Ширина" name="dimensionWidth" placeholder="10" />
            <DimField label="Высота" name="dimensionHeight" placeholder="5" />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <DimField
              label="Вес, г (опц.)"
              name="dimensionWeight"
              placeholder="120"
            />
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">
                Единица измерения
              </Label>
              <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
                {DIMENSION_UNITS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={cn(
                      "flex-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
                      unit === u
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
              <input type="hidden" name="dimensionUnit" value={unit} />
            </div>
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground leading-snug">
            AI получит реальные пропорции и не сделает часы размером со шкаф или
            кружку размером с кулак.
          </p>
        </div>
      )}

      {error && (
        <span className="text-xs text-[hsl(var(--destructive))]">{error}</span>
      )}
    </div>
  );
}

function DimField({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder: string;
}) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[11px] text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type="number"
        min="0"
        step="0.1"
        inputMode="decimal"
        placeholder={placeholder}
      />
    </div>
  );
}
