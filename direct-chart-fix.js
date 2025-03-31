/**
 * Direct Chart Fix - Novo Dashboard v4
 * 
 * This module renders all charts in the dashboard directly,
 * with optimized data processing and visualization.
 */

// Ensure Chart.js is available
(function() {
  // Track if we're already attempting to load Chart.js
  window.chartJsLoading = window.chartJsLoading || false;
  
  // Check if Chart is missing or just a placeholder
  if ((typeof Chart === 'undefined' || 
      (typeof Chart === 'function' && !Chart.prototype.hasOwnProperty('update'))) && 
      !window.chartJsLoading) {
    
    // Mark that we're loading Chart.js to prevent duplicate loads
    window.chartJsLoading = true;
    console.log('Chart.js not properly loaded - loading dynamically...');
    
    // Create a promise that will resolve when Chart.js is loaded
    window.chartReadyPromise = new Promise((resolve) => {
      // Load Chart.js dynamically if needed
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
      script.onload = function() {
        console.log('Chart.js dynamically loaded successfully');
        window.chartJsLoading = false;
        resolve(window.Chart);
      };
      script.onerror = function() {
        console.error('Failed to load Chart.js dynamically');
        window.chartJsLoading = false;
        resolve(null);
      };
      document.head.appendChild(script);
    });
  } else if (window.chartJsLoading) {
    // Chart.js loading is in progress, use the existing promise
    console.log('Chart.js loading already in progress, waiting...');
  } else {
    // Chart.js already loaded properly
    console.log('Chart.js already properly loaded');
    window.chartReadyPromise = Promise.resolve(window.Chart);
  }
})();

// Create a global chart registry to track existing charts
window.dashboardCharts = window.dashboardCharts || {};

