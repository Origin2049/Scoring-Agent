import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/': '仪表盘',
  '/agents': 'Agent 管理',
  '/scoring': '评分',
  '/reports': '报告',
  '/rubric': '评分细则',
  '/comparison': '对比分析',
};

export function Header() {
  const location = useLocation();

  const basePath = '/' + (location.pathname.split('/')[1] || '');
  const title = PAGE_TITLES[basePath] || 'Agent 评分平台';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <div className="text-sm text-gray-500">2026-06</div>
    </header>
  );
}
