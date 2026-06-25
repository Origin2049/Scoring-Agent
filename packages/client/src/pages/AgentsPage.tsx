import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { useAppStore } from '../store/app.store';
import { fetchAgents, uploadAgent, deleteAgent } from '../api/agents.api';
import type { AgentMetadata } from '@asp/shared';

export function AgentsPage() {
  const [agents, setAgents] = useState<AgentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const showToast = useAppStore((s) => s.showToast);

  const loadAgents = useCallback(() => {
    fetchAgents({ search: search || undefined })
      .then((res) => setAgents(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    if (!file || !file.name.endsWith('.zip')) {
      showToast('请选择 .zip 文件', 'error');
      return;
    }

    setUploading(true);
    try {
      await uploadAgent(formData);
      showToast('Agent 上传成功', 'success');
      e.currentTarget.reset();
      loadAgents();
    } catch (err) {
      showToast(`上传失败: ${(err as Error).message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除 "${name}" 吗？此操作不可撤销。`)) return;
    try {
      await deleteAgent(id);
      showToast('已删除', 'success');
      loadAgents();
    } catch (err) {
      showToast(`删除失败: ${(err as Error).message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <Card title="上传 Agent">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent 名称</label>
              <input
                name="name"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="我的 Agent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">版本号</label>
              <input
                name="version"
                defaultValue="1.0.0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <input
                name="description"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="简要描述 Agent 功能"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">作者</label>
              <input
                name="author"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="作者名称"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              上传 Agent 压缩包 (.zip)
            </label>
            <input
              type="file"
              name="file"
              accept=".zip"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700"
            />
            <p className="text-xs text-gray-400 mt-1">
              Agent 入口文件将自动检测，支持 index.js、main.js 等
            </p>
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? '上传中...' : '上传并解压'}
          </button>
        </form>
      </Card>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索 Agent..."
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => { setLoading(true); loadAgents(); }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          刷新
        </button>
      </div>

      {/* Agent list */}
      {loading ? (
        <Spinner />
      ) : agents.length === 0 ? (
        <Card>
          <div className="text-gray-400 text-center py-12">
            <p className="text-lg mb-2">暂无 Agent</p>
            <p className="text-sm">上传第一个 Agent 开始评分</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/agents/${agent.id}`}
                    className="text-base font-semibold text-blue-700 hover:text-blue-900 truncate block"
                  >
                    {agent.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">v{agent.version}</p>
                </div>
                <button
                  onClick={() => handleDelete(agent.id!, agent.name)}
                  className="text-xs text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                >
                  删除
                </button>
              </div>
              {agent.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{agent.description}</p>
              )}
              <div className="flex gap-2 mt-3 text-xs text-gray-400">
                <span>{agent.fileCount} 文件</span>
                <span>·</span>
                <span>{(agent.totalSizeBytes / 1024).toFixed(1)} KB</span>
                {agent.author && (
                  <>
                    <span>·</span>
                    <span>{agent.author}</span>
                  </>
                )}
              </div>
              <div className="mt-3">
                <Link
                  to={`/scoring?agentId=${agent.id}`}
                  className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                >
                  开始评分 →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
