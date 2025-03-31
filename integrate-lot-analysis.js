/**
 * Pharma Lot Analysis Integration Script
 * 
 * This script integrates the comprehensive lot analysis into the dashboard,
 * adding UI elements to display results and attaching event handlers.
 */

(function() {
  console.log('Initializing pharma lot analysis integration...');
  
  // Flag to track initialization
  let isInitialized = false;
  
  // Add lot analysis tab to the dashboard
  function addLotAnalysisTab() {
    console.log('Adding lot analysis tab to dashboard');
    const tabsContainer = document.querySelector('.dashboard-tabs');
    if (!tabsContainer) {
      console.warn('Dashboard tabs container not found');
      return false;
    }
    
    // Check if tab already exists
    if (document.getElementById('lot-analysis-tab')) {
      console.log('Lot analysis tab already exists');
      return true;
    }
    
    // Create new tab element
    const lotTab = document.createElement('div');
    lotTab.id = 'lot-analysis-tab';
    lotTab.className = 'tab-item';
    lotTab.setAttribute('data-tab', 'lot-analysis');
    lotTab.textContent = 'Lot Analysis';
    
    // Add tab to container
    tabsContainer.appendChild(lotTab);
    console.log('Added lot analysis tab to dashboard tabs');
    
    // Create tab content container
    const contentContainer = document.querySelector('.dashboard-content');
    if (!contentContainer) {
      console.warn('Dashboard content container not found');
      return false;
    }
    
    // Create content section for the tab
    const lotContent = document.createElement('div');
    lotContent.id = 'lot-analysis-content';
    lotContent.className = 'tab-content';
    
    // Add initial content structure
    lotContent.innerHTML = `
      <div class="section-header">
        <h2>Lot-Based Pharmaceutical Analysis</h2>
        <div class="controls">
          <button id="refresh-lot-analysis" class="action-button">Refresh Analysis</button>
        </div>
      </div>
      
      <div class="summary-metrics">
        <div class="metric-card">
          <div class="metric-value" id="lot-count">--</div>
          <div class="metric-label">Lots Analyzed</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" id="lot-rft-rate">--</div>
          <div class="metric-label">Lot RFT Rate</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" id="avg-cycle-time">--</div>
          <div class="metric-label">Avg Cycle Time</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" id="avg-error-count">--</div>
          <div class="metric-label">Avg Errors per Lot</div>
        </div>
      </div>
      
      <div class="analysis-container">
        <div class="analysis-section">
          <h3>Key Insights</h3>
          <div id="insights-container" class="insights-list">
            <div class="loading-placeholder">Analyzing data...</div>
          </div>
        </div>
        
        <div class="analysis-section">
          <h3>Recommendations</h3>
          <div id="recommendations-container" class="recommendations-list">
            <div class="loading-placeholder">Generating recommendations...</div>
          </div>
        </div>
      </div>
      
      <div class="lot-details-container">
        <h3>Lot Details</h3>
        <div class="lot-selector-container">
          <label for="lot-selector">Select Lot: </label>
          <select id="lot-selector">
            <option value="">-- Select a lot --</option>
          </select>
        </div>
        
        <div id="selected-lot-details" class="lot-details">
          <div class="loading-placeholder">Select a lot to view details</div>
        </div>
      </div>
    `;
    
    // Add content to container
    contentContainer.appendChild(lotContent);
    console.log('Added lot analysis content to dashboard content');
    
    // Add tab click event
    lotTab.addEventListener('click', function() {
      console.log('Lot analysis tab clicked');
      // Hide all tab contents and deactivate all tabs
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.querySelectorAll('.tab-item').forEach(tab => {
        tab.classList.remove('active');
      });
      
      // Show selected content and activate tab
      lotContent.classList.add('active');
      lotTab.classList.add('active');
    });
    
    // Add refresh button handler
    document.getElementById('refresh-lot-analysis').addEventListener('click', function() {
      console.log('Refresh analysis button clicked');
      if (window.initializeLotAnalysis) {
        window.initializeLotAnalysis();
      } else {
        console.warn('initializeLotAnalysis not found');
      }
    });
    
    return true;
  }
  
  // Update the UI with analysis results
  function updateAnalysisDisplay() {
    console.log('Updating analysis display with results');
    if (!window.lotAnalysisResults) {
      console.warn('Lot analysis results not available');
      return;
    }
    
    const { metrics, insights, recommendations, lots } = window.lotAnalysisResults;
    console.log(`Updating display with ${metrics.totalLots} lots, ${insights.length} insights, ${recommendations.length} recommendations`);
    
    // Update summary metrics
    document.getElementById('lot-count').textContent = metrics.totalLots || 0;
    document.getElementById('lot-rft-rate').textContent = metrics.rftRate ? `${metrics.rftRate.toFixed(1)}%` : '0%';
    document.getElementById('avg-cycle-time').textContent = metrics.avgCycleTime ? `${metrics.avgCycleTime.toFixed(1)} days` : 'N/A';
    document.getElementById('avg-error-count').textContent = metrics.avgErrorCount ? metrics.avgErrorCount.toFixed(1) : '0';
    
    // Update insights
    const insightsContainer = document.getElementById('insights-container');
    if (insightsContainer) {
      insightsContainer.innerHTML = '';
      
      if (insights.length > 0) {
        const insightsList = document.createElement('ul');
        
        insights.forEach(insight => {
          const insightItem = document.createElement('li');
          insightItem.className = `insight-item ${insight.severity}-severity`;
          
          insightItem.innerHTML = `
            <div class="insight-title">${insight.title}</div>
            <div class="insight-description">${insight.description}</div>
            <div class="insight-category">${insight.category}</div>
          `;
          
          insightsList.appendChild(insightItem);
        });
        
        insightsContainer.appendChild(insightsList);
      } else {
        insightsContainer.innerHTML = '<div class="no-data-message">No insights available</div>';
      }
    }
    
    // Update recommendations
    const recommendationsContainer = document.getElementById('recommendations-container');
    if (recommendationsContainer) {
      recommendationsContainer.innerHTML = '';
      
      if (recommendations.length > 0) {
        const recommendationsList = document.createElement('ul');
        
        recommendations.forEach(recommendation => {
          const recommendationItem = document.createElement('li');
          recommendationItem.className = `recommendation-item ${recommendation.priority}-priority`;
          
          let actionsHtml = '';
          if (recommendation.actions && recommendation.actions.length > 0) {
            actionsHtml = '<ul class="action-steps">';
            recommendation.actions.forEach(action => {
              actionsHtml += `<li>${action}</li>`;
            });
            actionsHtml += '</ul>';
          }
          
          recommendationItem.innerHTML = `
            <div class="recommendation-title">${recommendation.title}</div>
            <div class="recommendation-category">${recommendation.category}</div>
            ${actionsHtml}
          `;
          
          recommendationsList.appendChild(recommendationItem);
        });
        
        recommendationsContainer.appendChild(recommendationsList);
      } else {
        recommendationsContainer.innerHTML = '<div class="no-data-message">No recommendations available</div>';
      }
    }
    
    // Update lot selector
    const lotSelector = document.getElementById('lot-selector');
    if (lotSelector) {
      // Clear existing options except the default one
      while (lotSelector.options.length > 1) {
        lotSelector.remove(1);
      }
      
      // Add an option for each lot
      const lotIds = Object.keys(lots).sort();
      console.log(`Adding ${lotIds.length} lots to selector`);
      lotIds.forEach(lotId => {
        const option = document.createElement('option');
        option.value = lotId;
        option.textContent = lotId;
        lotSelector.appendChild(option);
      });
      
      // Add change event handler to display selected lot details
      if (!lotSelector.hasEventListener) {
        lotSelector.addEventListener('change', function() {
          displayLotDetails(this.value);
        });
        lotSelector.hasEventListener = true;
      }
    }
  }
  
  // Display details for the selected lot
  function displayLotDetails(lotId) {
    console.log(`Displaying details for lot ${lotId}`);
    const container = document.getElementById('selected-lot-details');
    if (!container) {
      console.error('Lot details container not found');
      return;
    }
    
    if (!lotId || !window.lotAnalysisResults || !window.lotAnalysisResults.lots) {
      container.innerHTML = '<div class="no-data-message">No lot selected or lot data unavailable</div>';
      return;
    }
    
    const lotAnalysis = window.lotAnalysisResults.lots[lotId];
    if (!lotAnalysis) {
      container.innerHTML = `<div class="error-message">Analysis for lot ${lotId} not found</div>`;
      return;
    }
    
    console.log(`Building UI for lot ${lotId} analysis`, lotAnalysis);
    
    // Start building the HTML content for the lot details
    let content = `
      <div class="lot-header">
        <h4>Lot ${lotId}</h4>
        <div class="lot-status ${lotAnalysis.overallRftStatus.overall ? 'status-pass' : 'status-fail'}">
          ${lotAnalysis.overallRftStatus.overall ? 'RFT PASS' : 'RFT FAIL'}
        </div>
      </div>
      
      <div class="lot-stats">
        <div class="stat-item">
          <span class="stat-label">Total Records:</span>
          <span class="stat-value">${lotAnalysis.recordCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Process Records:</span>
          <span class="stat-value">${lotAnalysis.processMetrics.available ? '1' : '0'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Internal RFT Records:</span>
          <span class="stat-value">${lotAnalysis.internalRftAnalysis.recordCount || '0'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">External RFT Records:</span>
          <span class="stat-value">${lotAnalysis.externalRftAnalysis.recordCount || '0'}</span>
        </div>
      </div>
    `;
    
    // Add process metrics if available
    if (lotAnalysis.processMetrics.available) {
      content += `
        <div class="lot-section">
          <h5>Process Metrics</h5>
          <div class="process-metrics">
            <div class="metric-item">
              <span class="metric-label">Cycle Time:</span>
              <span class="metric-value">${lotAnalysis.processMetrics.cycleTimes.totalCycleTime.toFixed(1)} days</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Assembly Work Order:</span>
              <span class="metric-value">${lotAnalysis.processMetrics.metadata.assemblyWo || 'N/A'}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Cartoning Work Order:</span>
              <span class="metric-value">${lotAnalysis.processMetrics.metadata.cartoningWo || 'N/A'}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Strength:</span>
              <span class="metric-value">${lotAnalysis.processMetrics.metadata.strength || 'N/A'}</span>
            </div>
          </div>
          
          <h6>Timeline</h6>
          <div class="timeline">
            ${buildTimelineHTML(lotAnalysis.processMetrics.timeline)}
          </div>
        </div>
      `;
    }
    
    // Add internal RFT analysis if available
    if (lotAnalysis.internalRftAnalysis.available) {
      content += `
        <div class="lot-section">
          <h5>Internal RFT Analysis</h5>
          <div class="rft-status ${lotAnalysis.overallRftStatus.internalRft ? 'status-pass' : 'status-fail'}">
            ${lotAnalysis.overallRftStatus.internalRft ? 'PASS' : 'FAIL'}
          </div>
          
          <div class="metric-item">
            <span class="metric-label">Total Errors:</span>
            <span class="metric-value">${lotAnalysis.internalRftAnalysis.errorCount}</span>
          </div>
          
          ${buildErrorTypesHTML(lotAnalysis.internalRftAnalysis.errorTypes, lotAnalysis.internalRftAnalysis.formTitles)}
          
          <div class="metric-item">
            <span class="metric-label">Work Order:</span>
            <span class="metric-value">${lotAnalysis.internalRftAnalysis.workOrder || 'N/A'}</span>
          </div>
        </div>
      `;
    }
    
    // Add external RFT analysis if available
    if (lotAnalysis.externalRftAnalysis.available) {
      content += `
        <div class="lot-section">
          <h5>External RFT Analysis</h5>
          <div class="rft-status ${lotAnalysis.overallRftStatus.externalRft ? 'status-pass' : 'status-fail'}">
            ${lotAnalysis.overallRftStatus.externalRft ? 'PASS' : 'FAIL'}
          </div>
          
          <div class="metric-item">
            <span class="metric-label">Total Issues:</span>
            <span class="metric-value">${lotAnalysis.externalRftAnalysis.issueCount}</span>
          </div>
          
          ${buildCategoriesHTML(lotAnalysis.externalRftAnalysis.categories, lotAnalysis.externalRftAnalysis.stages)}
        </div>
      `;
    }
    
    // Add evaluation section
    if (lotAnalysis.evaluation) {
      content += `
        <div class="lot-section">
          <h5>Evaluation</h5>
          <div class="metric-item">
            <span class="metric-label">Risk Score:</span>
            <span class="metric-value risk-${getRiskLevelClass(lotAnalysis.evaluation.riskScore)}">
              ${lotAnalysis.evaluation.riskScore.toFixed(1)}
            </span>
          </div>
          
          ${buildEvaluationHTML(lotAnalysis.evaluation)}
        </div>
      `;
    }
    
    container.innerHTML = content;
  }
  
  // Add styles for the lot analysis section
  function addAnalysisStyles() {
    console.log('Adding lot analysis styles');
    
    // Check if styles already exist
    if (document.getElementById('lot-analysis-styles')) {
      console.log('Lot analysis styles already exist');
      return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'lot-analysis-styles';
    styleElement.textContent = `
      .summary-metrics {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      
      .metric-card {
        flex: 1;
        background: #f5f7fa;
        border-radius: 8px;
        padding: 15px;
        margin: 0 10px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .metric-card:first-child {
        margin-left: 0;
      }
      
      .metric-card:last-child {
        margin-right: 0;
      }
      
      .metric-value {
        font-size: 24px;
        font-weight: bold;
        color: #2c3e50;
      }
      
      .metric-label {
        font-size: 14px;
        color: #7f8c8d;
        margin-top: 5px;
      }
      
      .analysis-container {
        display: flex;
        margin-bottom: 30px;
      }
      
      .analysis-section {
        flex: 1;
        margin: 0 10px;
      }
      
      .analysis-section:first-child {
        margin-left: 0;
      }
      
      .analysis-section:last-child {
        margin-right: 0;
      }
      
      .insights-list ul, .recommendations-list ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .insight-item, .recommendation-item {
        background: #fff;
        border-left: 4px solid #3498db;
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 0 4px 4px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .insight-title, .recommendation-title {
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .insight-description {
        font-size: 14px;
        color: #555;
        margin-bottom: 8px;
      }
      
      .insight-category, .recommendation-category {
        font-size: 12px;
        color: #7f8c8d;
        text-transform: uppercase;
      }
      
      .high-severity {
        border-left-color: #e74c3c;
      }
      
      .medium-severity {
        border-left-color: #f39c12;
      }
      
      .low-severity {
        border-left-color: #2ecc71;
      }
      
      .high-priority {
        border-left-color: #e74c3c;
      }
      
      .medium-priority {
        border-left-color: #f39c12;
      }
      
      .low-priority {
        border-left-color: #3498db;
      }
      
      .action-steps {
        margin: 10px 0 0 0;
        padding-left: 20px;
        font-size: 14px;
      }
      
      .action-steps li {
        margin-bottom: 5px;
      }
      
      .lot-selector-container {
        margin-bottom: 15px;
      }
      
      #lot-selector {
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #ddd;
        min-width: 200px;
      }
      
      .lot-details {
        background: #f9f9f9;
        border-radius: 8px;
        padding: 20px;
      }
      
      .lot-header {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
      }
      
      .lot-header h4 {
        margin: 0;
        flex: 1;
      }
      
      .lot-status {
        padding: 5px 10px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 14px;
        margin-right: 10px;
      }
      
      .rft-pass {
        background: #2ecc71;
        color: white;
      }
      
      .rft-fail {
        background: #e74c3c;
        color: white;
      }
      
      .risk-score {
        font-size: 14px;
        color: #555;
      }
      
      .detail-section {
        margin-bottom: 20px;
        border-top: 1px solid #eee;
        padding-top: 15px;
      }
      
      .detail-grid {
        display: flex;
        flex-wrap: wrap;
        margin: 0 -10px;
      }
      
      .detail-item {
        flex: 0 0 calc(50% - 20px);
        margin: 0 10px 10px;
      }
      
      .detail-label {
        font-size: 13px;
        color: #7f8c8d;
      }
      
      .detail-value {
        font-size: 16px;
        font-weight: bold;
      }
      
      .critical-path-list, .error-types-list, .form-errors-list, .category-list {
        margin-top: 10px;
      }
      
      .critical-path-item, .error-type-item, .form-error-item, .category-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }
      
      .comments-list {
        margin-top: 10px;
      }
      
      .comment-item {
        background: #fff;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 8px;
      }
      
      .comment-category {
        font-size: 12px;
        color: #7f8c8d;
        margin-bottom: 5px;
      }
      
      .comment-text {
        font-size: 14px;
      }
      
      .loading-placeholder, .no-data-message, .error-message {
        padding: 20px;
        text-align: center;
        color: #7f8c8d;
      }
      
      .error-message {
        color: #e74c3c;
      }
    `;
    
    document.head.appendChild(styleElement);
    console.log('Added lot analysis styles to head');
  }
  
  // Force the analysis to run
  function forceAnalysisRun() {
    console.log('Attempting to force analysis run');
    
    // If our own analysis initializer is available, use it
    if (window.initializeLotAnalysis) {
      console.log('Using window.initializeLotAnalysis()');
      window.initializeLotAnalysis();
      return true;
    }
    
    // Otherwise, try to access the data directly and run analysis
    if (window.processedData && window.processedData.records) {
      console.log(`Data found with ${window.processedData.records.length} records, attempting to analyze`);
      
      // Check if we have the performAnalysis function available
      if (typeof performAnalysis === 'function') {
        console.log('Using performAnalysis()');
        performAnalysis(window.processedData.records);
        return true;
      }
    }
    
    console.warn('Unable to force analysis run - no suitable method found');
    return false;
  }
  
  // Initialize the integration
  function initialize() {
    console.log('Setting up lot analysis integration...');
    
    if (isInitialized) {
      console.log('Already initialized, skipping');
      return;
    }
    
    // Add the styles
    addAnalysisStyles();
    
    // Add the tab and UI elements
    if (!addLotAnalysisTab()) {
      console.warn('Failed to add lot analysis tab');
      return;
    }
    
    // Listen for analysis completion
    document.addEventListener('lotAnalysisComplete', function(e) {
      console.log('Lot analysis complete event received, updating display');
      updateAnalysisDisplay();
    });
    
    // Attempt to run the analysis immediately if data is available
    setTimeout(forceAnalysisRun, 1000);
    
    // Attach to the 'Load Data' button if it exists
    const loadButton = document.getElementById('loadDataButton');
    if (loadButton) {
      console.log('Adding event listener to Load Data button');
      loadButton.addEventListener('click', function() {
        console.log('Load Data button clicked');
        // Wait for data to be loaded before initializing analysis
        setTimeout(forceAnalysisRun, 2000);
      });
    } else {
      console.warn('Load Data button not found');
    }
    
    // Set up a MutationObserver to watch for data changes
    setupDataWatcher();
    
    isInitialized = true;
    console.log('Lot analysis integration setup complete');
  }
  
  // Watch for data changes that might indicate data was loaded
  function setupDataWatcher() {
    console.log('Setting up data watcher');
    
    // Check periodically for data availability
    const dataCheckInterval = setInterval(() => {
      if (window.processedData && window.processedData.records) {
        console.log('Data detected by interval checker, running analysis');
        forceAnalysisRun();
        clearInterval(dataCheckInterval);
      }
    }, 2000);
    
    // Stop checking after 30 seconds
    setTimeout(() => {
      clearInterval(dataCheckInterval);
    }, 30000);
  }
  
  // Execute initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // Add this function after existing functions
  
  // Integrate lot-based data into all dashboard tabs
  function integrateLotDataIntoAllTabs() {
    console.log('Integrating lot-based data into all dashboard tabs');
    
    // Initialize data adapter
    const adapter = new LotBasedDataAdapter();
    
    // Process the data if available
    if (!window.processedData || !window.processedData.records) {
      console.warn('No data available to process for integration');
      return;
    }
    
    // Process data with lot-based adapter
    const lotBasedData = adapter.processRecords(window.processedData.records);
    
    // Store adapter results for debugging
    window.lotBasedAdapterResults = lotBasedData;
    
    // Get lot debug data
    const lotDebugData = adapter.debugLotData();
    console.log('Lot analysis results:', lotDebugData.summary);
    
    // Update dashboard displays with lot-based data
    updateDashboardWithLotData(lotBasedData, lotDebugData);
  }
  
  /**
   * Update the dashboard with lot-based data
   * @param {Object} lotBasedData - Data from lot-based data adapter
   * @param {Object} lotDebugData - Debug information about lot grouping
   */
  function updateDashboardWithLotData(lotBasedData, lotDebugData) {
    console.log('Updating dashboard with lot-based data', lotBasedData);
    
    if (!lotBasedData || !lotBasedData.lotMetrics) {
      console.warn('No lot metrics available to update dashboard');
      return;
    }
    
    // Store the lot metrics for other components
    window.lotMetrics = lotBasedData.lotMetrics;
    
    // Store the lot data for drill-down
    window.lotData = lotBasedData.lotData || {};
    
    // Update each tab with lot-specific metrics
    updateOverviewTabMetrics(lotBasedData);
    updateInternalRftTabMetrics(lotBasedData);
    updateExternalRftTabMetrics(lotBasedData);
    updateProcessMetricsTabMetrics(lotBasedData);
    
    // Add data quality report if available
    if (lotDebugData) {
      addLotDataQualityReport(lotBasedData, lotDebugData);
    }
    
    console.log('Dashboard updated with lot-based metrics');
  }
  
  /**
   * Update the overview tab with lot-based metrics
   * @param {Object} lotBasedData - Lot-based data
   */
  function updateOverviewTabMetrics(lotBasedData) {
    console.log('Updating overview tab with lot metrics');
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics) return;
    
    // Find overview metric elements
    const rftElement = document.getElementById('overview-rft-percentage');
    const cycleTimeElement = document.getElementById('overview-avg-cycle-time');
    const totalLotsElement = document.getElementById('overview-total-lots');
    const rftLotsElement = document.getElementById('overview-rft-lots');
    const wipLotsElement = document.getElementById('overview-wip-lots');
    const fgLotsElement = document.getElementById('overview-fg-lots');
    
    // Update metrics if elements exist
    if (rftElement) {
      rftElement.textContent = `${metrics.lotRftPercentage.toFixed(1)}%`;
    }
    
    if (cycleTimeElement) {
      cycleTimeElement.textContent = `${metrics.averageTimeMetrics?.avgCycleTime?.toFixed(1) || '0.0'} days`;
    }
    
    if (totalLotsElement) {
      totalLotsElement.textContent = metrics.totalLots;
    }
    
    if (rftLotsElement) {
      rftLotsElement.textContent = metrics.rftLots;
    }
    
    if (wipLotsElement) {
      wipLotsElement.textContent = metrics.wipLots;
    }
    
    if (fgLotsElement) {
      fgLotsElement.textContent = metrics.fgLots;
    }
    
    // Update all overview charts and tables
    updateOverviewCharts(lotBasedData);
  }
  
  /**
   * Update the internal RFT tab with lot-based metrics
   * @param {Object} lotBasedData - Lot-based data
   */
  function updateInternalRftTabMetrics(lotBasedData) {
    console.log('Updating internal RFT tab with lot metrics');
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics) return;
    
    // Find internal RFT metric elements
    const rftRateElement = document.getElementById('internal-rft-percentage');
    const totalErrorsElement = document.getElementById('internal-total-errors');
    const lotsWithErrorsElement = document.getElementById('internal-lots-with-errors');
    const avgErrorsPerLotElement = document.getElementById('internal-avg-errors-per-lot');
    
    // Update metrics if elements exist
    if (rftRateElement && metrics.internalRftFailLots !== undefined) {
      const totalInternal = metrics.internalRftFailLots + metrics.rftLots;
      const percentage = totalInternal > 0 ? 
        ((metrics.rftLots / totalInternal) * 100).toFixed(1) : '0.0';
      rftRateElement.textContent = `${percentage}%`;
    }
    
    if (lotsWithErrorsElement) {
      lotsWithErrorsElement.textContent = metrics.internalRftFailLots || 0;
    }
    
    // Calculate total errors if we have the data
    if (totalErrorsElement && metrics.topInternalIssues) {
      const totalErrors = metrics.topInternalIssues.reduce((sum, issue) => sum + issue.count, 0);
      totalErrorsElement.textContent = totalErrors;
    }
    
    // Calculate average errors per lot
    if (avgErrorsPerLotElement && metrics.internalRftFailLots) {
      const avgErrors = metrics.internalRftFailLots > 0 && metrics.topInternalIssues ? 
        (metrics.topInternalIssues.reduce((sum, issue) => sum + issue.count, 0) / metrics.internalRftFailLots).toFixed(1) : '0.0';
      avgErrorsPerLotElement.textContent = avgErrors;
    }
    
    // Update all charts and tables with our new implementations
    updateInternalRftCharts(lotBasedData);
  }
  
  /**
   * Update the external RFT tab with lot-based metrics
   * @param {Object} lotBasedData - Lot-based data
   */
  function updateExternalRftTabMetrics(lotBasedData) {
    console.log('Updating external RFT tab with lot metrics');
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics) return;
    
    // Find external RFT metric elements
    const rftRateElement = document.getElementById('external-rft-percentage');
    const totalIssuesElement = document.getElementById('external-total-issues');
    const lotsWithIssuesElement = document.getElementById('external-lots-with-issues');
    const avgIssuesPerLotElement = document.getElementById('external-avg-issues-per-lot');
    
    // Update metrics if elements exist
    if (rftRateElement && metrics.externalRftFailLots !== undefined) {
      const totalExternal = metrics.externalRftFailLots + metrics.rftLots;
      const percentage = totalExternal > 0 ? 
        ((metrics.rftLots / totalExternal) * 100).toFixed(1) : '0.0';
      rftRateElement.textContent = `${percentage}%`;
    }
    
    if (lotsWithIssuesElement) {
      lotsWithIssuesElement.textContent = metrics.externalRftFailLots || 0;
    }
    
    // Calculate total issues if we have the data
    if (totalIssuesElement && metrics.topExternalIssues) {
      const totalIssues = metrics.topExternalIssues.reduce((sum, issue) => sum + issue.count, 0);
      totalIssuesElement.textContent = totalIssues;
    }
    
    // Calculate average issues per lot
    if (avgIssuesPerLotElement && metrics.externalRftFailLots) {
      const avgIssues = metrics.externalRftFailLots > 0 && metrics.topExternalIssues ? 
        (metrics.topExternalIssues.reduce((sum, issue) => sum + issue.count, 0) / metrics.externalRftFailLots).toFixed(1) : '0.0';
      avgIssuesPerLotElement.textContent = avgIssues;
    }
    
    // Update all charts and tables with our new implementations
    updateExternalRftCharts(lotBasedData);
  }
  
  /**
   * Update process metrics tab with lot-based data and charts
   * @param {Object} lotBasedData - Lot-based data from adapter
   */
  function updateProcessMetricsTabMetrics(lotBasedData) {
    console.log('Updating process metrics tab with lot data');
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics) return;
    
    // 1. Update main metrics
    const avgCycleTimeElement = document.getElementById('process-avg-cycle-time');
    const totalProcessLotsElement = document.getElementById('process-total-lots');
    const avgWipTimeElement = document.getElementById('process-avg-wip-time');
    const avgFgTimeElement = document.getElementById('process-avg-fg-time');
    
    // Update metrics if elements exist
    if (avgCycleTimeElement) {
      avgCycleTimeElement.textContent = `${metrics.averageTimeMetrics?.avgCycleTime?.toFixed(1) || '0.0'} days`;
    }
    
    if (totalProcessLotsElement) {
      totalProcessLotsElement.textContent = metrics.totalLots || 0;
    }
    
    if (avgWipTimeElement && metrics.averageTimeMetrics) {
      avgWipTimeElement.textContent = `${metrics.averageTimeMetrics.avgWipReviewTime?.toFixed(1) || '0.0'} days`;
    }
    
    if (avgFgTimeElement && metrics.averageTimeMetrics) {
      avgFgTimeElement.textContent = `${metrics.averageTimeMetrics.avgFgReviewTime?.toFixed(1) || '0.0'} days`;
    }
    
    // 2. Update timeline phase breakdown - use our lot data for accurate calculations
    updateProcessTimelineChart(lotBasedData);
    
    // 3. Update bottleneck analysis
    updateBottleneckAnalysisTable(lotBasedData);
    
    // 4. Update WIP vs FG comparison chart
    updateWipFgComparisonChart(lotBasedData);
    
    // 5. Update process metrics trend chart
    updateProcessTrendChart(lotBasedData);
  }
  
  /**
   * Update the process timeline chart using lot data
   * @param {Object} lotBasedData - Lot data from adapter
   */
  function updateProcessTimelineChart(lotBasedData) {
    const chartContainer = document.getElementById('process-timeline-chart');
    if (!chartContainer) return;
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics || !metrics.timelinePhases) return;
    
    // Extract timeline phases
    const phaseData = metrics.timelinePhases || {};
    
    // Create labels and data arrays
    const labels = Object.keys(phaseData);
    const data = labels.map(phase => phaseData[phase]?.avgDuration || 0);
    
    // Find or create chart canvas
    let chartCanvas = chartContainer.querySelector('canvas');
    if (!chartCanvas) {
      chartCanvas = document.createElement('canvas');
      chartContainer.appendChild(chartCanvas);
    }
    
    // Clear any existing chart
    if (chartCanvas.chartInstance) {
      chartCanvas.chartInstance.destroy();
    }
    
    // Create chart using our wrapper (which handles Chart.js conflicts)
    window.chartJsReadyPromise.then(Chart => {
      chartCanvas.chartInstance = new Chart(chartCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Average Duration (Days)',
            data: data,
            backgroundColor: 'rgba(54, 162, 235, 0.7)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Days'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Average Process Phase Duration'
            }
          }
        }
      });
    });
  }
  
  /**
   * Update the bottleneck analysis table with our lot data
   * @param {Object} lotBasedData - Lot data from adapter
   */
  function updateBottleneckAnalysisTable(lotBasedData) {
    const tableContainer = document.getElementById('bottleneck-table');
    if (!tableContainer) return;
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics || !metrics.bottlenecks) return;
    
    // Get the bottlenecks
    const bottlenecks = metrics.bottlenecks || [];
    
    // Build table HTML
    let tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Process Phase</th>
            <th>Average Duration (Days)</th>
            <th>Impact</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // Add rows for each bottleneck
    bottlenecks.forEach(bottleneck => {
      const impact = bottleneck.avgDuration > 14 ? 'High' : 
                    bottleneck.avgDuration > 7 ? 'Medium' : 'Low';
      
      const impactClass = impact === 'High' ? 'impact-high' :
                         impact === 'Medium' ? 'impact-medium' : 'impact-low';
                         
      tableHtml += `
        <tr>
          <td>${bottleneck.phase}</td>
          <td>${bottleneck.avgDuration.toFixed(1)}</td>
          <td class="${impactClass}">${impact}</td>
        </tr>
      `;
    });
    
    tableHtml += `
        </tbody>
      </table>
    `;
    
    // Update the container
    tableContainer.innerHTML = tableHtml;
  }
  
  /**
   * Update the WIP vs FG comparison chart
   * @param {Object} lotBasedData - Lot data from adapter
   */
  function updateWipFgComparisonChart(lotBasedData) {
    const chartContainer = document.getElementById('wip-fg-comparison-chart');
    if (!chartContainer) return;
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics) return;
    
    // Extract review times for WIP and FG
    const wipReviewTime = metrics.averageTimeMetrics?.avgWipReviewTime || 0;
    const fgReviewTime = metrics.averageTimeMetrics?.avgFgReviewTime || 0;
    const wipCorrectionsTime = metrics.averageTimeMetrics?.avgWipCorrectionsTime || 0;
    const fgCorrectionsTime = metrics.averageTimeMetrics?.avgFgCorrectionsTime || 0;
    
    // Find or create chart canvas
    let chartCanvas = chartContainer.querySelector('canvas');
    if (!chartCanvas) {
      chartCanvas = document.createElement('canvas');
      chartContainer.appendChild(chartCanvas);
    }
    
    // Clear any existing chart
    if (chartCanvas.chartInstance) {
      chartCanvas.chartInstance.destroy();
    }
    
    // Create chart
    window.chartJsReadyPromise.then(Chart => {
      chartCanvas.chartInstance = new Chart(chartCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Review Time', 'Corrections Time', 'Total Time'],
          datasets: [
            {
              label: 'WIP Documentation',
              data: [wipReviewTime, wipCorrectionsTime, wipReviewTime + wipCorrectionsTime],
              backgroundColor: 'rgba(75, 192, 192, 0.7)'
            },
            {
              label: 'FG Documentation',
              data: [fgReviewTime, fgCorrectionsTime, fgReviewTime + fgCorrectionsTime],
              backgroundColor: 'rgba(153, 102, 255, 0.7)'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Days'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'WIP vs FG Documentation Time Comparison'
            }
          }
        }
      });
    });
  }
  
  /**
   * Update the process trend chart using lot data
   * @param {Object} lotBasedData - Lot data from adapter
   */
  function updateProcessTrendChart(lotBasedData) {
    const chartContainer = document.getElementById('process-trend-chart');
    if (!chartContainer) return;
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics || !metrics.trends) return;
    
    // Extract trend data - we expect a format like:
    // trends: { cycleTime: [{ period: 'Jan', value: 45 }, ...] }
    const trendData = metrics.trends?.cycleTime || [];
    
    // Exit if no trend data
    if (trendData.length === 0) return;
    
    // Find or create chart canvas
    let chartCanvas = chartContainer.querySelector('canvas');
    if (!chartCanvas) {
      chartCanvas = document.createElement('canvas');
      chartContainer.appendChild(chartCanvas);
    }
    
    // Clear any existing chart
    if (chartCanvas.chartInstance) {
      chartCanvas.chartInstance.destroy();
    }
    
    // Create chart
    window.chartJsReadyPromise.then(Chart => {
      chartCanvas.chartInstance = new Chart(chartCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: trendData.map(point => point.period),
          datasets: [{
            label: 'Average Cycle Time',
            data: trendData.map(point => point.value),
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Days'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Process Cycle Time Trend'
            }
          }
        }
      });
    });
  }
  
  // Add a lot data quality report to the insights tab
  function addLotDataQualityReport(lotBasedData, lotDebugData) {
    const insightsContainer = document.getElementById('key-insights-container');
    if (!insightsContainer) return;
    
    // Create lot analysis report
    const reportElement = document.createElement('div');
    reportElement.className = 'lot-data-report';
    reportElement.innerHTML = `
      <h4>Lot Analysis Report</h4>
      <p>Total Lots: ${lotDebugData.summary.totalLots}</p>
      <p>Lots with Process Records: ${lotDebugData.summary.lotsWithProcessRecords}</p>
      <p>Lots with Internal Records: ${lotDebugData.summary.lotsWithInternalRecords}</p>
      <p>Lots with External Records: ${lotDebugData.summary.lotsWithExternalRecords}</p>
      <p>Potential Data Issues: ${lotDebugData.summary.potentialAnomalies}</p>
    `;
    
    // Check if potential issues exist and highlight them
    if (lotDebugData.summary.potentialAnomalies > 0) {
      const issuesList = document.createElement('div');
      issuesList.className = 'data-issues';
      issuesList.innerHTML = '<h5>Potential Data Issues:</h5><ul>';
      
      // Add top 5 potential issues
      const potentialIssues = Object.values(lotDebugData.lotDetails)
        .filter(lot => lot.potentialAnomaly)
        .sort((a, b) => b.totalRecords - a.totalRecords)
        .slice(0, 5);
      
      potentialIssues.forEach(lot => {
        issuesList.innerHTML += `
          <li>Lot ${lot.lotId}: ${lot.totalRecords} records 
          (${lot.recordCounts.process} process, 
          ${lot.recordCounts.internal} internal, 
          ${lot.recordCounts.external} external)</li>
        `;
      });
      
      issuesList.innerHTML += '</ul>';
      reportElement.appendChild(issuesList);
    }
    
    // Insert at the top of the insights container
    if (insightsContainer.firstChild) {
      insightsContainer.insertBefore(reportElement, insightsContainer.firstChild);
    } else {
      insightsContainer.appendChild(reportElement);
    }
  }
  
  // Extend the existing initialize function
  const originalInitialize = window.initializeLotAnalysis;
  window.initializeLotAnalysis = function() {
    if (originalInitialize) originalInitialize();
    
    // Also integrate lot data across all tabs
    integrateLotDataIntoAllTabs();
  };

  /**
   * Build a timeline HTML representation from timeline data
   * @param {Object} timeline - Timeline data with dates
   * @returns {string} HTML representation of the timeline
   */
  function buildTimelineHTML(timeline) {
    let html = '<div class="timeline-steps">';
    const timelineEvents = [
      { key: 'bulkReceiptDate', label: 'Bulk Receipt' },
      { key: 'assemblyStart', label: 'Assembly Start' },
      { key: 'assemblyFinish', label: 'Assembly Finish' },
      { key: 'packagingStart', label: 'Packaging Start' },
      { key: 'packagingFinish', label: 'Packaging Finish' },
      { key: 'release', label: 'Release' },
      { key: 'shipment', label: 'Shipment' }
    ];
    
    timelineEvents.forEach(event => {
      if (timeline[event.key]) {
        const date = new Date(timeline[event.key]);
        html += `
          <div class="timeline-step">
            <div class="step-date">${date.toLocaleDateString()}</div>
            <div class="step-marker"></div>
            <div class="step-label">${event.label}</div>
          </div>
        `;
      }
    });
    
    html += '</div>';
    return html;
  }
  
  /**
   * Build HTML for displaying error types and form titles
   * @param {Array} errorTypes - Array of error types with counts
   * @param {Array} formTitles - Array of form titles with counts
   * @returns {string} HTML representation of error types and forms
   */
  function buildErrorTypesHTML(errorTypes, formTitles) {
    let html = '<div class="errors-section">';
    
    // Error types table
    if (errorTypes && errorTypes.length > 0) {
      html += '<h6>Error Types</h6>';
      html += '<div class="error-table">';
      
      errorTypes.slice(0, 5).forEach(error => {
        html += `
          <div class="error-row">
            <div class="error-type">${error.type}</div>
            <div class="error-count">${error.count}</div>
          </div>
        `;
      });
      
      html += '</div>';
    }
    
    // Form titles table
    if (formTitles && formTitles.length > 0) {
      html += '<h6>Forms with Errors</h6>';
      html += '<div class="form-table">';
      
      formTitles.slice(0, 5).forEach(form => {
        html += `
          <div class="form-row">
            <div class="form-title">${form.title}</div>
            <div class="form-count">${form.count}</div>
          </div>
        `;
      });
      
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  }
  
  /**
   * Build HTML for displaying categories and stages
   * @param {Array} categories - Array of categories with counts
   * @param {Array} stages - Array of stages with counts
   * @returns {string} HTML representation of categories and stages
   */
  function buildCategoriesHTML(categories, stages) {
    let html = '<div class="categories-section">';
    
    // Categories table
    if (categories && categories.length > 0) {
      html += '<h6>Categories</h6>';
      html += '<div class="category-table">';
      
      categories.slice(0, 5).forEach(cat => {
        html += `
          <div class="category-row">
            <div class="category-name">${cat.category}</div>
            <div class="category-count">${cat.count}</div>
          </div>
        `;
      });
      
      html += '</div>';
    }
    
    // Stages table
    if (stages && stages.length > 0) {
      html += '<h6>Stages</h6>';
      html += '<div class="stage-table">';
      
      stages.slice(0, 5).forEach(stage => {
        html += `
          <div class="stage-row">
            <div class="stage-name">${stage.stage}</div>
            <div class="stage-count">${stage.count}</div>
          </div>
        `;
      });
      
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  }
  
  /**
   * Get the CSS class for a risk score
   * @param {number} riskScore - The risk score value
   * @returns {string} The CSS class for the risk level
   */
  function getRiskLevelClass(riskScore) {
    if (riskScore >= 8) return 'high';
    if (riskScore >= 4) return 'medium';
    return 'low';
  }
  
  /**
   * Build HTML for the evaluation section
   * @param {Object} evaluation - The lot evaluation data
   * @returns {string} HTML representation of the evaluation
   */
  function buildEvaluationHTML(evaluation) {
    let html = '<div class="evaluation-section">';
    
    // Risk factors
    if (evaluation.riskFactors && evaluation.riskFactors.length > 0) {
      html += '<h6>Risk Factors</h6>';
      html += '<ul class="risk-factors-list">';
      
      evaluation.riskFactors.forEach(factor => {
        html += `
          <li class="risk-factor-item risk-${getRiskLevelClass(factor.severity)}">
            <span class="risk-factor-name">${factor.name}:</span>
            <span class="risk-factor-detail">${factor.detail}</span>
          </li>
        `;
      });
      
      html += '</ul>';
    }
    
    // Recommendations if available
    if (evaluation.recommendations && evaluation.recommendations.length > 0) {
      html += '<h6>Recommendations</h6>';
      html += '<ul class="recommendations-list">';
      
      evaluation.recommendations.forEach(rec => {
        html += `<li class="recommendation-item">${rec}</li>`;
      });
      
      html += '</ul>';
    }
    
    html += '</div>';
    return html;
  }

  /**
   * Update internal RFT charts and tables
   * @param {Object} lotBasedData - Data from lot-based adapter
   */
  function updateInternalRftCharts(lotBasedData) {
    console.log('Updating internal RFT charts with lot data');
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics) return;
    
    // 1. Update error type distribution chart
    updateErrorTypeChart(lotBasedData);
    
    // 2. Update error by form chart
    updateErrorFormChart(lotBasedData);
    
    // 3. Update error by department table
    updateErrorDepartmentTable(lotBasedData);
    
    // 4. Update top error details table
    updateTopErrorDetailsTable(lotBasedData);
  }
  
  /**
   * Update the error type distribution chart
   * @param {Object} lotBasedData - Data from lot-based adapter
   */
  function updateErrorTypeChart(lotBasedData) {
    const chartContainer = document.getElementById('error-type-chart');
    if (!chartContainer) return;
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics || !metrics.topInternalIssues) return;
    
    // Get top error types (limit to top 5 for readability)
    const topErrors = metrics.topInternalIssues.slice(0, 5);
    
    // Find or create chart canvas
    let chartCanvas = chartContainer.querySelector('canvas');
    if (!chartCanvas) {
      chartCanvas = document.createElement('canvas');
      chartContainer.appendChild(chartCanvas);
    }
    
    // Clear any existing chart
    if (chartCanvas.chartInstance) {
      chartCanvas.chartInstance.destroy();
    }
    
    // Create chart
    window.chartJsReadyPromise.then(Chart => {
      chartCanvas.chartInstance = new Chart(chartCanvas.getContext('2d'), {
        type: 'pie',
        data: {
          labels: topErrors.map(error => error.type),
          datasets: [{
            data: topErrors.map(error => error.count),
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Error Type Distribution'
            },
            legend: {
              position: 'right'
            }
          }
        }
      });
    });
  }
  
  /**
   * Update the error by form chart
   * @param {Object} lotBasedData - Data from lot-based adapter
   */
  function updateErrorFormChart(lotBasedData) {
    const chartContainer = document.getElementById('form-error-chart');
    if (!chartContainer) return;
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics || !metrics.formErrorFrequency) return;
    
    // Get form error data
    const formErrors = metrics.formErrorFrequency || [];
    
    // Limit to top 5 forms for readability
    const topForms = formErrors.slice(0, 5);
    
    // Find or create chart canvas
    let chartCanvas = chartContainer.querySelector('canvas');
    if (!chartCanvas) {
      chartCanvas = document.createElement('canvas');
      chartContainer.appendChild(chartCanvas);
    }
    
    // Clear any existing chart
    if (chartCanvas.chartInstance) {
      chartCanvas.chartInstance.destroy();
    }
    
    // Create chart
    window.chartJsReadyPromise.then(Chart => {
      chartCanvas.chartInstance = new Chart(chartCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: topForms.map(form => form.form),
          datasets: [{
            label: 'Number of Errors',
            data: topForms.map(form => form.count),
            backgroundColor: 'rgba(54, 162, 235, 0.7)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Error Count'
              }
            },
            x: {
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Errors by Form'
            }
          }
        }
      });
    });
  }
  
  /**
   * Update error by department table
   * @param {Object} lotBasedData - Data from lot-based adapter
   */
  function updateErrorDepartmentTable(lotBasedData) {
    const tableContainer = document.getElementById('error-department-table');
    if (!tableContainer) return;
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics || !metrics.departmentErrorCounts) return;
    
    // Get department error data
    const departmentErrors = metrics.departmentErrorCounts || [];
    
    // Build table HTML
    let tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Error Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // Calculate total error count
    const totalErrors = departmentErrors.reduce((sum, dept) => sum + dept.count, 0);
    
    // Add rows for each department
    departmentErrors.forEach(dept => {
      const percentage = totalErrors > 0 ? ((dept.count / totalErrors) * 100).toFixed(1) : '0.0';
      
      tableHtml += `
        <tr>
          <td>${dept.department || 'Unknown'}</td>
          <td>${dept.count}</td>
          <td>${percentage}%</td>
        </tr>
      `;
    });
    
    tableHtml += `
        </tbody>
      </table>
    `;
    
    // Update the container
    tableContainer.innerHTML = tableHtml;
  }
  
  /**
   * Update top error details table
   * @param {Object} lotBasedData - Data from lot-based adapter
   */
  function updateTopErrorDetailsTable(lotBasedData) {
    const tableContainer = document.getElementById('top-errors-table');
    if (!tableContainer) return;
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics || !metrics.recentErrorDetails) return;
    
    // Get error details
    const errorDetails = metrics.recentErrorDetails || [];
    
    // Build table HTML
    let tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Error Type</th>
            <th>Form</th>
            <th>Room</th>
            <th>Made By</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // Add rows for each error detail (limit to 10 for readability)
    errorDetails.slice(0, 10).forEach(error => {
      // Format date
      const date = error.date ? new Date(error.date).toLocaleDateString() : 'N/A';
      
      tableHtml += `
        <tr>
          <td>${date}</td>
          <td>${error.type || 'Unknown'}</td>
          <td>${error.form || 'Unknown'}</td>
          <td>${error.room || 'N/A'}</td>
          <td>${error.madeBy || 'Unknown'}</td>
        </tr>
      `;
    });
    
    tableHtml += `
        </tbody>
      </table>
    `;
    
    // Update the container
    tableContainer.innerHTML = tableHtml;
  }

  /**
   * Update external RFT charts and tables
   * @param {Object} lotBasedData - Data from lot-based adapter
   */
  function updateExternalRftCharts(lotBasedData) {
    console.log('Updating external RFT charts with lot data');
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics) return;
    
    // 1. Update category distribution chart
    updateCategoryDistributionChart(lotBasedData);
    
    // 2. Update stage distribution chart
    updateStageDistributionChart(lotBasedData);
    
    // 3. Update external comments table
    updateExternalCommentsTable(lotBasedData);
  }
  
  /**
   * Update the category distribution chart
   * @param {Object} lotBasedData - Data from lot-based adapter
   */
  function updateCategoryDistributionChart(lotBasedData) {
    const chartContainer = document.getElementById('category-distribution-chart');
    if (!chartContainer) return;
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics || !metrics.topExternalIssues) return;
    
    // Get top categories (limit to top 5 for readability)
    const topCategories = metrics.topExternalIssues.slice(0, 5);
    
    // Find or create chart canvas
    let chartCanvas = chartContainer.querySelector('canvas');
    if (!chartCanvas) {
      chartCanvas = document.createElement('canvas');
      chartContainer.appendChild(chartCanvas);
    }
    
    // Clear any existing chart
    if (chartCanvas.chartInstance) {
      chartCanvas.chartInstance.destroy();
    }
    
    // Create chart
    window.chartJsReadyPromise.then(Chart => {
      chartCanvas.chartInstance = new Chart(chartCanvas.getContext('2d'), {
        type: 'pie',
        data: {
          labels: topCategories.map(cat => cat.category),
          datasets: [{
            data: topCategories.map(cat => cat.count),
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'External Feedback by Category'
            },
            legend: {
              position: 'right'
            }
          }
        }
      });
    });
  }
  
  /**
   * Update the stage distribution chart
   * @param {Object} lotBasedData - Data from lot-based adapter
   */
  function updateStageDistributionChart(lotBasedData) {
    const chartContainer = document.getElementById('stage-distribution-chart');
    if (!chartContainer) return;
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics || !metrics.externalStageFrequency) return;
    
    // Get stage data
    const stageData = metrics.externalStageFrequency || [];
    
    // Find or create chart canvas
    let chartCanvas = chartContainer.querySelector('canvas');
    if (!chartCanvas) {
      chartCanvas = document.createElement('canvas');
      chartContainer.appendChild(chartCanvas);
    }
    
    // Clear any existing chart
    if (chartCanvas.chartInstance) {
      chartCanvas.chartInstance.destroy();
    }
    
    // Create chart
    window.chartJsReadyPromise.then(Chart => {
      chartCanvas.chartInstance = new Chart(chartCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: stageData.map(stage => stage.stage),
          datasets: [{
            label: 'Number of Issues',
            data: stageData.map(stage => stage.count),
            backgroundColor: 'rgba(75, 192, 192, 0.7)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Issue Count'
              }
            },
            x: {
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'External Issues by Stage'
            }
          }
        }
      });
    });
  }
  
  /**
   * Update external comments table
   * @param {Object} lotBasedData - Data from lot-based adapter
   */
  function updateExternalCommentsTable(lotBasedData) {
    const tableContainer = document.getElementById('external-comments-table');
    if (!tableContainer) return;
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics || !metrics.recentExternalIssues) return;
    
    // Get comment details
    const commentDetails = metrics.recentExternalIssues || [];
    
    // Build table HTML
    let tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Stage</th>
            <th>Comment</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // Add rows for each comment (limit to 10 for readability)
    commentDetails.slice(0, 10).forEach(comment => {
      // Truncate comments that are too long
      const truncatedComment = comment.comment?.length > 100 ? 
        comment.comment.substring(0, 100) + '...' : comment.comment || '';
      
      tableHtml += `
        <tr>
          <td>${comment.category || 'Uncategorized'}</td>
          <td>${comment.stage || 'Unknown'}</td>
          <td class="comment-cell">${truncatedComment}</td>
        </tr>
      `;
    });
    
    tableHtml += `
        </tbody>
      </table>
    `;
    
    // Update the container
    tableContainer.innerHTML = tableHtml;
  }

  /**
   * Update overview charts and tables
   * @param {Object} lotBasedData - Data from lot-based adapter
   */
  function updateOverviewCharts(lotBasedData) {
    console.log('Updating overview charts with lot data');
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics) return;
    
    // 1. Update RFT trend chart
    updateRftTrendChart(lotBasedData);
    
    // 2. Update lot status distribution chart
    updateLotStatusChart(lotBasedData);
    
    // 3. Update lot quality issues table
    updateLotQualityIssuesTable(lotBasedData);
  }
  
  /**
   * Update the RFT trend chart
   * @param {Object} lotBasedData - Data from lot-based adapter
   */
  function updateRftTrendChart(lotBasedData) {
    const chartContainer = document.getElementById('rft-trend-chart');
    if (!chartContainer) return;
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics || !metrics.trends || !metrics.trends.rftRate) return;
    
    // Get RFT trend data
    const trendData = metrics.trends.rftRate || [];
    
    // Find or create chart canvas
    let chartCanvas = chartContainer.querySelector('canvas');
    if (!chartCanvas) {
      chartCanvas = document.createElement('canvas');
      chartContainer.appendChild(chartCanvas);
    }
    
    // Clear any existing chart
    if (chartCanvas.chartInstance) {
      chartCanvas.chartInstance.destroy();
    }
    
    // Create chart
    window.chartJsReadyPromise.then(Chart => {
      chartCanvas.chartInstance = new Chart(chartCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: trendData.map(point => point.period),
          datasets: [{
            label: 'RFT Rate',
            data: trendData.map(point => point.value),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'RFT Rate (%)'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'RFT Rate Trend'
            }
          }
        }
      });
    });
  }
  
  /**
   * Update the lot status distribution chart
   * @param {Object} lotBasedData - Data from lot-based adapter
   */
  function updateLotStatusChart(lotBasedData) {
    const chartContainer = document.getElementById('lot-status-chart');
    if (!chartContainer) return;
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics) return;
    
    // Extract lot status data
    const rftLots = metrics.rftLots || 0;
    const internalRftFailLots = metrics.internalRftFailLots || 0;
    const externalRftFailLots = metrics.externalRftFailLots || 0;
    
    // Find or create chart canvas
    let chartCanvas = chartContainer.querySelector('canvas');
    if (!chartCanvas) {
      chartCanvas = document.createElement('canvas');
      chartContainer.appendChild(chartCanvas);
    }
    
    // Clear any existing chart
    if (chartCanvas.chartInstance) {
      chartCanvas.chartInstance.destroy();
    }
    
    // Create chart
    window.chartJsReadyPromise.then(Chart => {
      chartCanvas.chartInstance = new Chart(chartCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['RFT Pass', 'Internal RFT Fail', 'External RFT Fail'],
          datasets: [{
            data: [rftLots, internalRftFailLots, externalRftFailLots],
            backgroundColor: [
              'rgba(46, 204, 113, 0.7)',
              'rgba(231, 76, 60, 0.7)',
              'rgba(243, 156, 18, 0.7)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Lot Status Distribution'
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    });
  }
  
  /**
   * Update lot quality issues table
   * @param {Object} lotBasedData - Data from lot-based adapter
   */
  function updateLotQualityIssuesTable(lotBasedData) {
    const tableContainer = document.getElementById('lot-quality-issues-table');
    if (!tableContainer) return;
    
    const metrics = lotBasedData.lotMetrics;
    if (!metrics) return;
    
    // Combine top issues from internal and external
    const topInternalIssues = metrics.topInternalIssues || [];
    const topExternalIssues = metrics.topExternalIssues || [];
    
    // Build table HTML
    let tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Issue Type</th>
            <th>Count</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // Add rows for internal issues
    topInternalIssues.slice(0, 3).forEach(issue => {
      tableHtml += `
        <tr>
          <td>${issue.type}</td>
          <td>${issue.count}</td>
          <td>Internal</td>
        </tr>
      `;
    });
    
    // Add rows for external issues
    topExternalIssues.slice(0, 3).forEach(issue => {
      tableHtml += `
        <tr>
          <td>${issue.category}</td>
          <td>${issue.count}</td>
          <td>External</td>
        </tr>
      `;
    });
    
    tableHtml += `
        </tbody>
      </table>
    `;
    
    // Update the container
    tableContainer.innerHTML = tableHtml;
  }
})(); 