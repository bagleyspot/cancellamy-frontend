import { formatPeriod, formatShortMonth } from '@/lib/format';

export interface BarDatum {
  /** YYYY-MM */
  month: string;
  count: number;
}

interface BarChartProps {
  data: readonly BarDatum[];
  caption: string;
  countLabel: string;
  monthLabel: string;
}

const WIDTH = 480;
const HEIGHT = 180;
const PAD = { top: 16, right: 8, bottom: 28, left: 8 };

/** Minimal SVG column chart with a screen-reader table fallback. */
export function BarChart({ data, caption, countLabel, monthLabel }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const slot = data.length > 0 ? innerW / data.length : innerW;
  const barW = Math.min(28, slot * 0.6);

  return (
    <figure className="space-y-2">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label={caption}>
        <line x1={PAD.left} x2={WIDTH - PAD.right} y1={HEIGHT - PAD.bottom} y2={HEIGHT - PAD.bottom} stroke="var(--border)" />
        {data.map((d, index) => {
          const h = (d.count / max) * innerH;
          const x = PAD.left + index * slot + (slot - barW) / 2;
          const y = HEIGHT - PAD.bottom - h;
          return (
            <g key={d.month}>
              <rect x={x} y={y} width={barW} height={Math.max(h, d.count > 0 ? 2 : 0)} rx={4} fill="var(--primary)">
                <title>{`${formatPeriod(d.month)}: ${d.count}`}</title>
              </rect>
              {d.count > 0 && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fill="var(--fg)">
                  {d.count}
                </text>
              )}
              <text x={x + barW / 2} y={HEIGHT - 10} textAnchor="middle" fontSize="10" fill="var(--muted)">
                {formatShortMonth(d.month)}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{monthLabel}</th>
            <th scope="col">{countLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <th scope="row">{formatPeriod(d.month)}</th>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
