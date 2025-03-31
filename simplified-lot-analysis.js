/**
 * Simplified Lot-Based Analysis Module
 * 
 * This standalone module analyzes data by lot number and renders various visualizations.
 * It does not depend on other complex initialization patterns.
 */

(function() {
  console.log('Simplified Lot Analysis module loaded');
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, initializing simplified lot analysis');
    
    // Check for data immediately, then periodically
    waitForDataAndProcess();
  });
  
  // Wait for data to be available and process it
  function waitForDataAndProcess() {
    if (window.processedData && window.processedData.records) {
      console.log('Data found, processing lot analysis');
      processLotAnalysis();
      return;
    }
    
    console.log('Waiting for data...');
    setTimeout(waitForDataAndProcess, 1000);
  }
  
  // Main function to process lot-based analysis
  function processLotAnalysis() {
    try {
      // Extract records
      const records = window.processedData.records;
      console.log('Processing', records.length, 'records for lot analysis');
      
      // Group records by lot
      const lotData = groupRecordsByLot(records);
      
      // Calculate lot metrics
      const lotMetrics = calculateLotMetrics(lotData);
      
      // Store results for future use
      window.simplifiedLotAnalysis = {
        lotData: lotData,
        lotMetrics: lotMetrics
      };
      
      // Update summary metrics
      updateSummaryMetrics(lotMetrics);
      
      // Render charts
      renderLotCharts(lotData, lotMetrics);
      
      console.log('Lot analysis completed successfully');
    } catch (error) {
      console.error('Error in lot analysis:', error);
    }
  }
  
  // Group records by lot number
  function groupRecordsByLot(records) {
    const lotMap = {};
    
    records.forEach(record => {
      // Extract lot ID from various fields
      const lotId = getLotId(record);
      
      if (!lotId) return; // Skip records without lot ID
      
      if (!lotMap[lotId]) {
        lotMap[lotId] = {
          lotId: lotId,
          records: [],
          wipIssues: [],
          fgIssues: [],
          documentationIssues: [],
          internalForms: [],
          rftStatus: 'PASS', // Default to pass
          cycleTimeData: null
        };
      }
      
      // Add record to lot
      lotMap[lotId].records.push(record);
      
      // Check if record indicates RFT failure
      if (record.rftStatus === 'FAIL' || 
          record.isRft === false || 
          (record.hasErrors !== undefined && record.hasErrors)) {
        lotMap[lotId].rftStatus = 'FAIL';
      }
      
      // Categorize issues
      categorizeIssue(record, lotMap[lotId]);
    });
    
    // Count lots and calculate cycle times
    Object.values(lotMap).forEach(lot => {
      lot.cycleTimeData = calculateLotCycleTime(lot);
    });
    
    return lotMap;
  }
  
  // Extract lot ID from record using various field conventions
  function getLotId(record) {
    // Try various fields where lot ID might be stored
    if (record.lotNumber) return record.lotNumber;
    if (record.lot_number) return record.lot_number;
    if (record.lot) return record.lot;
    if (record.batchId) return record.batchId;
    if (record.batch_id) return record.batch_id;
    if (record.id && typeof record.id === 'string' && record.id.includes('LOT')) return record.id;
    
    // Try to extract from WO/lot field 
    if (record['wo/lot#']) {
      const woLot = record['wo/lot#'];
      // Extract lot part if it contains a slash or hyphen
      if (woLot.includes('/')) {
        return woLot.split('/')[1];
      }
      if (woLot.includes('-')) {
        return woLot.split('-')[1];
      }
      return woLot;
    }
    
    // If no specific lot ID found, use record ID
    return record.id || null;
  }
  
  // Categorize an issue record into WIP/FG and documentation categories
  function categorizeIssue(record, lot) {
    // Skip if not an issue
    if (record.rftStatus !== 'FAIL' && 
        record.isRft !== false && 
        !(record.hasErrors !== undefined && record.hasErrors)) {
      return;
    }
    
    // Determine process stage (WIP vs FG)
    const stage = getProcessStage(record);
    if (stage === 'WIP') {
      lot.wipIssues.push(record);
    } else if (stage === 'FG') {
      lot.fgIssues.push(record);
    }
    
    // Check for documentation issues
    if (record.category && 
        ['Documentation Update', 'Documentation missing', 'Process Clarification'].includes(record.category)) {
      lot.documentationIssues.push(record);
    }
    
    // Check for internal forms
    if (record.form_title || record.error_type) {
      lot.internalForms.push(record);
    }
  }
  
  // Determine process stage (WIP or FG)
  function getProcessStage(record) {
    // Check for explicit stage field
    if (record.stage) return record.stage;
    if (record.process_stage) return record.process_stage;
    
    // Check type field
    if (record.type) {
      if (record.type.includes('Assembly') || 
          record.type.includes('WIP') || 
          record.type.toLowerCase().includes('work in progress')) {
        return 'WIP';
      }
      
      if (record.type.includes('Packaging') || 
          record.type.includes('FG') || 
          record.type.toLowerCase().includes('finished goods')) {
        return 'FG';
      }
    }
    
    // Check department
    if (record.department) {
      if (record.department.includes('Assembly')) return 'WIP';
      if (record.department.includes('Packaging')) return 'FG';
    }
    
    // Check form title for internal RFT
    if (record.form_title) {
      if (record.form_title.includes('Assembly')) return 'WIP';
      if (record.form_title.includes('Packaging')) return 'FG';
    }
    
    // Default based on error type for internal RFT
    if (record.error_type) {
      if (record.error_type.includes('Assembly')) return 'WIP';
      if (record.error_type.includes('Packaging')) return 'FG';
    }
    
    // If can't determine, default to WIP
    return 'WIP';
  }
  
  // Calculate cycle time for a lot
  function calculateLotCycleTime(lot) {
    // Try to find records with start and end dates
    const recordsWithDates = lot.records.filter(r => r.startDate && r.endDate);
    
    if (recordsWithDates.length === 0) {
      // If no complete date records, try to find just a cycle time field
      const recordsWithCycleTime = lot.records.filter(r => 
        r.cycletime || r.cycle_time || r.processDurationDays || 
        r.total_cycle_time_days || r.total_cycle_time || r['total_cycle_time_(days)']
      );
      
      if (recordsWithCycleTime.length > 0) {
        // Find the record with the highest cycle time value
        const record = recordsWithCycleTime.reduce((prev, current) => {
          const prevTime = prev.cycletime || prev.cycle_time || prev.processDurationDays || 
                          prev.total_cycle_time_days || prev.total_cycle_time || prev['total_cycle_time_(days)'] || 0;
                          
          const currentTime = current.cycletime || current.cycle_time || current.processDurationDays || 
                              current.total_cycle_time_days || current.total_cycle_time || current['total_cycle_time_(days)'] || 0;
          
          return prevTime > currentTime ? prev : current;
        });
        
        // Return the cycle time value
        return {
          days: record.cycletime || record.cycle_time || record.processDurationDays || 
                record.total_cycle_time_days || record.total_cycle_time || record['total_cycle_time_(days)'] || 0,
          startDate: record.startDate || null,
          endDate: record.endDate || null
        };
      }
      
      // No cycle time data found
      return {
        days: 0,
        startDate: null,
        endDate: null
      };
    }
    
    // Find the earliest start date and latest end date
    let earliestStart = null;
    let latestEnd = null;
    
    recordsWithDates.forEach(record => {
      const startDate = new Date(record.startDate);
      const endDate = new Date(record.endDate);
      
      if (!earliestStart || startDate < earliestStart) {
        earliestStart = startDate;
      }
      
      if (!latestEnd || endDate > latestEnd) {
        latestEnd = endDate;
      }
    });
    
    // Calculate days difference
    const diffTime = Math.abs(latestEnd - earliestStart);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      days: diffDays,
      startDate: earliestStart,
      endDate: latestEnd
    };
  }
  
  // Calculate lot-level metrics
  function calculateLotMetrics(lotData) {
    const lotArray = Object.values(lotData);
    
    // Basic counts
    const totalLots = lotArray.length;
    const passingLots = lotArray.filter(lot => lot.rftStatus === 'PASS').length;
    const failingLots = totalLots - passingLots;
    const lotRftPercentage = totalLots > 0 ? (passingLots / totalLots) * 100 : 0;
    
    // Issue counts
    const wipIssueCount = lotArray.reduce((sum, lot) => sum + lot.wipIssues.length, 0);
    const fgIssueCount = lotArray.reduce((sum, lot) => sum + lot.fgIssues.length, 0);
    
    // Cycle time analysis
    const lotCycleTimes = {
      passing: [],
      failing: []
    };
    
    lotArray.forEach(lot => {
      if (lot.cycleTimeData && lot.cycleTimeData.days > 0) {
        if (lot.rftStatus === 'PASS') {
          lotCycleTimes.passing.push(lot.cycleTimeData.days);
        } else {
          lotCycleTimes.failing.push(lot.cycleTimeData.days);
        }
      }
    });
    
    // Calculate averages
    const avgCycleTimeByRftStatus = {
      passing: lotCycleTimes.passing.length > 0 
                ? lotCycleTimes.passing.reduce((sum, days) => sum + days, 0) / lotCycleTimes.passing.length 
                : 0,
      failing: lotCycleTimes.failing.length > 0 
                ? lotCycleTimes.failing.reduce((sum, days) => sum + days, 0) / lotCycleTimes.failing.length 
                : 0
    };
    
    // Count documentation issues
    let documentationIssues = {
      total: 0,
      wipCount: 0,
      fgCount: 0,
      byCategory: {}
    };
    
    lotArray.forEach(lot => {
      lot.documentationIssues.forEach(issue => {
        documentationIssues.total++;
        
        // Count by stage
        if (getProcessStage(issue) === 'WIP') {
          documentationIssues.wipCount++;
        } else {
          documentationIssues.fgCount++;
        }
        
        // Count by category
        const category = issue.category || 'Uncategorized';
        if (!documentationIssues.byCategory[category]) {
          documentationIssues.byCategory[category] = 0;
        }
        documentationIssues.byCategory[category]++;
      });
    });
    
    // Analyze internal forms
    let internalFormMetrics = {
      totalForms: 0,
      byFormTitle: {},
      byErrorType: {},
      byErrorMaker: {}
    };
    
    lotArray.forEach(lot => {
      lot.internalForms.forEach(form => {
        internalFormMetrics.totalForms++;
        
        // Count by form title
        const formTitle = form.form_title || 'Unknown';
        if (!internalFormMetrics.byFormTitle[formTitle]) {
          internalFormMetrics.byFormTitle[formTitle] = 0;
        }
        internalFormMetrics.byFormTitle[formTitle]++;
        
        // Count by error type
        const errorType = form.error_type || 'Unknown';
        if (!internalFormMetrics.byErrorType[errorType]) {
          internalFormMetrics.byErrorType[errorType] = 0;
        }
        internalFormMetrics.byErrorType[errorType]++;
        
        // Count by error maker
        const errorMaker = form.error_made_by || 'Unknown';
        if (!internalFormMetrics.byErrorMaker[errorMaker]) {
          internalFormMetrics.byErrorMaker[errorMaker] = 0;
        }
        internalFormMetrics.byErrorMaker[errorMaker]++;
      });
    });
    
    return {
      totalLots,
      passingLots,
      failingLots,
      lotRftPercentage,
      wipIssueCount,
      fgIssueCount,
      avgCycleTimeByRftStatus,
      documentationIssues,
      internalFormMetrics
    };
  }
  
  // Update dashboard summary metrics
  function updateSummaryMetrics(metrics) {
    // Update total lots
    updateElementText('total-records', metrics.totalLots);
    updateElementText('lots-analyzed', metrics.totalLots);
    
    // Update issue rate
    updateElementText('issue-rate', (100 - metrics.lotRftPercentage).toFixed(1) + '%');
    
    // Update RFT rate
    updateElementText('overall-rft-rate', metrics.lotRftPercentage.toFixed(1) + '%');
    
    // Update analysis status
    updateElementText('analysis-status', 'Complete');
    
    // Update lot metrics if elements exist
    updateElementText('total-lots-value', metrics.totalLots);
    updateElementText('lot-rft-percentage', metrics.lotRftPercentage.toFixed(1) + '%');
    updateElementText('wip-issues-count', metrics.wipIssueCount);
    updateElementText('fg-issues-count', metrics.fgIssueCount);
    
    // Update data status message
    updateElementText('data-status', 'Lot-based analytics complete', true);
  }
  
  // Helper function to update element text content
  function updateElementText(id, text, success = false) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
      if (success) {
        element.style.color = '#28a745';
      }
    }
  }
  
  // Render lot-based charts
  function renderLotCharts(lotData, metrics) {
    // Render WIP vs FG comparison chart
    renderWipFgComparisonChart(metrics);
    
    // Render form analysis chart
    renderFormAnalysisChart(metrics);
    
    // Render error by form chart
    renderErrorByFormChart(metrics);
    
    // Render error maker chart
    renderErrorMakerChart(metrics);
  }
  
  // Render WIP vs FG comparison chart
  function renderWipFgComparisonChart(metrics) {
    const container = document.getElementById('wip-fg-comparison-chart');
    if (!container) return;
    
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
  
  // Render form analysis chart
  function renderFormAnalysisChart(metrics) {
    const container = document.getElementById('form-analysis-chart');
    if (!container) return;
    
    if (metrics.internalFormMetrics.totalForms === 0) {
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
              <div style="height: 20px; background-color: #f8f9fa; border-radius: 4px; overflow: hidden;">
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
  
  // Render error by form chart
  function renderErrorByFormChart(metrics) {
    const container = document.getElementById('error-by-form-chart');
    if (!container) return;
    
    if (metrics.internalFormMetrics.totalForms === 0) {
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
  
  // Render error maker chart
  function renderErrorMakerChart(metrics) {
    const container = document.getElementById('error-maker-chart');
    if (!container) return;
    
    if (metrics.internalFormMetrics.totalForms === 0 || 
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
  
  // Make key functions available globally
  window.simplifiedLotAnalysis = {
    processLotAnalysis: processLotAnalysis,
    renderWipFgComparisonChart: renderWipFgComparisonChart,
    renderFormAnalysisChart: renderFormAnalysisChart,
    renderErrorByFormChart: renderErrorByFormChart,
    renderErrorMakerChart: renderErrorMakerChart
  };
})();
