import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: '仪表盘', icon: '📊' },
  { to: '/agents', label: 'Agent 管理', icon: '🤖' },
  { to: '/scoring', label: '评分', icon: '📝' },
  { to: '/reports', label: '报告', icon: '📋' },
  { to: '/comparison', label: '对比', icon: '📈' },
  { to: '/rubric', label: '评分细则', icon: '📐' },
];

export function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-800">Agent 评分平台</h1>
        <p className="text-xs text-gray-400 mt-0.5">CLASSic 五维模型</p>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100 text-xs text-gray-400">
        v1.0.0 — CLASSic 2026
      </div>
    </aside>
  );
}