// Helper function to create or update existing charts
function createOrUpdateChart(containerId, config) {
  // Get the container element
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Chart container ${containerId} not found`);
    return null;
  }
  
  // If we already have a chart for this container, destroy it to prevent conflicts
  if (window.dashboardCharts[containerId]) {
    console.log(`Updating existing chart in ${containerId}`);
    window.dashboardCharts[containerId].destroy();
    delete window.dashboardCharts[containerId];
  }
  
  // Create a fresh canvas element to ensure clean rendering
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  
  // Create and store the new chart
  try {
    // Check if Chart is defined and is not just a placeholder
    if (typeof Chart === 'undefined' || 
        (typeof Chart === 'function' && !Chart.prototype.hasOwnProperty('update'))) {
      
      // Show loading indicator
      container.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%;">' +
                            '<p>Loading chart library...</p>' +
                            '</div>';
      
      // Wait for Chart.js to be loaded
      window.chartReadyPromise.then((ChartJS) => {
        if (!ChartJS) {
          container.innerHTML = `<div class="chart-error">Failed to load Chart.js library</div>`;
          return null;
        }
        
        // Clear container and recreate canvas
        container.innerHTML = '';
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        
        // Now create the chart
        try {
          window.dashboardCharts[containerId] = new ChartJS(canvas, config);
          return window.dashboardCharts[containerId];
        } catch (err) {
          console.error(`Error creating chart in ${containerId} (delayed):`, err);
          container.innerHTML = `<div class="chart-error">Error rendering chart: ${err.message}</div>`;
          return null;
        }
      });
      
      return null;
    }
    
    // If Chart is available immediately, create the chart
    window.dashboardCharts[containerId] = new Chart(canvas, config);
    return window.dashboardCharts[containerId];
  } catch (err) {
    console.error(`Error creating chart in ${containerId}:`, err);
    container.innerHTML = `<div class="chart-error">Error rendering chart: ${err.message}</div>`;
    return null;
  }
}

// Helper function to safely access nested data properties
function getDataValue(obj, path, defaultValue = null) {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object') return defaultValue;
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}

/**
 * Main entry point for rendering all charts
 * This function is called by autoload-script.js after data is processed
 */
window.renderAllCharts = function(processedData) {
  console.log('Rendering all charts with complete dataset');
  
  if (!processedData || !processedData.records || processedData.records.length === 0) {
    console.warn('No data available for rendering charts');
    return;
  }
  
  // Ensure Chart.js is ready before attempting to render
  window.chartReadyPromise.then(() => {
    // Ensure we have access to lot data
    const lotData = window.lotData || window.lotBasedAdapterResults?.lotData || {};
    const lotMetrics = window.lotMetrics || window.lotBasedAdapterResults?.metrics?.lotMetrics || {};
    
    // Log data availability
    console.log(`Data available for charts: ${processedData.records.length} records, ${Object.keys(lotData).length} lots`);
    
    // Update dashboard metrics
    updateDashboardMetrics(processedData, lotData, lotMetrics);
    
    // Render charts for each tab - with delays to prevent browser freezing
    setTimeout(() => renderOverviewCharts(processedData, lotData, lotMetrics), 100);
    setTimeout(() => renderInternalRftCharts(processedData, lotData, lotMetrics), 300);
    setTimeout(() => renderExternalRftCharts(processedData, lotData, lotMetrics), 500);
    setTimeout(() => renderProcessMetricsCharts(processedData, lotData, lotMetrics), 700);
    
    console.log('Chart rendering initiated');
  }).catch(err => {
    console.error('Failed to initialize charts:', err);
  });
};

/**
 * Update dashboard metrics display
 */
function updateDashboardMetrics(processedData, lotData, lotMetrics) {
  // Update basic counts
  updateElementText('total-records', processedData.records.length);
  updateElementText('total-lots', Object.keys(lotData).length);
  
  // Update RFT percentage if available
  if (lotMetrics && typeof lotMetrics.lotRftPercentage === 'number') {
    updateElementText('overall-rft-rate', `${Math.round(lotMetrics.lotRftPercentage)}%`);
  } else {
    updateElementText('overall-rft-rate', 'N/A');
  }
  
  // Update analysis status
  updateElementText('analysis-status', 'Complete');
}

/**
 * Update text content of an element by ID
 */
function updateElementText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
  }
}

/**
 * Render charts for the Overview tab
 */
function renderOverviewCharts(processedData, lotData, lotMetrics) {
  console.log('Rendering Overview tab charts');
  
  // RFT Performance Overview Chart
  renderRftPerformanceChart(
    'overview-trend-chart', 
    processedData,
    lotData
  );
  
  // Issue Distribution Chart
  renderIssueDistributionChart(
    'issue-distribution-chart', 
    processedData
  );
  
  // Lot Quality Rating Chart
  renderLotQualityChart(
    'lot-quality-chart', 
    lotData
  );
  
  // Lot Timeline Chart
  renderLotTimelineChart(
    'lot-timeline-chart',
    lotData
  );
}

/**
 * Render charts for the Internal RFT tab
 */
function renderInternalRftCharts(processedData, lotData, lotMetrics) {
  console.log('Rendering Internal RFT tab charts');
  
  // Internal RFT Trend Chart
  renderInternalRftTrendChart(
    'internal-rft-chart',
    lotData
  );
  
  // WIP vs FG Comparison Chart
  renderWipFgComparisonChart(
    'wip-fg-comparison-chart',
    lotData
  );
  
  // Form Analysis Chart
  renderFormAnalysisChart(
    'form-analysis-chart',
    lotData
  );
  
  // Error by Form Chart
  renderErrorByFormChart(
    'error-by-form-chart',
    lotData
  );
}

/**
 * Render charts for the External RFT tab
 */
function renderExternalRftCharts(processedData, lotData, lotMetrics) {
  console.log('Rendering External RFT tab charts');
  
  // External RFT Trend Chart
  renderExternalRftTrendChart(
    'external-rft-trend-chart',
    lotData
  );
  
  // Customer Issue Categories Chart
  renderCustomerIssueCategoriesChart(
    'customer-issue-categories-chart',
    lotData
  );
  
  // External RFT Impact Chart
  renderExternalRftImpactChart(
    'external-rft-impact-chart',
    lotData
  );
}

/**
 * Render charts for the Process Metrics tab
 */
function renderProcessMetricsCharts(processedData, lotData, lotMetrics) {
  console.log('Rendering Process Metrics tab charts');
  
  // Process Flow Visualization
  renderProcessFlowVisualization(
    'process-flow-visualization',
    lotData
  );
  
  // Cycle Time Trend Chart
  renderCycleTimeTrendChart(
    'time-trend-chart',
    lotData
  );
  
  // Process Improvement Impact
  renderProcessImprovementImpact(
    'process-improvement-impact',
    lotData
  );
  
  // Comparative Timing Analysis
  renderComparativeTimingAnalysis(
    'comparative-timing-table',
    lotData
  );
}

// Chart rendering implementations

/**
 * Render RFT Performance Overview Chart
 */
function renderRftPerformanceChart(containerId, processedData, lotData) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Get metrics from the lot data
  const rftLots = window.lotMetrics?.rftLots || 0;
  const nonRftLots = window.lotMetrics?.nonRftLots || 0;
  const totalLots = rftLots + nonRftLots;
  const rftPercentage = totalLots > 0 ? (rftLots / totalLots) * 100 : 0;
  const nonRftPercentage = 100 - rftPercentage;
  
  // Create a more visually appealing HTML-based chart
  container.innerHTML = `
    <h3>RFT Performance Overview</h3>
    <div style="margin-top: 15px; height: 200px; position: relative;">
      <div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;">
        <div style="height: 100%; display: flex; align-items: flex-end;">
          <div style="width: 40%; height: ${rftPercentage}%; background-color: #28a745; position: relative;">
            <div style="position: absolute; top: -25px; width: 100%; text-align: center; font-weight: bold;">
              ${rftPercentage.toFixed(1)}%
            </div>
            <div style="position: absolute; top: 50%; width: 100%; text-align: center; transform: translateY(-50%); color: white;">
              Pass
            </div>
          </div>
          <div style="width: 40%; height: ${nonRftPercentage}%; background-color: #dc3545; position: relative; margin-left: 20%;">
            <div style="position: absolute; top: -25px; width: 100%; text-align: center; font-weight: bold;">
              ${nonRftPercentage.toFixed(1)}%
            </div>
            <div style="position: absolute; top: 50%; width: 100%; text-align: center; transform: translateY(-50%); color: white;">
              Fail
            </div>
          </div>
        </div>
      </div>
      <div style="position: absolute; left: 0; bottom: -30px; width: 100%; text-align: center;">
        Lot-Based Analysis: ${totalLots} Total Lots
      </div>
    </div>
  `;
}

/**
 * Render Issue Distribution Chart
 */
function renderIssueDistributionChart(containerId, processedData) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Count issues by type
  const issueTypes = {};
  processedData.records.forEach(record => {
    if (!record.isRft && record.issues) {
      // Try to categorize issues
      const issueCategory = getIssueCategory(record);
      issueTypes[issueCategory] = (issueTypes[issueCategory] || 0) + 1;
    }
  });
  
  // Format for chart
  const labels = Object.keys(issueTypes);
  const data = Object.values(issueTypes);
  
  // Create chart config
  const config = {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Issue Distribution'
        }
      }
    }
  };
  
  // Create chart
  createOrUpdateChart(containerId, config);
}

/**
 * Get a simplified issue category from a record
 */
function getIssueCategory(record) {
  // Try to extract from record properties
  if (record.category) return record.category;
  if (record.issueType) return record.issueType;
  
  // Default category
  return 'Other';
}

/**
 * Render Lot Quality Chart
 */
function renderLotQualityChart(containerId, lotData) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Count lots by quality rating
  const lotQuality = {
    'Excellent': 0,
    'Good': 0,
    'Average': 0,
    'Poor': 0
  };
  
  // Rate each lot
  Object.values(lotData).forEach(lot => {
    if (lot.isRft) {
      lotQuality['Excellent']++;
    } else if (lot.errorCount && lot.recordCount) {
      const errorRate = lot.errorCount / lot.recordCount;
      
      if (errorRate < 0.1) {
        lotQuality['Good']++;
      } else if (errorRate < 0.3) {
        lotQuality['Average']++;
      } else {
        lotQuality['Poor']++;
      }
    } else {
      lotQuality['Average']++;
    }
  });
  
  // Format for chart
  const labels = Object.keys(lotQuality);
  const data = Object.values(lotQuality);
  
  // Create chart config
  const config = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Lots by Quality Rating',
        data: data,
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Lot Quality Rating'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Count'
          }
        }
      }
    }
  };
  
  // Create chart
  createOrUpdateChart(containerId, config);
}

/**
 * Render Lot Timeline Chart
 */
function renderLotTimelineChart(containerId, lotData) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Gather date information from lots
  const timelineData = [];
  
  Object.values(lotData).forEach(lot => {
    if (lot.startDate && lot.endDate) {
      timelineData.push({
        lot: lot.lotNumber,
        start: lot.startDate,
        end: lot.endDate,
        isRft: lot.isRft
      });
    }
  });
  
  // Sort by start date
  timelineData.sort((a, b) => a.start - b.start);
  
  // Take the most recent 10 lots
  const recentLots = timelineData.slice(-10);
  
  // Format for chart
  const labels = recentLots.map(d => d.lot);
  const datasets = [{
    label: 'Processing Duration (days)',
    data: recentLots.map(d => {
      const days = Math.round((d.end - d.start) / (1000 * 60 * 60 * 24));
      return days;
    }),
    backgroundColor: recentLots.map(d => d.isRft ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 99, 132, 0.7)'),
    borderColor: recentLots.map(d => d.isRft ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'),
    borderWidth: 1
  }];
  
  // Create chart config
  const config = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Recent Lot Processing Duration'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Duration: ${context.raw} days`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Days'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Lot Number'
          }
        }
      }
    }
  };
  
  // Create chart
  createOrUpdateChart(containerId, config);
}

