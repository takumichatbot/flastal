'use client';
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === 'development') {
      if (metric.name === 'LCP' && metric.value > 4000) {
        console.warn(`[WebVitals] LCP が遅すぎます: ${metric.value.toFixed(0)}ms`);
      }
      if (metric.name === 'CLS' && metric.value > 0.25) {
        console.warn(`[WebVitals] CLS が高すぎます: ${metric.value.toFixed(3)}`);
      }
      if (metric.name === 'INP' && metric.value > 500) {
        console.warn(`[WebVitals] INP が遅すぎます: ${metric.value.toFixed(0)}ms`);
      }
    }
  });
  return null;
}
