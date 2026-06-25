import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { GradeDistribution } from '../components/charts/GradeDistribution';
import { Spinner } from '../components/ui/Spinner';
import { fetchSummary } from '../api/reports.api';
import type { ReportSummary } from '@asp/shared';
import type { Grade } from '@asp/shared';

export function DashboardPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!summary) return <div className="text-gray-500">暂无数据</div>;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-2xl font-bold text-gray-800">{summary.totalAgents}</div>
          <div className="text-sm text-gray-500 mt-1">Agent 总数</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-gray-800">{summary.totalRuns}</div>
          <div className="text-sm text-gray-500 mt-1">评分次数</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-blue-600">
            {summary.avgScore.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 mt-1">平均分</div>
        </Card>
        <Card>
          <div className="flex gap-2">
            {(Object.entries(summary.gradeDistribution) as [Grade, number][])
              .filter(([_, c]) => c > 0)
              .map(([grade, count]) => (
                <span key={grade} className="text-sm">
                  <strong>{grade}</strong>: {count}
                </span>
              ))}
          </div>
          <div className="text-sm text-gray-500 mt-1">等级分布</div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="等级分布">
          <GradeDistribution data={summary.gradeDistribution} />
        </Card>
        <Card title="各维度平均分">
          {Object.keys(summary.dimensionAverages).length > 0 ? (
            <div className="space-y-3">
              {(Object.entries(summary.dimensionAverages) as [string, number][]).map(
                ([key, avg]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{key}</span>
                      <span className="font-semibold">{avg.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${avg}%` }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-sm py-8 text-center">暂无评分数据</div>
          )}
        </Card>
      </div>

      {/* Recent runs */}
      <Card title="最近评分">
        {summary.recentRuns.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Agent</th>
                <th className="pb-2">分数</th>
                <th className="pb-2">等级</th>
                <th className="pb-2">时间</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentRuns.map((run) => (
                <tr key={run.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2">{run.agentName}</td>
                  <td className="py-2 font-semibold">{run.overallScore?.toFixed(1) || '-'}</td>
                  <td className="py-2">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                        run.grade === 'S'
                          ? 'bg-green-100 text-green-700'
                          : run.grade === 'A'
                            ? 'bg-blue-100 text-blue-700'
                            : run.grade === 'B'
                              ? 'bg-yellow-100 text-yellow-700'
                              : run.grade === 'C'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {run.grade}级
                    </span>
                  </td>
                  <td className="py-2 text-gray-500">
                    {run.createdAt ? new Date(run.createdAt).toLocaleDateString('zh-CN') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-gray-400 text-sm py-8 text-center">暂无评分记录</div>
        )}
      </Card>
    </div>
  );
}
