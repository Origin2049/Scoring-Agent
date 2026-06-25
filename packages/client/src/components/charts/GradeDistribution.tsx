import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Grade } from '@asp/shared';
import { GRADE_COLORS } from '@asp/shared';

interface Props {
  data: Record<Grade, number>;
}

export function GradeDistribution({ data }: Props) {
  const chartData = (Object.entries(data) as [Grade, number][]).map(([grade, count]) => ({
    name: `${grade}级`,
    value: count,
    color: GRADE_COLORS[grade],
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
