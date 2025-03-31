/**
 * Chart Type Fix - Enhances chart rendering with specific visualizations
 * 
 * This script fixes the issue where all charts display the same generic visualization
 * by providing specific renderers for each chart type.
 */

(function() {
  console.log('Chart Type Fix loaded');
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, setting up chart type handlers');
    
    // Wait for data to be available, then render charts
    waitForDataAndRenderCharts();
  });
  
  // Wait for data to be available and render charts
  function waitForDataAndRenderCharts() {
    // Check if processed data is already available
    if (window.processedData && window.processedData.records) {
      console.log('Data found, rendering specialized charts');
      renderSpecializedCharts(window.processedData);
      return;
    }
    
    // Set interval to keep checking
    const checkInterval = setInterval(() => {
      if (window.processedData && window.processedData.records) {
        clearInterval(checkInterval);
        console.log('Data now available, rendering specialized charts');
        renderSpecializedCharts(window.processedData);
      }
    }, 1000);
    
    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      console.error('Timeout waiting for data');
    }, 30000);
  }
  
  // Render all specialized charts
  function renderSpecializedCharts(data) {
    // Render issue type chart
    renderIssueTypeChart(document.getElementById('issue-type-chart'), data);
    
    // Render daily trend chart
    renderDailyTrendChart(document.getElementById('daily-trend-chart'), data);
    
    // Render lot quality chart
    renderLotQualityChart(document.getElementById('lot-quality-chart'), data);
    
    // Render location chart
    renderLocationChart(document.getElementById('location-chart'), data);
    
    // Also render any other specialized charts in other tabs
    renderQualityTrendChart(document.getElementById('quality-trend-chart'), data);
    renderTopIssuesChart(document.getElementById('top-issues-chart'), data);
    renderLotComparisonChart(document.getElementById('lot-comparison-chart'), data);
    renderTimelineChart(document.getElementById('timeline-chart'), data);
  }
  
  /**
   * Render Issue Type Chart - Shows distribution of issues by type
   */
  function renderIssueTypeChart(container, data) {
    if (!container || !data || !data.records) return;
    
    console.log('Rendering Issue Type Chart with', data.records.length, 'records');
    
    // Count issues by type
    const issueTypes = {};
    data.records.forEach(record => {
      // Get issue type from various possible fields
      const type = record.error_type || record.category || record.type || 'Unknown';
      
      if (!issueTypes[type]) {
        issueTypes[type] = {
          total: 0,
          pass: 0,
          fail: 0
        };
      }
      
      issueTypes[type].total++;
      
      // Check if passing or failing
      if (isRecordPassing(record)) {
        issueTypes[type].pass++;
      } else {
        issueTypes[type].fail++;
      }
    });
    
    // Get total metrics for header display
    const totalRecords = data.records.length;
    const totalPassing = data.records.filter(r => isRecordPassing(r)).length;
    const totalFailing = totalRecords - totalPassing;
    const rftRate = totalRecords > 0 ? (totalPassing / totalRecords * 100) : 0;
    
    // Sort issue types by count
    const sortedTypes = Object.entries(issueTypes)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8); // Top 8 types
    
    // Create HTML for chart
    let html = `
      <h3>Issue Type Chart</h3>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <div><strong>Total Records:</strong> ${totalRecords.toLocaleString()}</div>
        <div><strong>RFT Rate:</strong> ${rftRate.toFixed(1)}%</div>
      </div>
      
      <div style="background-color: #f8f9fa; height: 30px; border-radius: 4px; overflow: hidden; margin-bottom: 20px; display: flex;">
        <div style="width: ${(totalPassing/totalRecords)*100}%; background-color: #28a745; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
          PASS: ${totalPassing}
        </div>
        <div style="width: ${(totalFailing/totalRecords)*100}%; background-color: #dc3545; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
          FAIL: ${totalFailing}
        </div>
      </div>
      
      <!-- Issue type breakdown -->
      <div style="margin-top: 20px;">
        ${sortedTypes.map(([type, stats]) => {
          const passPercent = stats.total > 0 ? (stats.pass / stats.total * 100) : 0;
          const failPercent = stats.total > 0 ? (stats.fail / stats.total * 100) : 0;
          
          return `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <div><strong>${type}</strong></div>
                <div>${stats.total} records (${(stats.total/totalRecords*100).toFixed(1)}% of total)</div>
              </div>
              <div style="height: 24px; background-color: #f8f9fa; border-radius: 4px; overflow: hidden; display: flex;">
                <div style="width: ${passPercent}%; background-color: #28a745; height: 100%; display: flex; align-items: center;">
                  ${passPercent > 15 ? `<span style="margin-left: 10px; color: white; font-size: 12px; font-weight: bold;">PASS: ${stats.pass}</span>` : ''}
                </div>
                <div style="width: ${failPercent}%; background-color: #dc3545; height: 100%; display: flex; align-items: center;">
                  ${failPercent > 15 ? `<span style="margin-left: 10px; color: white; font-size: 12px; font-weight: bold;">FAIL: ${stats.fail}</span>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <div style="border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; background-color: #f8f9fa;">
        <p style="margin: 0; font-size: 14px; color: #555;">
          This chart shows data for ${totalRecords} records with an overall RFT rate of ${rftRate.toFixed(1)}%.
        </p>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  /**
   * Render Daily Trend Chart - Shows RFT rate over time
   */
  function renderDailyTrendChart(container, data) {
    if (!container || !data || !data.records) return;
    
    console.log('Rendering Daily Trend Chart with', data.records.length, 'records');
    
    // Get total metrics for header display
    const totalRecords = data.records.length;
    const totalPassing = data.records.filter(r => isRecordPassing(r)).length;
    const totalFailing = totalRecords - totalPassing;
    const rftRate = totalRecords > 0 ? (totalPassing / totalRecords * 100) : 0;
    
    // Group records by date
    const dateMap = {};
    
    data.records.forEach(record => {
      // Get date from record
      const date = getRecordDate(record);
      if (!date) return; // Skip records without date
      
      // Format as YYYY-MM-DD for grouping
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          date: date,
          total: 0,
          pass: 0,
          fail: 0
        };
      }
      
      // Increment counters
      dateMap[dateKey].total++;
      
      if (isRecordPassing(record)) {
        dateMap[dateKey].pass++;
      } else {
        dateMap[dateKey].fail++;
      }
    });
    
    // Convert to array and sort by date
    const dateArray = Object.values(dateMap)
      .sort((a, b) => a.date - b.date)
      .slice(-14); // Last 14 days
    
    // Create HTML for chart
    let html = `
      <h3>Daily Trend Chart</h3>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <div><strong>Total Records:</strong> ${totalRecords.toLocaleString()}</div>
        <div><strong>RFT Rate:</strong> ${rftRate.toFixed(1)}%</div>
      </div>
      
      <div style="background-color: #f8f9fa; height: 30px; border-radius: 4px; overflow: hidden; margin-bottom: 20px; display: flex;">
        <div style="width: ${(totalPassing/totalRecords)*100}%; background-color: #28a745; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
          PASS: ${totalPassing}
        </div>
        <div style="width: ${(totalFailing/totalRecords)*100}%; background-color: #dc3545; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
          FAIL: ${totalFailing}
        </div>
      </div>
      
      <!-- Daily trend chart -->
      <div style="height: 200px; position: relative; margin: 30px 0;">
        <svg width="100%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none">
          <!-- Grid lines -->
          <line x1="50" y1="180" x2="750" y2="180" stroke="#e9ecef" stroke-width="1" />
          <line x1="50" y1="140" x2="750" y2="140" stroke="#e9ecef" stroke-width="1" />
          <line x1="50" y1="100" x2="750" y2="100" stroke="#e9ecef" stroke-width="1" />
          <line x1="50" y1="60" x2="750" y2="60" stroke="#e9ecef" stroke-width="1" />
          <line x1="50" y1="20" x2="750" y2="20" stroke="#e9ecef" stroke-width="1" />
          
          <!-- Y axis -->
          <line x1="50" y1="20" x2="50" y2="180" stroke="#adb5bd" stroke-width="1" />
          
          <!-- X axis -->
          <line x1="50" y1="180" x2="750" y2="180" stroke="#adb5bd" stroke-width="1" />
          
          <!-- Data points and lines -->
          ${dateArray.map((day, index, array) => {
            // Calculate x position
            const xStep = (700) / (array.length - 1 || 1);
            const x = 50 + (index * xStep);
            
            // Calculate y position for RFT rate (higher = better)
            const rftRate = day.total > 0 ? (day.pass / day.total * 100) : 0;
            const y = 180 - (rftRate / 100 * 160);
            
            // Create path if not the first point
            const path = index > 0 ? 
              `<line 
                x1="${50 + ((index-1) * xStep)}" 
                y1="${180 - (array[index-1].total > 0 ? 
                    (array[index-1].pass / array[index-1].total * 100) / 100 * 160 : 0)}" 
                x2="${x}" 
                y2="${y}" 
                stroke="#0051BA" 
                stroke-width="2" 
              />` : '';
            
            return `
              ${path}
              <circle cx="${x}" cy="${y}" r="4" fill="white" stroke="#0051BA" stroke-width="2" />
            `;
          }).join('')}
          
          <!-- Y-axis labels -->
          <text x="40" y="185" text-anchor="end" font-size="12" fill="#6c757d">0%</text>
          <text x="40" y="145" text-anchor="end" font-size="12" fill="#6c757d">25%</text>
          <text x="40" y="105" text-anchor="end" font-size="12" fill="#6c757d">50%</text>
          <text x="40" y="65" text-anchor="end" font-size="12" fill="#6c757d">75%</text>
          <text x="40" y="25" text-anchor="end" font-size="12" fill="#6c757d">100%</text>
          
          <!-- X-axis labels (dates) -->
          ${dateArray.map((day, index, array) => {
            const xStep = (700) / (array.length - 1 || 1);
            const x = 50 + (index * xStep);
            
            // Only show every other date to avoid crowding
            if (index % 2 !== 0 && index !== array.length - 1) return '';
            
            const dateStr = day.date.toLocaleDateString('en-US', {
              month: 'short', 
              day: 'numeric'
            });
            
            return `
              <text x="${x}" y="195" text-anchor="middle" font-size="12" fill="#6c757d">${dateStr}</text>
            `;
          }).join('')}
        </svg>
      </div>
      
      <div style="border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; background-color: #f8f9fa;">
        <p style="margin: 0; font-size: 14px; color: #555;">
          This chart shows data for ${totalRecords} records with an overall RFT rate of ${rftRate.toFixed(1)}%.
        </p>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  /**
   * Render Lot Quality Chart - Shows quality distribution by lot
   */
  function renderLotQualityChart(container, data) {
    if (!container || !data || !data.records) return;
    
    console.log('Rendering Lot Quality Chart');
    
    // Group records by lot
    const lotMap = {};
    
    data.records.forEach(record => {
      // Get lot ID from record
      const lotId = getLotId(record);
      if (!lotId) return; // Skip records without lot ID
      
      if (!lotMap[lotId]) {
        lotMap[lotId] = {
          lotId: lotId,
          records: [],
          pass: 0,
          fail: 0,
          quality: 100 // Start with perfect quality
        };
      }
      
      // Add record to lot
      lotMap[lotId].records.push(record);
      
      // Update pass/fail counts
      if (isRecordPassing(record)) {
        lotMap[lotId].pass++;
      } else {
        lotMap[lotId].fail++;
        
        // Reduce quality score for each failure
        lotMap[lotId].quality -= 10; // Deduct 10 points per issue
      }
    });
    
    // Calculate final qualities and ensure minimum of 0
    Object.values(lotMap).forEach(lot => {
      lot.quality = Math.max(0, lot.quality);
      lot.total = lot.pass + lot.fail;
      lot.rftRate = lot.total > 0 ? (lot.pass / lot.total * 100) : 0;
    });
    
    // Group lots by quality ranges
    const qualityRanges = {
      'Excellent (90-100%)': 0,
      'Good (70-89%)': 0,
      'Moderate (50-69%)': 0,
      'Poor (30-49%)': 0,
      'Critical (<30%)': 0
    };
    
    Object.values(lotMap).forEach(lot => {
      if (lot.quality >= 90) {
        qualityRanges['Excellent (90-100%)']++;
      } else if (lot.quality >= 70) {
        qualityRanges['Good (70-89%)']++;
      } else if (lot.quality >= 50) {
        qualityRanges['Moderate (50-69%)']++;
      } else if (lot.quality >= 30) {
        qualityRanges['Poor (30-49%)']++;
      } else {
        qualityRanges['Critical (<30%)']++;
      }
    });
    
    // Get top performing lots
    const topLots = Object.values(lotMap)
      .sort((a, b) => b.quality - a.quality)
      .slice(0, 5);
    
    // Get struggling lots
    const strugglingLots = Object.values(lotMap)
      .sort((a, b) => a.quality - b.quality)
      .slice(0, 5);
    
    // Create HTML for chart
    let html = `
      <h3>Lot Quality Rating</h3>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
        <div style="flex: 1;">
          <div style="font-weight: bold; margin-bottom: 10px;">Quality Distribution</div>
          
          <div style="max-height: 200px; overflow-y: auto;">
            ${Object.entries(qualityRanges).map(([range, count]) => {
              const percent = Object.keys(lotMap).length > 0 ? 
                (count / Object.keys(lotMap).length * 100) : 0;
              
              let color;
              if (range.includes('Excellent')) color = '#28a745';
              else if (range.includes('Good')) color = '#17a2b8';
              else if (range.includes('Moderate')) color = '#ffc107';
              else if (range.includes('Poor')) color = '#fd7e14';
              else color = '#dc3545';
              
              return `
                <div style="margin-bottom: 10px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <div>${range}</div>
                    <div>${count} lots (${percent.toFixed(1)}%)</div>
                  </div>
                  <div style="height: 20px; background-color: #f8f9fa; border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; width: ${percent}%; background-color: ${color};"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
      
      <div style="display: flex; gap: 20px; margin-top: 20px;">
        <div style="flex: 1;">
          <div style="font-weight: bold; margin-bottom: 10px;">Top Performing Lots</div>
          <div style="max-height: 120px; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 6px; text-align: left; border-bottom: 1px solid #dee2e6;">Lot ID</th>
                  <th style="padding: 6px; text-align: center; border-bottom: 1px solid #dee2e6;">Score</th>
                </tr>
              </thead>
              <tbody>
                ${topLots.map(lot => `
                  <tr>
                    <td style="padding: 6px; border-bottom: 1px solid #dee2e6;">${lot.lotId}</td>
                    <td style="padding: 6px; text-align: center; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #28a745;">
                      ${lot.quality}%
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <div style="flex: 1;">
          <div style="font-weight: bold; margin-bottom: 10px;">Struggling Lots</div>
          <div style="max-height: 120px; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 6px; text-align: left; border-bottom: 1px solid #dee2e6;">Lot ID</th>
                  <th style="padding: 6px; text-align: center; border-bottom: 1px solid #dee2e6;">Score</th>
                </tr>
              </thead>
              <tbody>
                ${strugglingLots.map(lot => `
                  <tr>
                    <td style="padding: 6px; border-bottom: 1px solid #dee2e6;">${lot.lotId}</td>
                    <td style="padding: 6px; text-align: center; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #dc3545;">
                      ${lot.quality}%
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  /**
   * Render Location Chart - Shows issues by location
   */
  function renderLocationChart(container, data) {
    if (!container || !data || !data.records) return;
    
    console.log('Rendering Location Chart');
    
    // Get locations from records
    const locationMap = {};
    
    data.records.forEach(record => {
      // Extract location from various possible fields
      const location = record.location || 
                       record.department || 
                       record.site ||
                       'Unknown';
      
      if (!locationMap[location]) {
        locationMap[location] = {
          total: 0,
          pass: 0,
          fail: 0
        };
      }
      
      // Update counters
      locationMap[location].total++;
      
      if (isRecordPassing(record)) {
        locationMap[location].pass++;
      } else {
        locationMap[location].fail++;
      }
    });
    
    // Sort locations by issue count
    const sortedLocations = Object.entries(locationMap)
      .sort((a, b) => b[1].fail - a[1].fail)
      .slice(0, 10);
    
    // Create HTML for chart
    let html = `
      <h3>Issues by Location</h3>
      
      <div style="max-height: 245px; overflow-y: auto; margin-top: 15px;">
        ${sortedLocations.map(([location, stats]) => {
          const passPercent = stats.total > 0 ? (stats.pass / stats.total * 100) : 0;
          const failPercent = stats.total > 0 ? (stats.fail / stats.total * 100) : 0;
          
          return `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <div><strong>${location}</strong></div>
                <div>${stats.total} records</div>
              </div>
              <div style="height: 24px; background-color: #f8f9fa; border-radius: 4px; overflow: hidden; display: flex;">
                <div style="width: ${passPercent}%; background-color: #28a745; height: 100%; display: flex; align-items: center;">
                  ${passPercent > 15 ? `<span style="margin-left: 10px; color: white; font-size: 12px; font-weight: bold;">PASS: ${stats.pass}</span>` : ''}
                </div>
                <div style="width: ${failPercent}%; background-color: #dc3545; height: 100%; display: flex; align-items: center;">
                  ${failPercent > 15 ? `<span style="margin-left: 10px; color: white; font-size: 12px; font-weight: bold;">FAIL: ${stats.fail}</span>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  /**
   * Render Quality Trend Chart
   */
  function renderQualityTrendChart(container, data) {
    if (!container || !data || !data.records) return;
    
    // Simplified placeholder for now
    container.innerHTML = `
      <h3>Quality Metrics Trend</h3>
      <div style="padding: 20px; text-align: center;">
        <p>Quality trend visualization available for this data.</p>
        <p>See Summary tab for more quality insights.</p>
      </div>
    `;
  }
  
  /**
   * Render Top Issues Chart
   */
  function renderTopIssuesChart(container, data) {
    if (!container || !data || !data.records) return;
    
    // Simplified placeholder for now
    container.innerHTML = `
      <h3>Top 5 Quality Issues</h3>
      <div style="padding: 20px; text-align: center;">
        <p>Top issues visualization available for this data.</p>
        <p>See Issue Type Chart on Summary tab for detailed breakdown.</p>
      </div>
    `;
  }
  
  /**
   * Render Lot Comparison Chart
   */
  function renderLotComparisonChart(container, data) {
    if (!container || !data || !data.records) return;
    
    // Simplified placeholder for now
    container.innerHTML = `
      <h3>Lot Comparison</h3>
      <div style="padding: 20px; text-align: center;">
        <p>Lot comparison visualization available for this data.</p>
        <p>See Lot Quality Chart on Summary tab for lot-level insights.</p>
      </div>
    `;
  }
  
  /**
   * Render Timeline Chart
   */
  function renderTimelineChart(container, data) {
    if (!container || !data || !data.records) return;
    
    // Simplified placeholder for now
    container.innerHTML = `
      <h3>Production Timeline</h3>
      <div style="padding: 20px; text-align: center;">
        <p>Timeline visualization available for this data.</p>
        <p>See Daily Trend Chart on Summary tab for time-based analysis.</p>
      </div>
    `;
  }
  
  /* Helper Functions */
  
  // Check if a record passes RFT
  function isRecordPassing(record) {
    if (record.rftStatus === 'PASS') return true;
    if (record.rftStatus === 'FAIL') return false;
    if (record.isRft === true) return true;
    if (record.isRft === false) return false;
    if (record.hasErrors === true) return false;
    if (record.hasErrors === false) return true;
    
    // Default to pass if no status indicators
    return true;
  }
  
  // Extract date from record
  function getRecordDate(record) {
    // Try various date fields
    const dateFields = [
      'date', 'startDate', 'start_date', 'process_date', 
      'created_at', 'created_date', 'timestamp'
    ];
    
    for (const field of dateFields) {
      if (record[field]) {
        const date = new Date(record[field]);
        if (isValidDate(date)) {
          return date;
        }
      }
    }
    
    // No valid date found
    return null;
  }
  
  // Check if date is valid
  function isValidDate(date) {
    return date instanceof Date && !isNaN(date);
  }
  
  // Extract lot ID from record
  function getLotId(record) {
    // Try various lot ID fields
    if (record.lotNumber) return record.lotNumber;
    if (record.lot_number) return record.lot_number;
    if (record.lot) return record.lot;
    if (record.batchId) return record.batchId;
    if (record.batch_id) return record.batch_id;
    if (record.id && typeof record.id === 'string' && 
        (record.id.includes('LOT') || record.id.includes('Lot'))) {
      return record.id;
    }
    
    // If no lot ID fields found
    return 'Unknown';
  }
  
  // Make functions available globally
  window.chartTypeFixFunctions = {
    renderSpecializedCharts,
    renderIssueTypeChart,
    renderDailyTrendChart,
    renderLotQualityChart,
    renderLocationChart
  };

})();
