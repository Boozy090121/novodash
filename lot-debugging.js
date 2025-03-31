/**
 * Lot Debugging Utility
 * 
 * This script helps identify issues with lot grouping by analyzing 
 * all the lots identified by the data adapter and listing them with details.
 */

(function() {
  console.log('Lot debugging utility loaded');
  
  // Initialize debugging when data is available
  document.addEventListener('DOMContentLoaded', function() {
    // Check for data immediately
    if (window.processedData && window.processedData.records) {
      console.log('Data already available, analyzing lots');
      analyzeLots();
      return;
    }
    
    // Wait for data to become available
    const dataWatcher = setInterval(() => {
      if (window.processedData && window.processedData.records) {
        clearInterval(dataWatcher);
        console.log('Data now available, analyzing lots');
        analyzeLots();
      }
    }, 1000);
    
    // Give up after 30 seconds
    setTimeout(() => {
      clearInterval(dataWatcher);
      console.warn('Timeout waiting for data');
    }, 30000);
  });
  
  /**
   * Main function to analyze lots using the data adapter
   */
  function analyzeLots() {
    console.log('Starting lot analysis...');
    
    // Initialize the data adapter
    const adapter = new LotBasedDataAdapter();
    
    // Process the data
    const processedData = adapter.processRecords(window.processedData.records);
    
    // Retrieve lot debugging information
    const lotDebug = adapter.debugLotData();
    
    // Output summary
    console.log('=== LOT ANALYSIS SUMMARY ===');
    console.log(`Total Lots: ${lotDebug.summary.totalLots}`);
    console.log(`Lots with Process Records: ${lotDebug.summary.lotsWithProcessRecords}`);
    console.log(`Lots with Internal Records: ${lotDebug.summary.lotsWithInternalRecords}`);
    console.log(`Lots with External Records: ${lotDebug.summary.lotsWithExternalRecords}`);
    console.log(`Potential Anomalies: ${lotDebug.summary.potentialAnomalies}`);
    
    // Count proper lot IDs vs numeric work orders
    const lotDetails = lotDebug.lotDetails;
    const properLotIds = Object.keys(lotDetails).filter(id => adapter._isProperLotId(id));
    const nonProperIds = Object.keys(lotDetails).filter(id => !adapter._isProperLotId(id));
    
    console.log(`Proper Lot IDs (PAR/NAR format): ${properLotIds.length}`);
    console.log(`Numeric/Other IDs (likely work orders): ${nonProperIds.length}`);
    
    // Output lots sorted by potential issues
    console.log('\n=== LOT DETAILS (SORTED BY POTENTIAL ISSUES) ===');
    const sortedLots = Object.values(lotDebug.lotDetails)
      .sort((a, b) => {
        // First, sort by proper lot ID (put proper lots first)
        const aIsProper = adapter._isProperLotId(a.lotId);
        const bIsProper = adapter._isProperLotId(b.lotId);
        
        if (aIsProper !== bIsProper) {
          return aIsProper ? -1 : 1;
        }
        
        // Then by potential anomaly
        if (a.potentialAnomaly !== b.potentialAnomaly) {
          return a.potentialAnomaly ? -1 : 1;
        }
        
        // Then by record count (higher first)
        return b.totalRecords - a.totalRecords;
      });
    
    // Output the first 20 lots or all if fewer
    const displayCount = Math.min(sortedLots.length, 20);
    for (let i = 0; i < displayCount; i++) {
      const lot = sortedLots[i];
      const isProperLotId = adapter._isProperLotId(lot.lotId);
      
      console.log(`Lot ${i+1}: ${lot.lotId} ${isProperLotId ? '✓' : '⚠️'} - ${lot.totalRecords} records (${lot.recordCounts.process} process, ${lot.recordCounts.internal} internal, ${lot.recordCounts.external} external)${lot.potentialAnomaly ? ' [ANOMALY]' : ''}`);
      
      // Output samples of record details for this lot
      if (lot.processRecordSample) {
        console.log(`  Process Sample: ${JSON.stringify(lot.processRecordSample)}`);
      }
      if (lot.internalRecordSample) {
        console.log(`  Internal Sample: ${JSON.stringify(lot.internalRecordSample)}`);
      }
      if (lot.externalRecordSample) {
        console.log(`  External Sample: ${JSON.stringify(lot.externalRecordSample)}`);
      }
    }
    
    // Create lot report on the page
    createLotReport(lotDebug, sortedLots, adapter);
  }
  
  /**
   * Create a visual report of lots in the page
   */
  function createLotReport(lotDebug, sortedLots, adapter) {
    // Look for insights tab content
    const insightsContent = document.getElementById('insights-content');
    if (!insightsContent) {
      console.warn('Could not find insights content element to add lot report');
      return;
    }
    
    // Count proper lot IDs vs numeric work orders
    const lotDetails = lotDebug.lotDetails;
    const properLotIds = Object.keys(lotDetails).filter(id => adapter._isProperLotId(id));
    const nonProperIds = Object.keys(lotDetails).filter(id => !adapter._isProperLotId(id));
    
    // Calculate RFT statistics
    const lotsWithRftStatus = sortedLots.filter(lot => lot.isRft !== null).length;
    const rftLots = sortedLots.filter(lot => lot.isRft === true).length;
    const nonRftLots = sortedLots.filter(lot => lot.isRft === false).length;
    const rftPercentage = lotsWithRftStatus > 0 ? ((rftLots / lotsWithRftStatus) * 100).toFixed(1) : "0.0";
    
    // Create the report container
    const reportContainer = document.createElement('div');
    reportContainer.className = 'chart-container';
    reportContainer.innerHTML = `
      <h3>Lot Analysis Debug Report</h3>
      <div style="margin-bottom: 15px; text-align: right;">
        <button id="reprocess-lots-button" style="background-color: #0051BA; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
          Reprocess Data (Fix Work Order Issues)
        </button>
      </div>
      <div id="lot-debug-summary" style="margin-bottom: 15px;">
        <p><strong>Total Lots:</strong> ${lotDebug.summary.totalLots}</p>
        <p><strong>Proper Lot IDs (PAR/NAR format):</strong> ${properLotIds.length}</p>
        <p><strong>Numeric Work Orders:</strong> ${nonProperIds.length}</p>
        <p><strong>Lots with Process Records:</strong> ${lotDebug.summary.lotsWithProcessRecords}</p>
        <p><strong>Lots with Internal Records:</strong> ${lotDebug.summary.lotsWithInternalRecords}</p>
        <p><strong>Lots with External Records:</strong> ${lotDebug.summary.lotsWithExternalRecords}</p>
        <p><strong>Lots with RFT Status:</strong> ${lotsWithRftStatus} (${rftLots} RFT, ${nonRftLots} non-RFT, ${rftPercentage}% RFT Rate)</p>
        <p><strong>Potential Anomalies:</strong> ${lotDebug.summary.potentialAnomalies}</p>
      </div>
      <div id="lot-debug-details" style="max-height: 400px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Lot ID</th>
              <th style="text-align: center; padding: 8px; border-bottom: 1px solid #ddd;">Valid Format</th>
              <th style="text-align: center; padding: 8px; border-bottom: 1px solid #ddd;">RFT Status</th>
              <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Process</th>
              <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Internal</th>
              <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">External</th>
              <th style="text-align: center; padding: 8px; border-bottom: 1px solid #ddd;">Anomaly</th>
            </tr>
          </thead>
          <tbody id="lot-table-body">
            ${sortedLots.map((lot, index) => {
              const isProperLotId = adapter._isProperLotId(lot.lotId);
              
              // Handle RFT status display
              let rftStatusDisplay = '-';
              let rftStatusClass = '';
              
              if (lot.isRft === true) {
                rftStatusDisplay = '✓ PASS';
                rftStatusClass = 'color: green;';
              } else if (lot.isRft === false) {
                rftStatusDisplay = '✗ FAIL';
                rftStatusClass = 'color: red;';
              } else {
                rftStatusDisplay = 'N/A';
                rftStatusClass = 'color: gray;';
              }
              
              const rowStyle = lot.potentialAnomaly ? 'background-color: #ffebee;' : 
                              !isProperLotId ? 'background-color: #fff8e1;' : '';
              
              return `
                <tr style="${rowStyle}">
                  <td style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">${lot.lotId}</td>
                  <td style="text-align: center; padding: 8px; border-bottom: 1px solid #ddd;">${isProperLotId ? '✓' : '⚠️'}</td>
                  <td style="text-align: center; padding: 8px; border-bottom: 1px solid #ddd; ${rftStatusClass}">${rftStatusDisplay}</td>
                  <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">${lot.recordCounts.process}</td>
                  <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">${lot.recordCounts.internal}</td>
                  <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">${lot.recordCounts.external}</td>
                  <td style="text-align: center; padding: 8px; border-bottom: 1px solid #ddd;">${lot.potentialAnomaly ? '⚠️' : ''}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      
      <div id="lot-list-section" style="margin-top: 20px;">
        <h4>Proper Lot IDs (${properLotIds.length})</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; max-height: 200px; overflow-y: auto; padding: 10px; border: 1px solid #eee;">
          ${properLotIds.map(id => `<div style="background: #e3f2fd; padding: 5px 10px; border-radius: 4px;">${id}</div>`).join('')}
        </div>
        
        <h4 style="margin-top: 15px;">Numeric Work Orders (${nonProperIds.length})</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; max-height: 200px; overflow-y: auto; padding: 10px; border: 1px solid #eee;">
          ${nonProperIds.map(id => `<div style="background: #fff8e1; padding: 5px 10px; border-radius: 4px;">${id}</div>`).join('')}
        </div>
      </div>
    `;
    
    // Add the report to the insights tab
    insightsContent.appendChild(reportContainer);
    
    // Add event listener to the reprocess button
    const reprocessButton = document.getElementById('reprocess-lots-button');
    if (reprocessButton) {
      reprocessButton.addEventListener('click', function() {
        console.log('Reprocessing data to fix work order issues...');
        reprocessButton.textContent = 'Processing...';
        reprocessButton.disabled = true;
        
        // Add a small delay to let the UI update
        setTimeout(function() {
          // Create a proper data adapter with work order mapping improvements
          const adapter = new LotBasedDataAdapter();
          
          // Process the data
          const processedData = adapter.processRecords(window.processedData.records);
          
          // Update the global results
          window.lotBasedAdapterResults = processedData;
          
          // Trigger lot analysis refresh
          if (window.initializeLotAnalysis) {
            window.initializeLotAnalysis();
          }
          
          // Reload the debugging analysis
          analyzeLots();
          
          // Update button state
          reprocessButton.textContent = 'Reprocessed Successfully!';
          setTimeout(() => {
            reprocessButton.textContent = 'Reprocess Data (Fix Work Order Issues)';
            reprocessButton.disabled = false;
          }, 3000);
        }, 100);
      });
    }
  }
})(); 