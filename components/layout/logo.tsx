import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, href = "/dashboard", size = "md" }: LogoProps) {
  const dims = size === "sm" ? "size-7" : size === "lg" ? "size-10" : "size-8";
  const text = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 select-none",
        className
      )}
    >
      <span
        className={cn(
          "relative inline-flex items-center justify-center rounded-md bg-foreground text-background overflow-hidden",
          "ring-1 ring-foreground/20 transition-all duration-300 group-hover:scale-[1.04]",
          dims
        )}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-1/2"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 4L19 12L5 20V4Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span
        className={cn(
          "font-semibold tracking-tight text-foreground",
          text
        )}
      >
        AigenVideo
      </span>
    </Link>
  );
}
