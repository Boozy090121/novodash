/**
 * Comprehensive Pharmaceutical Manufacturing Lot-Based Analysis
 * 
 * This script performs in-depth analysis of pharmaceutical manufacturing data
 * at the lot/batch level, integrating information from three record types:
 * 1. Process Metrics Records (Commercial Process_Yes/No)
 * 2. Internal RFT Records (Internal RFT_*)
 * 3. External RFT Records (External RFT_*)
 */

(function() {
  console.log('Initializing comprehensive lot-based pharmaceutical analysis...');
  
  // Global storage for analysis results
  window.lotAnalysisResults = {
    lots: {},           // Each lot's consolidated records and analysis 
    metrics: {},        // Overall metrics across all lots
    insights: [],       // Key insights derived from analysis
    recommendations: [] // Actionable recommendations
  };
  
  // Constants for record identification
  const RECORD_TYPES = {
    PROCESS: 'process',
    INTERNAL_RFT: 'internal_rft',
    EXTERNAL_RFT: 'external_rft'
  };
  
  /**
   * Initialize analysis when data is available
   */
  function initialize() {
    // Check for data immediately
    if (window.processedData && window.processedData.records) {
      console.log('Data already available, performing lot-based analysis');
      performAnalysis(window.processedData.records);
      return;
    }
    
    // Set up a watcher for data
    console.log('Setting up watcher for data availability');
    const watcherInterval = setInterval(() => {
      if (window.processedData && window.processedData.records) {
        clearInterval(watcherInterval);
        console.log('Data now available, performing lot-based analysis');
        performAnalysis(window.processedData.records);
      }
    }, 500);
    
    // Add a timeout to prevent endless waiting
    setTimeout(() => {
      clearInterval(watcherInterval);
      console.warn('Timeout waiting for data to become available');
    }, 30000);
  }
  
  /**
   * Main analysis function to process all records
   * @param {Array} records - All records from the dataset
   */
  function performAnalysis(records) {
    console.log(`Starting analysis of ${records.length} records`);
    
    // Step 1: Group records by lot
    const lotGroups = groupRecordsByLot(records);
    
    // Step 2: Process each lot group
    for (const [lotId, lotRecords] of Object.entries(lotGroups)) {
      window.lotAnalysisResults.lots[lotId] = analyzeLot(lotId, lotRecords);
    }
    
    // Step 3: Calculate overall metrics
    window.lotAnalysisResults.metrics = calculateOverallMetrics(window.lotAnalysisResults.lots);
    
    // Step 4: Generate insights
    window.lotAnalysisResults.insights = generateInsights(window.lotAnalysisResults.lots, window.lotAnalysisResults.metrics);
    
    // Step 5: Generate recommendations
    window.lotAnalysisResults.recommendations = generateRecommendations(window.lotAnalysisResults.lots, window.lotAnalysisResults.metrics);
    
    // Output the summary of results
    console.log(`Analysis complete for ${Object.keys(window.lotAnalysisResults.lots).length} lots`);
    outputAnalysisSummary();
  }
  
  /**
   * Group all records by their lot/batch identifier
   * @param {Array} records - All records from the dataset
   * @returns {Object} Records grouped by lot ID
   */
  function groupRecordsByLot(records) {
    console.log('Grouping records by lot/batch...');
    
    // First pass: Extract Process Metrics records to build work order to lot mappings
    const workOrderToLotMap = {};
    const lotToRecordsMap = {};
    
    // Track record numbers for debugging
    let processRecordsCount = 0;
    let internalRftRecordsCount = 0;
    let externalRftRecordsCount = 0;
    
    // First, identify all Process Metrics records to extract work order -> lot mappings
    records.forEach(record => {
      const recordType = getRecordType(record);
      if (recordType === RECORD_TYPES.PROCESS) {
        processRecordsCount++;
        
        // Extract lot (fg_batch) and work orders (assembly_wo and cartoning_wo)
        if (record.fg_batch) {
          const lotId = normalizeLotId(record.fg_batch);
          
          // Map both assembly and cartoning work orders to this lot
          if (record.assembly_wo) {
            const workOrder = record.assembly_wo.toString();
            workOrderToLotMap[workOrder] = lotId;
          }
          
          if (record.cartoning_wo) {
            const workOrder = record.cartoning_wo.toString();
            workOrderToLotMap[workOrder] = lotId;
          }
          
          // Initialize lot records array
          if (!lotToRecordsMap[lotId]) {
            lotToRecordsMap[lotId] = [];
          }
          
          // Add this process record to the lot
          lotToRecordsMap[lotId].push({
            ...record,
            recordType,
            normalizedLotId: lotId
          });
        }
      }
    });
    
    // Log work order mapping information
    console.log(`Built work order to lot mapping with ${Object.keys(workOrderToLotMap).length} work orders`);
    if (Object.keys(workOrderToLotMap).length > 0) {
      console.log(`Sample work orders: ${Object.keys(workOrderToLotMap).slice(0, 5).join(', ')}`);
    }
    
    // Second pass: Process Internal RFT and External RFT records
    records.forEach(record => {
      const recordType = getRecordType(record);
      if (!recordType || recordType === RECORD_TYPES.PROCESS) {
        return; // Skip non-categorized or process records (already processed)
      }
      
      let assignedLotId = null;
      
      if (recordType === RECORD_TYPES.INTERNAL_RFT) {
        internalRftRecordsCount++;
        
        // For Internal RFT, use wo/lot# to look up the lot via workOrderToLotMap
        if (record['wo/lot#']) {
          const workOrder = record['wo/lot#'].toString();
          if (workOrderToLotMap[workOrder]) {
            assignedLotId = workOrderToLotMap[workOrder];
            console.log(`Mapped Internal RFT work order ${workOrder} to lot ${assignedLotId}`);
          } else {
            // If not in mapping, use the work order as a fallback lot ID
            assignedLotId = normalizeLotId(workOrder);
          }
        }
      } else if (recordType === RECORD_TYPES.EXTERNAL_RFT) {
        externalRftRecordsCount++;
        
        // For External RFT, use the lot field directly
        if (record.lot) {
          assignedLotId = normalizeLotId(record.lot);
        }
      }
      
      // If we have a valid lot ID, add the record to that lot's array
      if (assignedLotId && assignedLotId !== 'UNKNOWN') {
        if (!lotToRecordsMap[assignedLotId]) {
          lotToRecordsMap[assignedLotId] = [];
        }
        
        lotToRecordsMap[assignedLotId].push({
          ...record,
          recordType,
          normalizedLotId: assignedLotId
        });
      }
    });
    
    // Log statistics for debugging
    console.log(`Processed ${processRecordsCount} Process records, ${internalRftRecordsCount} Internal RFT records, ${externalRftRecordsCount} External RFT records`);
    console.log(`Identified ${Object.keys(lotToRecordsMap).length} distinct lots`);
    
    // Filter out lots that don't have enough meaningful data
    const filteredLots = {};
    Object.entries(lotToRecordsMap).forEach(([lotId, lotRecords]) => {
      // Count record types
      const processCount = lotRecords.filter(r => r.recordType === RECORD_TYPES.PROCESS).length;
      const internalCount = lotRecords.filter(r => r.recordType === RECORD_TYPES.INTERNAL_RFT).length;
      const externalCount = lotRecords.filter(r => r.recordType === RECORD_TYPES.EXTERNAL_RFT).length;
      
      // Only include lots with at least one process record or multiple other records
      if (processCount > 0 || (internalCount + externalCount) > 1) {
        filteredLots[lotId] = lotRecords;
      }
    });
    
    console.log(`After filtering, found ${Object.keys(filteredLots).length} relevant lots`);
    
    // Debug: log the first few lot IDs and their record counts
    const sampleLots = Object.entries(filteredLots).slice(0, 5);
    sampleLots.forEach(([lotId, records]) => {
      const processCount = records.filter(r => r.recordType === RECORD_TYPES.PROCESS).length;
      const internalCount = records.filter(r => r.recordType === RECORD_TYPES.INTERNAL_RFT).length;
      const externalCount = records.filter(r => r.recordType === RECORD_TYPES.EXTERNAL_RFT).length;
      
      console.log(`Lot ${lotId}: ${records.length} total records (${processCount} process, ${internalCount} internal, ${externalCount} external)`);
    });
    
    return filteredLots;
  }
  
  /**
   * Extract the raw lot ID from a record based on its type
   * @param {Object} record - A single record from the dataset
   * @param {string} recordType - The type of record (process, internal_rft, external_rft)
   * @returns {string|null} The raw lot ID or null if not found
   */
  function extractRawLotId(record, recordType) {
    switch (recordType) {
      case RECORD_TYPES.PROCESS:
        // Prefer FG batch over bulk batch for Process records
        return record.fg_batch || record.bulk_batch || null;
        
      case RECORD_TYPES.INTERNAL_RFT:
        // Internal RFT uses wo/lot# with bracket notation for special characters
        return record['wo/lot#'] ? record['wo/lot#'].toString() : null;
        
      case RECORD_TYPES.EXTERNAL_RFT:
        // External RFT has a lot field
        return record.lot || null;
        
      default:
        return null;
    }
  }
  
  /**
   * Normalize a lot ID to ensure consistent format
   * @param {string} lotId - The raw lot ID
   * @returns {string} The normalized lot ID
   */
  function normalizeLotId(lotId) {
    if (!lotId) return 'UNKNOWN';
    
    // Convert to string, trim and uppercase
    let normalized = lotId.toString().trim().toUpperCase();
    
    // Remove any non-alphanumeric characters except for common separators
    normalized = normalized.replace(/[^\w\d]/g, '');
    
    return normalized;
  }
  
  /**
   * Determine the type of record (Process, Internal RFT, External RFT)
   * @param {Object} record - A record from the dataset
   * @returns {string|null} The record type or null if can't be determined
   */
  function getRecordType(record) {
    // Check batchId first (most reliable indicator)
    if (record.batchId) {
      if (record.batchId.startsWith('Commercial Process')) {
        return RECORD_TYPES.PROCESS;
      } else if (record.batchId.startsWith('Internal RFT')) {
        return RECORD_TYPES.INTERNAL_RFT;
      } else if (record.batchId.startsWith('External RFT')) {
        return RECORD_TYPES.EXTERNAL_RFT;
      }
    }
    
    // Fallback to checking source field
    if (record.source) {
      const source = record.source.toLowerCase();
      if (source === 'process') {
        return RECORD_TYPES.PROCESS;
      } else if (source === 'internal') {
        return RECORD_TYPES.INTERNAL_RFT;
      } else if (source === 'external') {
        return RECORD_TYPES.EXTERNAL_RFT;
      }
    }
    
    // If we still don't know, check for characteristic fields
    if (record.fg_batch || record.bulk_batch || record.assembly_wo || record.cartoning_wo) {
      return RECORD_TYPES.PROCESS;
    } else if (record['wo/lot#'] || record.error_type || record.form_title) {
      return RECORD_TYPES.INTERNAL_RFT;
    } else if (record.lot && record.category && record.comment) {
      return RECORD_TYPES.EXTERNAL_RFT;
    }
    
    // Can't determine type
    return null;
  }
  
  /**
   * Analyze a single lot by processing all its records
   * @param {string} lotId - The lot identifier
   * @param {Array} lotRecords - All records for this lot
   * @returns {Object} The analysis results for this lot
   */
  function analyzeLot(lotId, lotRecords) {
    console.log(`Analyzing lot ${lotId} with ${lotRecords.length} records`);
    
    // Group records by type
    const processRecords = lotRecords.filter(r => r.recordType === RECORD_TYPES.PROCESS);
    const internalRftRecords = lotRecords.filter(r => r.recordType === RECORD_TYPES.INTERNAL_RFT);
    const externalRftRecords = lotRecords.filter(r => r.recordType === RECORD_TYPES.EXTERNAL_RFT);
    
    // Process the lot-level analysis
    const result = {
      lotId,
      recordCount: lotRecords.length,
      processMetrics: processProcessRecords(processRecords),
      internalRftAnalysis: analyzeInternalRft(internalRftRecords),
      externalRftAnalysis: analyzeExternalRft(externalRftRecords),
      overallRftStatus: determineOverallRftStatus(processRecords, internalRftRecords, externalRftRecords)
    };
    
    // Add overall evaluation for the lot
    result.evaluation = evaluateLot(result);
    
    return result;
  }
  
  /**
   * Process all Process Metrics records for a lot
   * @param {Array} processRecords - Process metrics records for the lot
   * @returns {Object} Processed metrics
   */
  function processProcessRecords(processRecords) {
    if (processRecords.length === 0) {
      return {
        available: false
      };
    }
    
    // For multiple process records, use the one with most complete data
    // (typically the latest one would have the most fields populated)
    const record = processRecords.reduce((best, current) => {
      // Count the number of populated fields as a simple heuristic
      const bestFieldCount = Object.keys(best).filter(k => best[k] !== null && best[k] !== undefined).length;
      const currentFieldCount = Object.keys(current).filter(k => current[k] !== null && current[k] !== undefined).length;
      
      return currentFieldCount > bestFieldCount ? current : best;
    }, processRecords[0]);
    
    // Extract timeline dates
    const timeline = {
      bulkReceiptDate: parseDate(record.bulk_receipt_date),
      assemblyStart: parseDate(record.assembly_start),
      assemblyFinish: parseDate(record.assembly_finish),
      pciLabrReviewDate: parseDate(record["pci_l/a_br_review_date"]),
      nnLabrReviewDate: parseDate(record["nn_l/a_br_review_date"]),
      pciAssemblyCorrections: parseDate(record.pci_assembly_corrections),
      nnReviewOfAssemblyCorrections: parseDate(record.novo_review_of_assembly_corrections),
      assemblyBrApproved: parseDate(record.assembly_br_approved),
      packagingStart: parseDate(record.packaging_start),
      packagingFinish: parseDate(record.packaging_finish),
      pciPackReviewDate: parseDate(record.pci_pack_review_date),
      nnPackReviewDate: parseDate(record.nn_pack_review_date),
      pciFgCorrections: parseDate(record.pci_fg_corrections),
      nnReviewOfFgCorrections: parseDate(record.novo_review_of_fg_corrections),
      fgBrApproved: parseDate(record.fg_br_approved),
      release: parseDate(record.release),
      shipment: parseDate(record.shipment)
    };
    
    // Extract cycle times
    const cycleTimes = {
      totalCycleTime: getNumberValue(record["total_cycle_time_(days)"]),
      assemblyCycleTime: getNumberValue(record.assembly_cycle_time),
      pciWipReviewCycleTime: getNumberValue(record.pci_wip_review_cycle_time),
      nnWipReviewCycleTime: getNumberValue(record.nn_wip_review_cycle_time),
      assemblyToCartoningCycleTime: getNumberValue(record.assembly_to_cartoning_cycle_time),
      pciAssemblyCorrectionsCycleTime: getNumberValue(record.pci_assembly_corrections_cycle_time),
      nnReviewOfAssemblyCorrectionsCycleTime: getNumberValue(record.nn_review_of_assembly_corrections_cycle_time),
      cartoningCycleTime: getNumberValue(record.cartoning_cycle_time),
      pciPackReviewCycleTime: getNumberValue(record.pci_pack_review_cycle_time),
      nnPackReviewCycleTime: getNumberValue(record.nn_pack_review_cycle_time),
      cartoningFinishToReleaseCycleTime: getNumberValue(record.cartoning_finish_to_release_cycle_time),
      pciFgCorrectionsCycleTime: getNumberValue(record.pci_fg_corrections_cycle_time),
      nnReviewOfFgCorrectionsCycleTime: getNumberValue(record.nn_review_of_fg_corrections_cycle_time)
    };
    
    // Additional metadata
    const metadata = {
      fgBatch: record.fg_batch,
      bulkBatch: record.bulk_batch,
      strength: getNumberValue(record.strength),
      calendarYear: getNumberValue(record.calendar_yr),
      released: record.released,
      assemblyWo: getNumberValue(record.assembly_wo),
      cartoningWo: getNumberValue(record.cartoning_wo),
      oee: getNumberValue(record.oee || record["oee's"])
    };
    
    // Calculate critical path and bottlenecks
    const criticalPath = calculateCriticalPath(cycleTimes);
    
    return {
      available: true,
      record,
      timeline,
      cycleTimes,
      metadata,
      criticalPath,
      hasErrors: record.hasErrors === true || record.errorCount > 0
    };
  }
  
  /**
   * Analyze internal RFT records for a lot
   * @param {Array} internalRftRecords - Internal RFT records for the lot
   * @returns {Object} Analyzed internal RFT data
   */
  function analyzeInternalRft(internalRftRecords) {
    if (internalRftRecords.length === 0) {
      return {
        available: false,
        errorCount: 0,
        errorTypes: []
      };
    }
    
    // Calculate total error count
    const totalErrorCount = internalRftRecords.reduce((sum, record) => {
      return sum + getNumberValue(record['#_of_errors'] || record.errorCount || 0);
    }, 0);
    
    // Extract and categorize all error types
    const errorTypes = {};
    const formTitles = {};
    const reviewers = {};
    const errorMakers = {};
    const shifts = {};
    const rooms = {};
    
    for (const record of internalRftRecords) {
      // Capture error type
      if (record.error_type) {
        errorTypes[record.error_type] = (errorTypes[record.error_type] || 0) + 1;
      }
      
      // Capture form title
      if (record.form_title) {
        formTitles[record.form_title] = (formTitles[record.form_title] || 0) + 1;
      }
      
      // Capture QA reviewer
      if (record.qa_reviewer) {
        reviewers[record.qa_reviewer] = (reviewers[record.qa_reviewer] || 0) + 1;
      }
      
      // Capture error maker
      if (record.error_made_by) {
        errorMakers[record.error_made_by] = (errorMakers[record.error_made_by] || 0) + 1;
      }
      
      // Capture shift
      if (record.shift_error__occurred_on) {
        const shift = record.shift_error__occurred_on.toString();
        shifts[shift] = (shifts[shift] || 0) + 1;
      }
      
      // Capture room
      if (record['room_#']) {
        rooms[record['room_#']] = (rooms[record['room_#']] || 0) + 1;
      }
    }
    
    // Convert to sorted arrays for easier consumption
    const errorTypesArray = Object.entries(errorTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
      
    const formTitlesArray = Object.entries(formTitles)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count);
      
    const reviewersArray = Object.entries(reviewers)
      .map(([reviewer, count]) => ({ reviewer, count }))
      .sort((a, b) => b.count - a.count);
      
    const errorMakersArray = Object.entries(errorMakers)
      .map(([maker, count]) => ({ maker, count }))
      .sort((a, b) => b.count - a.count);
      
    const shiftsArray = Object.entries(shifts)
      .map(([shift, count]) => ({ shift, count }))
      .sort((a, b) => b.count - a.count);
      
    const roomsArray = Object.entries(rooms)
      .map(([room, count]) => ({ room, count }))
      .sort((a, b) => b.count - a.count);
    
    // Compile detailed information about significant errors
    const errorDetails = internalRftRecords.map(record => {
      return {
        type: record.error_type || 'Unknown',
        form: record.form_title || 'Unknown',
        count: getNumberValue(record['#_of_errors'] || record.errorCount || 1),
        date: parseDate(record.input_date || record.date_input_date),
        page: record.page,
        reviewer: record.qa_reviewer,
        madeBy: record.error_made_by,
        shift: record.shift_error__occurred_on,
        room: record['room_#'],
        comment: record.if_entry_is_not_available_in_drop_down_specify_here__i_e__error_type_missing_page_missing_person_etc_ || '',
        product: record.product,
        customer: record.customer
      };
    });
    
    return {
      available: true,
      recordCount: internalRftRecords.length,
      errorCount: totalErrorCount,
      errorTypes: errorTypesArray,
      formTitles: formTitlesArray,
      reviewers: reviewersArray,
      errorMakers: errorMakersArray,
      shifts: shiftsArray,
      rooms: roomsArray,
      errorDetails,
      product: internalRftRecords[0].product,
      customer: internalRftRecords[0].customer
    };
  }
  
  /**
   * Analyze external RFT records for a lot
   * @param {Array} externalRftRecords - External RFT records for the lot
   * @returns {Object} Analyzed external RFT data
   */
  function analyzeExternalRft(externalRftRecords) {
    if (externalRftRecords.length === 0) {
      return {
        available: false,
        issueCount: 0,
        categories: []
      };
    }
    
    // Categorize external feedback by category
    const categories = {};
    const stages = {};
    
    for (const record of externalRftRecords) {
      if (record.category) {
        categories[record.category] = (categories[record.category] || 0) + 1;
      }
      
      if (record.stage) {
        stages[record.stage] = (stages[record.stage] || 0) + 1;
      }
    }
    
    // Convert to sorted arrays
    const categoriesArray = Object.entries(categories)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
      
    const stagesArray = Object.entries(stages)
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count);
      
    // Compile detailed issue information
    const issueDetails = externalRftRecords.map(record => {
      return {
        category: record.category || 'Uncategorized',
        stage: record.stage || 'Unknown',
        comment: record.comment || '',
        sequence: record.sequence
      };
    });
    
    return {
      available: true,
      recordCount: externalRftRecords.length,
      issueCount: externalRftRecords.length,
      categories: categoriesArray,
      stages: stagesArray,
      issueDetails
    };
  }
  
  /**
   * Determine the overall RFT status for a lot
   * @param {Array} processRecords - Process records for the lot
   * @param {Array} internalRftRecords - Internal RFT records for the lot
   * @param {Array} externalRftRecords - External RFT records for the lot
   * @returns {Object} Overall RFT status
   */
  function determineOverallRftStatus(processRecords, internalRftRecords, externalRftRecords) {
    // Process records may explicitly state RFT status
    const processRft = processRecords.length > 0 ? !processRecords[0].hasErrors : true;
    
    // For internal RFT, any error record means not RFT
    const internalRft = internalRftRecords.length === 0;
    
    // For external RFT, we'll ignore "Process Clarification" category as these
    // are often informational and don't constitute actual failures
    const nonClarificationIssues = externalRftRecords.filter(r => 
      r.category && r.category !== 'Process Clarification'
    );
    
    const externalRft = nonClarificationIssues.length === 0;
    
    // Overall status depends on all three components
    const isRft = processRft && internalRft && externalRft;
    
    return {
      overall: isRft,
      processRft,
      internalRft,
      externalRft,
      processClarificationsOnly: externalRftRecords.length > 0 && nonClarificationIssues.length === 0
    };
  }
  
  /**
   * Evaluate a lot based on its metrics and analysis
   * @param {Object} lotAnalysis - The complete lot analysis
   * @returns {Object} Evaluation results
   */
  function evaluateLot(lotAnalysis) {
    const evaluation = {
      cycleTimes: {},
      qualityIssues: {},
      riskScore: 0
    };
    
    // Evaluate cycle times if available
    if (lotAnalysis.processMetrics.available) {
      const { cycleTimes } = lotAnalysis.processMetrics;
      
      // Identify particularly long cycle times (if we had benchmarks, we could compare to them)
      const longCycleTimes = [];
      
      if (cycleTimes.totalCycleTime > 90) {
        longCycleTimes.push({
          name: 'Total Cycle Time',
          value: cycleTimes.totalCycleTime,
          severity: 'high'
        });
      }
      
      if (cycleTimes.pciWipReviewCycleTime > 14) {
        longCycleTimes.push({
          name: 'PCI WIP Review',
          value: cycleTimes.pciWipReviewCycleTime,
          severity: 'medium'
        });
      }
      
      if (cycleTimes.nnWipReviewCycleTime > 14) {
        longCycleTimes.push({
          name: 'NN WIP Review',
          value: cycleTimes.nnWipReviewCycleTime,
          severity: 'medium'
        });
      }
      
      evaluation.cycleTimes = {
        longCycleTimes,
        criticalPath: lotAnalysis.processMetrics.criticalPath
      };
    }
    
    // Evaluate quality issues
    if (lotAnalysis.internalRftAnalysis.available) {
      const { errorCount, errorTypes } = lotAnalysis.internalRftAnalysis;
      
      evaluation.qualityIssues.internalErrors = {
        count: errorCount,
        mostCommon: errorTypes.length > 0 ? errorTypes[0].type : 'None',
        severity: errorCount > 10 ? 'high' : errorCount > 5 ? 'medium' : 'low'
      };
    }
    
    if (lotAnalysis.externalRftAnalysis.available) {
      const { issueCount, categories } = lotAnalysis.externalRftAnalysis;
      
      evaluation.qualityIssues.externalIssues = {
        count: issueCount,
        mostCommon: categories.length > 0 ? categories[0].category : 'None',
        severity: issueCount > 5 ? 'high' : issueCount > 2 ? 'medium' : 'low'
      };
    }
    
    // Calculate overall risk score (0-100)
    let riskScore = 0;
    
    // Factor in RFT status
    if (!lotAnalysis.overallRftStatus.overall) {
      riskScore += 30;
    }
    
    // Factor in cycle time
    if (lotAnalysis.processMetrics.available) {
      // Higher cycle times increase risk
      const { totalCycleTime } = lotAnalysis.processMetrics.cycleTimes;
      if (totalCycleTime > 100) riskScore += 30;
      else if (totalCycleTime > 80) riskScore += 20;
      else if (totalCycleTime > 60) riskScore += 10;
    }
    
    // Factor in error counts
    if (lotAnalysis.internalRftAnalysis.available) {
      const { errorCount } = lotAnalysis.internalRftAnalysis;
      if (errorCount > 15) riskScore += 30;
      else if (errorCount > 10) riskScore += 20;
      else if (errorCount > 5) riskScore += 10;
    }
    
    // Factor in external issues
    if (lotAnalysis.externalRftAnalysis.available) {
      const { issueCount } = lotAnalysis.externalRftAnalysis;
      if (issueCount > 10) riskScore += 10;
      else if (issueCount > 5) riskScore += 5;
    }
    
    // Cap at 100
    evaluation.riskScore = Math.min(riskScore, 100);
    
    return evaluation;
  }
  
  /**
   * Calculate the critical path based on cycle times
   * @param {Object} cycleTimes - Cycle time metrics
   * @returns {Object} Critical path analysis
   */
  function calculateCriticalPath(cycleTimes) {
    // Identify the longest cycle times in the process
    const cycleTimeArray = [
      { name: 'Assembly', value: cycleTimes.assemblyCycleTime },
      { name: 'PCI WIP Review', value: cycleTimes.pciWipReviewCycleTime },
      { name: 'NN WIP Review', value: cycleTimes.nnWipReviewCycleTime },
      { name: 'Assembly to Cartoning', value: cycleTimes.assemblyToCartoningCycleTime },
      { name: 'PCI Assembly Corrections', value: cycleTimes.pciAssemblyCorrectionsCycleTime },
      { name: 'NN Review of Assembly Corrections', value: cycleTimes.nnReviewOfAssemblyCorrectionsCycleTime },
      { name: 'Cartoning', value: cycleTimes.cartoningCycleTime },
      { name: 'PCI Pack Review', value: cycleTimes.pciPackReviewCycleTime },
      { name: 'NN Pack Review', value: cycleTimes.nnPackReviewCycleTime },
      { name: 'Cartoning Finish to Release', value: cycleTimes.cartoningFinishToReleaseCycleTime },
      { name: 'PCI FG Corrections', value: cycleTimes.pciFgCorrectionsCycleTime },
      { name: 'NN Review of FG Corrections', value: cycleTimes.nnReviewOfFgCorrectionsCycleTime }
    ];
    
    // Sort by duration (descending)
    cycleTimeArray.sort((a, b) => b.value - a.value);
    
    // Return top contributors to cycle time
    return {
      longest: cycleTimeArray.slice(0, 3),
      total: cycleTimes.totalCycleTime,
      bottlenecks: cycleTimeArray.filter(ct => ct.value > 10)
    };
  }
  
  /**
   * Calculate overall metrics across all lots
   * @param {Object} lotAnalyses - All lot analyses
   * @returns {Object} Overall metrics
   */
  function calculateOverallMetrics(lotAnalyses) {
    const metrics = {
      totalLots: Object.keys(lotAnalyses).length,
      rftLots: 0,
      rftRate: 0,
      avgCycleTime: 0,
      avgErrorCount: 0,
      avgExternalIssues: 0,
      errorTypeFrequency: {},
      externalCategoryFrequency: {},
      formErrorFrequency: {},
      avgWipReviewTime: 0,
      avgFgReviewTime: 0,
      lotsByRiskCategory: {
        low: 0,
        medium: 0,
        high: 0
      }
    };
    
    // Count lots with data available
    let lotsWithCycleTimes = 0;
    let lotsWithInternalRft = 0;
    let lotsWithExternalRft = 0;
    
    // Temporary data for averages
    let totalCycleTime = 0;
    let totalErrorCount = 0;
    let totalExternalIssues = 0;
    let totalWipReviewTime = 0;
    let totalFgReviewTime = 0;
    
    // Process each lot
    for (const lotId in lotAnalyses) {
      const lot = lotAnalyses[lotId];
      
      // RFT status
      if (lot.overallRftStatus.overall) {
        metrics.rftLots++;
      }
      
      // Risk categorization
      if (lot.evaluation.riskScore < 30) {
        metrics.lotsByRiskCategory.low++;
      } else if (lot.evaluation.riskScore < 60) {
        metrics.lotsByRiskCategory.medium++;
      } else {
        metrics.lotsByRiskCategory.high++;
      }
      
      // Process metrics
      if (lot.processMetrics.available) {
        lotsWithCycleTimes++;
        totalCycleTime += lot.processMetrics.cycleTimes.totalCycleTime || 0;
        
        // WIP and FG review times
        const wipReviewTime = (lot.processMetrics.cycleTimes.pciWipReviewCycleTime || 0) + 
                             (lot.processMetrics.cycleTimes.nnWipReviewCycleTime || 0);
        const fgReviewTime = (lot.processMetrics.cycleTimes.pciPackReviewCycleTime || 0) + 
                            (lot.processMetrics.cycleTimes.nnPackReviewCycleTime || 0);
        
        totalWipReviewTime += wipReviewTime;
        totalFgReviewTime += fgReviewTime;
      }
      
      // Internal RFT data
      if (lot.internalRftAnalysis.available) {
        lotsWithInternalRft++;
        totalErrorCount += lot.internalRftAnalysis.errorCount;
        
        // Aggregate error types
        for (const errorType of lot.internalRftAnalysis.errorTypes) {
          if (!metrics.errorTypeFrequency[errorType.type]) {
            metrics.errorTypeFrequency[errorType.type] = 0;
          }
          metrics.errorTypeFrequency[errorType.type] += errorType.count;
        }
        
        // Aggregate form errors
        for (const formTitle of lot.internalRftAnalysis.formTitles) {
          if (!metrics.formErrorFrequency[formTitle.title]) {
            metrics.formErrorFrequency[formTitle.title] = 0;
          }
          metrics.formErrorFrequency[formTitle.title] += formTitle.count;
        }
      }
      
      // External RFT data
      if (lot.externalRftAnalysis.available) {
        lotsWithExternalRft++;
        totalExternalIssues += lot.externalRftAnalysis.issueCount;
        
        // Aggregate categories
        for (const category of lot.externalRftAnalysis.categories) {
          if (!metrics.externalCategoryFrequency[category.category]) {
            metrics.externalCategoryFrequency[category.category] = 0;
          }
          metrics.externalCategoryFrequency[category.category] += category.count;
        }
      }
    }
    
    // Calculate averages
    metrics.rftRate = metrics.totalLots > 0 ? (metrics.rftLots / metrics.totalLots) * 100 : 0;
    metrics.avgCycleTime = lotsWithCycleTimes > 0 ? totalCycleTime / lotsWithCycleTimes : 0;
    metrics.avgErrorCount = lotsWithInternalRft > 0 ? totalErrorCount / lotsWithInternalRft : 0;
    metrics.avgExternalIssues = lotsWithExternalRft > 0 ? totalExternalIssues / lotsWithExternalRft : 0;
    metrics.avgWipReviewTime = lotsWithCycleTimes > 0 ? totalWipReviewTime / lotsWithCycleTimes : 0;
    metrics.avgFgReviewTime = lotsWithCycleTimes > 0 ? totalFgReviewTime / lotsWithCycleTimes : 0;
    
    // Convert frequency maps to sorted arrays
    metrics.topErrorTypes = Object.entries(metrics.errorTypeFrequency)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
      
    metrics.topExternalCategories = Object.entries(metrics.externalCategoryFrequency)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
      
    metrics.topFormErrors = Object.entries(metrics.formErrorFrequency)
      .map(([form, count]) => ({ form, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return metrics;
  }
  
  /**
   * Generate insights based on lot analyses and metrics
   * @param {Object} lotAnalyses - All lot analyses
   * @param {Object} metrics - Overall metrics
   * @returns {Array} Insights
   */
  function generateInsights(lotAnalyses, metrics) {
    const insights = [];
    
    // RFT rate insight
    insights.push({
      category: 'Overall Performance',
      title: `Overall RFT rate is ${metrics.rftRate.toFixed(1)}%`,
      description: `${metrics.rftLots} out of ${metrics.totalLots} lots passed Right First Time criteria.`,
      severity: metrics.rftRate < 50 ? 'high' : metrics.rftRate < 80 ? 'medium' : 'low'
    });
    
    // Cycle time insight
    insights.push({
      category: 'Process Efficiency',
      title: `Average cycle time is ${metrics.avgCycleTime.toFixed(1)} days`,
      description: `Lots with high cycle times may indicate process inefficiencies or quality issues requiring rework.`,
      severity: metrics.avgCycleTime > 90 ? 'high' : metrics.avgCycleTime > 60 ? 'medium' : 'low'
    });
    
    // Review time insight
    insights.push({
      category: 'Review Efficiency',
      title: `WIP reviews average ${metrics.avgWipReviewTime.toFixed(1)} days, FG reviews average ${metrics.avgFgReviewTime.toFixed(1)} days`,
      description: `${metrics.avgWipReviewTime > metrics.avgFgReviewTime ? 'WIP reviews are taking longer than FG reviews.' : 'FG reviews are taking longer than WIP reviews.'}`,
      severity: Math.max(metrics.avgWipReviewTime, metrics.avgFgReviewTime) > 20 ? 'high' : 'medium'
    });
    
    // Most common error types
    if (metrics.topErrorTypes.length > 0) {
      insights.push({
        category: 'Quality',
        title: `Most common error: "${metrics.topErrorTypes[0].type}" (${metrics.topErrorTypes[0].count} occurrences)`,
        description: `This error type represents a significant portion of all internal errors.`,
        severity: metrics.topErrorTypes[0].count > 20 ? 'high' : metrics.topErrorTypes[0].count > 10 ? 'medium' : 'low'
      });
    }
    
    // Error-prone forms
    if (metrics.topFormErrors.length > 0) {
      insights.push({
        category: 'Documentation',
        title: `Most error-prone form: "${metrics.topFormErrors[0].form}" (${metrics.topFormErrors[0].count} errors)`,
        description: `This form consistently shows the highest error rate and may need revision or additional training.`,
        severity: metrics.topFormErrors[0].count > 15 ? 'high' : metrics.topFormErrors[0].count > 8 ? 'medium' : 'low'
      });
    }
    
    // External issues
    if (metrics.topExternalCategories.length > 0) {
      insights.push({
        category: 'External Review',
        title: `Most common external feedback: "${metrics.topExternalCategories[0].category}" (${metrics.topExternalCategories[0].count} instances)`,
        description: `This category of external feedback represents the most frequent issue identified by external reviewers.`,
        severity: metrics.topExternalCategories[0].count > 10 ? 'high' : metrics.topExternalCategories[0].count > 5 ? 'medium' : 'low'
      });
    }
    
    // High risk lots
    if (metrics.lotsByRiskCategory.high > 0) {
      insights.push({
        category: 'Risk Assessment',
        title: `${metrics.lotsByRiskCategory.high} lots classified as high risk`,
        description: `${((metrics.lotsByRiskCategory.high / metrics.totalLots) * 100).toFixed(1)}% of lots show significant quality or cycle time issues requiring immediate attention.`,
        severity: 'high'
      });
    }
    
    // Find worst performing lot
    let worstLot = null;
    let highestRiskScore = -1;
    
    for (const lotId in lotAnalyses) {
      const lot = lotAnalyses[lotId];
      if (lot.evaluation.riskScore > highestRiskScore) {
        highestRiskScore = lot.evaluation.riskScore;
        worstLot = lot;
      }
    }
    
    if (worstLot) {
      insights.push({
        category: 'Lot Analysis',
        title: `Lot ${worstLot.lotId} has the highest risk score (${worstLot.evaluation.riskScore})`,
        description: `This lot shows significant issues in ${worstLot.internalRftAnalysis.available ? `internal quality (${worstLot.internalRftAnalysis.errorCount} errors)` : ''} ${worstLot.processMetrics.available && worstLot.internalRftAnalysis.available ? 'and' : ''} ${worstLot.processMetrics.available ? `cycle time (${worstLot.processMetrics.cycleTimes.totalCycleTime} days)` : ''}.`,
        severity: 'high'
      });
    }
    
    return insights;
  }
  
  /**
   * Generate actionable recommendations based on analysis
   * @param {Object} lotAnalyses - All lot analyses
   * @param {Object} metrics - Overall metrics
   * @returns {Array} Recommendations
   */
  function generateRecommendations(lotAnalyses, metrics) {
    const recommendations = [];
    
    // Recommendations based on top error types
    if (metrics.topErrorTypes.length > 0) {
      recommendations.push({
        category: 'Quality Improvement',
        title: `Address "${metrics.topErrorTypes[0].type}" errors`,
        actions: [
          `Develop targeted training for operators to reduce "${metrics.topErrorTypes[0].type}" errors`,
          `Review form design to see if clarity improvements could reduce this error type`,
          `Consider implementing additional verification steps for this specific error type`
        ],
        priority: metrics.topErrorTypes[0].count > 20 ? 'high' : 'medium'
      });
    }
    
    // Review time recommendations
    if (metrics.avgWipReviewTime > 14 || metrics.avgFgReviewTime > 14) {
      recommendations.push({
        category: 'Process Efficiency',
        title: `Optimize ${metrics.avgWipReviewTime > metrics.avgFgReviewTime ? 'WIP' : 'FG'} review process`,
        actions: [
          `Analyze the ${metrics.avgWipReviewTime > metrics.avgFgReviewTime ? 'WIP' : 'FG'} review workflow to identify bottlenecks`,
          `Consider implementing a triage system to prioritize critical issues`,
          `Evaluate resource allocation for the review team`
        ],
        priority: Math.max(metrics.avgWipReviewTime, metrics.avgFgReviewTime) > 20 ? 'high' : 'medium'
      });
    }
    
    // Form improvement recommendations
    if (metrics.topFormErrors.length > 0) {
      recommendations.push({
        category: 'Documentation',
        title: `Improve "${metrics.topFormErrors[0].form}" form`,
        actions: [
          `Review and redesign "${metrics.topFormErrors[0].form}" to reduce error opportunities`,
          `Provide specialized training for completing this particular form`,
          `Consider adding in-process verification steps for this form`
        ],
        priority: metrics.topFormErrors[0].count > 15 ? 'high' : 'medium'
      });
    }
    
    // External feedback recommendations
    if (metrics.topExternalCategories.length > 0 && metrics.topExternalCategories[0].category !== 'Process Clarification') {
      recommendations.push({
        category: 'External Quality',
        title: `Address "${metrics.topExternalCategories[0].category}" feedback`,
        actions: [
          `Review all instances of "${metrics.topExternalCategories[0].category}" feedback to identify patterns`,
          `Implement preventive measures to address the root causes`,
          `Establish feedback loop with external reviewers to verify improvements`
        ],
        priority: metrics.topExternalCategories[0].count > 10 ? 'high' : 'medium'
      });
    }
    
    // High risk lot recommendations
    if (metrics.lotsByRiskCategory.high > 0) {
      recommendations.push({
        category: 'Risk Management',
        title: `Investigate high-risk lots`,
        actions: [
          `Perform root cause analysis on the ${metrics.lotsByRiskCategory.high} high-risk lots`,
          `Identify any common factors contributing to their issues`,
          `Develop specific action plans for preventing similar issues in future lots`
        ],
        priority: 'high'
      });
    }
    
    // Overall RFT improvement
    if (metrics.rftRate < 80) {
      recommendations.push({
        category: 'Performance Improvement',
        title: `Improve overall RFT rate (currently ${metrics.rftRate.toFixed(1)}%)`,
        actions: [
          `Implement a comprehensive RFT improvement program across all departments`,
          `Set incremental RFT targets with regular progress reviews`,
          `Establish cross-functional teams to address interdepartmental issues`
        ],
        priority: metrics.rftRate < 50 ? 'high' : 'medium'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Output a summary of the analysis results
   */
  function outputAnalysisSummary() {
    const { metrics, insights, recommendations } = window.lotAnalysisResults;
    
    console.log('=== PHARMACEUTICAL LOT ANALYSIS SUMMARY ===');
    console.log(`Analyzed ${metrics.totalLots} lots`);
    console.log(`RFT rate: ${metrics.rftRate.toFixed(1)}% (${metrics.rftLots} of ${metrics.totalLots} lots)`);
    console.log(`Average cycle time: ${metrics.avgCycleTime.toFixed(1)} days`);
    console.log(`Top error type: ${metrics.topErrorTypes.length > 0 ? metrics.topErrorTypes[0].type : 'None'}`);
    
    console.log('\nTOP INSIGHTS:');
    insights.slice(0, 3).forEach((insight, i) => {
      console.log(`${i+1}. ${insight.title} (${insight.severity} severity)`);
    });
    
    console.log('\nTOP RECOMMENDATIONS:');
    recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`${i+1}. ${rec.title} (${rec.priority} priority)`);
    });
    
    console.log('\nAnalysis complete. Use window.lotAnalysisResults to access full results.');
    
    // Create a custom event to notify other parts of the application
    document.dispatchEvent(new CustomEvent('lotAnalysisComplete', {
      detail: window.lotAnalysisResults
    }));
  }
  
  /**
   * Helper function to parse dates safely
   * @param {string} dateString - Date string to parse
   * @returns {Date|null} Parsed date or null if invalid
   */
  function parseDate(dateString) {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }
  
  /**
   * Helper function to get numeric value safely
   * @param {any} value - Value to convert to number
   * @returns {number} Numeric value or 0 if invalid
   */
  function getNumberValue(value) {
    if (value === null || value === undefined) return 0;
    
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  
  // Initialize the analysis when the document is ready
  document.addEventListener('DOMContentLoaded', initialize);
  
  // Also expose direct initialization method
  window.initializeLotAnalysis = initialize;
  
  console.log('Pharmaceutical lot-based analysis script loaded');
})(); 