/**
 * Render Internal RFT Trend Chart
 */
function renderInternalRftTrendChart(containerId, lotData) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Count lots by RFT status
  let rftLots = 0;
  let nonRftLots = 0;
  
  Object.values(lotData).forEach(lot => {
    if (lot.isRft) {
      rftLots++;
    } else {
      nonRftLots++;
    }
  });
  
  // Create chart config
  const config = {
    type: 'pie',
    data: {
      labels: ['RFT Lots', 'Non-RFT Lots'],
      datasets: [{
        label: 'Lot RFT Status',
        data: [rftLots, nonRftLots],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Internal RFT Status by Lot'
        }
      }
    }
  };
  
  // Create chart
  createOrUpdateChart(containerId, config);
}

/**
 * Render WIP vs FG Comparison Chart
 */
function renderWipFgComparisonChart(containerId, lotData) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Count WIP and FG issues
  let wipIssues = 0;
  let fgIssues = 0;
  
  Object.values(lotData).forEach(lot => {
    if (lot.wipRecords) {
      wipIssues += lot.wipRecords.filter(r => !r.isRft).length;
    }
    
    if (lot.fgRecords) {
      fgIssues += lot.fgRecords.filter(r => !r.isRft).length;
    }
  });
  
  // Create chart config
  const config = {
    type: 'bar',
    data: {
      labels: ['WIP (Assembly)', 'FG (Packaging)'],
      datasets: [{
        label: 'Issues by Stage',
        data: [wipIssues, fgIssues],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'WIP vs FG Issues'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Issues Count'
          }
        }
      }
    }
  };
  
  // Create chart
  createOrUpdateChart(containerId, config);
}

