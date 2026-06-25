import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { useAppStore } from '../store/app.store';
import { fetchActiveRubric, uploadRubric } from '../api/rubric.api';
import type { ParsedRubric } from '@asp/shared';

export function RubricPage() {
  const [rubric, setRubric] = useState<ParsedRubric | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const showToast = useAppStore((s) => s.showToast);

  useEffect(() => {
    fetchActiveRubric()
      .then((data) => setRubric(data.parsedJson || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRubricUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;

    if (!file) {
      showToast('请选择 .md 文件', 'error');
      return;
    }

    setUploading(true);
    try {
      await uploadRubric(file, name || file.name);
      showToast('细则上传成功', 'success');
      // Reload
      const data = await fetchActiveRubric();
      setRubric(data.parsedJson || data);
    } catch (err) {
      showToast(`上传失败: ${(err as Error).message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Spinner />;
  if (!rubric) return <div className="text-gray-500">暂无评分细则</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Rubric info */}
      <Card title={`评分细则 — ${rubric.model}`}>
        <p className="text-sm text-gray-500 mb-4">版本: {rubric.version}</p>
      </Card>

      {/* Dimensions */}
      {rubric.dimensions.map((dim) => (
        <Card key={dim.key} title={`${dim.label} (权重: ${(dim.weight * 100).toFixed(0)}%)`}>
          {dim.description && (
            <p className="text-sm text-gray-500 mb-4">{dim.description}</p>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">指标</th>
                <th className="pb-2">说明</th>
                <th className="pb-2">目标值</th>
                <th className="pb-2">评分方式</th>
              </tr>
            </thead>
            <tbody>
              {dim.subMetrics.map((sm) => (
                <tr key={sm.key} className="border-b border-gray-50">
                  <td className="py-2 font-medium text-gray-700">{sm.label}</td>
                  <td className="py-2 text-gray-500 text-xs">{sm.description || '-'}</td>
                  <td className="py-2 text-gray-700 font-mono text-xs">{sm.target}</td>
                  <td className="py-2 text-xs text-gray-500">
                    {sm.scoringFn === 'higherIsBetter'
                      ? '越高越好'
                      : sm.scoringFn === 'lowerIsBetter'
                        ? '越低越好'
                        : sm.scoringFn === 'boolean'
                          ? '是/否'
                          : '区间内'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}

      {/* Veto items */}
      <Card title="一票否决项">
        <div className="space-y-2">
          {rubric.vetoItems.map((item) => (
            <div
              key={item.key}
              className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-md"
            >
              <span className="text-red-500 mt-0.5">⚠️</span>
              <div>
                <div className="text-sm font-semibold text-red-700">{item.label}</div>
                <div className="text-xs text-red-600">{item.description}</div>
                <div className="text-xs text-red-500 font-mono mt-1">阈值: {item.threshold}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Upload new rubric */}
      <Card title="上传新评分细则">
        <form onSubmit={handleRubricUpload} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">细则名称</label>
            <input
              name="name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="自定义评分细则"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              上传 Markdown 文件 (.md)
            </label>
            <input
              type="file"
              name="file"
              accept=".md"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? '上传中...' : '上传细则'}
          </button>
        </form>
      </Card>
    </div>
  );
}
