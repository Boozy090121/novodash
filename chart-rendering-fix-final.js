/**
 * Chart Rendering Fix - Final Solution
 * This script ensures charts are properly cleared before rendering
 * and prevents multiple scripts from rendering the same charts.
 */

(function() {
  console.log('Chart Rendering Fix loaded - Final Solution');
  
  // Flag to track which tabs have been rendered
  window.renderedTabs = {};
  
  // Override chart functions to prevent conflicts
  window.originalCreateOrUpdateChart = window.createOrUpdateChart;
  window.createOrUpdateChart = function(containerId, config) {
    console.log(`Safely creating chart in ${containerId}`);
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Chart container ${containerId} not found`);
      return null;
    }
    
    // Always clear container first
    container.innerHTML = '';
    
    // If we already have a chart for this container, destroy it
    if (window.dashboardCharts && window.dashboardCharts[containerId]) {
      try {
        window.dashboardCharts[containerId].destroy();
      } catch (err) {
        console.warn(`Error destroying chart in ${containerId}:`, err);
      }
      delete window.dashboardCharts[containerId];
    }
    
    // Create a fresh canvas
    const canvas = document.createElement('canvas');
    canvas.id = containerId + '-canvas';
    container.appendChild(canvas);
    
    // Create and store the new chart
    try {
      if (typeof Chart !== 'undefined') {
        window.dashboardCharts = window.dashboardCharts || {};
        window.dashboardCharts[containerId] = new Chart(canvas, config);
        return window.dashboardCharts[containerId];
      } else {
        console.error('Chart.js not loaded');
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #dc3545;">Chart.js library not loaded</div>';
        return null;
      }
    } catch (err) {
      console.error(`Error creating chart in ${containerId}:`, err);
      container.innerHTML = `<div style="padding: 20px; text-align: center; color: #dc3545;">Error: ${err.message}</div>`;
      return null;
    }
  };
  
  // Add an event listener for tab switching to clear charts in the target tab
  document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        console.log(`Tab clicked: ${tabId}`);
        
        // Clear charts in the tab content
        clearChartsInTab(tabId);
        
        // Mark tab as needing rendering
        window.renderedTabs[tabId] = false;
        
        // Render charts after a short delay
        setTimeout(() => {
          if (!window.renderedTabs[tabId]) {
            renderChartsForTab(tabId);
            window.renderedTabs[tabId] = true;
          }
        }, 200);
      });
    });
    
    // Also render the initial active tab
    const activeTab = document.querySelector('.tab-item.active');
    if (activeTab) {
      const tabId = activeTab.getAttribute('data-tab');
      console.log(`Initial active tab: ${tabId}`);
      
      clearChartsInTab(tabId);
      renderChartsForTab(tabId);
      window.renderedTabs[tabId] = true;
    }
  });
  
  // Clear charts in a specific tab
  function clearChartsInTab(tabId) {
    const tabContent = document.getElementById(tabId + '-content');
    if (!tabContent) return;
    
    const chartContainers = tabContent.querySelectorAll('.chart-container');
    console.log(`Clearing ${chartContainers.length} charts in tab ${tabId}`);
    
    chartContainers.forEach(container => {
      // Keep the heading
      const heading = container.querySelector('h3');
      const headingText = heading ? heading.textContent : '';
      
      // Clear the container
      container.innerHTML = '';
      
      // Restore the heading
      if (headingText) {
        const newHeading = document.createElement('h3');
        newHeading.textContent = headingText;
        container.appendChild(newHeading);
      }
      
      // Remove from chart registry
      if (window.dashboardCharts && window.dashboardCharts[container.id]) {
        try {
          window.dashboardCharts[container.id].destroy();
        } catch (err) {
          console.warn(`Error destroying chart in ${container.id}:`, err);
        }
        delete window.dashboardCharts[container.id];
      }
    });
  }
  
  // Render charts for a specific tab
  function renderChartsForTab(tabId) {
    console.log(`Rendering charts for tab: ${tabId}`);
    
    switch (tabId) {
      case 'overview':
        renderOverviewCharts();
        break;
      case 'internal-rft':
        renderInternalRftCharts();
        break;
      case 'external-rft':
        renderExternalRftCharts();
        break;
      case 'process-metrics':
        renderProcessMetricsCharts();
        break;
      case 'insights':
        renderInsightsCharts();
        break;
    }
  }
  
  // Render overview tab charts
  function renderOverviewCharts() {
    console.log('Rendering Overview tab charts');
    
    // Only proceed if we have data
    if (!window.lotMetrics) {
      console.warn('No lot metrics available for rendering overview charts');
      return;
    }
    
    // Call the appropriate chart rendering functions
    if (typeof window.renderRftPerformanceChart === 'function') {
      window.renderRftPerformanceChart('overview-trend-chart');
    }
    
    if (typeof window.renderIssueDistributionChart === 'function') {
      window.renderIssueDistributionChart('issue-distribution-chart');
    }
    
    if (typeof window.renderLotQualityChart === 'function') {
      window.renderLotQualityChart('lot-quality-chart');
    }
    
    if (typeof window.renderLotTimelineChart === 'function') {
      window.renderLotTimelineChart('lot-timeline-chart');
    }
  }
  
  // Render internal-rft tab charts
  function renderInternalRftCharts() {
    console.log('Rendering Internal RFT tab charts');
    
    // Only proceed if we have data
    if (!window.lotMetrics) {
      console.warn('No lot metrics available for rendering internal-rft charts');
      return;
    }
    
    // Call the appropriate chart rendering functions
    if (typeof window.renderInternalRftTrendChart === 'function') {
      window.renderInternalRftTrendChart('internal-rft-chart');
    }
    
    if (typeof window.renderWipFgComparisonChart === 'function') {
      window.renderWipFgComparisonChart('wip-fg-comparison-chart');
    }
    
    if (typeof window.renderFormAnalysisChart === 'function') {
      window.renderFormAnalysisChart('form-analysis-chart');
    }
    
    if (typeof window.renderErrorByFormChart === 'function') {
      window.renderErrorByFormChart('error-by-form-chart');
    }
  }
  
  // Render external-rft tab charts
  function renderExternalRftCharts() {
    console.log('Rendering External RFT tab charts');
    
    // Only proceed if we have data
    if (!window.lotMetrics) {
      console.warn('No lot metrics available for rendering external-rft charts');
      return;
    }
    
    // Call the appropriate chart rendering functions
    if (typeof window.renderExternalRftTrendChart === 'function') {
      window.renderExternalRftTrendChart('external-rft-trend-chart');
    }
    
    if (typeof window.renderCustomerIssueCategoriesChart === 'function') {
      window.renderCustomerIssueCategoriesChart('customer-issue-categories-chart');
    }
    
    if (typeof window.renderExternalRftImpactChart === 'function') {
      window.renderExternalRftImpactChart('external-rft-impact-chart');
    }
  }
  
  // Render process-metrics tab charts
  function renderProcessMetricsCharts() {
    console.log('Rendering Process Metrics tab charts');
    
    // Only proceed if we have data
    if (!window.lotMetrics) {
      console.warn('No lot metrics available for rendering process-metrics charts');
      return;
    }
    
    // Call the appropriate chart rendering functions
    if (typeof window.renderProcessFlowVisualization === 'function') {
      window.renderProcessFlowVisualization('process-flow-visualization');
    }
    
    if (typeof window.renderCycleTimeTrendChart === 'function') {
      window.renderCycleTimeTrendChart('time-trend-chart');
    }
    
    if (typeof window.renderProcessImprovementImpact === 'function') {
      window.renderProcessImprovementImpact('process-improvement-impact');
    }
    
    if (typeof window.renderComparativeTimingAnalysis === 'function') {
      window.renderComparativeTimingAnalysis('comparative-timing-table');
    }
  }
  
  // Render insights tab charts
  function renderInsightsCharts() {
    console.log('Rendering Insights tab charts');
    
    // Only proceed if we have data
    if (!window.lotMetrics) {
      console.warn('No lot metrics available for rendering insights charts');
      return;
    }
    
    // Call the appropriate chart rendering functions
    if (typeof window.renderLotBasedRftAnalysis === 'function') {
      window.renderLotBasedRftAnalysis('critical-factors-chart');
    }
    
    if (typeof window.renderDocumentationCorrelationChart === 'function') {
      window.renderDocumentationCorrelationChart('documentation-correlation-chart');
    }
    
    // Also update key insights
    updateKeyInsights();
  }
  
  // Update key insights container
  function updateKeyInsights() {
    const container = document.getElementById('key-insights-container');
    if (!container) return;
    
    const metrics = window.lotMetrics;
    if (!metrics) {
      console.warn('No lot metrics available for updating key insights');
      return;
    }
    
    // Generate insights HTML
    let html = '<div style="padding: 15px;">';
    
    // Add RFT insights
    html += `
      <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; border-left: 4px solid #0051BA;">
        <div style="font-weight: bold;">RFT Performance Analysis</div>
        <p style="margin: 5px 0 0 0;">
          Overall lot-based RFT rate: ${metrics.lotRftPercentage.toFixed(1)}% (${metrics.rftLots} of ${metrics.totalLots} lots passing).
          ${metrics.lotRftPercentage < 80 ? 'This is below the target of 85%.' : 'This meets the quality target.'}
        </p>
      </div>
    `;
    
    // Add cycle time insights
    html += `
      <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; border-left: 4px solid #28a745;">
        <div style="font-weight: bold;">Cycle Time Analysis</div>
        <p style="margin: 5px 0 0 0;">
          Average cycle time is ${metrics.avgCycleTimeDays.toFixed(1)} days.
          ${metrics.wipLots > metrics.fgLots ? 'WIP (Assembly) issues are predominant.' : 'FG (Packaging) issues are predominant.'}
        </p>
      </div>
    `;
    
    // Add recommendations
    html += `
      <div style="padding: 10px; background-color: #f8f9fa; border-radius: 4px; border-left: 4px solid #dc3545;">
        <div style="font-weight: bold;">Key Recommendations</div>
        <ul style="margin: 5px 0 0 0; padding-left: 20px;">
          <li>Focus on ${metrics.wipLots > metrics.fgLots ? 'Assembly' : 'Packaging'} process improvements for greatest impact.</li>
          <li>Implement documentation checks before process handoffs to reduce errors.</li>
          <li>Standardize correction procedures to minimize cycle time impact.</li>
        </ul>
      </div>
    `;
    
    html += '</div>';
    
    // Update container
    container.innerHTML = html;
  }
})(); 