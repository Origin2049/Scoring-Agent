import type { Grade } from '@asp/shared';

const COLORS: Record<Grade, string> = {
  S: 'bg-green-100 text-green-800 border-green-300',
  A: 'bg-blue-100 text-blue-800 border-blue-300',
  B: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  C: 'bg-orange-100 text-orange-800 border-orange-300',
  D: 'bg-red-100 text-red-800 border-red-300',
};

export function Badge({ grade }: { grade: Grade }) {
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${COLORS[grade]}`}
    >
      {grade} 级
    </span>
  );
}
