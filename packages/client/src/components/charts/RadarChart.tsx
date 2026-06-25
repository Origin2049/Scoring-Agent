import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DimensionResult } from '@asp/shared';

interface Props {
  data: DimensionResult[];
  comparisonData?: DimensionResult[][];
  agentNames?: string[];
}

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];

export function RadarChartWidget({ data, comparisonData, agentNames }: Props) {
  // Transform dimension results to Recharts format
  const chartData = data.map((d) => ({
    dimension: d.dimensionLabel,
    score: Math.round(d.rawScore),
    fullMark: 100,
    ...(comparisonData
      ? Object.fromEntries(
          comparisonData.map((cd, i) => [
            agentNames?.[i] || `Agent ${i + 1}`,
            Math.round(cd.find((r) => r.dimensionKey === d.dimensionKey)?.rawScore || 0),
          ]),
        )
      : {}),
  }));

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar data={chartData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid />
          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
          {comparisonData ? (
            agentNames?.map((name, i) => (
              <Radar
                key={name}
                name={name}
                dataKey={name}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.15}
              />
            ))
          ) : (
            <Radar
              name="评分"
              dataKey="score"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.2}
            />
          )}
          <Legend />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
