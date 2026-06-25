import { useAppStore } from '../../store/app.store';
import { useEffect } from 'react';

export function Toast() {
  const { toastMessage, toastType, clearToast } = useAppStore();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(clearToast, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, clearToast]);

  if (!toastMessage) return null;

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`${colors[toastType]} text-white px-4 py-3 rounded-lg shadow-lg text-sm max-w-sm`}>
        {toastMessage}
      </div>
    </div>
  );
}
