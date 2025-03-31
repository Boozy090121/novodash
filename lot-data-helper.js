/**
 * Lot Data Helper - Enhances data processing and triggers events
 * 
 * This script enhances the data processing flow and helps with coordinating
 * data processing and chart rendering.
 */

(function() {
  console.log('Lot Data Helper loaded - Setting up event dispatching');
  
  // Function to monitor data availability
  function checkDataAvailability() {
    // If we have both lotData and lotMetrics, dispatch the event
    if (window.lotData && window.lotMetrics && window.lotMetrics.totalLots > 0) {
      console.log('Data processing complete, dispatching lotDataProcessed event');
      document.dispatchEvent(new CustomEvent('lotDataProcessed', {
        detail: {
          dataSource: 'lot-data-helper',
          timestamp: new Date().toISOString(),
          metrics: {
            totalLots: window.lotMetrics.totalLots,
            rftLots: window.lotMetrics.rftLots,
            nonRftLots: window.lotMetrics.nonRftLots
          }
        }
      }));
      return true;
    }
    return false;
  }
  
  // Check immediately
  if (checkDataAvailability()) {
    console.log('Data already available');
  } else {
    console.log('Waiting for data to become available');
    
    // Set up interval to check periodically
    const checkInterval = setInterval(() => {
      if (checkDataAvailability()) {
        clearInterval(checkInterval);
      }
    }, 1000);
    
    // Don't let the interval run forever
    setTimeout(() => {
      clearInterval(checkInterval);
      console.log('Giving up waiting for data');
    }, 10000);
  }
  
  // Enhance the load data button to trigger the event
  document.addEventListener('DOMContentLoaded', () => {
    const loadButton = document.getElementById('loadDataButton');
    if (loadButton) {
      // Wrap the existing click handler
      const originalClick = loadButton.onclick;
      loadButton.addEventListener('click', function(e) {
        // Let the original handler run (if any)
        if (originalClick) {
          originalClick.call(this, e);
        }
        
        // After a delay for processing, check and dispatch the event
        setTimeout(() => {
          checkDataAvailability();
        }, 3000);
      });
      console.log('Enhanced load data button with event dispatching');
    }
  });
})(); 