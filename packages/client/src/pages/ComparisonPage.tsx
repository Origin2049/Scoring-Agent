import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { RadarChartWidget } from '../components/charts/RadarChart';
import { BarChartWidget } from '../components/charts/BarChart';
import { fetchAgents } from '../api/agents.api';
import { compareAgents } from '../api/reports.api';
import type { AgentMetadata, Report } from '@asp/shared';

export function ComparisonPage() {
  const [agents, setAgents] = useState<AgentMetadata[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [compared, setCompared] = useState(false);

  useEffect(() => {
    fetchAgents({ limit: 100 }).then((res) => setAgents(res.data)).catch(console.error);
  }, []);

  const toggleAgent = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) return;
    setLoading(true);
    try {
      const data = await compareAgents(selectedIds);
      setReports(data);
      setCompared(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Agent selector */}
      <Card title="选择 Agent 进行对比">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => toggleAgent(agent.id!)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  selectedIds.includes(agent.id!)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {agent.name}
              </button>
            ))}
          </div>
          <button
            onClick={handleCompare}
            disabled={selectedIds.length < 2 || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '加载中...' : `对比 ${selectedIds.length} 个 Agent`}
          </button>
        </div>
      </Card>

      {/* Comparison results */}
      {loading ? (
        <Spinner />
      ) : compared && reports.length === 0 ? (
        <Card>
          <div className="text-gray-400 text-center py-12">
            所选 Agent 暂无评分报告 — 请先对它们执行评分
          </div>
        </Card>
      ) : reports.length > 0 ? (
        <>
          {/* Score summary table */}
          <Card title="分数对比">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3">Agent</th>
                  <th className="pb-3">总分</th>
                  <th className="pb-3">等级</th>
                  {reports[0]?.dimensionResults.map((dim) => (
                    <th key={dim.dimensionKey} className="pb-3 text-right">
                      {dim.dimensionLabel.split('(')[0].trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium">{report.agentName}</td>
                    <td className="py-3 font-bold">{report.overallScore.toFixed(1)}</td>
                    <td className="py-3">
                      <Badge grade={report.grade} />
                    </td>
                    {report.dimensionResults.map((dim) => (
                      <td key={dim.dimensionKey} className="py-3 text-right">
                        <span className="font-semibold">{dim.rawScore.toFixed(1)}</span>
                        <span className="text-xs text-gray-400 ml-1">/100</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Comparison charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="五维雷达图对比">
              {reports[0] && (
                <RadarChartWidget
                  data={reports[0].dimensionResults}
                  comparisonData={reports.slice(1).map((r) => r.dimensionResults)}
                  agentNames={reports.map((r) => r.agentName)}
                />
              )}
            </Card>
            <Card title="维度加权分对比">
              {reports[0] && (
                <BarChartWidget
                  data={reports[0].dimensionResults}
                  comparisonData={reports.slice(1).map((r) => r.dimensionResults)}
                  agentNames={reports.map((r) => r.agentName)}
                />
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
