"use client";

import { useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps {
  headers: string[];
  rows: string[][];
  className?: string;
}

const PAGE_SIZE = 20;

export function DataTable({ headers, rows, className }: DataTableProps) {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);

  const sorted = sortCol !== null
    ? [...rows].sort((a, b) => {
        const av = a[sortCol] ?? "";
        const bv = b[sortCol] ?? "";
        // Try numeric sort first
        const an = parseFloat(av);
        const bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return sortAsc ? an - bn : bn - an;
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : rows;

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(col: number) {
    if (sortCol === col) {
      setSortAsc((v) => !v);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border/60", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-border/50 bg-muted/40">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left font-medium text-muted-foreground"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(i)}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {h}
                    <ArrowUpDown className={cn(
                      "size-3",
                      sortCol === i ? "text-foreground" : "text-muted-foreground/40"
                    )} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => (
              <tr key={ri} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-1.5 text-foreground/90 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
          <span>{sorted.length} rows</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded p-0.5 hover:bg-accent disabled:opacity-30"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span>{page + 1} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded p-0.5 hover:bg-accent disabled:opacity-30"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Parse a markdown table string into headers + rows.
 * Returns null if the string isn't a valid markdown table.
 */
export function parseMarkdownTable(text: string): { headers: string[]; rows: string[][] } | null {
  const lines = text.trim().split("\n").filter((l) => l.trim());
  if (lines.length < 3) return null; // need header + separator + at least 1 row

  const parseLine = (line: string) =>
    line.split("|").map((c) => c.trim()).filter((c) => c.length > 0);

  const headers = parseLine(lines[0]);
  if (headers.length < 2) return null;

  // Check separator line
  const sep = parseLine(lines[1]);
  if (!sep.every((s) => /^[-:]+$/.test(s))) return null;

  const rows = lines.slice(2).map(parseLine);
  return { headers, rows };
}
