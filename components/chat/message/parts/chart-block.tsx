"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface ChartData {
  label: string;
  value: number;
  [key: string]: string | number;
}

type ChartType = "bar" | "line" | "pie";

interface ChartBlockProps {
  data: ChartData[];
  type?: ChartType;
  title?: string;
  xKey?: string;
  yKey?: string;
  className?: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 200 80% 55%))",
  "hsl(var(--chart-3, 150 60% 45%))",
  "hsl(var(--chart-4, 40 90% 55%))",
  "hsl(var(--chart-5, 280 65% 55%))",
  "hsl(var(--chart-6, 0 75% 55%))",
];

export function ChartBlock({
  data,
  type = "bar",
  title,
  xKey = "label",
  yKey = "value",
  className,
}: ChartBlockProps) {
  if (!data || data.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card/50 p-4",
        className,
      )}
    >
      {title && (
        <p className="mb-3 text-[12px] font-medium text-foreground/80">
          {title}
        </p>
      )}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey={yKey} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : type === "line" ? (
            <LineChart
              data={data}
              margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey={yKey}
                stroke={COLORS[0]}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS[0] }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey={yKey}
                nameKey={xKey}
                label={({
                  name,
                  percent,
                }: {
                  name?: string;
                  percent?: number;
                }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Try to detect if a tool result looks like chart-able numerical data.
 * Returns parsed data + suggested chart type if detected.
 */
export function detectChartData(
  result: unknown,
): { data: ChartData[]; type: ChartType } | null {
  if (!result || typeof result !== "object") return null;

  // Array of objects with label + value
  if (Array.isArray(result)) {
    if (result.length < 2 || result.length > 50) return null;

    // Check if items have a string key + numeric value
    const first = result[0];
    if (!first || typeof first !== "object") return null;

    const keys = Object.keys(first as object);
    const labelKey = keys.find(
      (k) => typeof (first as Record<string, unknown>)[k] === "string",
    );
    const valueKey = keys.find(
      (k) => typeof (first as Record<string, unknown>)[k] === "number",
    );

    if (!labelKey || !valueKey) return null;

    const data = result.map((item) => ({
      label: String((item as Record<string, unknown>)[labelKey] ?? ""),
      value: Number((item as Record<string, unknown>)[valueKey] ?? 0),
    }));

    // Suggest chart type based on data characteristics
    const type: ChartType =
      data.length <= 6 ? "pie" : data.length > 12 ? "line" : "bar";
    return { data, type };
  }

  return null;
}
