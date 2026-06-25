import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { RadarChartWidget } from '../components/charts/RadarChart';
import { BarChartWidget } from '../components/charts/BarChart';
import { fetchAgent } from '../api/agents.api';
import { fetchScoringRuns } from '../api/scoring.api';
import type { AgentMetadata, ScoringRun } from '@asp/shared';

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<AgentMetadata | null>(null);
  const [runs, setRuns] = useState<ScoringRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchAgent(Number(id)), fetchScoringRuns({ agentId: Number(id) })])
      .then(([a, r]) => {
        setAgent(a);
        setRuns(r.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!agent) return <div className="text-gray-500">Agent 不存在</div>;

  const latestRun = runs.length > 0 ? runs[0] : null;

  return (
    <div className="space-y-6">
      {/* Agent info */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{agent.name}</h3>
            <p className="text-sm text-gray-400 mt-0.5">v{agent.version}</p>
            {agent.description && <p className="text-sm text-gray-600 mt-2">{agent.description}</p>}
            <div className="flex gap-3 mt-3 text-xs text-gray-500">
              <span>📁 {agent.fileCount} 文件</span>
              <span>📦 {(agent.totalSizeBytes / 1024).toFixed(1)} KB</span>
              <span>📄 入口: {agent.entryFile}</span>
              {agent.author && <span>👤 {agent.author}</span>}
            </div>
          </div>
          <Link
            to={`/scoring?agentId=${agent.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            重新评分
          </Link>
        </div>
      </Card>

      {/* Latest run */}
      {latestRun?.dimensionResults && latestRun.dimensionResults.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="五维雷达图">
              <RadarChartWidget data={latestRun.dimensionResults} />
            </Card>
            <Card title="维度评分柱状图">
              <BarChartWidget data={latestRun.dimensionResults} />
            </Card>
          </div>

          {/* Dimension detail */}
          <Card title="维度详细得分">
            <div className="space-y-4">
              {latestRun.dimensionResults.map((dim) => (
                <div key={dim.dimensionKey} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-700">{dim.dimensionLabel}</h4>
                      <p className="text-xs text-gray-400">
                        权重: {(dim.weight * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {dim.rawScore.toFixed(1)}
                      </div>
                      <Badge grade={dim.grade} />
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${dim.rawScore}%` }}
                    />
                  </div>
                  {dim.subMetrics.length > 0 && (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 border-b">
                          <th className="text-left pb-1">指标</th>
                          <th className="text-right pb-1">实测值</th>
                          <th className="text-right pb-1">目标</th>
                          <th className="text-right pb-1">得分</th>
                          <th className="text-center pb-1">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dim.subMetrics.map((sm) => (
                          <tr key={sm.key} className="border-b border-gray-50">
                            <td className="py-1 text-gray-700">{sm.label}</td>
                            <td className="py-1 text-right font-mono">
                              {typeof sm.measuredValue === 'number'
                                ? sm.measuredValue.toFixed(2)
                                : String(sm.measuredValue)}
                            </td>
                            <td className="py-1 text-right text-gray-400">{sm.target}</td>
                            <td className="py-1 text-right font-semibold">{sm.rawScore}</td>
                            <td className="py-1 text-center">
                              {sm.passes ? '✅' : '❌'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Run history */}
      <Card title="评分历史">
        {runs.length === 0 ? (
          <div className="text-gray-400 text-sm py-8 text-center">暂无评分记录</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">#</th>
                <th className="pb-2">状态</th>
                <th className="pb-2">总分</th>
                <th className="pb-2">等级</th>
                <th className="pb-2">否决</th>
                <th className="pb-2">耗时</th>
                <th className="pb-2">时间</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2">
                    <Link to={`/reports/${run.id}`} className="text-blue-600 hover:underline">
                      #{run.id}
                    </Link>
                  </td>
                  <td className="py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        run.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : run.status === 'running'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {run.status === 'completed'
                        ? '已完成'
                        : run.status === 'running'
                          ? '运行中'
                          : run.status === 'failed'
                            ? '失败'
                            : '等待'}
                    </span>
                  </td>
                  <td className="py-2 font-semibold">
                    {run.overallScore != null ? run.overallScore.toFixed(1) : '-'}
                  </td>
                  <td className="py-2">{run.grade ? <Badge grade={run.grade} /> : '-'}</td>
                  <td className="py-2">{run.isVetoed ? '⚠️ 一票否决' : '-'}</td>
                  <td className="py-2 text-gray-500">
                    {run.durationMs != null ? `${(run.durationMs / 1000).toFixed(1)}s` : '-'}
                  </td>
                  <td className="py-2 text-gray-500">
                    {run.createdAt ? new Date(run.createdAt).toLocaleString('zh-CN') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