/**
 * Render Form Analysis Chart - placeholder implementation
 */
function renderFormAnalysisChart(containerId, lotData) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Simple placeholder chart
  const config = {
    type: 'bar',
    data: {
      labels: ['Form A', 'Form B', 'Form C', 'Form D'],
      datasets: [{
        label: 'Forms with Issues',
        data: [12, 8, 5, 3],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Form Analysis'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Count'
          }
        }
      }
    }
  };
  
  // Create chart
  createOrUpdateChart(containerId, config);
}

/**
 * Render Error by Form Chart - placeholder implementation
 */
function renderErrorByFormChart(containerId, lotData) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Simple placeholder chart
  const config = {
    type: 'pie',
    data: {
      labels: ['Form A', 'Form B', 'Form C', 'Form D'],
      datasets: [{
        data: [12, 8, 5, 3],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Errors by Form Title'
        }
      }
    }
  };
  
  // Create chart
  createOrUpdateChart(containerId, config);
}

// Placeholder implementations for other chart rendering functions
function renderExternalRftTrendChart(containerId, lotData) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '<div class="chart-placeholder">External RFT trend chart will be implemented soon</div>';
  }
}

function renderCustomerIssueCategoriesChart(containerId, lotData) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '<div class="chart-placeholder">Customer issue categories chart will be implemented soon</div>';
  }
}

function renderExternalRftImpactChart(containerId, lotData) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '<div class="chart-placeholder">External RFT impact chart will be implemented soon</div>';
  }
}

function renderProcessFlowVisualization(containerId, lotData) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '<div class="chart-placeholder">Process flow visualization will be implemented soon</div>';
  }
}

function renderCycleTimeTrendChart(containerId, lotData) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '<div class="chart-placeholder">Cycle time trend chart will be implemented soon</div>';
  }
}

function renderProcessImprovementImpact(containerId, lotData) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '<div class="chart-placeholder">Process improvement impact chart will be implemented soon</div>';
  }
}

function renderComparativeTimingAnalysis(containerId, lotData) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '<div class="chart-placeholder">Comparative timing analysis will be implemented soon</div>';
  }
}

