import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { useAppStore } from '../store/app.store';
import { fetchAgents } from '../api/agents.api';
import { evaluateAgent, fetchScoringRun } from '../api/scoring.api';
import { seedTests } from '../api/tests.api';
import type { AgentMetadata, ScoringRun } from '@asp/shared';

export function ScoringPage() {
  const [searchParams] = useSearchParams();
  const [agents, setAgents] = useState<AgentMetadata[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(
    searchParams.get('agentId') ? Number(searchParams.get('agentId')) : null,
  );
  const [running, setRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState<ScoringRun | null>(null);
  const showToast = useAppStore((s) => s.showToast);

  useEffect(() => {
    fetchAgents({ limit: 100 }).then((res) => setAgents(res.data)).catch(console.error);
    seedTests().catch(() => {}); // Seed tests in background if needed
  }, []);

  const handleStartScoring = async () => {
    if (!selectedAgent) {
      showToast('请选择一个 Agent', 'error');
      return;
    }

    setRunning(true);
    setCurrentRun(null);
    try {
      const run = await evaluateAgent(selectedAgent);
      setCurrentRun(run);
      showToast('评分已启动', 'success');

      // Poll for completion
      const poll = setInterval(async () => {
        try {
          const updated = await fetchScoringRun(run.id!);
          if (updated.status === 'completed' || updated.status === 'failed') {
            clearInterval(poll);
            setCurrentRun(updated);
            setRunning(false);
            showToast(
              updated.status === 'completed'
                ? `评分完成: ${updated.grade}级 (${updated.overallScore?.toFixed(1)})`
                : `评分失败: ${updated.errorMessage || '未知错误'}`,
              updated.status === 'completed' ? 'success' : 'error',
            );
          } else {
            setCurrentRun(updated);
          }
        } catch {
          clearInterval(poll);
          setRunning(false);
        }
      }, 2000);
    } catch (err) {
      showToast(`启动失败: ${(err as Error).message}`, 'error');
      setRunning(false);
    }
  };

  const selectedAgentName =
    agents.find((a) => a.id === selectedAgent)?.name || '选择 Agent';

  return (
    <div className="space-y-6 max-w-2xl">
      <Card title="执行评分">
        <div className="space-y-4">
          {/* Agent selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择待评分 Agent
            </label>
            <select
              value={selectedAgent || ''}
              onChange={(e) => setSelectedAgent(Number(e.target.value) || null)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={running}
            >
              <option value="">— 请选择 —</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id!}>
                  {a.name} (v{a.version})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleStartScoring}
            disabled={running || !selectedAgent}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {running ? '⏳ 评分进行中...' : '🚀 开始评分'}
          </button>
        </div>
      </Card>

      {/* Progress */}
      {(running || currentRun) && (
        <Card title="评分进度">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">状态</span>
              <span
                className={`font-semibold ${
                  currentRun?.status === 'completed'
                    ? 'text-green-600'
                    : currentRun?.status === 'running'
                      ? 'text-blue-600'
                      : currentRun?.status === 'failed'
                        ? 'text-red-600'
                        : 'text-gray-500'
                }`}
              >
                {currentRun?.status === 'completed'
                  ? '✅ 已完成'
                  : currentRun?.status === 'running'
                    ? '🔄 运行中...'
                    : currentRun?.status === 'failed'
                      ? '❌ 失败'
                      : currentRun?.status === 'pending'
                        ? '⏳ 等待中'
                        : '-'}
              </span>
            </div>

            {running && (
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse w-1/2" />
              </div>
            )}

            {currentRun?.status === 'completed' && currentRun.overallScore != null && (
              <>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-lg font-bold text-gray-800">
                    总分: {currentRun.overallScore.toFixed(1)}
                  </span>
                  <Badge grade={currentRun.grade!} />
                </div>

                {currentRun.isVetoed && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                    ⚠️ 一票否决触发！
                    {currentRun.vetoReasons?.map((r) => (
                      <div key={r.key} className="mt-1">
                        • {r.label}: {r.description}
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  to={`/reports/${currentRun.id}`}
                  className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  查看完整报告 →
                </Link>
              </>
            )}

            {currentRun?.status === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                {currentRun.errorMessage || '评分过程发生未知错误'}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
