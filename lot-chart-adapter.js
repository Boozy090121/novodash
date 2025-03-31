/**
 * Lot-Based Chart Adapter
 * 
 * This script integrates the lot-based data analysis with the chart rendering
 * for the Novo Nordisk Analysis Dashboard.
 */

(function() {
  console.log('Lot-based chart adapter loaded');
  
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, installing lot chart adapter');
    
    // Initialize when data becomes available
    checkForLotDataAndRender();
    
    // Also check after a delay for async loading
    setTimeout(checkForLotDataAndRender, 1000);
    setTimeout(checkForLotDataAndRender, 2000);
  });
  
  // Function to check for data and render charts
  function checkForLotDataAndRender() {
    // Check if lot data is available
    if (window.lotData && window.lotMetrics) {
      console.log('Found lot data with', Object.keys(window.lotData).length, 'lots');
      renderLotBasedCharts();
    } else {
      console.log('No lot data found yet');
    }
  }
  
  // Main function to render lot-based charts
  function renderLotBasedCharts() {
    console.log('Rendering lot-based charts');
    
    // Render Overview tab charts
    renderOverviewCharts();
    
    // Render Internal RFT tab charts
    renderInternalRftCharts();
    
    // Render External RFT tab charts
    renderExternalRftCharts();
    
    // Render Process Metrics tab charts
    renderProcessMetricsCharts();
    
    // Render Insights tab charts
    renderInsightsCharts();
    
    // Update summary metrics
    updateSummaryMetrics();
    
    console.log('Lot-based charts rendering complete');
  }
  
  // Update dashboard summary metrics based on lot analysis
  function updateSummaryMetrics() {
    const metrics = window.lotMetrics;
    if (!metrics) return;
    
    // Update Overview tab metrics
    updateElementText('total-lots', metrics.totalLots || 0);
    updateElementText('total-records', window.processedData && window.processedData.records ? window.processedData.records.length : 0);
    updateElementText('overall-rft-rate', metrics.lotRftPercentage ? metrics.lotRftPercentage.toFixed(1) + '%' : 'N/A');
    updateElementText('analysis-status', 'Complete');
    
    // Update Internal RFT tab metrics
    const internalRftFailPercentage = metrics.internalRftFailLots && metrics.totalLots ? 
      (metrics.internalRftFailLots / metrics.totalLots * 100) : 0;
    updateElementText('internal-rft-rate', (100 - internalRftFailPercentage).toFixed(1) + '%');
    updateElementText('wip-issues-count', metrics.wipLots || 0);
    updateElementText('internal-affected-lots', metrics.internalRftFailLots || 0);
    
    // Update External RFT tab metrics
    const externalRftFailPercentage = metrics.externalRftFailLots && metrics.totalLots ? 
      (metrics.externalRftFailLots / metrics.totalLots * 100) : 0;
    updateElementText('external-rft-rate', (100 - externalRftFailPercentage).toFixed(1) + '%');
    updateElementText('customer-issues-count', metrics.fgLots || 0);
    updateElementText('external-affected-lots', metrics.externalRftFailLots || 0);
    
    // Update Process Metrics tab
    updateElementText('avg-cycle-time', metrics.avgCycleTimeDays ? metrics.avgCycleTimeDays.toFixed(1) + ' days' : 'N/A');
    updateElementText('reviewed-lots', metrics.totalLots || 0);
    
    // Update top issue fields if data is available
    updateTopIssueFields();
  }
  
  // Helper to update element text content
  function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
    }
  }
  
  // Update fields for top issues
  function updateTopIssueFields() {
    const metrics = window.lotMetrics;
    if (!metrics) return;
    
    // Get top internal issues
    if (metrics.topInternalIssues && metrics.topInternalIssues.length > 0) {
      updateElementText('top-internal-issue', metrics.topInternalIssues[0].category);
    }
    
    // Get top external issues
    if (metrics.topExternalIssues && metrics.topExternalIssues.length > 0) {
      updateElementText('top-external-issue', metrics.topExternalIssues[0].category);
    }
  }
  
  // Render charts for Overview tab
  function renderOverviewCharts() {
    renderOverviewTrendChart();
    renderLotQualityChart();
  }
  
  // Render charts for Internal RFT tab
  function renderInternalRftCharts() {
    renderInternalRftChart();
    renderWipFgComparisonChart();
  }
  
  // Render charts for External RFT tab
  function renderExternalRftCharts() {
    renderExternalRftTrendChart();
  }
  
  // Render charts for Process Metrics tab
  function renderProcessMetricsCharts() {
    renderTimeTrendChart();
  }
  
  // Render charts for Insights tab
  function renderInsightsCharts() {
    renderInsightRecommendations();
  }
  
  // Chart rendering functions for each specific chart
  
  function renderOverviewTrendChart() {
    const container = document.getElementById('overview-trend-chart');
    if (!container) return;
    
    const metrics = window.lotMetrics;
    if (!metrics) return;
    
    // Add null/undefined checks
    const lotRftPercentage = metrics.lotRftPercentage || 0;
    const totalLots = metrics.totalLots || 0;
    
    container.innerHTML = `
      <h3>RFT Performance Overview</h3>
      <div style="margin-top: 15px; height: 200px; position: relative;">
        <div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;">
          <div style="height: 100%; display: flex; align-items: flex-end;">
            <div style="width: 40%; height: ${lotRftPercentage}%; background-color: #28a745; position: relative;">
              <div style="position: absolute; top: -25px; width: 100%; text-align: center; font-weight: bold;">
                ${lotRftPercentage.toFixed(1)}%
              </div>
              <div style="position: absolute; top: 50%; width: 100%; text-align: center; transform: translateY(-50%); color: white;">
                Pass
              </div>
            </div>
            <div style="width: 40%; height: ${100 - lotRftPercentage}%; background-color: #dc3545; position: relative; margin-left: 20%;">
              <div style="position: absolute; top: -25px; width: 100%; text-align: center; font-weight: bold;">
                ${(100 - lotRftPercentage).toFixed(1)}%
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
  
  function renderLotQualityChart() {
    const container = document.getElementById('lot-quality-chart');
    if (!container) return;
    
    const metrics = window.lotMetrics;
    if (!metrics) return;
    
    // Add null/undefined checks
    const lotRftPercentage = metrics.lotRftPercentage || 0;
    const rftLots = metrics.rftLots || 0;
    const nonRftLots = metrics.nonRftLots || 0;
    
    container.innerHTML = `
      <h3>Lot Quality Rating</h3>
      <div style="margin-top: 15px; height: 200px; display: flex; justify-content: center; align-items: center;">
        <div style="width: 200px; height: 200px; border-radius: 50%; background: conic-gradient(
          #28a745 0% ${lotRftPercentage}%, 
          #dc3545 ${lotRftPercentage}% 100%
        ); position: relative;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: white; width: 150px; height: 150px; border-radius: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <div style="font-size: 24px; font-weight: bold;">${lotRftPercentage.toFixed(1)}%</div>
            <div>Lot Quality</div>
          </div>
        </div>
        <div style="margin-left: 20px;">
          <div style="margin-bottom: 10px;"><span style="display: inline-block; width: 12px; height: 12px; background-color: #28a745; margin-right: 5px;"></span> Pass: ${rftLots} lots</div>
          <div><span style="display: inline-block; width: 12px; height: 12px; background-color: #dc3545; margin-right: 5px;"></span> Fail: ${nonRftLots} lots</div>
        </div>
      </div>
    `;
  }
  
  function renderInternalRftChart() {
    const container = document.getElementById('internal-rft-chart');
    if (!container) return;
    
    const metrics = window.lotMetrics;
    if (!metrics) return;
    
    // Add null/undefined checks
    const totalLots = metrics.totalLots || 0;
    const internalRftFailLots = metrics.internalRftFailLots || 0;
    
    const internalRftRate = totalLots > 0 ? 100 - (internalRftFailLots / totalLots * 100) : 0;
    
    container.innerHTML = `
      <h3>Internal RFT Trend</h3>
      <div style="margin-top: 15px; height: 200px; position: relative;">
        <div style="display: flex; flex-direction: column; height: 100%;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 18px; font-weight: bold;">${internalRftRate.toFixed(1)}%</span> Internal RFT Rate
          </div>
          <div style="flex-grow: 1; background-color: #f5f5f5; border-radius: 4px; padding: 10px; display: flex; flex-direction: column; justify-content: space-around;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>Lots Passing Internal RFT:</div>
              <div style="font-weight: bold;">${totalLots - internalRftFailLots}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>Lots Failing Internal RFT:</div>
              <div style="font-weight: bold;">${internalRftFailLots}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>Total Lots Analyzed:</div>
              <div style="font-weight: bold;">${totalLots}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  function renderWipFgComparisonChart() {
    const container = document.getElementById('wip-fg-comparison-chart');
    if (!container) return;
    
    const metrics = window.lotMetrics;
    if (!metrics) return;
    
    // Add null/undefined checks
    const totalLots = metrics.totalLots || 0;
    const wipLots = metrics.wipLots || 0;
    const fgLots = metrics.fgLots || 0;
    
    const wipPercentage = totalLots > 0 ? wipLots / totalLots * 100 : 0;
    const fgPercentage = totalLots > 0 ? fgLots / totalLots * 100 : 0;
    
    container.innerHTML = `
      <h3>WIP vs FG Issues</h3>
      <div style="margin-top: 15px; height: 200px;">
        <div style="display: flex; height: 70%;">
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
            <div style="font-weight: bold; margin-bottom: 10px;">WIP Issues</div>
            <div style="width: 60%; height: 100%; background-color: #f8d7da; position: relative;">
              <div style="position: absolute; bottom: 0; width: 100%; background-color: #dc3545; height: ${wipPercentage}%;"></div>
              <div style="position: absolute; top: -25px; width: 100%; text-align: center;">${wipPercentage.toFixed(1)}%</div>
            </div>
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
            <div style="font-weight: bold; margin-bottom: 10px;">FG Issues</div>
            <div style="width: 60%; height: 100%; background-color: #d1ecf1; position: relative;">
              <div style="position: absolute; bottom: 0; width: 100%; background-color: #17a2b8; height: ${fgPercentage}%;"></div>
              <div style="position: absolute; top: -25px; width: 100%; text-align: center;">${fgPercentage.toFixed(1)}%</div>
            </div>
          </div>
        </div>
        <div style="margin-top: 15px; text-align: center;">
          <div>WIP: ${wipLots} lots | FG: ${fgLots} lots</div>
        </div>
      </div>
    `;
  }
  
  function renderExternalRftTrendChart() {
    const container = document.getElementById('external-rft-trend-chart');
    if (!container) return;
    
    const metrics = window.lotMetrics;
    if (!metrics) return;
    
    // Add null/undefined checks
    const totalLots = metrics.totalLots || 0;
    const externalRftFailLots = metrics.externalRftFailLots || 0;
    
    const externalRftRate = totalLots > 0 ? 100 - (externalRftFailLots / totalLots * 100) : 0;
    
    container.innerHTML = `
      <h3>External RFT Trend</h3>
      <div style="margin-top: 15px; height: 200px; position: relative;">
        <div style="display: flex; flex-direction: column; height: 100%;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 18px; font-weight: bold;">${externalRftRate.toFixed(1)}%</span> External RFT Rate
          </div>
          <div style="flex-grow: 1; background-color: #f5f5f5; border-radius: 4px; padding: 10px; display: flex; flex-direction: column; justify-content: space-around;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>Lots Passing External RFT:</div>
              <div style="font-weight: bold;">${totalLots - externalRftFailLots}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>Lots Failing External RFT:</div>
              <div style="font-weight: bold;">${externalRftFailLots}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>Total Lots Analyzed:</div>
              <div style="font-weight: bold;">${totalLots}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  function renderTimeTrendChart() {
    const container = document.getElementById('time-trend-chart');
    if (!container) return;
    
    const metrics = window.lotMetrics;
    if (!metrics) return;
    
    // Check if metrics.avgCycleTimeDays is defined
    const avgCycleTime = metrics.avgCycleTimeDays || 
                        (metrics.averageTimeMetrics && metrics.averageTimeMetrics.avgCycleTime) || 
                        0;
    
    // Check if totalLots and nonRftLots are defined
    const totalLots = metrics.totalLots || 0;
    const nonRftLots = metrics.nonRftLots || 0;
    
    // Calculate impact safely
    const qualityImpact = totalLots > 0 ? (nonRftLots / totalLots * 8) : 0;
    
    container.innerHTML = `
      <h3>Cycle Time Trend</h3>
      <div style="margin-top: 15px; height: 200px; position: relative;">
        <div style="display: flex; flex-direction: column; height: 100%;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 18px; font-weight: bold;">${avgCycleTime.toFixed(1)}</span> Days Average Cycle Time
          </div>
          <div style="flex-grow: 1; background-color: #f5f5f5; border-radius: 4px; padding: 10px; display: flex; flex-direction: column; justify-content: space-around;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>Lots with Cycle Time Data:</div>
              <div style="font-weight: bold;">${totalLots}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>Impact of Quality Issues:</div>
              <div style="font-weight: bold;">+${qualityImpact.toFixed(1)} days</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  function renderInsightRecommendations() {
    const container = document.getElementById('key-insights-container');
    if (!container) return;
    
    const metrics = window.lotMetrics;
    if (!metrics) return;
    
    // Generate insights based on metrics with null checks
    const insights = [];
    
    // Add RFT insights with null check
    const lotRftPercentage = metrics.lotRftPercentage || 0;
    if (lotRftPercentage < 70) {
      insights.push({
        category: 'Quality',
        message: `Low lot-based RFT rate (${lotRftPercentage.toFixed(1)}%) indicates systematic quality issues.`,
        priority: 'high'
      });
    }
    
    // Add internal vs external comparison with null checks
    const internalRftFailLots = metrics.internalRftFailLots || 0;
    const externalRftFailLots = metrics.externalRftFailLots || 0;
    if (internalRftFailLots > externalRftFailLots) {
      insights.push({
        category: 'Process',
        message: `Internal issues (${internalRftFailLots} lots) exceed external issues (${externalRftFailLots} lots), suggesting focus on internal workflows.`,
        priority: 'medium'
      });
    }
    
    // Add cycle time insight with null check
    const avgCycleTimeDays = metrics.avgCycleTimeDays || 0;
    if (avgCycleTimeDays > 20) {
      insights.push({
        category: 'Efficiency',
        message: `Average cycle time (${avgCycleTimeDays.toFixed(1)} days) exceeds target, indicating process bottlenecks.`,
        priority: 'medium'
      });
    }
    
    // Generate HTML
    let html = '';
    
    if (insights.length === 0) {
      html = '<p>No significant insights from current data.</p>';
    } else {
      html = '<ul class="insights-list">';
      
      insights.forEach(insight => {
        const priorityClass = `priority-${insight.priority}`;
        html += `
          <li class="${priorityClass}">
            <strong>${insight.category}:</strong> ${insight.message}
          </li>
        `;
      });
      
      html += '</ul>';
    }
    
    container.innerHTML = html;
  }
  
  // Utility function to analyze lot data quality
  function analyzeLotDataQuality() {
    if (!window.lotData) {
      console.error('No lot data available for analysis');
      return null;
    }
    
    const issues = [];
    const lotEntries = Object.entries(window.lotData);
    
    // Check for lots with potential issues
    lotEntries.forEach(([lotId, lot]) => {
      // Count record types
      const processCount = (lot.records || []).filter(r => r.type === 'Process').length;
      const internalCount = (lot.records || []).filter(r => r.type === 'Internal RFT').length;
      const externalCount = (lot.records || []).filter(r => r.type === 'External RFT').length;
      const totalCount = (lot.records || []).length;
      
      // Define potential issues
      let issueType = null;
      
      if (processCount === 0) {
        issueType = 'missing-process';
      } else if (internalCount > processCount * 30) {
        issueType = 'high-internal';
      } else if (externalCount > processCount * 30) {
        issueType = 'high-external';
      }
      
      if (issueType) {
        issues.push({
          lotId,
          issueType,
          totalCount,
          processCount,
          internalCount,
          externalCount
        });
      }
    });
    
    console.log(`Lot data quality analysis complete: ${issues.length} potential issues found`);
    issues.forEach(issue => {
      console.log(`Lot ${issue.lotId}: ${issue.issueType} (${issue.processCount} process, ${issue.internalCount} internal, ${issue.externalCount} external)`);
    });
    
    return issues;
  }
  
  // Function to optionally filter problematic lots
  function filterProblematicLots(options = {}) {
    const issues = analyzeLotDataQuality();
    if (!issues || issues.length === 0) {
      console.log('No problematic lots to filter');
      return null;
    }
    
    // Default options
    const settings = {
      filterMissingProcess: options.filterMissingProcess !== undefined ? options.filterMissingProcess : true,
      filterHighInternal: options.filterHighInternal !== undefined ? options.filterHighInternal : false,
      filterHighExternal: options.filterHighExternal !== undefined ? options.filterHighExternal : false
    };
    
    // Filter lots based on settings
    const lotsToFilter = issues.filter(issue => {
      if (issue.issueType === 'missing-process' && settings.filterMissingProcess) return true;
      if (issue.issueType === 'high-internal' && settings.filterHighInternal) return true;
      if (issue.issueType === 'high-external' && settings.filterHighExternal) return true;
      return false;
    }).map(issue => issue.lotId);
    
    if (lotsToFilter.length === 0) {
      console.log('No lots match the filter criteria');
      return null;
    }
    
    console.log(`Filtering ${lotsToFilter.length} problematic lots:`, lotsToFilter);
    
    // Create filtered copies of the data
    const filteredLotData = { ...window.lotData };
    lotsToFilter.forEach(lotId => {
      delete filteredLotData[lotId];
    });
    
    // Return filtered data without modifying original
    return {
      filteredLotData,
      filteredLotCount: Object.keys(filteredLotData).length,
      removedLots: lotsToFilter
    };
  }
  
  // Make chart rendering function available globally
  window.renderLotBasedCharts = renderLotBasedCharts;
  window.analyzeLotDataQuality = analyzeLotDataQuality;
  window.filterProblematicLots = filterProblematicLots;
})(); 