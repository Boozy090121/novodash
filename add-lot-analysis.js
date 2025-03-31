/**
 * Add Lot Analysis Scripts
 * 
 * This script dynamically adds the lot analysis scripts to the page.
 * Run this in the browser console to add the scripts without modifying the HTML.
 */

(function() {
  function addScript(src, id) {
    // Check if script already exists
    if (document.getElementById(id)) {
      console.log(`Script ${id} already exists`);
      return;
    }
    
    // Create script element
    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    
    // Add to document
    document.body.appendChild(script);
    console.log(`Added script: ${src}`);
  }
  
  // Add our scripts
  addScript('pharmaceutical-lot-analysis.js', 'pharmaceutical-lot-analysis');
  addScript('integrate-lot-analysis.js', 'integrate-lot-analysis');
  
  console.log('Lot analysis scripts added to page');
})(); 