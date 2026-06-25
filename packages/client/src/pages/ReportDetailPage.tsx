import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { RadarChartWidget } from '../components/charts/RadarChart';
import { BarChartWidget } from '../components/charts/BarChart';
import { fetchReport } from '../api/reports.api';
import type { Report } from '@asp/shared';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchReport(Number(id))
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!report) return <div className="text-gray-500">报告不存在</div>;

  // Export handler
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-report-${report.agentId}-${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{report.agentName}</h3>
            <p className="text-sm text-gray-400">v{report.agentVersion} · {report.rubricName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{report.overallScore.toFixed(1)}</div>
              <Badge grade={report.grade} />
            </div>
            <button
              onClick={handleExport}
              className="text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-2 py-1"
            >
              导出 JSON
            </button>
          </div>
        </div>

        {report.isVetoed && report.vetoReasons && (
          <div className="mt-4 bg-red-50 border border-red-300 rounded-lg p-4">
            <h4 className="text-sm font-bold text-red-700 mb-2">⚠️ 一票否决</h4>
            {report.vetoReasons.map((r) => (
              <div key={r.key} className="text-sm text-red-600 mt-1">
                <strong>{r.label}</strong> — {r.description}（实际值: {r.actualValue?.toFixed(2)}，阈值: {r.threshold}）
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="五维雷达图">
          <RadarChartWidget data={report.dimensionResults} />
        </Card>
        <Card title="维度评分对比">
          <BarChartWidget data={report.dimensionResults} />
        </Card>
      </div>

      {/* Dimension breakdown */}
      <Card title="各维度详细得分">
        <div className="space-y-4">
          {report.dimensionResults.map((dim) => (
            <div key={dim.dimensionKey} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-700">{dim.dimensionLabel}</h4>
                  <p className="text-xs text-gray-400">权重: {(dim.weight * 100).toFixed(0)}%</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">{dim.rawScore.toFixed(1)}</div>
                  <div className="text-xs text-gray-400">
                    加权分: {dim.weightedScore.toFixed(1)}
                  </div>
                  <Badge grade={dim.grade} />
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${dim.rawScore}%` }}
                />
              </div>
              {dim.subMetrics.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b text-xs">
                      <th className="text-left pb-1">子指标</th>
                      <th className="text-right pb-1">实测值</th>
                      <th className="text-right pb-1">目标值</th>
                      <th className="text-right pb-1">得分</th>
                      <th className="text-center pb-1">通过</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dim.subMetrics.map((sm) => (
                      <tr key={sm.key} className="border-b border-gray-50">
                        <td className="py-1.5 text-gray-700">{sm.label}</td>
                        <td className="py-1.5 text-right font-mono text-xs">
                          {typeof sm.measuredValue === 'number'
                            ? sm.measuredValue < 1
                              ? sm.measuredValue.toFixed(4)
                              : sm.measuredValue.toFixed(2)
                            : String(sm.measuredValue)}
                        </td>
                        <td className="py-1.5 text-right text-gray-400 text-xs">{sm.target}</td>
                        <td className="py-1.5 text-right font-semibold">
                          {sm.rawScore}
                        </td>
                        <td className="py-1.5 text-center text-xs">
                          {sm.passes ? (
                            <span className="text-green-600">✅</span>
                          ) : (
                            <span className="text-red-500">❌</span>
                          )}
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

      {/* Summary */}
      <Card title="评分小结">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">评分耗时：</span>
            <span className="font-semibold">{(report.durationMs / 1000).toFixed(1)} 秒</span>
          </div>
          <div>
            <span className="text-gray-500">评分时间：</span>
            <span className="font-semibold">
              {report.createdAt ? new Date(report.createdAt).toLocaleString('zh-CN') : '-'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
