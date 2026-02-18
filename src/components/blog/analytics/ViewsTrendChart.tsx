/**
 * ViewsTrendChart Component
 *
 * SVG-based bar chart showing daily view counts. No external chart library.
 * Uses <rect> elements with <title> children for hover tooltips.
 *
 * Story BL-020.3: Admin Analytics Dashboard UI
 * Task 3: ViewsTrendChart component
 *
 * @see AC4 - Views trend chart as SVG bar chart
 * @see AC8 - Loading state
 * @see AC9 - Empty state when no data
 */

interface ViewsTrendChartProps {
  data: { date: string; count: number }[];
  loading: boolean;
}

const CHART_WIDTH = 800;
const CHART_HEIGHT = 180;
const LABEL_HEIGHT = 20;
const BAR_COLOR = '#3b82f6'; // Tailwind blue-500

/**
 * Format a YYYY-MM-DD date string as a short label (e.g., "Feb 15").
 */
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ViewsTrendChart({ data, loading }: ViewsTrendChartProps) {
  // Loading state
  if (loading) {
    return (
      <div
        className="w-full h-[200px] bg-gray-100 rounded animate-pulse"
        data-testid="chart-loading"
      />
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        className="w-full h-[200px] flex items-center justify-center text-sm text-gray-400"
        data-testid="chart-empty"
      >
        No view data available for this period.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barGap = 2;
  const totalBarWidth = CHART_WIDTH / data.length;
  const barWidth = Math.max(totalBarWidth - barGap, 1);

  // Determine x-axis label indices: first, middle, last
  const labelIndices = new Set<number>();
  labelIndices.add(0);
  labelIndices.add(data.length - 1);
  if (data.length > 2) {
    labelIndices.add(Math.floor(data.length / 2));
  }

  return (
    <div data-testid="chart-container">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + LABEL_HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full h-[200px]"
        role="img"
        aria-label="Views trend chart"
      >
        {data.map((point, i) => {
          const barHeight = Math.floor((point.count / maxCount) * CHART_HEIGHT);
          const x = i * totalBarWidth;
          const y = CHART_HEIGHT - barHeight;

          return (
            <g key={point.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={BAR_COLOR}
                rx={1}
                data-testid={`bar-${point.date}`}
              >
                <title>{`${formatDateLabel(point.date)}: ${point.count.toLocaleString()} views`}</title>
              </rect>
              {labelIndices.has(i) && (
                <text
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT + LABEL_HEIGHT - 4}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-500"
                >
                  {formatDateLabel(point.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
