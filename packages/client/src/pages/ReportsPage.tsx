import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { fetchReports } from '../api/reports.api';
import type { Report } from '@asp/shared';
import type { Grade } from '@asp/shared';

const GRADE_FILTERS: { label: string; value: string }[] = [
  { label: '全部', value: '' },
  { label: 'S 级', value: 'S' },
  { label: 'A 级', value: 'A' },
  { label: 'B 级', value: 'B' },
  { label: 'C 级', value: 'C' },
  { label: 'D 级', value: 'D' },
];

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchReports({ grade: gradeFilter || undefined })
      .then((res) => setReports(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [gradeFilter]);

  return (
    <div className="space-y-6">
      {/* Grade filter */}
      <div className="flex gap-2">
        {GRADE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setGradeFilter(f.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              gradeFilter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : reports.length === 0 ? (
        <Card>
          <div className="text-gray-400 text-center py-12">
            暂无评分报告 — 请先对 Agent 执行评分
          </div>
        </Card>
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3">Agent</th>
                <th className="pb-3">版本</th>
                <th className="pb-3">总分</th>
                <th className="pb-3">等级</th>
                <th className="pb-3">否决</th>
                <th className="pb-3">耗时</th>
                <th className="pb-3">时间</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-800">{report.agentName}</td>
                  <td className="py-3 text-gray-500">{report.agentVersion}</td>
                  <td className="py-3 font-semibold">{report.overallScore.toFixed(1)}</td>
                  <td className="py-3">
                    <Badge grade={report.grade} />
                  </td>
                  <td className="py-3">
                    {report.isVetoed ? '⚠️ 已否决' : '✅ 正常'}
                  </td>
                  <td className="py-3 text-gray-500">
                    {(report.durationMs / 1000).toFixed(1)}s
                  </td>
                  <td className="py-3 text-gray-500">
                    {report.createdAt
                      ? new Date(report.createdAt).toLocaleString('zh-CN')
                      : '-'}
                  </td>
                  <td className="py-3">
                    <Link
                      to={`/reports/${report.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      详情 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
