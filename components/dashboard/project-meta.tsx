import { Box, Camera, Sparkles, Ruler } from "lucide-react";
import {
  formatDimensions,
  type GenerationMode,
  type ProductDimensions,
  type ProductIdentity,
} from "@/lib/projects/types";

/**
 * Карточка мета-данных проекта: режим генерации, реальные размеры
 * и Product Identity Object. Отображается на странице проекта рядом
 * с превью и брифом.
 */

interface ProjectMetaProps {
  mode: GenerationMode;
  dimensions: ProductDimensions | null;
  identity: ProductIdentity | null;
  sourceImages: string[];
}

const MODE_META: Record<GenerationMode, { label: string; caption: string }> = {
  REALISTIC: {
    label: "Realistic",
    caption: "UGC-эстетика, реалистичная съёмка",
  },
  CARTOON: {
    label: "Cartoon",
    caption: "Стилизованная 3D-анимация",
  },
};

export function ProjectMeta({
  mode,
  dimensions,
  identity,
  sourceImages,
}: ProjectMetaProps) {
  const modeInfo = MODE_META[mode];

  return (
    <div className="grid gap-3">
      <Row icon={Camera} title="Режим" value={modeInfo.label} caption={modeInfo.caption} />

      {dimensions && (
        <Row
          icon={Ruler}
          title="Размеры продукта"
          value={formatDimensions(dimensions)}
          caption="Используются как масштаб в каждой сцене"
        />
      )}

      {sourceImages.length > 0 && (
        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Box className="size-3.5" />
            <span className="uppercase tracking-wider">Референсы продукта</span>
            <span className="ml-auto tabular-nums">
              {sourceImages.length}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {sourceImages.slice(0, 10).map((url, i) => (
              <a
                key={url + i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square overflow-hidden rounded-md border border-border bg-surface"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Reference ${i + 1}`}
                  className="size-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {identity && (
        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" />
            <span className="uppercase tracking-wider">Product Identity</span>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <IdentityRow label="Тип" value={identity.productType} />
            <IdentityRow label="Материал" value={identity.material} />
            <IdentityRow label="Форма" value={identity.shape} />
            <IdentityRow label="Фактура" value={identity.texture} />
            <IdentityRow label="Финиш" value={identity.surfaceFinish} />
            <IdentityRow label="Стиль" value={identity.visualStyle} />
          </dl>
          {identity.dominantColors?.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Цвета
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {identity.dominantColors.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-foreground/85"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {identity.smallDetails?.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Ключевые детали
              </p>
              <ul className="mt-1.5 space-y-1 text-[11px] text-foreground/85">
                {identity.smallDetails.map((d) => (
                  <li key={d} className="flex items-start gap-1.5">
                    <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-foreground/60" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  icon: Icon,
  title,
  value,
  caption,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  caption?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface/40 px-4 py-3">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated ring-1 ring-border-strong">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
        <div className="text-sm font-medium tabular-nums">{value}</div>
        {caption && (
          <div className="text-[11px] text-muted-foreground">{caption}</div>
        )}
      </div>
    </div>
  );
}

function IdentityRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="truncate text-foreground/90">{value}</dd>
    </div>
  );
}
