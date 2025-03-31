/**
 * Auto-Load Dashboard Script - Novo Nordisk Analysis Dashboard v4
 * 
 * This script automatically loads and processes data on page load,
 * initializes the lot-based analysis, and configures the dashboard
 * with the new tab structure: Overview, Internal RFT, External RFT, 
 * Process Metrics, and Insights.
 */

(function() {
  console.log('Auto-load script initiated');
  
  // Auto-execute on page load
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded, initializing dashboard...');
    
    // Hide file controls since we're loading automatically
    const fileControls = document.querySelector('.file-controls');
    if (fileControls) {
      fileControls.style.display = 'none';
    }
    
    // Update status message
    const dataStatus = document.getElementById('data-status');
    if (dataStatus) {
      dataStatus.textContent = 'Loading data automatically...';
    }
    
    // Load local JSON data
    loadLocalData();
    
    // Set up tab event listeners
    setupTabListeners();
    
    // Check for data availability and render
    checkDataAvailability();
  });
  
  // Set up tab click listeners
  function setupTabListeners() {
    const tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Show corresponding content
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId + '-content').classList.add('active');
      });
    });
  }
  
  // Load data from local JSON file
  function loadLocalData() {
    console.log('Loading local data...');
    
    // Create XMLHttpRequest (works with local files)
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'dashboard_data.json', true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) { // 0 for local files
          try {
            const data = JSON.parse(xhr.responseText);
            console.log('Loaded data with', data.length, 'records');
            
            // Update status message
            const dataStatus = document.getElementById('data-status');
            if (dataStatus) {
              dataStatus.textContent = 'Data loaded successfully - processing...';
              dataStatus.style.color = '#28a745';
            }
            
            // Process the data using both adapters
            processData(data);
          } catch (error) {
            console.error('Error parsing JSON:', error);
            
            // Update status message
            const dataStatus = document.getElementById('data-status');
            if (dataStatus) {
              dataStatus.textContent = 'Error loading data: ' + error.message;
              dataStatus.style.color = '#dc3545';
            }
          }
        } else {
          console.error('Failed to load data. Status:', xhr.status);
          
          // Update status message
          const dataStatus = document.getElementById('data-status');
          if (dataStatus) {
            dataStatus.textContent = 'Failed to load data. Status: ' + xhr.status;
            dataStatus.style.color = '#dc3545';
          }
        }
      }
    };
    xhr.send();
  }
  
  // Process data using both standard and lot-based adapters
  function processData(data) {
    console.log('Processing data...');
    
    try {
      // Store original raw data globally
      window.rawData = data;
      
      // 1. Process with lot-based adapter (preferred for proper lot analysis)
      if (typeof LotBasedDataAdapter === 'function') {
        console.log('Processing with lot-based adapter...');
        
        const lotAdapter = new LotBasedDataAdapter();
        const lotProcessedData = lotAdapter.processRecords(data);
        
        // Store lot data globally
        window.lotData = lotProcessedData.lotData;
        window.lotMetrics = lotProcessedData.lotMetrics;
        window.processedData = lotProcessedData;
        
        const lotCount = Object.keys(lotProcessedData.lotData).length;
        console.log(`Lot-based processing complete: ${lotCount} lots analyzed`);
      } 
      // 2. If lot-based adapter isn't available, use standard data adapter
      else {
        console.warn('Lot-based adapter not found, using standard data adapter');
        
        const adapter = new DataAdapter();
        const processedData = adapter.processRecords(data);
        
        // Store processed data globally
        window.processedData = processedData;
        window.lotData = processedData.lotData;
        window.lotMetrics = processedData.lotMetrics;
      }
      
      // 3. Validate the processed data
      validateProcessedData();
      
      // 4. Render dashboard with complete data
      renderDashboard();
    } catch (error) {
      console.error('Error processing data:', error);
      
      // Update status message
      const dataStatus = document.getElementById('data-status');
      if (dataStatus) {
        dataStatus.textContent = 'Error processing data: ' + error.message;
        dataStatus.style.color = '#dc3545';
      }
    }
  }
  
  // Validate processed data to ensure we have all needed information
  function validateProcessedData() {
    // Check if we have lot data
    const lotCount = window.lotData ? Object.keys(window.lotData).length : 0;
    
    if (lotCount === 0) {
      console.error('No lots were identified in the data - check lot identification logic');
    } else if (lotCount > 200) {
      console.warn('Unusually high number of lots detected:', lotCount, 
                  'This may indicate incorrect lot identification.');
    } else {
      console.log('Number of lots looks reasonable:', lotCount);
    }
    
    // Ensure lot metrics exist to prevent errors
    if (!window.lotMetrics || Object.keys(window.lotMetrics).length === 0) {
      console.error('No lot metrics calculated - creating default metrics');
      
      // Create comprehensive default metrics if none exist
      window.lotMetrics = {
        totalLots: lotCount,
        lotRftPercentage: 0,
        rftLots: 0,
        nonRftLots: 0,
        wipLots: 0,
        fgLots: 0,
        internalRftFailLots: 0,
        externalRftFailLots: 0,
        avgCycleTimeDays: 0,
        averageTimeMetrics: {
          avgCycleTime: 0,
          avgWipTime: 0,
          avgFgTime: 0
        },
        topInternalIssues: [],
        topExternalIssues: []
      };
    } else {
      // Ensure all required metrics properties exist to prevent null/undefined errors
      window.lotMetrics = {
        ...window.lotMetrics,
        totalLots: window.lotMetrics.totalLots || lotCount || 0,
        lotRftPercentage: window.lotMetrics.lotRftPercentage || 0,
        rftLots: window.lotMetrics.rftLots || 0,
        nonRftLots: window.lotMetrics.nonRftLots || 0,
        wipLots: window.lotMetrics.wipLots || 0,
        fgLots: window.lotMetrics.fgLots || 0,
        internalRftFailLots: window.lotMetrics.internalRftFailLots || 0,
        externalRftFailLots: window.lotMetrics.externalRftFailLots || 0,
        avgCycleTimeDays: window.lotMetrics.avgCycleTimeDays || 
                           (window.lotMetrics.averageTimeMetrics && window.lotMetrics.averageTimeMetrics.avgCycleTime) || 0,
        averageTimeMetrics: window.lotMetrics.averageTimeMetrics || {
          avgCycleTime: 0,
          avgWipTime: 0,
          avgFgTime: 0
        },
        topInternalIssues: window.lotMetrics.topInternalIssues || [],
        topExternalIssues: window.lotMetrics.topExternalIssues || []
      };
    }
    
    console.log('Data validation complete, metrics set:', window.lotMetrics);
  }
  
  // Check for data availability and render when ready
  function checkDataAvailability() {
    const checkInterval = setInterval(() => {
      if (window.processedData) {
        clearInterval(checkInterval);
        renderDashboard();
      }
    }, 500);
    
    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      console.error('Timeout: Data processing took too long');
    }, 30000);
  }
  
  // Render the dashboard with all data
  function renderDashboard() {
    console.log('Rendering dashboard with complete processed data...');
    
    // Update status message
    const dataStatus = document.getElementById('data-status');
    if (dataStatus) {
      dataStatus.textContent = 'Rendering dashboard...';
    }
    
    // 1. First render all charts using the direct chart fix
    if (typeof window.renderAllCharts === 'function') {
      // Pass all needed data to ensure charts render correctly
      window.renderAllCharts(window.processedData);
    } else {
      console.warn('renderAllCharts function not available');
    }
    
    // 2. Wait a moment before rendering lot analytics to prevent conflicts
    setTimeout(() => {
      // Ensure lot analytics rendering happens AFTER charts are rendered
      if (typeof window.processLotBasedAnalytics === 'function') {
        console.log('Rendering lot-based analytics...');
        window.processLotBasedAnalytics();
      }
      
      // Update status when complete
      if (dataStatus) {
        dataStatus.textContent = 'Dashboard ready - All data loaded';
        dataStatus.style.color = '#28a745';
      }
      
      console.log('Dashboard rendering complete');
    }, 500);
  }
})();
