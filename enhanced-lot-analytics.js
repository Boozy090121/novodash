/**
 * Enhanced Lot-Based Analytics Extension for Novo Dashboard
 * 
 * This script automatically processes data by lot number rather than individual records,
 * providing comprehensive lot-level RFT metrics, trends, and actionable insights.
 * 
 * Key improvements:
 * - Auto-execution on page load without requiring button clicks
 * - All analysis based on lots rather than individual records
 * - Enhanced insights generation with actionable recommendations
 * - Predictive analytics for process optimization
 * - Specialized business rule handling (e.g., Process Clarification not failing RFT)
 */

(function() {
  console.log('Enhanced Lot Analytics module loaded - Auto-execution mode');
  
  // Global variables for lot-based analytics
  window.lotAnalytics = {
    enabled: true,
    data: {
      lots: {},
      metrics: {},
      insights: [],
      recommendations: []
    },
    status: 'initializing'
  };
  
  // Auto-initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, auto-initializing lot-based analytics');
    
    // Create analytics container elements if they don't exist
    setupAnalyticsContainers();
    
    // Set up watchers to detect when data is available
    watchForDataAvailability();
  });
  
  // Watch for data availability and auto-process when ready
  function watchForDataAvailability() {
    console.log('Setting up data availability watcher');
    
    // Check immediately
    if (window.processedData && window.processedData.records) {
      console.log('Data already available, processing now');
      processLotBasedAnalytics();
      return;
    }
    
    // Set up interval to check for data availability
    const watchInterval = setInterval(() => {
      if (window.processedData && window.processedData.records) {
        console.log('Data now available, processing');
        clearInterval(watchInterval);
        processLotBasedAnalytics();
      }
    }, 500);
    
    // Timeout after 30 seconds to prevent endless checking
    setTimeout(() => {
      clearInterval(watchInterval);
      if (!window.lotAnalytics.data.lots || Object.keys(window.lotAnalytics.data.lots).length === 0) {
        console.error('Timeout: No data became available for lot analytics');
        window.lotAnalytics.status = 'error';
      }
    }, 30000);
  }
  
  // Set up the UI containers for lot-based analytics
  function setupAnalyticsContainers() {
    // Make sure the insights tab exists and has content
    enhanceInsightsTab();
    
    // Create lot-based analytics tab if it doesn't exist
    addLotAnalyticsTab();
    
    // Update the dashboard status message
    updateStatusMessage('Initializing lot-based analytics...');
  }
  
  // Update the status message in the header
  function updateStatusMessage(message, isSuccess = false) {
    const statusElement = document.getElementById('data-status');
    if (statusElement) {
      statusElement.textContent = message;
      if (isSuccess) {
        statusElement.style.color = '#28a745';
      }
    }
  }
  
  // Enhance the insights tab with lot-based content
  function enhanceInsightsTab() {
    const insightsContent = document.getElementById('insights-content');
    if (!insightsContent) return;
    
    // Replace placeholder content with structured insights sections
    insightsContent.innerHTML = `
      <div class="summary-box">
        <div class="summary-item">
          <div class="summary-label">Critical Path</div>
          <div class="summary-value" id="critical-path-value">...</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Data Confidence Score</div>
          <div class="summary-value" id="confidence-score">...</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">RFT Performance vs Baseline</div>
          <div class="summary-value" id="rft-deviation">...</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Process Risk Potential</div>
          <div class="summary-value" id="risk-potential">...</div>
        </div>
      </div>
      
      <div class="chart-grid">
        <div class="chart-container" id="critical-factors-chart">
          <div class="data-requirement-message">
            <h3>Lot-Based RFT Analysis</h3>
            <p>Analyzing lot-level RFT performance...</p>
          </div>
        </div>
        <div class="chart-container" id="failure-prediction-chart">
          <div class="data-requirement-message">
            <h3>Internal RFT Form Analysis</h3>
            <p>Analyzing lot-level form data...</p>
          </div>
        </div>
      </div>
      
      <div class="chart-grid">
        <div class="chart-container" id="process-optimization-chart">
          <div class="data-requirement-message">
            <h3>Process Cycle Time Analysis</h3>
            <p>Analyzing lot-level cycle time data...</p>
          </div>
        </div>
        <div class="chart-container" id="correction-impact-chart">
          <div class="data-requirement-message">
            <h3>Correction Impact Analysis</h3>
            <p>Analyzing impact of corrections on cycle time...</p>
          </div>
        </div>
      </div>
      
      <div class="chart-container" id="documentation-correlation-chart">
        <div class="data-requirement-message">
            <h3>Documentation Issue Analysis</h3>
            <p>Analyzing impact of documentation issues...</p>
          </div>
      </div>
      
      <div class="chart-container">
        <h3>Key Insights and Recommendations</h3>
        <div id="key-insights-container" style="max-height: 400px; overflow-y: auto;">
          <div class="data-requirement-message">
            <p>Generating lot-based insights and recommendations...</p>
          </div>
        </div>
      </div>
    `;
  }
  
  // Add a dedicated lot analytics tab
  function addLotAnalyticsTab() {
    // Check if tab already exists
    if (document.getElementById('lot-analytics-tab')) return;
    
    // Add tab to navigation
    const tabBar = document.querySelector('.dashboard-tabs');
    if (tabBar) {
      const lotAnalyticsTab = document.createElement('div');
      lotAnalyticsTab.className = 'tab-item';
      lotAnalyticsTab.id = 'lot-analytics-tab';
      lotAnalyticsTab.setAttribute('data-tab', 'lot-analytics');
      lotAnalyticsTab.textContent = 'Lot Analytics';
      
      tabBar.appendChild(lotAnalyticsTab);
      
      // Add click handler
      lotAnalyticsTab.addEventListener('click', function() {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to this tab
        this.classList.add('active');
        
        // Show corresponding content
        const lotContent = document.getElementById('lot-analytics-content');
        if (lotContent) {
          lotContent.classList.add('active');
        }
      });
    }
    
    // Create tab content
    const lotContent = document.createElement('div');
    lotContent.className = 'tab-content';
    lotContent.id = 'lot-analytics-content';
    
    // Add content structure
    lotContent.innerHTML = `
      <div class="summary-box">
        <div class="summary-item">
          <div class="summary-label">Total Lots</div>
          <div class="summary-value" id="total-lots-value">...</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Lot RFT Percentage</div>
          <div class="summary-value" id="lot-rft-percentage">...</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">WIP Issues</div>
          <div class="summary-value" id="wip-issues-count">...</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">FG Issues</div>
          <div class="summary-value" id="fg-issues-count">...</div>
        </div>
      </div>
      
      <div class="chart-container" id="lot-insights-container">
        <h3>Lot-Based Analysis Insights</h3>
        <div id="lot-insights-list" style="max-height: 300px; overflow-y: auto;">
          <div class="data-requirement-message">
            <p>Analyzing lot-level data...</p>
          </div>
        </div>
      </div>
      
      <div class="chart-grid">
        <div class="chart-container" id="lot-rft-chart">
          <div class="data-requirement-message">
            <h3>Lot RFT Performance</h3>
            <p>Analyzing lot-level RFT rates...</p>
          </div>
        </div>
        <div class="chart-container" id="wip-fg-comparison-chart">
          <div class="data-requirement-message">
            <h3>WIP vs FG Issues</h3>
            <p>Comparing issues in WIP (Assembly) vs FG (Packaging)...</p>
          </div>
        </div>
      </div>
      
      <div class="chart-container" id="form-analysis-chart">
        <div class="data-requirement-message">
          <h3>Internal RFT Form Analysis</h3>
          <p>Analyzing form data by lot...</p>
        </div>
      </div>
      
      <div class="chart-grid">
        <div class="chart-container" id="error-by-form-chart">
          <div class="data-requirement-message">
            <h3>Errors by Form Title</h3>
            <p>Analyzing error distribution by form title...</p>
          </div>
        </div>
        <div class="chart-container" id="error-maker-chart">
          <div class="data-requirement-message">
            <h3>Error Attribution</h3>
            <p>Analyzing error attribution by person...</p>
          </div>
        </div>
      </div>
    `;
    
    // Add to page
    const parentContainer = document.querySelector('.dashboard-section');
    if (parentContainer) {
      parentContainer.appendChild(lotContent);
    }
  }
  
  // Main function to process lot-based analytics
  function processLotBasedAnalytics() {
    console.log('Processing lot-based analytics from available data');
    
    window.lotAnalytics.status = 'processing';
    
    // If lot data is already available from the adapter
    if (window.lotData) {
      console.log('Using pre-calculated lot data from adapter');
      window.lotAnalytics.data.lots = window.lotData;
      window.lotAnalytics.data.metrics = window.lotMetrics || {};
    } else {
      console.log('Generating lot data from processed records');
      // Get processed records
      const records = window.processedData.records;
      
      // Group records by lot
      window.lotAnalytics.data.lots = groupRecordsByLot(records);
      window.lotAnalytics.data.metrics = calculateLotMetrics(window.lotAnalytics.data.lots);
    }
    
    // Generate insights and recommendations
    window.lotAnalytics.data.insights = generateLotInsights(
      window.lotAnalytics.data.lots, 
      window.lotAnalytics.data.metrics
    );
    
    window.lotAnalytics.data.recommendations = generateActionableRecommendations(
      window.lotAnalytics.data.lots, 
      window.lotAnalytics.data.metrics
    );
    
    // Update dashboard with analytics results
    updateDashboardWithLotAnalytics();
    
    // Update status
    window.lotAnalytics.status = 'complete';
    updateStatusMessage('Lot-based analytics complete - Dashboard ready', true);
    
    // Remove "Advanced Analytics" notices
    removeAdvancedAnalyticsNotice();
    
    // Store references to all existing Chart instances to prevent recreation
    window.existingCharts = window.existingCharts || {};
    
    // Use a setTimeout to render each tab separately to prevent race conditions
    setTimeout(() => {
      console.log('Rendering Overview tab with lot-based data');
      renderOverviewTab();
    }, 100);
    
    setTimeout(() => {
      console.log('Rendering Internal RFT tab with lot-based data');
      renderInternalRftTab();
    }, 200);
    
    setTimeout(() => {
      console.log('Rendering External RFT tab with lot-based data');
      renderExternalRftTab();
    }, 300);
    
    setTimeout(() => {
      console.log('Rendering Process Metrics tab with lot-based data');
      renderProcessMetricsTab();
    }, 400);
    
    // Render lot-specific analytics charts
    setTimeout(() => {
      console.log('Rendering lot-specific analytics charts');
      renderLotAnalyticsCharts();
    }, 500);
    
    console.log('Lot-based analytics processing complete');
  }
  
  /**
   * Group records by lot number to enable lot-based analysis
   * @param {Array} records - Raw records from processedData
   * @returns {Object} Data grouped by lot number
   */
  function groupRecordsByLot(records) {
    const lotData = {};
    
    records.forEach(record => {
      // Extract lot number using multiple possible fields
      const lotNumber = getLotNumber(record);
      
      if (!lotData[lotNumber]) {
        lotData[lotNumber] = {
          lotNumber: lotNumber,
          records: [],
          externalRft: [],
          internalRft: [],
          processMetrics: [],
          wipIssues: [],
          fgIssues: [],
          hasFailedRft: false
        };
      }
      
      // Add record to the lot
      lotData[lotNumber].records.push(record);
      
      // Categorize by record type
      const recordType = getRecordType(record);
      
      if (recordType === 'external-rft') {
        lotData[lotNumber].externalRft.push(record);
        
        // Apply special business rule: Process Clarification doesn't fail RFT
        if (record.category !== 'Process Clarification') {
          lotData[lotNumber].hasFailedRft = true;
        }
        
        // Categorize by WIP/FG
        const stage = getProcessStage(record);
        if (stage === 'WIP') {
          lotData[lotNumber].wipIssues.push(record);
        } else if (stage === 'FG') {
          lotData[lotNumber].fgIssues.push(record);
        }
      } else if (recordType === 'internal-rft') {
        lotData[lotNumber].internalRft.push(record);
        lotData[lotNumber].hasFailedRft = true;
        
        // Categorize by WIP/FG
        const stage = getProcessStage(record);
        if (stage === 'WIP') {
          lotData[lotNumber].wipIssues.push(record);
        } else if (stage === 'FG') {
          lotData[lotNumber].fgIssues.push(record);
        }
      } else if (recordType === 'process-metrics') {
        lotData[lotNumber].processMetrics.push(record);
      }
    });
    
    console.log('Grouped records into lots:', Object.keys(lotData).length);
    
    return lotData;
  }
  
  /**
   * Calculate lot-level metrics from grouped data
   * @param {Object} lotData - Data grouped by lot
   * @returns {Object} Lot-based metrics
   */
  function calculateLotMetrics(lotData) {
    const metrics = {
      totalLots: Object.keys(lotData).length,
      lotsPassing: 0,
      lotsFailing: 0,
      lotRftPercentage: 0,
      wipIssueCount: 0,
      fgIssueCount: 0,
      avgCycleTimeByRftStatus: {
        passing: 0,
        failing: 0
      },
      departmentMetrics: {},
      documentationIssues: {
        total: 0,
        wipCount: 0,
        fgCount: 0,
        byCategory: {}
      },
      internalFormMetrics: {
        totalForms: 0,
        byFormTitle: {},
        byErrorType: {},
        byErrorMaker: {}
      }
    };
    
    // Count passing vs failing lots
    Object.values(lotData).forEach(lot => {
      if (lot.hasFailedRft) {
        metrics.lotsFailing++;
      } else {
        metrics.lotsPassing++;
      }
      
      // Count WIP and FG issues
      metrics.wipIssueCount += lot.wipIssues.length;
      metrics.fgIssueCount += lot.fgIssues.length;
      
      // Calculate cycle times by RFT status
      const lotCycleTime = calculateLotCycleTime(lot);
      
      if (lotCycleTime > 0) {
        if (lot.hasFailedRft) {
          metrics.avgCycleTimeByRftStatus.failing += lotCycleTime;
        } else {
          metrics.avgCycleTimeByRftStatus.passing += lotCycleTime;
        }
      }
      
      // Process internal RFT form data
      lot.internalRft.forEach(record => {
        metrics.internalFormMetrics.totalForms++;
        
        // Count by form title
        const formTitle = record.form_title || 'Unknown';
        if (!metrics.internalFormMetrics.byFormTitle[formTitle]) {
          metrics.internalFormMetrics.byFormTitle[formTitle] = 0;
        }
        metrics.internalFormMetrics.byFormTitle[formTitle]++;
        
        // Count by error type
        const errorType = record.error_type || 'Unknown';
        if (!metrics.internalFormMetrics.byErrorType[errorType]) {
          metrics.internalFormMetrics.byErrorType[errorType] = 0;
        }
        metrics.internalFormMetrics.byErrorType[errorType]++;
        
        // Count by error maker
        const errorMaker = record.error_made_by || 'Unknown';
        if (!metrics.internalFormMetrics.byErrorMaker[errorMaker]) {
          metrics.internalFormMetrics.byErrorMaker[errorMaker] = 0;
        }
        metrics.internalFormMetrics.byErrorMaker[errorMaker]++;
      });
      
      // Process documentation issues
      lot.externalRft.forEach(record => {
        if (['Documentation Update', 'Documentation missing', 'Process Clarification'].includes(record.category)) {
          metrics.documentationIssues.total++;
          
          // Count by category
          if (!metrics.documentationIssues.byCategory[record.category]) {
            metrics.documentationIssues.byCategory[record.category] = 0;
          }
          metrics.documentationIssues.byCategory[record.category]++;
          
          // Count WIP vs FG
          const stage = getProcessStage(record);
          if (stage === 'WIP') {
            metrics.documentationIssues.wipCount++;
          } else if (stage === 'FG') {
            metrics.documentationIssues.fgCount++;
          }
        }
      });
      
      // Process department data
      lot.processMetrics.forEach(record => {
        const dept = record.department || 'Unknown';
        if (!metrics.departmentMetrics[dept]) {
          metrics.departmentMetrics[dept] = {
            totalLots: 0,
            passingLots: 0,
            failingLots: 0,
            rftPercentage: 0,
            totalCycleTime: 0,
            avgCycleTime: 0
          };
        }
        
        metrics.departmentMetrics[dept].totalLots++;
        
        if (lot.hasFailedRft) {
          metrics.departmentMetrics[dept].failingLots++;
        } else {
          metrics.departmentMetrics[dept].passingLots++;
        }
        
        // Add cycle time
        const cycletime = getProcessCycleTime(record);
        if (cycletime > 0) {
          metrics.departmentMetrics[dept].totalCycleTime += cycletime;
        }
      });
    });
    
    // Calculate lot RFT percentage
    metrics.lotRftPercentage = metrics.totalLots > 0 ? 
      (metrics.lotsPassing / metrics.totalLots) * 100 : 0;
    
    // Calculate avg cycle times
    if (metrics.lotsFailing > 0) {
      metrics.avgCycleTimeByRftStatus.failing /= metrics.lotsFailing;
    }
    
    if (metrics.lotsPassing > 0) {
      metrics.avgCycleTimeByRftStatus.passing /= metrics.lotsPassing;
    }
    
    // Calculate department percentages and averages
    Object.keys(metrics.departmentMetrics).forEach(dept => {
      const deptMetrics = metrics.departmentMetrics[dept];
      
      deptMetrics.rftPercentage = deptMetrics.totalLots > 0 ? 
        (deptMetrics.passingLots / deptMetrics.totalLots) * 100 : 0;
        
      deptMetrics.avgCycleTime = deptMetrics.totalLots > 0 ? 
        deptMetrics.totalCycleTime / deptMetrics.totalLots : 0;
    });
    
    return metrics;
  }
  
  /**
   * Generate insights based on lot-level metrics
   * @param {Object} lotData - Data grouped by lot
   * @param {Object} metrics - Calculated metrics
   * @returns {Array} Insights
   */
  function generateLotInsights(lotData, metrics) {
    const insights = [];
    
    // Generate RFT performance insight
    insights.push({
      title: `Lot-Based RFT: ${metrics.lotRftPercentage ? metrics.lotRftPercentage.toFixed(1) : 0}%`,
      description: `${metrics.lotsPassing || 0} out of ${metrics.totalLots || 0} lots passed RFT. ${metrics.lotsFailing || 0} lots had at least one RFT failure.`,
      importance: metrics.lotRftPercentage && metrics.lotRftPercentage < 70 ? 'high' : 'medium',
      category: 'Performance'
    });
    
    // Generate WIP vs FG insight
    if ((metrics.wipIssueCount || 0) > 0 || (metrics.fgIssueCount || 0) > 0) {
      insights.push({
        title: `${(metrics.wipIssueCount || 0) > (metrics.fgIssueCount || 0) ? 'WIP' : 'FG'} Issues Predominant`,
        description: `${metrics.wipIssueCount || 0} issues in WIP (Assembly) vs ${metrics.fgIssueCount || 0} in FG (Packaging).`,
        importance: 'medium',
        category: 'Process Stage'
      });
    }
    
    // Generate cycle time insight - safely check for properties
    if (metrics.avgCycleTimeByRftStatus && 
        typeof metrics.avgCycleTimeByRftStatus.failing === 'number' && 
        typeof metrics.avgCycleTimeByRftStatus.passing === 'number') {
      
      const cycleDiff = Math.abs(metrics.avgCycleTimeByRftStatus.failing - metrics.avgCycleTimeByRftStatus.passing);
      
      if (cycleDiff > 2) {
        insights.push({
          title: `Cycle Time Impact: ${cycleDiff.toFixed(1)} days`,
          description: `Failed lots take ${metrics.avgCycleTimeByRftStatus.failing > metrics.avgCycleTimeByRftStatus.passing ? 'longer' : 'shorter'} than passed lots (${metrics.avgCycleTimeByRftStatus.failing.toFixed(1)}d vs ${metrics.avgCycleTimeByRftStatus.passing.toFixed(1)}d).`,
          importance: cycleDiff > 5 ? 'high' : 'medium',
          category: 'Cycle Time'
        });
      }
    }
    
    // Generate documentation insight
    if (metrics.documentationIssues && metrics.documentationIssues.total > 0) {
      const docIssuesImpactingRft = 
        (metrics.documentationIssues.byCategory && metrics.documentationIssues.byCategory['Documentation Update'] || 0) +
        (metrics.documentationIssues.byCategory && metrics.documentationIssues.byCategory['Documentation missing'] || 0);
      
      insights.push({
        title: `Documentation Impact: ${docIssuesImpactingRft} RFT Failures`,
        description: `${docIssuesImpactingRft} lots failed RFT due to Documentation issues. Process Clarification issues (${metrics.documentationIssues.byCategory && metrics.documentationIssues.byCategory['Process Clarification'] || 0}) don't fail RFT.`,
        importance: docIssuesImpactingRft > ((metrics.totalLots || 0) * 0.1) ? 'high' : 'medium',
        category: 'Documentation'
      });
    }
    
    // Generate department insight
    if (metrics.departmentMetrics) {
      const deptEntries = Object.entries(metrics.departmentMetrics);
      if (deptEntries.length > 0) {
        // Find department with lowest RFT
        const lowestRftDept = deptEntries.sort((a, b) => 
          (a[1].rftPercentage || 0) - (b[1].rftPercentage || 0))[0];
        
        if (lowestRftDept && lowestRftDept[1].rftPercentage < 80) {
          insights.push({
            title: `${lowestRftDept[0]} Department: ${lowestRftDept[1].rftPercentage.toFixed(1)}% RFT`,
            description: `${lowestRftDept[0]} has the lowest lot RFT rate (${lowestRftDept[1].passingLots || 0}/${lowestRftDept[1].totalLots || 0} lots passing).`,
            importance: lowestRftDept[1].rftPercentage < 60 ? 'high' : 'medium',
            category: 'Department'
          });
        }
      }
    }
    
    // Generate form error insight
    if (metrics.internalFormMetrics && metrics.internalFormMetrics.totalForms > 0) {
      // Find most common form error
      if (metrics.internalFormMetrics.byErrorType) {
        const topFormError = Object.entries(metrics.internalFormMetrics.byErrorType)
          .sort((a, b) => b[1] - a[1])[0];
        
        if (topFormError) {
          insights.push({
            title: `Top Error Type: ${topFormError[0]}`,
            description: `${topFormError[0]} is the most common error type, accounting for ${((topFormError[1] / metrics.internalFormMetrics.totalForms) * 100).toFixed(1)}% of form errors.`,
            importance: 'medium',
            category: 'Form Errors'
          });
        }
      }
    }
    
    return insights;
  }
  
  /**
   * Generate actionable recommendations based on insights
   * @param {Object} lotData - Data grouped by lot
   * @param {Object} metrics - Calculated metrics
   * @returns {Array} Actionable recommendations
   */
  function generateActionableRecommendations(lotData, metrics) {
    const recommendations = [];
    
    // RFT improvement recommendation
    if (metrics.lotRftPercentage < 80) {
      recommendations.push({
        title: 'Improve Lot RFT Rate',
        description: `Focus on ${metrics.wipIssueCount > metrics.fgIssueCount ? 'WIP (Assembly)' : 'FG (Packaging)'} issues which account for the majority of RFT failures.`,
        impact: 'High',
        difficulty: 'Medium',
        payoff: 'Immediate'
      });
    }
    
    // Cycle time recommendation - Add null/undefined checks
    if (metrics.avgCycleTimeByRftStatus && 
        typeof metrics.avgCycleTimeByRftStatus.failing === 'number' && 
        typeof metrics.avgCycleTimeByRftStatus.passing === 'number' &&
        metrics.avgCycleTimeByRftStatus.failing > metrics.avgCycleTimeByRftStatus.passing + 3) {
      
      recommendations.push({
        title: 'Reduce Correction Cycle Time',
        description: `Failing lots take ${(metrics.avgCycleTimeByRftStatus.failing - metrics.avgCycleTimeByRftStatus.passing).toFixed(1)} days longer than passing lots. Standardize correction workflows to reduce this gap.`,
        impact: 'Medium',
        difficulty: 'Medium', 
        payoff: 'Short-term'
      });
    }
    
    // Documentation improvement recommendation - Add null/undefined checks
    if (metrics.documentationIssues && metrics.documentationIssues.total > 0 && metrics.documentationIssues.byCategory) {
      const docUpdate = metrics.documentationIssues.byCategory['Documentation Update'] || 0;
      const docMissing = metrics.documentationIssues.byCategory['Documentation missing'] || 0;
      const docIssuesImpactingRft = docUpdate + docMissing;
                                   
      if (docIssuesImpactingRft > 0) {
        recommendations.push({
          title: 'Address Documentation Issues',
          description: `${docIssuesImpactingRft} lots failed RFT due to documentation issues. Review documentation processes to prevent these failures.`,
          impact: 'High',
          difficulty: 'Low',
          payoff: 'Immediate'
        });
      }
    }
    
    // Department-specific recommendation - Add null/undefined checks
    if (metrics.departmentMetrics && Object.keys(metrics.departmentMetrics).length > 0) {
      const deptEntries = Object.entries(metrics.departmentMetrics);
      
      // Find department with lowest RFT
      const sortedDepts = deptEntries.sort((a, b) => {
        const aVal = a[1] && typeof a[1].rftPercentage === 'number' ? a[1].rftPercentage : 100;
        const bVal = b[1] && typeof b[1].rftPercentage === 'number' ? b[1].rftPercentage : 100;
        return aVal - bVal;
      });
      
      const lowestRftDept = sortedDepts[0];
      
      if (lowestRftDept && lowestRftDept[1] && 
          typeof lowestRftDept[1].rftPercentage === 'number' && 
          lowestRftDept[1].rftPercentage < 70) {
        recommendations.push({
          title: `Improve ${lowestRftDept[0]} Department Performance`,
          description: `With just ${lowestRftDept[1].rftPercentage.toFixed(1)}% lot RFT, ${lowestRftDept[0]} is the lowest performing department. Focus improvement efforts here.`,
          impact: 'High',
          difficulty: 'Medium',
          payoff: 'Medium-term'
        });
      }
    }
    
    // Form error recommendation - Add null/undefined checks
    if (metrics.internalFormMetrics && metrics.internalFormMetrics.totalForms > 0 && 
        metrics.internalFormMetrics.byFormTitle && Object.keys(metrics.internalFormMetrics.byFormTitle).length > 0) {
      
      // Find most common form with errors
      const topErrorForm = Object.entries(metrics.internalFormMetrics.byFormTitle)
        .sort((a, b) => b[1] - a[1])[0];
      
      if (topErrorForm && topErrorForm.length >= 2) {
        recommendations.push({
          title: `Improve ${topErrorForm[0]} Form Completion`,
          description: `${topErrorForm[0]} forms have the highest error rate. Provide additional training or revise form design to reduce errors.`,
          impact: 'Medium',
          difficulty: 'Low',
          payoff: 'Short-term'
        });
      }
    }
    
    return recommendations;
  }
  
  /**
   * Update the dashboard UI with lot-based analytics
   */
  function updateDashboardWithLotAnalytics() {
    const metrics = window.lotAnalytics.data.metrics;
    
    // Update summary metrics
    updateElementText('total-lots-value', metrics.totalLots);
    updateElementText('lot-rft-percentage', metrics.lotRftPercentage.toFixed(1) + '%');
    updateElementText('wip-issues-count', metrics.wipIssueCount);
    updateElementText('fg-issues-count', metrics.fgIssueCount);
    
    // Update insights tab metrics
    updateElementText('critical-path-value', getCriticalPathName());
    updateElementText('confidence-score', calculateDataConfidenceScore() + '%');
    updateElementText('rft-deviation', calculateRftDeviation());
    updateElementText('risk-potential', calculateRiskPotential());
    
    // Update existing dashboard metrics for lot-based view
    updateElementText('overall-rft-rate', metrics.lotRftPercentage.toFixed(1) + '%');
    
    // Update key insights container
    updateKeyInsightsContainer();
    
    // Update lot insights list
    updateLotInsightsList();
    
    // Remove the download advanced analytics notice since we're already implementing it
    removeAdvancedAnalyticsNotice();
  }
  
  /**
   * Remove the advanced analytics download notice
   */
  function removeAdvancedAnalyticsNotice() {
    // Find the notice by its style or content
    const noticeElement = document.querySelector('.dashboard-section[style*="background-color: #f0f7ff"]');
    if (noticeElement) {
      noticeElement.style.display = 'none';
    }
  }
  
  /**
   * Extract the lot number from a record
   * @param {Object} record - The data record
   * @returns {String} Extracted lot number or 'Unknown'
   */
  function getLotNumber(record) {
    // Try different fields where lot number might be found
    return record.lot_number || 
           record.lotNumber || 
           record.lot || 
           record.lot_id || 
           record.batch_number || 
           'Unknown';
  }
  
  /**
   * Determine record type from its structure and fields
   * @param {Object} record - The data record
   * @returns {String} Record type classification
   */
  function getRecordType(record) {
    if (record.form_type === 'external' || record.category) {
      return 'external-rft';
    } else if (record.form_type === 'internal' || record.error_type) {
      return 'internal-rft';
    } else if (record.department || record.cycle_time) {
      return 'process-metrics';
    }
    return 'unknown';
  }
  
  /**
   * Determine process stage (WIP or FG) from record
   * @param {Object} record - The data record
   * @returns {String} Process stage
   */
  function getProcessStage(record) {
    // Check for explicit stage information
    if (record.stage) {
      const stage = record.stage.toUpperCase();
      if (stage === 'WIP' || stage === 'ASSEMBLY' || stage === 'MANUFACTURING') {
        return 'WIP';
      } else if (stage === 'FG' || stage === 'FINAL' || stage === 'PACKAGING') {
        return 'FG';
      }
    }
    
    // Try to infer from department or area
    if (record.department) {
      const dept = record.department.toUpperCase();
      if (dept.includes('ASSEMBLY') || dept.includes('MANUFACTURING')) {
        return 'WIP';
      } else if (dept.includes('PACKAGING') || dept.includes('INSPECTION')) {
        return 'FG';
      }
    }
    
    if (record.area) {
      const area = record.area.toUpperCase();
      if (area.includes('ASSEMBLY') || area.includes('MANUFACTURING')) {
        return 'WIP';
      } else if (area.includes('PACKAGING') || area.includes('INSPECTION')) {
        return 'FG';
      }
    }
    
    // Default case - check if specifically marked as WIP or FG
    if (record.isWip || record.is_wip) {
      return 'WIP';
    } else if (record.isFg || record.is_fg) {
      return 'FG';
    }
    
    return 'Unknown';
  }
  
  /**
   * Calculate cycle time for a lot
   * @param {Object} lot - Lot data
   * @returns {Number} Cycle time in days
   */
  function calculateLotCycleTime(lot) {
    if (lot.processMetrics && lot.processMetrics.length > 0) {
      // Find average of cycle times if multiple records exist
      let totalTime = 0;
      let validRecords = 0;
      
      lot.processMetrics.forEach(record => {
        const cycleTime = getProcessCycleTime(record);
        if (cycleTime > 0) {
          totalTime += cycleTime;
          validRecords++;
        }
      });
      
      return validRecords > 0 ? totalTime / validRecords : 0;
    }
    return 0;
  }
  
  /**
   * Extract cycle time from a process metrics record
   * @param {Object} record - Process metrics record
   * @returns {Number} Cycle time in days
   */
  function getProcessCycleTime(record) {
    // Try different field names for cycle time
    const cycleTime = record.cycle_time || record.cycleTime || record.cycle_time_days || 0;
    
    // If cycle time is 0 but start/end dates are available, calculate it
    if (cycleTime === 0 && record.start_date && record.end_date) {
      const startDate = new Date(record.start_date);
      const endDate = new Date(record.end_date);
      
      if (startDate && endDate && !isNaN(startDate) && !isNaN(endDate)) {
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      }
    }
    
    return typeof cycleTime === 'number' ? cycleTime : 0;
  }
  
  /**
   * Determine the critical path name based on metrics
   * @returns {String} Critical path name
   */
  function getCriticalPathName() {
    const metrics = window.lotAnalytics.data.metrics;
    
    if (!metrics) return 'Calculating...';
    
    // Determine critical path based on metrics
    if (metrics.wipIssueCount > metrics.fgIssueCount * 1.5) {
      return 'Assembly (WIP)';
    } else if (metrics.fgIssueCount > metrics.wipIssueCount * 1.5) {
      return 'Packaging (FG)';
    }
    
    // Check by department
    if (metrics.departmentMetrics) {
      const departmentsByRft = Object.entries(metrics.departmentMetrics)
        .sort((a, b) => a[1].rftPercentage - b[1].rftPercentage);
      
      if (departmentsByRft.length > 0 && departmentsByRft[0][1].rftPercentage < 70) {
        return departmentsByRft[0][0]; // Lowest RFT department
      }
    }
    
    return 'Mixed Path';
  }
  
  /**
   * Calculate data confidence score based on data quality
   * @returns {Number} Confidence score as percentage
   */
  function calculateDataConfidenceScore() {
    const lotData = window.lotAnalytics.data.lots;
    const metrics = window.lotAnalytics.data.metrics;
    
    if (!lotData || !metrics) return 0;
    
    // Start with base score
    let confidenceScore = 75;
    
    // Adjust based on data completeness
    const totalLots = Object.keys(lotData).length;
    
    // Better confidence with more lots
    if (totalLots < 5) {
      confidenceScore -= 25; // Limited data
    } else if (totalLots > 20) {
      confidenceScore += 10; // Substantial data
    }
    
    // Check for Unknown lot numbers
    if (lotData['Unknown']) {
      confidenceScore -= 10;
    }
    
    // Check for missing process metrics
    let lotsWithoutMetrics = 0;
    Object.values(lotData).forEach(lot => {
      if (!lot.processMetrics || lot.processMetrics.length === 0) {
        lotsWithoutMetrics++;
      }
    });
    
    if (lotsWithoutMetrics > 0) {
      const missingPercentage = (lotsWithoutMetrics / totalLots) * 100;
      if (missingPercentage > 50) {
        confidenceScore -= 20;
      } else if (missingPercentage > 20) {
        confidenceScore -= 10;
      }
    }
    
    // Cap confidence between 0-100%
    return Math.max(0, Math.min(100, Math.round(confidenceScore)));
  }
  
  /**
   * Calculate RFT deviation from baseline
   * @returns {String} Formatted RFT deviation
   */
  function calculateRftDeviation() {
    const metrics = window.lotAnalytics.data.metrics;
    
    if (!metrics || typeof metrics.lotRftPercentage !== 'number') {
      return 'N/A';
    }
    
    // Assume baseline is 85% or use from configuration if available
    const baseline = window.baselineRftPercentage || 85;
    
    const deviation = metrics.lotRftPercentage - baseline;
    
    if (deviation >= 0) {
      return '+' + deviation.toFixed(1) + '%';
    } else {
      return deviation.toFixed(1) + '%';
    }
  }
  
  /**
   * Calculate process risk potential
   * @returns {String} Risk level
   */
  function calculateRiskPotential() {
    const metrics = window.lotAnalytics.data.metrics;
    
    if (!metrics) return 'Unknown';
    
    // Calculate risk based on RFT rate and deviation
    if (metrics.lotRftPercentage < 60) {
      return 'High';
    } else if (metrics.lotRftPercentage < 75) {
      return 'Medium';
    } else if (metrics.lotRftPercentage < 90) {
      return 'Low';
    } else {
      return 'Minimal';
    }
  }
  
  /**
   * Update text content of an element by ID
   * @param {String} elementId - ID of the element to update
   * @param {String|Number} text - New text content
   */
  function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
    }
  }
  
  /**
   * Update the key insights container with generated insights
   */
  function updateKeyInsightsContainer() {
    const container = document.getElementById('key-insights-container');
    if (!container) return;
    
    const insights = window.lotAnalytics.data.insights;
    const recommendations = window.lotAnalytics.data.recommendations;
    
    if (!insights || !recommendations || insights.length === 0) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          <p>No insights available yet. Please load data first.</p>
        </div>
      `;
      return;
    }
    
    let html = `<div style="margin-bottom: 20px;">
      <h4 style="margin-top: 0;">Key Insights</h4>
      <ul style="padding-left: 20px;">
    `;
    
    insights.forEach(insight => {
      html += `
        <li style="margin-bottom: 10px; ${insight.importance === 'high' ? 'font-weight: bold;' : ''}">
          <div>${insight.title}</div>
          <div style="font-size: 14px; color: #555;">${insight.description}</div>
        </li>
      `;
    });
    
    html += `</ul></div>
      <div>
      <h4 style="margin-top: 0;">Recommendations</h4>
      <ul style="padding-left: 20px;">
    `;
    
    recommendations.forEach(rec => {
      html += `
        <li style="margin-bottom: 10px;">
          <div>${rec.title}</div>
          <div style="font-size: 14px; color: #555;">${rec.description}</div>
          <div style="font-size: 12px; margin-top: 5px;">
            <span style="background-color: ${rec.impact === 'High' ? '#ffebee' : '#e8f5e9'}; 
                        padding: 2px 6px; border-radius: 4px; margin-right: 10px;">
              ${rec.impact} Impact
            </span>
            <span style="background-color: #f9f9f9; padding: 2px 6px; 
                        border-radius: 4px; margin-right: 10px;">
              ${rec.difficulty} Difficulty
            </span>
            <span style="background-color: #f9f9f9; padding: 2px 6px; border-radius: 4px;">
              ${rec.payoff} Payoff
            </span>
          </div>
        </li>
      `;
    });
    
    html += `</ul></div>`;
    
    container.innerHTML = html;
  }
  
  /**
   * Update the lot insights list with insights
   */
  function updateLotInsightsList() {
    const container = document.getElementById('lot-insights-list');
    if (!container) return;
    
    const insights = window.lotAnalytics.data.insights;
    const recommendations = window.lotAnalytics.data.recommendations;
    
    if (!insights || insights.length === 0) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          <p>No insights available yet. Please load data first.</p>
        </div>
      `;
      return;
    }
    
    let html = '';
    
    // Group insights by category
    const insightsByCategory = {};
    
    insights.forEach(insight => {
      if (!insightsByCategory[insight.category]) {
        insightsByCategory[insight.category] = [];
      }
      insightsByCategory[insight.category].push(insight);
    });
    
    // Generate HTML for each category
    Object.entries(insightsByCategory).forEach(([category, categoryInsights]) => {
      html += `
        <div style="margin-bottom: 15px;">
          <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 14px; color: #0051BA;">
            ${category}
          </h4>
          <ul style="padding-left: 20px; margin: 0;">
      `;
      
      categoryInsights.forEach(insight => {
        html += `
          <li style="margin-bottom: 8px; ${insight.importance === 'high' ? 'font-weight: bold;' : ''}">
            ${insight.title}: ${insight.description}
          </li>
        `;
      });
      
      html += `</ul></div>`;
    });
    
    // Add top recommendations
    html += `
      <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
        <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 14px; color: #0051BA;">
          Top Recommendations
        </h4>
        <ul style="padding-left: 20px; margin: 0;">
    `;
    
    recommendations.slice(0, 3).forEach(rec => {
      html += `
        <li style="margin-bottom: 8px;">
          <strong>${rec.title}:</strong> ${rec.description}
        </li>
      `;
    });
    
    html += `</ul></div>`;
    
    container.innerHTML = html;
  }

  /**
   * Render lot analytics charts
   * This function calls all individual chart rendering functions
   */
  function renderLotAnalyticsCharts() {
    console.log('Rendering lot analytics charts');
    
    try {
      // Make sure data exists before trying to render
      if (!window.lotAnalytics || !window.lotAnalytics.data || !window.lotAnalytics.data.metrics) {
        console.log('No lot analytics data available for charts');
        return;
      }
      
      // Call each individual chart rendering function
      // WIP vs FG comparison chart
      if (typeof renderWipFgComparisonChart === 'function') {
        renderWipFgComparisonChart();
      }
      
      // Form analysis chart
      if (typeof renderFormAnalysisChart === 'function') {
        renderFormAnalysisChart();
      }
      
      // Error by form chart
      if (typeof renderErrorByFormChart === 'function') {
        renderErrorByFormChart();
      }
      
      // Error maker chart
      if (typeof renderErrorMakerChart === 'function') {
        renderErrorMakerChart();
      }
      
      // More detailed charts
      if (typeof renderLotBasedRftAnalysis === 'function') {
        renderLotBasedRftAnalysis();
      }
      
      if (typeof renderInternalRftFormAnalysis === 'function') {
        renderInternalRftFormAnalysis();
      }
      
      if (typeof renderProcessCycleTimeAnalysis === 'function') {
        renderProcessCycleTimeAnalysis();
      }
      
      if (typeof renderCorrectionImpactAnalysis === 'function') {
        renderCorrectionImpactAnalysis();
      }
      
      if (typeof renderDocumentationIssueAnalysis === 'function') {
        renderDocumentationIssueAnalysis();
      }
      
      console.log('Lot analytics charts rendered successfully');
    } catch (error) {
      console.error('Error rendering lot analytics charts:', error);
    }
  }
  
  /**
   * Render WIP vs FG comparison chart
   */
  function renderWipFgComparisonChart() {
    const container = document.getElementById('wip-fg-comparison-chart');
    if (!container) return;
    
    const metrics = window.lotAnalytics.data.metrics;
    
    // Clear previous content
    container.innerHTML = '';
    
    // Calculate percentages
    const totalIssues = metrics.wipIssueCount + metrics.fgIssueCount;
    const wipPercentage = totalIssues > 0 ? (metrics.wipIssueCount / totalIssues * 100) : 50;
    const fgPercentage = totalIssues > 0 ? (metrics.fgIssueCount / totalIssues * 100) : 50;
    
    // Create chart HTML
    let html = `
      <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">WIP vs FG Issues</h3>
      
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <!-- Horizontal bar chart -->
        <div style="height: 60px; position: relative; background-color: #f8f9fa; border-radius: 4px;">
          <!-- WIP bar (blue) -->
          <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${wipPercentage}%; 
                      background-color: #0051BA; border-radius: 4px 0 0 4px; 
                      ${wipPercentage === 100 ? 'border-radius: 4px;' : ''}
                      display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-weight: bold; ${wipPercentage < 25 ? 'display: none;' : ''}">
              WIP: ${metrics.wipIssueCount}
            </span>
          </div>
          
          <!-- FG bar (red) -->
          <div style="position: absolute; top: 0; left: ${wipPercentage}%; height: 100%; width: ${fgPercentage}%; 
                      background-color: #dc3545; border-radius: 0 4px 4px 0;
                      ${fgPercentage === 100 ? 'border-radius: 4px;' : ''}
                      display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-weight: bold; ${fgPercentage < 25 ? 'display: none;' : ''}">
              FG: ${metrics.fgIssueCount}
            </span>
          </div>
        </div>
        
        <!-- Statistics -->
        <div style="display: flex; gap: 15px; text-align: center;">
          <div style="flex: 1; padding: 15px; background-color: #e9f0f8; border-radius: 4px; border: 1px solid #cce5ff;">
            <div style="font-size: 24px; font-weight: bold; color: #0051BA;">${metrics.wipIssueCount}</div>
            <div style="font-size: 14px; color: #555;">WIP Issues</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">(Assembly)</div>
          </div>
          
          <div style="flex: 1; padding: 15px; background-color: #f8e9ec; border-radius: 4px; border: 1px solid #f8d7da;">
            <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${metrics.fgIssueCount}</div>
            <div style="font-size: 14px; color: #555;">FG Issues</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">(Packaging)</div>
          </div>
        </div>
        
        <!-- Analysis -->
        <div style="padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef;">
          <div style="font-weight: bold; margin-bottom: 8px;">Analysis:</div>
          <p style="margin: 0; font-size: 14px;">
            ${
              wipPercentage > fgPercentage ? 
                `Assembly (WIP) stage accounts for ${wipPercentage.toFixed(1)}% of issues, indicating a need to focus improvement efforts on this stage.` :
              fgPercentage > wipPercentage ?
                `Packaging (FG) stage accounts for ${fgPercentage.toFixed(1)}% of issues, indicating a need to focus improvement efforts on this stage.` :
                `Issues are evenly distributed between Assembly and Packaging stages, suggesting both areas need equal attention.`
            }
          </p>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  /**
   * Render form analysis chart
   */
  function renderFormAnalysisChart() {
    const container = document.getElementById('form-analysis-chart');
    if (!container) return;
    
    const metrics = window.lotAnalytics.data.metrics;
    
    // Add proper null checks
    if (!metrics || !metrics.internalFormMetrics || typeof metrics.internalFormMetrics.totalForms !== 'number' || metrics.internalFormMetrics.totalForms === 0) {
      container.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">Internal RFT Form Analysis</h3>
        <div style="padding: 30px; text-align: center; background-color: #f8f9fa; border-radius: 4px; color: #666;">
          <p>No form data available for analysis</p>
        </div>
      `;
      return;
    }
    
    // Ensure byErrorType exists before trying to use it
    if (!metrics.internalFormMetrics.byErrorType || Object.keys(metrics.internalFormMetrics.byErrorType).length === 0) {
      container.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">Internal RFT Form Analysis</h3>
        <div style="padding: 30px; text-align: center; background-color: #f8f9fa; border-radius: 4px; color: #666;">
          <p>No error type data available for analysis</p>
        </div>
      `;
      return;
    }
    
    // Get top error types
    const errorTypes = Object.entries(metrics.internalFormMetrics.byErrorType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Create chart HTML
    let html = `
      <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">Internal RFT Form Analysis</h3>
      
      <div style="margin-bottom: 20px;">
        <div style="font-weight: bold; margin-bottom: 10px;">Top Error Types</div>
        
        ${errorTypes.map(([errorType, count]) => {
          const percentage = (count / metrics.internalFormMetrics.totalForms) * 100;
          return `
            <div style="margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <div>${errorType}</div>
                <div>${count} (${percentage.toFixed(1)}%)</div>
              </div>
              <div style="height: 20px; background-color: #f0f0f0; border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: ${percentage}%; background-color: #0051BA;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <div style="font-size: 14px; color: #666; text-align: center;">
        Based on ${metrics.internalFormMetrics.totalForms} form errors across all lots
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  /**
   * Render error by form chart
   */
  function renderErrorByFormChart() {
    const container = document.getElementById('error-by-form-chart');
    if (!container) return;
    
    const metrics = window.lotAnalytics.data.metrics;
    
    // Add proper null checks
    if (!metrics || !metrics.internalFormMetrics || 
        typeof metrics.internalFormMetrics.totalForms !== 'number' || 
        metrics.internalFormMetrics.totalForms === 0 ||
        !metrics.internalFormMetrics.byFormTitle) {
      container.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">Errors by Form Title</h3>
        <div style="padding: 30px; text-align: center; background-color: #f8f9fa; border-radius: 4px; color: #666;">
          <p>No form data available for analysis</p>
        </div>
      `;
      return;
    }
    
    // Get top forms by error count
    const formErrors = Object.entries(metrics.internalFormMetrics.byFormTitle)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Create donut chart HTML
    let html = `
      <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">Errors by Form Title</h3>
      
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <!-- Form error table -->
        <div style="max-height: 200px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #dee2e6;">Form Title</th>
                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">Count</th>
                <th style="padding: 8px; text-align: right; border-bottom: 1px solid #dee2e6;">Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${formErrors.map(([formTitle, count]) => {
                const percentage = (count / metrics.internalFormMetrics.totalForms) * 100;
                return `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${formTitle}</td>
                    <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">${count}</td>
                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #dee2e6;">${percentage.toFixed(1)}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Action recommendation -->
        <div style="padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
          <div style="font-weight: bold; margin-bottom: 8px;">Recommendation:</div>
          <p style="margin: 0; font-size: 14px;">
            ${formErrors.length > 0 ? 
              `Focus improvement efforts on the "${formErrors[0][0]}" form which accounts for the highest percentage of errors.` :
              `No specific form has a significantly higher error rate than others.`
            }
          </p>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  /**
   * Render error maker chart
   */
  function renderErrorMakerChart() {
    const container = document.getElementById('error-maker-chart');
    if (!container) return;
    
    const metrics = window.lotAnalytics.data.metrics;
    
    // Add proper null checks
    if (!metrics || !metrics.internalFormMetrics || 
        typeof metrics.internalFormMetrics.totalForms !== 'number' || 
        metrics.internalFormMetrics.totalForms === 0 || 
        !metrics.internalFormMetrics.byErrorMaker ||
        Object.keys(metrics.internalFormMetrics.byErrorMaker).length === 0) {
      container.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">Error Attribution</h3>
        <div style="padding: 30px; text-align: center; background-color: #f8f9fa; border-radius: 4px; color: #666;">
          <p>No error attribution data available</p>
        </div>
      `;
      return;
    }
    
    // Get top error makers
    const errorMakers = Object.entries(metrics.internalFormMetrics.byErrorMaker)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Create chart HTML
    let html = `
      <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">Error Attribution</h3>
      
      <div style="margin-bottom: 20px;">
        ${errorMakers.map(([errorMaker, count]) => {
          const percentage = (count / metrics.internalFormMetrics.totalForms) * 100;
          return `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <div>${errorMaker}</div>
                <div>${count} (${percentage.toFixed(1)}%)</div>
              </div>
              <div style="height: 24px; background-color: #f8f9fa; border-radius: 4px; overflow: hidden; position: relative;">
                <div style="height: 100%; width: ${percentage}%; background-color: #6c757d;"></div>
                <div style="position: absolute; left: 10px; top: 0; line-height: 24px; font-size: 12px; color: ${percentage > 30 ? 'white' : '#333'};">
                  ${errorMaker}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <div style="padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef;">
        <div style="font-weight: bold; margin-bottom: 8px;">Note:</div>
        <p style="margin: 0; font-size: 14px;">
          This analysis is intended for process improvement, not for individual performance evaluation.
          The goal is to identify training needs and process weaknesses.
        </p>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  /**
   * Render lot-based RFT analysis
   */
  function renderLotBasedRftAnalysis() {
    const container = document.getElementById('critical-factors-chart');
    if (!container) return;
    
    // Clear container first
    container.innerHTML = '';
    
    // Check if we have lot data
    if (!window.lotAnalytics.data.lots || Object.keys(window.lotAnalytics.data.lots).length === 0) {
      container.innerHTML = `
        <div class="data-requirement-message">
          <h3>Lot-Based RFT Analysis</h3>
          <p>No lot data available for analysis</p>
        </div>
      `;
      return;
    }
    
    // Create canvas for chart
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Prepare data for chart
    const lotData = window.lotAnalytics.data.lots;
    const lotKeys = Object.keys(lotData);
    
    // Group lots by RFT status and count
    let rftLots = 0;
    let nonRftLots = 0;
    
    lotKeys.forEach(key => {
      if (lotData[key].isRft) {
        rftLots++;
      } else {
        nonRftLots++;
      }
    });
    
    // Calculate percentages
    const totalLots = lotKeys.length;
    const rftPercentage = (rftLots / totalLots) * 100;
    const nonRftPercentage = (nonRftLots / totalLots) * 100;
    
    // Create chart
    new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['RFT Lots', 'Non-RFT Lots'],
        datasets: [{
          label: 'Lot RFT Status',
          data: [rftPercentage, nonRftPercentage],
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
            text: 'Lot-Based RFT Analysis'
          },
          subtitle: {
            display: true,
            text: `Total Lots: ${totalLots} | RFT Lots: ${rftLots} | Non-RFT Lots: ${nonRftLots}`
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: ${Math.round(value)}%`;
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * Render internal RFT form analysis
   */
  function renderInternalRftFormAnalysis() {
    const container = document.getElementById('failure-prediction-chart');
    if (!container) return;
    
    const metrics = window.lotAnalytics.data.metrics;
    
    // Add proper null checks
    if (!metrics || !metrics.internalFormMetrics || 
        typeof metrics.internalFormMetrics.totalForms !== 'number' || 
        metrics.internalFormMetrics.totalForms === 0 ||
        !metrics.internalFormMetrics.byErrorType) {
      container.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">Internal RFT Form Analysis</h3>
        <div style="padding: 30px; text-align: center; background-color: #f8f9fa; border-radius: 4px; color: #666;">
          <p>No form data available for analysis</p>
        </div>
      `;
      return;
    }
    
    // Get top error types
    const errorTypes = Object.entries(metrics.internalFormMetrics.byErrorType)
      .sort((a, b) => b[1] - a[1]);
    
    // Create chart HTML
    let html = `
      <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">Internal RFT Form Analysis</h3>
      
      <div style="display: flex; flex-direction: column; gap: 15px;">
        <div style="padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #dee2e6;">
          <div style="font-weight: bold; margin-bottom: 10px;">Top Error Types</div>
          
          ${errorTypes.slice(0, 3).map(([errorType, count]) => {
            const percentage = (count / metrics.internalFormMetrics.totalForms) * 100;
            return `
              <div style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <div>${errorType}</div>
                  <div>${count} (${percentage.toFixed(1)}%)</div>
                </div>
                <div style="height: 20px; background-color: #f0f0f0; border-radius: 4px; overflow: hidden;">
                  <div style="height: 100%; width: ${percentage}%; background-color: #0051BA;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  /**
   * Render process cycle time analysis
   */
  function renderProcessCycleTimeAnalysis() {
    const container = document.getElementById('process-optimization-chart');
    if (!container) return;
    
    const metrics = window.lotAnalytics.data.metrics;
    
    // Add proper null checks
    if (!metrics || !metrics.avgCycleTimeByRftStatus || 
        typeof metrics.avgCycleTimeByRftStatus.failing !== 'number' || 
        typeof metrics.avgCycleTimeByRftStatus.passing !== 'number') {
      container.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">Process Cycle Time Analysis</h3>
        <div style="padding: 30px; text-align: center; background-color: #f8f9fa; border-radius: 4px; color: #666;">
          <p>No cycle time data available for analysis</p>
        </div>
      `;
      return;
    }
    
    // Calculate correction impact
    const avgCycleTime = (metrics.avgCycleTimeByRftStatus.passing + metrics.avgCycleTimeByRftStatus.failing) / 2;
    const cycleTimeDifference = metrics.avgCycleTimeByRftStatus.failing - metrics.avgCycleTimeByRftStatus.passing;
    const correctionImpact = cycleTimeDifference > 0 ? (cycleTimeDifference / avgCycleTime) * 100 : 0;
    
    let html = `
      <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">Process Cycle Time Analysis</h3>
      
      <div style="display: flex; gap: 15px; margin-bottom: 15px;">
        <div style="flex: 1; padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #dee2e6; text-align: center;">
          <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Passing Lots Cycle Time</div>
          <div style="font-size: 24px; font-weight: bold; color: #28a745;">
            ${metrics.avgCycleTimeByRftStatus.passing.toFixed(1)}d
          </div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">
            Average
          </div>
        </div>
        
        <div style="flex: 1; padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #dee2e6; text-align: center;">
          <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Failing Lots Cycle Time</div>
          <div style="font-size: 24px; font-weight: bold; color: #dc3545;">
            ${metrics.avgCycleTimeByRftStatus.failing.toFixed(1)}d
          </div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">
            Average
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  /**
   * Render correction impact analysis
   */
  function renderCorrectionImpactAnalysis() {
    const container = document.getElementById('correction-impact-chart');
    if (!container) return;
    
    const metrics = window.lotAnalytics.data.metrics;
    
    // Add proper null checks
    if (!metrics || !metrics.avgCycleTimeByRftStatus || 
        typeof metrics.avgCycleTimeByRftStatus.failing !== 'number' || 
        typeof metrics.avgCycleTimeByRftStatus.passing !== 'number') {
      container.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">Correction Impact Analysis</h3>
        <div style="padding: 30px; text-align: center; background-color: #f8f9fa; border-radius: 4px; color: #666;">
          <p>No correction impact data available for analysis</p>
        </div>
      `;
      return;
    }
    
    // Calculate correction impact
    const avgCycleTime = (metrics.avgCycleTimeByRftStatus.passing + metrics.avgCycleTimeByRftStatus.failing) / 2;
    const cycleTimeDifference = metrics.avgCycleTimeByRftStatus.failing - metrics.avgCycleTimeByRftStatus.passing;
    const correctionImpact = cycleTimeDifference > 0 ? (cycleTimeDifference / avgCycleTime) * 100 : 0;
    
    let html = `
      <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">Correction Impact Analysis</h3>
      
      <div style="padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #dee2e6;">
        <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 14px; color: #444;">Improvement Potential</h4>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">Current Average Cycle Time</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid #dee2e6; font-weight: bold;">
              ${avgCycleTime.toFixed(1)}d
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">Optimized Potential</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid #dee2e6; font-weight: bold;">
              ${metrics.avgCycleTimeByRftStatus.passing.toFixed(1)}d
            </td>
          </tr>
          <tr>
            <td style="padding: 8px;">Potential Savings</td>
            <td style="padding: 8px; text-align: right; font-weight: bold; color: ${cycleTimeDifference > 0 ? '#28a745' : '#666'};">
              ${cycleTimeDifference > 0 ? cycleTimeDifference.toFixed(1) + 'd per lot' : 'No significant savings'}
            </td>
          </tr>
        </table>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  /**
   * Render documentation issue analysis
   */
  function renderDocumentationIssueAnalysis() {
    const container = document.getElementById('documentation-correlation-chart');
    if (!container) return;
    
    const metrics = window.lotAnalytics.data.metrics;
    
    // Add proper null checks
    if (!metrics || !metrics.documentationIssues || 
        typeof metrics.documentationIssues.total !== 'number' || 
        metrics.documentationIssues.total === 0) {
      container.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">Documentation Issue Analysis</h3>
        <div style="padding: 30px; text-align: center; background-color: #f8f9fa; border-radius: 4px; color: #666;">
          <p>No documentation issues found in the data</p>
        </div>
      `;
      return;
    }
    
    // Get safe values with fallbacks for missing properties
    const wipCount = metrics.documentationIssues.wipCount || 0;
    const fgCount = metrics.documentationIssues.fgCount || 0;
    const total = metrics.documentationIssues.total || (wipCount + fgCount);
    
    // Create chart HTML
    let html = `
      <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #333;">Documentation Issue Analysis</h3>
      
      <div style="padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #dee2e6;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">Total Documentation Issues</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid #dee2e6; font-weight: bold;">
              ${total}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">Documentation Issues in WIP</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid #dee2e6;">
              ${wipCount} (${total > 0 ? (wipCount / total * 100).toFixed(1) : 0}%)
            </td>
          </tr>
          <tr>
            <td style="padding: 8px;">Documentation Issues in FG</td>
            <td style="padding: 8px; text-align: right;">
              ${fgCount} (${total > 0 ? (fgCount / total * 100).toFixed(1) : 0}%)
            </td>
          </tr>
        </table>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  /**
   * Set up tab listeners for insights and lot analytics tabs
   */
  function setupTabListeners() {
    console.log('Setting up tab listeners for lot analytics');
    
    // Add click handlers for insights and lot-analytics tabs
    const insightsTab = document.getElementById('insights-tab');
    const lotAnalyticsTab = document.getElementById('lot-analytics-tab');
    
    if (insightsTab) {
      insightsTab.addEventListener('click', function() {
        console.log('Insights tab clicked, refreshing charts');
        renderLotAnalyticsCharts();
      });
    }
    
    if (lotAnalyticsTab) {
      lotAnalyticsTab.addEventListener('click', function() {
        console.log('Lot analytics tab clicked, refreshing charts');
        renderLotAnalyticsCharts();
      });
    }
    
    // Also add listeners for the existing tabs
    document.querySelectorAll('.tab-item').forEach(tab => {
      if (tab.id !== 'insights-tab' && tab.id !== 'lot-analytics-tab') {
        tab.addEventListener('click', function() {
          console.log('Tab clicked:', this.getAttribute('data-tab'));
        });
      }
    });
    
    console.log('Tab listeners set up');
  }

  /**
   * Initialize the enhanced lot analytics module
   */
  function initialize() {
    console.log('Enhanced Lot-Based Analytics initializing...');
    
    // Set up event listeners for tab switching
    setupTabListeners();
    
    console.log('Enhanced Lot-Based Analytics initialized');
  }
  
  // Call initialize at the end
  initialize();

  // Store chart instances to prevent re-creation
  window.lotAnalyticsCharts = window.lotAnalyticsCharts || {};
  
  /**
   * Create or update a chart, preventing duplication and chart destruction
   * @param {string} containerId - The ID of the chart container
   * @param {object} chartConfig - The Chart.js configuration
   * @returns {Chart} The created or updated chart
   */
  function createOrUpdateChart(containerId, chartConfig) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container ${containerId} not found`);
      return null;
    }
    
    // If we already have a chart in this container, destroy it
    if (window.lotAnalyticsCharts[containerId]) {
      console.log(`Updating existing chart in ${containerId}`);
      try {
        window.lotAnalyticsCharts[containerId].destroy();
      } catch (err) {
        console.warn(`Error destroying chart: ${err.message}`);
      }
      delete window.lotAnalyticsCharts[containerId];
    }
    
    // Clear container and create fresh canvas element
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Create and store new chart
    try {
      window.lotAnalyticsCharts[containerId] = new Chart(canvas, chartConfig);
      return window.lotAnalyticsCharts[containerId];
    } catch (err) {
      console.error(`Error creating chart in ${containerId}:`, err);
      container.innerHTML = `<div style="padding: 20px; text-align: center;">Error creating chart: ${err.message}</div>`;
      return null;
    }
  }
  
  /**
   * Render Overview tab with lot-based data
   */
  function renderOverviewTab() {
    console.log('Rendering Overview tab content with lot-based analytics');
    
    try {
      // Render lot-based RFT analysis
      if (typeof renderLotBasedRftAnalysis === 'function') {
        renderLotBasedRftAnalysis();
      }
      
      // Render other overview charts if needed
      const metrics = window.lotAnalytics.data.metrics;
      if (!metrics) return;
      
      // Update overview metrics
      updateElementText('critical-path-value', getCriticalPathName());
      updateElementText('confidence-score', calculateDataConfidenceScore() + '%');
      updateElementText('rft-deviation', calculateRftDeviation());
      updateElementText('risk-potential', calculateRiskPotential());
    } catch (error) {
      console.error('Error rendering Overview tab:', error);
    }
  }
  
  /**
   * Render Internal RFT tab with lot-based data
   */
  function renderInternalRftTab() {
    console.log('Rendering Internal RFT tab content with lot-based analytics');
    
    try {
      // Render internal RFT form analysis
      if (typeof renderInternalRftFormAnalysis === 'function') {
        renderInternalRftFormAnalysis();
      }
      
      // Render WIP vs FG comparison if it exists in this tab
      const wipFgComparisonChart = document.getElementById('wip-fg-comparison-chart');
      if (wipFgComparisonChart && typeof renderWipFgComparisonChart === 'function') {
        renderWipFgComparisonChart();
      }
    } catch (error) {
      console.error('Error rendering Internal RFT tab:', error);
    }
  }
  
  /**
   * Render External RFT tab with lot-based data
   */
  function renderExternalRftTab() {
    console.log('Rendering External RFT tab content with lot-based analytics');
    
    try {
      // Render documentation issue analysis
      if (typeof renderDocumentationIssueAnalysis === 'function') {
        renderDocumentationIssueAnalysis();
      }
      
      // Placeholder content for external RFT tab if elements don't exist
      const externalChartContainers = document.querySelectorAll('#external-rft-content .chart-container');
      externalChartContainers.forEach(container => {
        if (container.children.length === 0) {
          container.innerHTML = `
            <div class="chart-placeholder">
              <h3>External RFT Analysis</h3>
              <p>Detailed external RFT analysis with lot-based data.</p>
            </div>
          `;
        }
      });
    } catch (error) {
      console.error('Error rendering External RFT tab:', error);
    }
  }
  
  /**
   * Render Process Metrics tab with lot-based data
   */
  function renderProcessMetricsTab() {
    console.log('Rendering Process Metrics tab content with lot-based analytics');
    
    try {
      // Render process cycle time analysis
      if (typeof renderProcessCycleTimeAnalysis === 'function') {
        renderProcessCycleTimeAnalysis();
      }
      
      // Render correction impact analysis
      if (typeof renderCorrectionImpactAnalysis === 'function') {
        renderCorrectionImpactAnalysis();
      }
    } catch (error) {
      console.error('Error rendering Process Metrics tab:', error);
    }
  }
})();