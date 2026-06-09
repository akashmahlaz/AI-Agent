"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MermaidBlockProps {
  code: string;
  className?: string;
}

export function MermaidBlock({ code, className }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reactId = useId();
  const idRef = useRef(`mermaid-${reactId.replace(/:/g, "")}`);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        // Dynamic import to avoid SSR issues and keep bundle small
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains("dark")
            ? "dark"
            : "default",
          securityLevel: "loose",
          fontFamily: "var(--font-mono, monospace)",
        });
        const { svg: rendered } = await mermaid.render(idRef.current, code);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to render diagram");
          setSvg(null);
        }
      }
    }

    if (code.trim()) render();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div
        className={cn(
          "rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-3",
          className,
        )}
      >
        <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 mb-1">
          Diagram Error
        </p>
        <pre className="text-[11px] text-muted-foreground font-mono whitespace-pre-wrap">
          {code}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        className={cn(
          "flex h-24 items-center justify-center rounded-lg border border-border/50 bg-muted/30",
          className,
        )}
      >
        <span className="text-[11px] text-muted-foreground animate-pulse">
          Rendering diagram…
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "overflow-x-auto rounded-lg border border-border/50 bg-card/50 p-3 [&_svg]:max-w-full",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
