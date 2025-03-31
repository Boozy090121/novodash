/**
 * Lot Analytics Initialization Fix
 * 
 * This script fixes the issue with lot-based analytics not initializing properly.
 * Add this script to your index.html file right before the closing </body> tag.
 */

(function() {
  console.log('Lot Analytics Initialization Fix loaded');
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, fixing lot analytics initialization');
    
    // Check for data availability and initialize lot analytics
    checkForDataAndInitLotAnalytics();
    
    // Add to existing data loading button if present
    const loadButton = document.getElementById('loadDataButton');
    if (loadButton) {
      loadButton.addEventListener('click', function() {
        // Give the data processing time to complete before initializing lot analytics
        setTimeout(checkForDataAndInitLotAnalytics, 1000);
      });
    }
  });
  
  // Function to check for data and initialize lot analytics
  function checkForDataAndInitLotAnalytics() {
    const maxAttempts = 5;
    let attempts = 0;
    
    // Try immediately
    if (initializeLotAnalytics()) {
      return;
    }
    
    // Set interval to keep trying
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (initializeLotAnalytics()) {
        clearInterval(checkInterval);
        console.log('Lot analytics initialized successfully after ' + attempts + ' attempts');
        return;
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('Failed to initialize lot analytics after ' + maxAttempts + ' attempts');
      }
    }, 1000);
  }
  
  // Function to initialize lot analytics
  function initializeLotAnalytics() {
    console.log('Attempting to initialize lot analytics...');
    
    // Check if processed data exists
    if (!window.processedData || !window.processedData.records) {
      console.log('No processed data available yet');
      return false;
    }
    
    try {
      console.log('Found processed data with ' + window.processedData.records.length + ' records');
      
      // Initialize lot analytics functions if they exist
      if (typeof window.performLotLevelAnalysis === 'function') {
        console.log('Executing performLotLevelAnalysis');
        window.processedData = window.performLotLevelAnalysis(window.processedData);
      }
      
      // Call lot analytics rendering if available
      if (typeof window.renderLotAnalyticsCharts === 'function') {
        console.log('Executing renderLotAnalyticsCharts');
        window.renderLotAnalyticsCharts();
      } 
      // Or try accessing through window.lotAnalytics object
      else if (window.lotAnalytics && typeof window.lotAnalytics.renderCharts === 'function') {
        console.log('Executing lotAnalytics.renderCharts');
        window.lotAnalytics.renderCharts();
      }
      // If neither exists, try some direct chart render calls
      else {
        console.log('No dedicated rendering function found, attempting direct chart renders');
        
        // Try rendering specific lot-based charts if functions exist
        if (typeof window.renderWipFgComparisonChart === 'function') {
          window.renderWipFgComparisonChart();
        }
        
        if (typeof window.renderFormAnalysisChart === 'function') {
          window.renderFormAnalysisChart();
        }
        
        if (typeof window.renderErrorByFormChart === 'function') {
          window.renderErrorByFormChart();
        }
        
        if (typeof window.renderErrorMakerChart === 'function') {
          window.renderErrorMakerChart();
        }
      }
      
      // Update status message
      const statusElement = document.getElementById('data-status');
      if (statusElement) {
        statusElement.textContent = 'Lot-based analytics active';
        statusElement.style.color = '#28a745';
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing lot analytics:', error);
      return false;
    }
  }

  // Manually expose key functions to window scope if they don't exist
  if (window.lotAnalytics && !window.renderLotAnalyticsCharts) {
    window.renderLotAnalyticsCharts = function() {
      console.log('Wrapper renderLotAnalyticsCharts called');
      
      // Try to render individual chart components
      if (typeof window.renderWipFgComparisonChart === 'function') {
        window.renderWipFgComparisonChart();
      }
      
      if (typeof window.renderFormAnalysisChart === 'function') {
        window.renderFormAnalysisChart();
      }
      
      if (typeof window.renderErrorByFormChart === 'function') {
        window.renderErrorByFormChart();
      }
      
      if (typeof window.renderErrorMakerChart === 'function') {
        window.renderErrorMakerChart();
      }
      
      if (typeof window.renderLotBasedRftAnalysis === 'function') {
        window.renderLotBasedRftAnalysis();
      }
      
      if (typeof window.renderInternalRftFormAnalysis === 'function') {
        window.renderInternalRftFormAnalysis();
      }
      
      if (typeof window.renderProcessCycleTimeAnalysis === 'function') {
        window.renderProcessCycleTimeAnalysis();
      }
      
      if (typeof window.renderCorrectionImpactAnalysis === 'function') {
        window.renderCorrectionImpactAnalysis();
      }
      
      if (typeof window.renderDocumentationIssueAnalysis === 'function') {
        window.renderDocumentationIssueAnalysis();
      }
    };
  }
})();
