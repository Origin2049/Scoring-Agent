import type { Grade } from '../types/scoring';

export const GRADE_THRESHOLDS: Record<Grade, number> = {
  S: 90,
  A: 80,
  B: 70,
  C: 60,
  D: 0,
};

export const GRADE_LABELS: Record<Grade, string> = {
  S: '生产就绪，可直接上线',
  A: '基本可用，少量优化后上线',
  B: '核心能力达标，需专项优化',
  C: '存在明显短板，不建议上线',
  D: '未达标，需重新设计',
};

export const GRADE_COLORS: Record<Grade, string> = {
  S: '#22c55e', // green-500
  A: '#3b82f6', // blue-500
  B: '#eab308', // yellow-500
  C: '#f97316', // orange-500
  D: '#ef4444', // red-500
};

export function calculateGrade(score: number): Grade {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

export function getGradeInfo(grade: Grade) {
  return {
    grade,
    label: GRADE_LABELS[grade],
    color: GRADE_COLORS[grade],
  };
}
