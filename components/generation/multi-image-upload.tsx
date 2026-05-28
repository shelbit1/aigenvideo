"use client";

import * as React from "react";
import {
  ImagePlus,
  Loader2,
  Plus,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils/format";

/**
 * Multi-image upload для фото продукта.
 *
 * Сохраняет URL'ы как hidden JSON-массив в поле `name` — серверная
 * Zod-схема (CreateProjectSchema.sourceImages) парсит этот JSON.
 *
 * Рекомендуется загружать front / back / side / detail / texture / lifestyle.
 */

interface UploadedImage {
  id: string;
  url: string;
  preview: string;
  name: string;
  bytes: number;
  uploading: boolean;
}

interface MultiImageUploadProps {
  name?: string;
  maxImages?: number;
  maxSizeBytes?: number;
}

const ACCEPT = "image/jpeg,image/png,image/webp";

export function MultiImageUpload({
  name = "sourceImages",
  maxImages = 10,
  maxSizeBytes = 15 * 1024 * 1024,
}: MultiImageUploadProps) {
  const [items, setItems] = React.useState<UploadedImage[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputId = React.useId();

  const uploadedUrls = React.useMemo(
    () => items.filter((it) => !it.uploading && it.url).map((it) => it.url),
    [items]
  );

  const remainingSlots = maxImages - items.length;

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const allowed = files.slice(0, remainingSlots);
    if (allowed.length < files.length) {
      toast.warning(`Максимум ${maxImages} изображений — лишние пропущены`);
    }

    const newItems: UploadedImage[] = allowed
      .filter((f) => {
        if (!ACCEPT.split(",").includes(f.type)) {
          toast.error(`«${f.name}»: поддерживаются только JPG, PNG, WEBP`);
          return false;
        }
        if (f.size > maxSizeBytes) {
          toast.error(
            `«${f.name}» слишком большой. Максимум ${formatBytes(maxSizeBytes)}`
          );
          return false;
        }
        return true;
      })
      .map((file) => ({
        id: crypto.randomUUID(),
        url: "",
        preview: URL.createObjectURL(file),
        name: file.name,
        bytes: file.size,
        uploading: true,
      }));

    if (newItems.length === 0) return;
    setItems((prev) => [...prev, ...newItems]);

    await Promise.all(
      newItems.map(async (item, idx) => {
        const file = allowed[idx];
        try {
          const presignedRes = await fetch("/api/uploads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              sizeBytes: file.size,
            }),
          });
          if (!presignedRes.ok) throw new Error("Не удалось получить ссылку");

          const presigned = (await presignedRes.json()) as {
            url: string;
            publicUrl: string;
          };

          const putRes = await fetch(presigned.url, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });
          if (!putRes.ok) throw new Error("Загрузка не удалась");

          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? { ...p, url: presigned.publicUrl, uploading: false }
                : p
            )
          );
        } catch (error) {
          console.error(error);
          toast.error(
            error instanceof Error
              ? `«${file.name}»: ${error.message}`
              : `«${file.name}»: не удалось загрузить`
          );
          setItems((prev) => prev.filter((p) => p.id !== item.id));
        }
      })
    );
  };

  const onSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) void handleFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length > 0) void handleFiles(files);
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  // Подстраховка: если по какой-то причине нативное <label htmlFor>
  // не сработает (CSS-перекрытие, Turbopack HMR-кэш и т.п.) — вызываем
  // showPicker() явно. Это нативный API HTMLInputElement, специально
  // созданный для программного открытия диалога файлов.
  const openPicker = (event: React.MouseEvent) => {
    const input = inputRef.current;
    if (!input) return;
    // Не перехватываем нативное поведение label, если оно сработало —
    // браузер сам откроет picker. Но если по какой-то причине input
    // не получит клика — fallback через showPicker/click.
    event.preventDefault();
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
      } else {
        input.click();
      }
    } catch {
      input.click();
    }
  };

  const anyUploading = items.some((it) => it.uploading);

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={JSON.stringify(uploadedUrls)} />

      {/*
        Скрытый input должен оставаться доступным для нативного клика
        через <label htmlFor>. sr-only (вместо display:none) — это
        a11y-паттерн: визуально скрыт, но кликабелен и фокусируется.
      */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        onChange={onSelect}
      />

      {items.length === 0 ? (
        <label
          htmlFor={inputId}
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "relative isolate flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-surface/40 px-6 py-12 text-center transition-all",
            dragging
              ? "border-[hsl(var(--accent))] bg-surface-elevated"
              : "border-border-strong hover:border-foreground/30 hover:bg-surface"
          )}
        >
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-surface-elevated ring-1 ring-border-strong">
            <UploadCloud className="size-5 text-foreground/90" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              Перетащите изображения или нажмите чтобы выбрать
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Front, back, side, detail, lifestyle — до {maxImages} фото
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPG, PNG, WEBP — до {formatBytes(maxSizeBytes)} каждое
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-foreground">
            <ImagePlus className="size-3.5" />
            Выбрать файлы
          </span>
        </label>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.preview}
                alt={item.name}
                className="size-full object-cover"
              />
              {item.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                  <Loader2 className="size-5 animate-spin text-foreground" />
                </div>
              )}
              {idx === 0 && !item.uploading && (
                <span className="absolute left-1.5 top-1.5 rounded bg-foreground/85 px-1.5 py-0.5 text-[10px] font-medium text-background">
                  Обложка
                </span>
              )}
              <button
                type="button"
                aria-label={`Удалить ${item.name}`}
                onClick={() => remove(item.id)}
                className="absolute right-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}

          {remainingSlots > 0 && (
            <label
              htmlFor={inputId}
              onClick={openPicker}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border-strong bg-surface/40 text-muted-foreground hover:border-foreground/30 hover:bg-surface transition-colors"
            >
              <Plus className="size-5" />
              <span className="text-xs">Добавить</span>
            </label>
          )}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        {items.length === 0
          ? `Минимум 1, максимум ${maxImages} изображений. Чем больше ракурсов и деталей — тем стабильнее identity продукта в кадре.`
          : `${items.filter((it) => !it.uploading).length} из ${maxImages} загружено${anyUploading ? "… (есть незавершённые загрузки)" : ""}`}
      </p>
    </div>
  );
}
