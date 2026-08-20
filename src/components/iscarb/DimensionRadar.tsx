import { cn } from "@/lib/utils";

interface Dimension {
  name: string;
  score: number;
  icon: string;
}

interface DimensionRadarProps {
  dimensions: Dimension[];
  className?: string;
}

export function DimensionRadar({ dimensions, className }: DimensionRadarProps) {
  const normalizedDimensions = dimensions.slice(0, 4);
  const angleSlice = (Math.PI * 2) / normalizedDimensions.length;

  const getPoints = (index: number, radius: number) => {
    const angle = angleSlice * index - Math.PI / 2;
    const x = 100 + radius * Math.cos(angle);
    const y = 100 + radius * Math.sin(angle);
    return `${x},${y}`;
  };

  const maxScore = 100;
  const dataPoints = normalizedDimensions
    .map((d, i) => getPoints(i, (d.score / maxScore) * 80))
    .join(" ");

  const labelPoints = normalizedDimensions.map((d, i) => getPoints(i, 95));

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <svg
        viewBox="0 0 200 200"
        className="w-64 h-64 drop-shadow-sm"
        style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}
      >
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(14, 108, 60)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="rgb(53, 169, 106)" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {[20, 40, 60, 80, 100].map((r, i) => (
          <circle
            key={`ring-${i}`}
            cx="100"
            cy="100"
            r={(r / 100) * 80}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-border opacity-30"
          />
        ))}

        {normalizedDimensions.map((_, i) => {
          const angle = angleSlice * i - Math.PI / 2;
          const x2 = 100 + 80 * Math.cos(angle);
          const y2 = 100 + 80 * Math.sin(angle);
          return (
            <line
              key={`axis-${i}`}
              x1="100"
              y1="100"
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-border opacity-20"
            />
          );
        })}

        <polygon
          points={dataPoints}
          fill="url(#radarGradient)"
          stroke="rgb(14, 108, 60)"
          strokeWidth="1.5"
          opacity="0.8"
        />
      </svg>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        {normalizedDimensions.map((dim) => (
          <div key={dim.name} className="rounded-lg bg-card border border-border p-3 text-center">
            <div className="text-2xl mb-1">{dim.icon}</div>
            <p className="text-xs font-semibold text-foreground">{dim.name}</p>
            <div className="mt-1.5 flex items-baseline justify-center gap-1">
              <span className="text-lg font-bold text-primary">{dim.score}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
