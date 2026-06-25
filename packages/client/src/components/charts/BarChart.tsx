import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

export function BarChartWidget({ data, comparisonData, agentNames }: Props) {
  if (comparisonData && agentNames) {
    // Grouped bar chart for comparison
    const chartData = data.map((d) => ({
      name: d.dimensionLabel,
      ...Object.fromEntries(
        comparisonData.map((cd, i) => [
          agentNames[i] || `Agent ${i + 1}`,
          Math.round(cd.find((r) => r.dimensionKey === d.dimensionKey)?.weightedScore || 0),
        ]),
      ),
    }));

    return (
      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBar data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 45]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {agentNames.map((name, i) => (
              <Bar key={name} dataKey={name} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </RechartsBar>
        </ResponsiveContainer>
      </div>
    );
  }

  // Single agent bar chart
  const chartData = data.map((d) => ({
    name: d.dimensionLabel,
    原始分: Math.round(d.rawScore),
    加权分: Math.round(d.weightedScore),
  }));

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBar data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="原始分" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="加权分" fill="#93c5fd" radius={[4, 4, 0, 0]} />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