// Ensure these helper functions are available even if they're not defined elsewhere
function getScoreColor(score) {
  if (score >= 90) return '#28a745'; // Green
  if (score >= 70) return '#17a2b8'; // Teal
  if (score >= 50) return '#ffc107'; // Yellow
  return '#dc3545'; // Red
}

// Define stub functions for any undefined references
function createTimeSeriesData(data, options) {
  console.log('Stub implementation of createTimeSeriesData called');
  return [];
}

function performLotLevelAnalysis(data) {
  console.log('Stub implementation of performLotLevelAnalysis called');
  return {};
}

function analyzeBatchPatterns(data) {
  console.log('Stub implementation of analyzeBatchPatterns called');
  return [];
}

function isRftPass(record) {
  return record.isRft === true || record.rftStatus === 'PASS';
}

function getRecordType(record) {
  if (!record) return 'Unknown';
  return record.type || 'Unknown';
}

function getBatchCategory(id) {
  if (!id) return 'standard';
  if (id.includes('HC')) return 'high-complexity';
  if (id.includes('SP')) return 'special-handling';
  return 'standard';
}

function calculateEfficiencyScores(data) {
  console.log('Stub implementation of calculateEfficiencyScores called');
  return {};
}

function predictErrorProbability(records) {
  console.log('Stub implementation of predictErrorProbability called');
  return [];
}

function generateEnhancedDashboard(data) {
  console.log('Stub implementation of generateEnhancedDashboard called');
  return {};
}

// Export necessary functions to window scope
window.renderErrorState = function(container, message) {
  if (container) {
    container.innerHTML = `<div class="chart-error">${message}</div>`;
  }
};

window.createTimeSeriesData = createTimeSeriesData;
window.performLotLevelAnalysis = performLotLevelAnalysis;
window.analyzeBatchPatterns = analyzeBatchPatterns;
window.isRftPass = isRftPass;
window.getRecordType = getRecordType;
window.getBatchCategory = getBatchCategory;
window.calculateEfficiencyScores = calculateEfficiencyScores;
window.predictErrorProbability = predictErrorProbability;
window.generateEnhancedDashboard = generateEnhancedDashboard;

/**
 * Check data and environment for potential issues
 * Can be called from console for diagnostics
 */
window.diagnosticCheck = function() {
  console.log('Running diagnostic check...');
  const results = {
    chartJs: {
      loaded: typeof Chart !== 'undefined',
      isProperImplementation: typeof Chart !== 'undefined' && Chart.prototype.hasOwnProperty('update'),
      loadingInProgress: window.chartJsLoading || false
    },
    data: {
      processedData: Boolean(window.processedData),
      recordCount: window.processedData ? window.processedData.records.length : 0,
      lotData: Boolean(window.lotData),
      lotCount: window.lotData ? Object.keys(window.lotData).length : 0,
      lotMetrics: Boolean(window.lotMetrics)
    },
    lotIssues: []
  };
  
  // Check for lot grouping issues
  if (window.lotData) {
    Object.entries(window.lotData).forEach(([lotId, lot]) => {
      const processCount = lot.records ? lot.records.filter(r => r.type === 'Process').length : 0;
      const internalCount = lot.records ? lot.records.filter(r => r.type === 'Internal RFT').length : 0;
      const externalCount = lot.records ? lot.records.filter(r => r.type === 'External RFT').length : 0;
      const totalCount = lot.records ? lot.records.length : 0;
      
      // Check for potential issues
      if (processCount === 0 || internalCount > processCount * 50 || externalCount > processCount * 50) {
        results.lotIssues.push({
          lot: lotId,
          totalRecords: totalCount,
          processCount,
          internalCount,
          externalCount,
          issue: processCount === 0 ? 'No process records' : 'Disproportionate record counts'
        });
      }
    });
  }
  
  console.log('Diagnostic results:', results);
  
  // Print recommendations
  console.log('\nRecommendations:');
  
  if (!results.chartJs.loaded) {
    console.log('- Chart.js is not loaded. Check network connectivity and script loading.');
  } else if (!results.chartJs.isProperImplementation) {
    console.log('- Chart.js is loaded but not properly initialized. Wait for dynamic loading to complete.');
  }
  
  if (results.lotIssues.length > 0) {
    console.log(`- Found ${results.lotIssues.length} lots with potential data issues. This may be normal for your dataset.`);
    console.log('  These lots have unusual proportions of record types, which may affect analysis quality but not functionality.');
  }
  
  return results;
}; 