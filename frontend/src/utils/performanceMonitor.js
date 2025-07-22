// Performance monitoring utilities
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  // Measure page load time
  measurePageLoad() {
    if (!this.isEnabled || !window.performance) return;

    window.addEventListener('load', () => {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      
      this.recordMetric('page_load_time', loadTime);
      console.log(`Page load time: ${loadTime}ms`);
    });
  }

  // Measure component render time
  measureComponentRender(componentName, renderFn) {
    if (!this.isEnabled) return renderFn();

    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    
    this.recordMetric(`component_render_${componentName}`, endTime - startTime);
    
    return result;
  }

  // Measure API call duration
  measureAPICall(endpoint, apiFn) {
    if (!this.isEnabled) return apiFn();

    const startTime = performance.now();
    
    return apiFn().finally(() => {
      const endTime = performance.now();
      this.recordMetric(`api_call_${endpoint}`, endTime - startTime);
    });
  }

  // Record custom metric
  recordMetric(name, value, unit = 'ms') {
    if (!this.isEnabled) return;

    const metric = {
      name,
      value,
      unit,
      timestamp: Date.now()
    };

    this.metrics.set(name, metric);
    
    // Log slow operations
    if (value > 1000) {
      console.warn(`Slow operation detected: ${name} took ${value}${unit}`);
    }
  }

  // Get Core Web Vitals
  measureWebVitals() {
    if (!this.isEnabled) return;

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('lcp', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const firstInput = list.getEntries()[0];
        if (firstInput) {
          const fid = firstInput.processingStart - firstInput.startTime;
          this.recordMetric('fid', fid);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.recordMetric('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  // Memory usage monitoring
  measureMemoryUsage() {
    if (!this.isEnabled || !performance.memory) return;

    const memory = performance.memory;
    this.recordMetric('memory_used', memory.usedJSHeapSize, 'bytes');
    this.recordMetric('memory_total', memory.totalJSHeapSize, 'bytes');
    this.recordMetric('memory_limit', memory.jsHeapSizeLimit, 'bytes');
  }

  // Network monitoring
  measureNetworkRequests() {
    if (!this.isEnabled || !window.fetch) return;

    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const url = args[0];
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.recordMetric(`network_${url}`, endTime - startTime);
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        this.recordMetric(`network_error_${url}`, endTime - startTime);
        throw error;
      }
    };
  }

  // Get performance report
  getReport() {
    return {
      metrics: Array.from(this.metrics.values()),
      summary: this.getSummary()
    };
  }

  getSummary() {
    const metrics = Array.from(this.metrics.values());
    
    return {
      totalMetrics: metrics.length,
      slowOperations: metrics.filter(m => m.value > 1000).length,
      averageLoadTime: this.getAverageMetric('page_load_time'),
      memoryUsage: this.metrics.get('memory_used')?.value || 0
    };
  }

  getAverageMetric(metricName) {
    const matchingMetrics = Array.from(this.metrics.values())
      .filter(m => m.name.includes(metricName));
    
    if (matchingMetrics.length === 0) return 0;
    
    const sum = matchingMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / matchingMetrics.length;
  }

  // Send metrics to analytics service (placeholder)
  sendMetrics() {
    if (!this.isEnabled) return;

    const report = this.getReport();
    
    // In a real app, you would send this to your analytics service
    console.log('Performance Report:', report);
    
    // Example: Send to Google Analytics, Mixpanel, etc.
    // analytics.track('performance_metrics', report);
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// React Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const measureRender = (componentName, renderFn) => {
    return performanceMonitor.measureComponentRender(componentName, renderFn);
  };

  const measureAPI = (endpoint, apiFn) => {
    return performanceMonitor.measureAPICall(endpoint, apiFn);
  };

  const recordMetric = (name, value, unit) => {
    performanceMonitor.recordMetric(name, value, unit);
  };

  return {
    measureRender,
    measureAPI,
    recordMetric,
    getReport: () => performanceMonitor.getReport()
  };
};

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  performanceMonitor.measurePageLoad();
  performanceMonitor.measureWebVitals();
  performanceMonitor.measureNetworkRequests();
  
  // Set up periodic monitoring
  setInterval(() => {
    performanceMonitor.measureMemoryUsage();
  }, 30000); // Every 30 seconds
  
  // Send metrics every 5 minutes
  setInterval(() => {
    performanceMonitor.sendMetrics();
  }, 300000);
};

export default performanceMonitor;
