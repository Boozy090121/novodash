/**
 * Pharmaceutical Process & Quality KPI Dashboard - Data Adapter
 * 
 * This adapter processes pharmaceutical manufacturing JSON data and
 * calculates metrics for RFT rates, process timelines, and quality outcomes.
 * 
 * Version 4.0: Enhanced with lot-based analysis capabilities
 */

class DataAdapter {
  constructor() {
    this.data = null;
    this.processedData = null;
    this.fieldMap = {};
    this.lotData = {}; // Added: Store lot-based grouped data
    this.capabilities = {
      hasRftData: false,
      hasProcessTimeData: false,
      hasIssueData: false,
      hasExternalSubmissionData: false,
      hasHistoricalData: false,
      hasLotAnalysis: true // Added: Lot analysis capability
    };
  }

  /**
   * Discover schema from sample data records
   * @param {Array|Object} data - The raw data to analyze
   */
  discoverSchema(data) {
    console.log('Discovering schema for pharmaceutical data...');
    
    // Normalize data to array
    const records = Array.isArray(data) ? data : data.records || [];
    
    if (records.length === 0) {
      console.warn('No records found to discover schema');
      return;
    }
    
    // Sample records for each record type for better schema discovery
    const processRecords = records.filter(r => r.batchId && r.batchId.startsWith('Commercial Process')).slice(0, 10);
    const internalRftRecords = records.filter(r => r.batchId && r.batchId.startsWith('Internal RFT')).slice(0, 10);
    const externalRftRecords = records.filter(r => r.batchId && r.batchId.startsWith('External RFT')).slice(0, 10);
    
    console.log(`Found sample records: ${processRecords.length} Process, ${internalRftRecords.length} Internal RFT, ${externalRftRecords.length} External RFT`);
    
    // Hard-code field mappings based on actual field names in the dataset
    this.fieldMap = {
      // Common fields for all record types
      id: 'batchId',
      
      // Process Metrics specific fields
      fgBatch: 'fg_batch',
      bulkBatch: 'bulk_batch',
      assemblyWO: 'assembly_wo',
      cartoningWO: 'cartoning_wo',
      
      // Process dates
      bulkReceiptDate: 'bulk_receipt_date',
      assemblyStart: 'assembly_start',
      assemblyFinish: 'assembly_finish',
      packagingStart: 'packaging_start',
      packagingFinish: 'packaging_finish',
      release: 'release',
      shipment: 'shipment',
      
      // Internal RFT specific fields
      workOrder: 'wo/lot#',
      errorCount: '#_of_errors',
      errorType: 'error_type',
      formTitle: 'form_title',
      inputDate: 'input_date',
      
      // External RFT specific fields
      lotNumber: 'lot',
      category: 'category',
      comment: 'comment',
      stage: 'stage',
      
      // Common error indicators
      hasErrors: 'hasErrors',
      
      // Legacy fields for compatibility
      type: null,
      department: null,
      startDate: null,
      endDate: null,
      rftStatus: null,
      issues: null,
      externalSubmission: null
    };
    
    // Check if any fields are actually different in the data
    if (processRecords.length > 0) {
      // Check bulk_receipt_date field
      if (!processRecords.some(r => r['bulk_receipt_date'] !== undefined)) {
        // Try alternate formats if the standard field isn't found
        const alternateFields = ['bulkReceiptDate', 'receipt_date', 'bulk_date'];
        for (const field of alternateFields) {
          if (processRecords.some(r => r[field] !== undefined)) {
            this.fieldMap.bulkReceiptDate = field;
            break;
          }
        }
      }
    }
    
    if (internalRftRecords.length > 0) {
      // Check work order field
      if (!internalRftRecords.some(r => r['wo/lot#'] !== undefined)) {
        const alternateFields = ['workOrder', 'wo', 'work_order', 'lot#'];
        for (const field of alternateFields) {
          if (internalRftRecords.some(r => r[field] !== undefined)) {
            this.fieldMap.workOrder = field;
            break;
          }
        }
      }
    }
    
    if (externalRftRecords.length > 0) {
      // Check lot field
      if (!externalRftRecords.some(r => r['lot'] !== undefined)) {
        const alternateFields = ['lotNumber', 'fg_lot', 'batch'];
        for (const field of alternateFields) {
          if (externalRftRecords.some(r => r[field] !== undefined)) {
            this.fieldMap.lotNumber = field;
            break;
          }
        }
      }
    }
    
    console.log('Field mapping discovered:', this.fieldMap);
    
    // Detect capabilities based on available fields
    this._detectCapabilities(records);
  }
  
  /**
   * Detect if a field exists in the data and return its name
   * @param {Array} records - Sample records to check
   * @param {Array} possibleNames - Possible field names to check
   * @returns {string|null} The field name if found, null otherwise
   */
  _detectField(records, possibleNames) {
    for (const name of possibleNames) {
      if (records.some(record => record[name] !== undefined)) {
        return name;
      }
    }
    return null;
  }
  
  /**
   * Detect what capabilities are available based on the data
   * @param {Array} records - Sample records to check
   */
  _detectCapabilities(records) {
    // Force enable all capabilities
    this.capabilities.hasRftData = true;
    this.capabilities.hasProcessTimeData = true;
    this.capabilities.hasIssueData = true;
    this.capabilities.hasExternalSubmissionData = true;
    this.capabilities.hasHistoricalData = true;
    this.capabilities.hasLotAnalysis = true;
    
    console.log('Data capabilities all enabled:', this.capabilities);
  }
  
  /**
   * Process the records to extract KPI metrics
   * @param {Array|Object} data - The data to process
   * @returns {Object} The processed data with metrics
   */
  processRecords(data) {
    console.log('Processing pharmaceutical records...');
    
    // Normalize data to array
    const records = Array.isArray(data) ? data : data.records || [];
    
    if (records.length === 0) {
      console.warn('No records to process');
      return { records: [], metrics: {}, capabilities: this.capabilities };
    }
    
    // If schema hasn't been discovered yet, do it now
    if (!this.fieldMap.id) {
      this.discoverSchema(data);
    }
    
    // Process and transform records
    const processedRecords = records.map(record => this._processRecord(record));
    
    // Added: Group records by lot number
    this.lotData = this._groupRecordsByLot(processedRecords);
    
    // Added: Calculate lot-level metrics
    const lotMetrics = this._calculateLotMetrics(this.lotData);
    
    // Calculate metrics (updated to include lot metrics)
    const metrics = this._calculateMetrics(processedRecords, lotMetrics);
    
    // Store results
    this.processedData = {
      records: processedRecords,
      metrics: metrics,
      capabilities: this.capabilities,
      fieldMap: this.fieldMap,
      lotData: this.lotData,
      lotMetrics: lotMetrics
    };
    
    return this.processedData;
  }
  
  /**
   * Process an individual record
   * @param {Object} record - The record to process
   * @returns {Object} The processed record with calculated fields
   */
  _processRecord(record) {
    const processed = {};
    
    // Map base fields
    processed.id = record[this.fieldMap.id] || 'Unknown';
    processed.originalRecord = record; // Store original for reference
    
    // Determine record type from batchId
    if (record.batchId) {
      if (record.batchId.startsWith('Commercial Process')) {
        processed.type = 'Process';
      } else if (record.batchId.startsWith('Internal RFT')) {
        processed.type = 'Internal RFT';
      } else if (record.batchId.startsWith('External RFT')) {
        processed.type = 'External RFT';
      } else {
        processed.type = 'Unknown';
      }
    } else {
      processed.type = record[this.fieldMap.type] || 'Unknown';
    }
    
    // Department if available
    processed.department = record[this.fieldMap.department] || 'Unknown';
    
    // Process by record type
    if (processed.type === 'Process') {
      // Process Metrics Record
      processed.lotNumber = record[this.fieldMap.fgBatch] || this._extractLotNumber(record);
      processed.bulkBatch = record[this.fieldMap.bulkBatch] || null;
      
      // Extract work orders
      if (this.fieldMap.assemblyWO && record[this.fieldMap.assemblyWO]) {
        processed.assemblyWO = parseInt(record[this.fieldMap.assemblyWO].toString(), 10) || record[this.fieldMap.assemblyWO];
      }
      
      if (this.fieldMap.cartoningWO && record[this.fieldMap.cartoningWO]) {
        processed.cartoningWO = parseInt(record[this.fieldMap.cartoningWO].toString(), 10) || record[this.fieldMap.cartoningWO];
      }
      
      // Process key dates
      if (this.fieldMap.bulkReceiptDate && record[this.fieldMap.bulkReceiptDate]) {
        processed.bulkReceiptDate = new Date(record[this.fieldMap.bulkReceiptDate]);
        processed.startDate = processed.bulkReceiptDate; // For compatibility
      }
      
      if (this.fieldMap.assemblyStart && record[this.fieldMap.assemblyStart]) {
        processed.assemblyStart = new Date(record[this.fieldMap.assemblyStart]);
      }
      
      if (this.fieldMap.assemblyFinish && record[this.fieldMap.assemblyFinish]) {
        processed.assemblyFinish = new Date(record[this.fieldMap.assemblyFinish]);
      }
      
      if (this.fieldMap.packagingStart && record[this.fieldMap.packagingStart]) {
        processed.packagingStart = new Date(record[this.fieldMap.packagingStart]);
      }
      
      if (this.fieldMap.packagingFinish && record[this.fieldMap.packagingFinish]) {
        processed.packagingFinish = new Date(record[this.fieldMap.packagingFinish]);
      }
      
      if (this.fieldMap.release && record[this.fieldMap.release]) {
        processed.releaseDate = new Date(record[this.fieldMap.release]);
        processed.endDate = processed.releaseDate; // For compatibility
      }
      
      if (this.fieldMap.shipment && record[this.fieldMap.shipment]) {
        processed.shipmentDate = new Date(record[this.fieldMap.shipment]);
      }
      
      // Calculate cycle times if available in original record
      if (record.assembly_cycle_time !== undefined) {
        processed.assemblyCycleTime = parseFloat(record.assembly_cycle_time);
      } else if (processed.assemblyStart && processed.assemblyFinish) {
        processed.assemblyCycleTime = this._calculateDaysDifference(processed.assemblyStart, processed.assemblyFinish);
      }
      
      // Calculate total cycle time
      if (record.total_cycle_time !== undefined) {
        processed.totalCycleTime = parseFloat(record.total_cycle_time);
      } else if (processed.bulkReceiptDate && processed.releaseDate) {
        processed.totalCycleTime = this._calculateDaysDifference(processed.bulkReceiptDate, processed.releaseDate);
      }
      
      // For process records, default to RFT
      processed.isRft = true;
      processed.rftStatus = 'PASS';
      processed.stage = this._determineProcessStage(record);
    }
    else if (processed.type === 'Internal RFT') {
      // Internal RFT Record
      // Extract work order which is the key identifier
      if (this.fieldMap.workOrder && record[this.fieldMap.workOrder] !== undefined) {
        processed.workOrder = record[this.fieldMap.workOrder].toString().trim();
      } else {
        // Try to extract from batchId as fallback
        const batchIdParts = record.batchId.split('_');
        if (batchIdParts.length > 1) {
          processed.workOrder = batchIdParts[1].trim();
        }
      }
      
      // Error details
      if (this.fieldMap.errorCount && record[this.fieldMap.errorCount] !== undefined) {
        processed.errorCount = parseInt(record[this.fieldMap.errorCount], 10) || 0;
      } else if (record['#_of_errors'] !== undefined) {
        processed.errorCount = parseInt(record['#_of_errors'], 10) || 0;
      } else {
        processed.errorCount = 0;
      }
      
      processed.errorType = record[this.fieldMap.errorType] || record.error_type || 'Unknown';
      processed.formTitle = record[this.fieldMap.formTitle] || record.form_title || 'Unknown';
      
      // Input date
      if (this.fieldMap.inputDate && record[this.fieldMap.inputDate]) {
        processed.inputDate = new Date(record[this.fieldMap.inputDate]);
        processed.startDate = processed.inputDate; // For compatibility
        processed.endDate = processed.inputDate; // For compatibility
      }
      
      // RFT is based on errorCount
      processed.isRft = processed.errorCount === 0;
      processed.rftStatus = processed.isRft ? 'PASS' : 'FAIL';
      
      // Combine error info into issues field
      processed.issues = {
        count: processed.errorCount,
        type: processed.errorType,
        form: processed.formTitle
      };
      
      // Stage is usually WIP for internal records
      processed.stage = record['room_#'] ? 'WIP' : this._determineProcessStage(record);
    }
    else if (processed.type === 'External RFT') {
      // External RFT Record
      // Get the lot number directly
      processed.lotNumber = record[this.fieldMap.lotNumber] || null;
      
      // External submission details
      processed.category = record[this.fieldMap.category] || 'Unknown';
      processed.comment = record[this.fieldMap.comment] || '';
      processed.stage = record[this.fieldMap.stage] || this._determineProcessStage(record);
      
      // RFT based on category - only Missing Documents is a failure
      const category = (processed.category || '').toString().toLowerCase();
      processed.isRft = !category.includes('missing document');
      processed.rftStatus = processed.isRft ? 'PASS' : 'FAIL';
      
      // Combine external details into externalSubmission field for compatibility
      processed.externalSubmission = {
        category: processed.category,
        comment: processed.comment,
        stage: processed.stage
      };
    }
    else {
      // Unknown record type - apply default processing
      processed.lotNumber = this._extractLotNumber(record);
      processed.stage = this._determineProcessStage(record);
      
      // Process dates
      if (this.fieldMap.startDate) {
        processed.startDate = new Date(record[this.fieldMap.startDate]);
      }
      
      if (this.fieldMap.endDate) {
        processed.endDate = new Date(record[this.fieldMap.endDate]);
      }
      
      // Process RFT status from hasErrors
      if (this.fieldMap.hasErrors !== null && record[this.fieldMap.hasErrors] !== undefined) {
        const hasErrors = typeof record[this.fieldMap.hasErrors] === 'string' 
          ? record[this.fieldMap.hasErrors].toLowerCase() === 'true' 
              || record[this.fieldMap.hasErrors].toLowerCase() === 'fail'
          : !!record[this.fieldMap.hasErrors];
        
        processed.isRft = !hasErrors;
        processed.rftStatus = processed.isRft ? 'PASS' : 'FAIL';
      } else {
        processed.isRft = true; // Default if no error indicator
        processed.rftStatus = 'PASS';
      }
    }
    
    // Common field for all record types
    processed.source = record.source || processed.type;
    
    // Process review and correction times
    processed.reviewTimes = {};
    
    if (this.fieldMap.pciReviewStart && this.fieldMap.pciReviewEnd && 
        record[this.fieldMap.pciReviewStart] && record[this.fieldMap.pciReviewEnd]) {
      const start = new Date(record[this.fieldMap.pciReviewStart]);
      const end = new Date(record[this.fieldMap.pciReviewEnd]);
      processed.reviewTimes.pciReview = {
        start,
        end,
        durationDays: this._calculateDaysDifference(start, end)
      };
    }
    
    if (this.fieldMap.nnReviewStart && this.fieldMap.nnReviewEnd && 
        record[this.fieldMap.nnReviewStart] && record[this.fieldMap.nnReviewEnd]) {
      const start = new Date(record[this.fieldMap.nnReviewStart]);
      const end = new Date(record[this.fieldMap.nnReviewEnd]);
      processed.reviewTimes.nnReview = {
        start,
        end,
        durationDays: this._calculateDaysDifference(start, end)
      };
    }
    
    if (this.fieldMap.pciCorrectionsStart && this.fieldMap.pciCorrectionsEnd && 
        record[this.fieldMap.pciCorrectionsStart] && record[this.fieldMap.pciCorrectionsEnd]) {
      const start = new Date(record[this.fieldMap.pciCorrectionsStart]);
      const end = new Date(record[this.fieldMap.pciCorrectionsEnd]);
      processed.reviewTimes.pciCorrections = {
        start,
        end,
        durationDays: this._calculateDaysDifference(start, end)
      };
    }
    
    if (this.fieldMap.nnCorrectionsReviewStart && this.fieldMap.nnCorrectionsReviewEnd && 
        record[this.fieldMap.nnCorrectionsReviewStart] && record[this.fieldMap.nnCorrectionsReviewEnd]) {
      const start = new Date(record[this.fieldMap.nnCorrectionsReviewStart]);
      const end = new Date(record[this.fieldMap.nnCorrectionsReviewEnd]);
      processed.reviewTimes.nnCorrectionsReview = {
        start,
        end,
        durationDays: this._calculateDaysDifference(start, end)
      };
    }
    
    // Calculate overall process time
    if (processed.startDate && processed.endDate) {
      processed.processDurationDays = this._calculateDaysDifference(
        processed.startDate, 
        processed.endDate
      );
    }
    
    // Process issues
    if (this.fieldMap.issues && record[this.fieldMap.issues]) {
      processed.issues = record[this.fieldMap.issues].map(issue => ({
        category: issue.category || 'Unknown',
        description: issue.description || '',
        severity: issue.severity || 'Medium',
        resolutionTimeDays: issue.resolution_time_days || 0,
        isProcessClarification: (issue.category || '').toLowerCase().includes('clarification')
      }));
      
      // Added: Business rule - Process Clarification issues don't fail RFT
      const hasOnlyProcessClarificationIssues = processed.issues.length > 0 && 
        processed.issues.every(issue => issue.isProcessClarification);
      
      if (hasOnlyProcessClarificationIssues) {
        processed.isRft = true;
        processed.rftStatus = 'PASS';
      }
      
    } else {
      processed.issues = [];
    }
    
    // Include the raw record for reference
    processed._raw = record;
    
    return processed;
  }
  
  /**
   * Calculate the difference in days between two dates
   * @param {Date} startDate - The start date
   * @param {Date} endDate - The end date
   * @returns {number} The difference in days, rounded to 1 decimal place
   */
  _calculateDaysDifference(startDate, endDate) {
    const diffMs = endDate - startDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return Math.round(diffDays * 10) / 10; // Round to 1 decimal place
  }
  
  /**
   * Extract the lot number from a record
   * @param {Object} record - The record to extract lot number from
   * @returns {string} The extracted lot number or 'Unknown'
   */
  _extractLotNumber(record) {
    // First check if a lot number field is available
    if (this.fieldMap.lotNumber && record[this.fieldMap.lotNumber]) {
      // Clean up the lot number to ensure consistent formatting
      let lotNumber = record[this.fieldMap.lotNumber].toString().trim();
      
      // If the lot number starts with "LOT" or similar, standardize format
      lotNumber = lotNumber.replace(/^(lot|batch|bn|b\/n)[\s-:]*/i, '');
      
      // Remove any leading zeros (but maintain a single zero if that's all there is)
      lotNumber = lotNumber.replace(/^0+(?=\d)/, '');
      
      // Remove any special characters that might cause inconsistency
      lotNumber = lotNumber.replace(/[^\w\d]/g, '');
      
      // If lot number is empty after cleaning, use fallback
      if (!lotNumber) {
        return this._extractLotNumberFromId(record);
      }
      
      return lotNumber;
    }
    
    // If no explicit lot field, try to extract from ID or other fields
    return this._extractLotNumberFromId(record);
  }
  
  /**
   * Extract lot number from ID or other fields as fallback
   * @param {Object} record - The record to extract from
   * @returns {string} The extracted lot number or 'Unknown'
   */
  _extractLotNumberFromId(record) {
    // Try to extract from ID if it's in a format like "LOT12345-1"
    if (this.fieldMap.id && record[this.fieldMap.id]) {
      const id = record[this.fieldMap.id].toString();
      
      // Look for lot number patterns
      const lotMatches = id.match(/(?:LOT|lot|Lot|BATCH|batch|Batch|BN|bn)[-:\s]*(\w+)/i);
      if (lotMatches && lotMatches[1]) {
        return lotMatches[1].replace(/[^\w\d]/g, '');
      }
      
      // If ID contains both letters and numbers, extract the numeric part as potential lot number
      if (/[A-Za-z]/.test(id) && /\d/.test(id)) {
        const numericPart = id.match(/(\d+)/);
        if (numericPart && numericPart[1]) {
          return numericPart[1];
        }
      }
    }
    
    // Look for batch ID in other fields as last resort
    const possibleFields = ['batch_id', 'batchId', 'batch', 'lot', 'lotid'];
    for (const field of possibleFields) {
      if (record[field]) {
        return record[field].toString().replace(/[^\w\d]/g, '');
      }
    }
    
    return 'Unknown';
  }

  /**
   * Determine the process stage (WIP/Assembly or FG/Packaging)
   * @param {Object} record - The record to analyze
   * @returns {string} The determined process stage
   */
  _determineProcessStage(record) {
    // Check type field first
    if (this.fieldMap.type && record[this.fieldMap.type]) {
      const type = record[this.fieldMap.type].toString().toLowerCase();
      
      // Check for assembly/WIP indicators
      if (type.includes('assembly') || type.includes('wip') || type.includes('work in progress') ||
          type.includes('in process') || type.includes('manufacturing')) {
        return 'WIP';
      }
      
      // Check for packaging/FG indicators
      if (type.includes('package') || type.includes('packaging') || type.includes('fg') ||
          type.includes('finished good') || type.includes('final')) {
        return 'FG';
      }
    }
    
    // Try to determine from department
    if (this.fieldMap.department && record[this.fieldMap.department]) {
      const dept = record[this.fieldMap.department].toString().toLowerCase();
      
      if (dept.includes('assembly') || dept.includes('manufacturing') || dept.includes('production')) {
        return 'WIP';
      }
      
      if (dept.includes('package') || dept.includes('packaging') || dept.includes('finishing')) {
        return 'FG';
      }
    }
    
    // Try to infer from ID pattern or other fields
    if (this.fieldMap.id && record[this.fieldMap.id]) {
      const id = record[this.fieldMap.id].toString().toLowerCase();
      
      if (id.includes('asm') || id.includes('wip') || id.includes('prod')) {
        return 'WIP';
      }
      
      if (id.includes('pkg') || id.includes('pac') || id.includes('fg')) {
        return 'FG';
      }
    }
    
    // Default to Unknown if we can't determine
    return 'Unknown';
  }

  /**
   * Group records by lot number
   * @param {Array} records - The records to group
   * @returns {Object} Records grouped by lot number
   */
  _groupRecordsByLot(records) {
    console.log('Grouping records by lot number...');
    
    const lotData = {};
    
    // First pass - create lot groups and add records
    records.forEach(record => {
      // Skip records with unknown lot numbers
      if (!record.lotNumber || record.lotNumber === 'Unknown') {
        console.warn('Record without lot number found:', record.id);
        return;
      }
      
      // Create lot entry if it doesn't exist
      if (!lotData[record.lotNumber]) {
        lotData[record.lotNumber] = {
          lotNumber: record.lotNumber,
          records: [],
          recordCount: 0,
          wipRecords: [],
          fgRecords: [],
          recordTypes: new Set(),
          departments: new Set(),
          startDate: null,
          endDate: null,
          hasErrors: false,
          isRft: true, // Default to true, will be set to false if any failures found
          errorCount: 0,
          issues: []
        };
      }
      
      // Add record to the lot
      lotData[record.lotNumber].records.push(record);
      lotData[record.lotNumber].recordCount++;
      
      // Add to stage-specific arrays
      if (record.stage === 'WIP') {
        lotData[record.lotNumber].wipRecords.push(record);
      } else if (record.stage === 'FG') {
        lotData[record.lotNumber].fgRecords.push(record);
      }
      
      // Update record types and departments
      if (record.type) lotData[record.lotNumber].recordTypes.add(record.type);
      if (record.department) lotData[record.lotNumber].departments.add(record.department);
      
      // Update lot date range
      if (record.startDate) {
        if (!lotData[record.lotNumber].startDate || record.startDate < lotData[record.lotNumber].startDate) {
          lotData[record.lotNumber].startDate = record.startDate;
        }
      }
      
      if (record.endDate) {
        if (!lotData[record.lotNumber].endDate || record.endDate > lotData[record.lotNumber].endDate) {
          lotData[record.lotNumber].endDate = record.endDate;
        }
      }
      
      // Update error status - note we track individual errors but RFT is lot-based
      if (!record.isRft) {
        lotData[record.lotNumber].hasErrors = true;
        lotData[record.lotNumber].errorCount++;
        
        // Only include certain error types when determining lot RFT status
        // For example, Process Clarifications don't make a lot fail RFT
        if (!this._isExcludedErrorType(record)) {
          lotData[record.lotNumber].isRft = false;
        }
      }
      
      // Collect issues if any
      if (record.issues && Array.isArray(record.issues)) {
        lotData[record.lotNumber].issues.push(...record.issues);
      }
    });
    
    console.log(`Grouped ${records.length} records into ${Object.keys(lotData).length} lots`);
    
    // Second pass - calculate additional lot metrics
    Object.keys(lotData).forEach(lotNumber => {
      const lot = lotData[lotNumber];
      
      // Convert sets to arrays
      lot.recordTypes = Array.from(lot.recordTypes);
      lot.departments = Array.from(lot.departments);
      
      // Calculate stage percentages
      lot.wipPercentage = lot.recordCount ? (lot.wipRecords.length / lot.recordCount) * 100 : 0;
      lot.fgPercentage = lot.recordCount ? (lot.fgRecords.length / lot.recordCount) * 100 : 0;
      
      // Calculate error percentages
      lot.errorPercentage = lot.recordCount ? (lot.errorCount / lot.recordCount) * 100 : 0;
      
      // Calculate cycle time (days from start to end)
      if (lot.startDate && lot.endDate) {
        const timeDiff = lot.endDate.getTime() - lot.startDate.getTime();
        lot.cycleDays = Math.round(timeDiff / (1000 * 3600 * 24));
      } else {
        lot.cycleDays = null;
      }
      
      // Categorize lot as WIP or FG based on majority of records
      lot.primaryStage = lot.wipRecords.length > lot.fgRecords.length ? 'WIP' : 'FG';
    });
    
    return lotData;
  }
  
  /**
   * Check if an error type should be excluded from RFT calculation
   * @param {Object} record - The record to check
   * @returns {boolean} True if this error type should be excluded from RFT calculation
   */
  _isExcludedErrorType(record) {
    // Process Clarification errors don't make a lot fail RFT
    if (record.type && record.type.includes('Process Clarification')) {
      return true;
    }
    
    // Check for specific excluded error categories in issues array
    if (record.issues && Array.isArray(record.issues)) {
      for (const issue of record.issues) {
        // If there's a category or type property on the issue object
        const category = issue.category || issue.type || '';
        if (typeof category === 'string' && 
            (category.includes('Clarification') || category.includes('Info Only'))) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Calculate lot-level metrics
   * @param {Object} lotData - The grouped lot data
   * @returns {Object} Calculated lot metrics
   */
  _calculateLotMetrics(lotData) {
    console.log('Calculating lot-level metrics...');
    
    const lotMetrics = {
      totalLots: Object.keys(lotData).length,
      rftLots: 0,
      nonRftLots: 0,
      lotRftPercentage: 0,
      wipLots: 0,
      fgLots: 0,
      avgCycleTimeDays: 0,
      internalRftFailLots: 0,
      externalRftFailLots: 0,
      lotsWithIssues: 0,
      issueCategories: {},
      topInternalIssues: [],
      topExternalIssues: []
    };
    
    // Track issue categories for WIP and FG
    const issuesByStage = {
      WIP: {},
      FG: {}
    };
    
    // Process each lot
    Object.values(lotData).forEach(lot => {
      // Count RFT lots
      if (lot.isRft) {
        lotMetrics.rftLots++;
      } else {
        lotMetrics.nonRftLots++;
        
        // Track RFT failure type
        if (lot.hasErrors) {
          lotMetrics.externalRftFailLots++;
        }
      }
      
      // Count by stage
      if (lot.primaryStage === 'WIP') {
        lotMetrics.wipLots++;
      } else if (lot.primaryStage === 'FG') {
        lotMetrics.fgLots++;
      }
      
      // Calculate cycle time
      if (lot.startDate && lot.endDate) {
        const cycleDays = this._calculateDaysDifference(lot.startDate, lot.endDate);
        lot.cycleTimeDays = cycleDays; // Add to lot data
        
        // Add to average calculation
        lotMetrics.avgCycleTimeDays += cycleDays;
      }
      
      // Process issues
      if (lot.issues && lot.issues.length > 0) {
        lotMetrics.lotsWithIssues++;
        
        // Count issue categories
        lot.issues.forEach(issue => {
          const category = issue.category || 'Unknown';
          
          // Overall count
          lotMetrics.issueCategories[category] = (lotMetrics.issueCategories[category] || 0) + 1;
          
          // Count by stage
          const issueStage = lot.primaryStage; // Use lot stage
          if (issuesByStage[issueStage]) {
            issuesByStage[issueStage][category] = (issuesByStage[issueStage][category] || 0) + 1;
          }
        });
      }
    });
    
    // Calculate percentage metrics
    if (lotMetrics.totalLots > 0) {
      lotMetrics.lotRftPercentage = (lotMetrics.rftLots / lotMetrics.totalLots) * 100;
      lotMetrics.avgCycleTimeDays = lotMetrics.avgCycleTimeDays / lotMetrics.totalLots;
    }
    
    // Calculate top issues by stage
    lotMetrics.topInternalIssues = Object.entries(issuesByStage.WIP)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
      
    lotMetrics.topExternalIssues = Object.entries(issuesByStage.FG)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
    
    console.log('Lot metrics calculated:', lotMetrics);
    return lotMetrics;
  }
  
  /**
   * Calculate overall metrics from processed records
   * @param {Array} records - The processed records
   * @param {Object} lotMetrics - The lot-level metrics (added)
   * @returns {Object} The calculated metrics
   */
  _calculateMetrics(records, lotMetrics = {}) {
    console.log('Calculating overall metrics...');
    
    const metrics = {
      totalRecords: records.length,
      rftCount: 0,
      nonRftCount: 0,
      rftPercentage: 0,
      avgProcessDurationDays: 0,
      processedWithIssues: 0,
      categories: {},
      departments: {},
      // Added: Include lot metrics
      lots: lotMetrics || {}
    };
    
    // Process records for record-level metrics
    let totalDurationDays = 0;
    
    records.forEach(record => {
      // Count RFT records
      if (record.isRft) {
        metrics.rftCount++;
      } else {
        metrics.nonRftCount++;
      }
      
      // Count records with issues
      if (record.issues && record.issues.length > 0) {
        metrics.processedWithIssues++;
      }
      
      // Sum duration for average
      if (record.processDurationDays) {
        totalDurationDays += record.processDurationDays;
      }
      
      // Count by category
      const category = record.type || 'Unknown';
      metrics.categories[category] = (metrics.categories[category] || 0) + 1;
      
      // Count by department
      const department = record.department || 'Unknown';
      metrics.departments[department] = (metrics.departments[department] || 0) + 1;
    });
    
    // Calculate percentages and averages
    if (metrics.totalRecords > 0) {
      metrics.rftPercentage = (metrics.rftCount / metrics.totalRecords) * 100;
      metrics.avgProcessDurationDays = totalDurationDays / metrics.totalRecords;
    }
    
    // Monthly trend analysis
    metrics.monthlyTrends = this._calculateMonthlyTrends(records);
    
    // Process improvements analysis
    metrics.improvements = this._calculateImprovements(records);
    
    console.log('Metrics calculated:', metrics);
    return metrics;
  }
  
  /**
   * Calculate monthly trends for the last 6 months
   * @param {Array} records - Processed records
   * @returns {Object} Monthly trend data
   */
  _calculateMonthlyTrends(records) {
    const trends = [];
    
    // Only calculate if we have start dates
    if (records.some(r => r.startDate)) {
      // Get date range
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      
      // Create array of month names
      const months = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        months.unshift({
          year: d.getFullYear(),
          month: d.getMonth(),
          name: `${monthNames[d.getMonth()]} ${d.getFullYear()}`
        });
      }
      
      // Group records by month
      months.forEach(monthObj => {
        const monthlyRecords = records.filter(record => {
          if (!record.startDate) return false;
          
          return record.startDate.getFullYear() === monthObj.year && 
                 record.startDate.getMonth() === monthObj.month;
        });
        
        // Skip empty months
        if (monthlyRecords.length === 0) {
          trends.push({
            month: monthObj.name,
            total: 0,
            rft: 0,
            nonRft: 0,
            rftPercentage: 0,
            avgDuration: 0
          });
          return;
        }
        
        // Count RFT status
        let rftCount = 0;
        let totalDuration = 0;
        
        monthlyRecords.forEach(record => {
          if (record.isRft) rftCount++;
          if (record.processDurationDays) totalDuration += record.processDurationDays;
        });
        
        // Calculate averages and percentages
        const rftPercentage = (rftCount / monthlyRecords.length) * 100;
        const avgDuration = totalDuration / monthlyRecords.length;
        
        // Add to trends
        trends.push({
          month: monthObj.name,
          total: monthlyRecords.length,
          rft: rftCount,
          nonRft: monthlyRecords.length - rftCount,
          rftPercentage,
          avgDuration
        });
      });
    }
    
    return trends;
  }
  
  /**
   * Calculate improvement metrics
   * @param {Array} records - The processed records
   * @returns {Object} Improvement metrics
   */
  _calculateImprovements(records) {
    console.log('Calculating improvement metrics...');
    
    // Sort records by date
    const sortedRecords = [...records].filter(r => r.startDate).sort((a, b) => a.startDate - b.startDate);
    
    if (sortedRecords.length < 10) {
      return {
        hasSufficientData: false
      };
    }
    
    // Determine first and second half
    const midpoint = Math.floor(sortedRecords.length / 2);
    const firstHalf = sortedRecords.slice(0, midpoint);
    const secondHalf = sortedRecords.slice(midpoint);
    
    // Calculate metrics for both halves
    const firstHalfMetrics = this._calculateHalfMetrics(firstHalf);
    const secondHalfMetrics = this._calculateHalfMetrics(secondHalf);
    
    // Calculate improvements
    const improvements = {
      hasSufficientData: true,
      rftRateChange: secondHalfMetrics.rftRate - firstHalfMetrics.rftRate,
      durationChange: firstHalfMetrics.avgDuration - secondHalfMetrics.avgDuration,
      issueRateChange: firstHalfMetrics.issueRate - secondHalfMetrics.issueRate,
      
      rftRatePercentChange: firstHalfMetrics.rftRate > 0 
        ? ((secondHalfMetrics.rftRate - firstHalfMetrics.rftRate) / firstHalfMetrics.rftRate) * 100 
        : 0,
        
      durationPercentChange: firstHalfMetrics.avgDuration > 0 
        ? ((firstHalfMetrics.avgDuration - secondHalfMetrics.avgDuration) / firstHalfMetrics.avgDuration) * 100 
        : 0,
        
      issueRatePercentChange: firstHalfMetrics.issueRate > 0 
        ? ((firstHalfMetrics.issueRate - secondHalfMetrics.issueRate) / firstHalfMetrics.issueRate) * 100 
        : 0,
        
      firstHalfStartDate: firstHalf[0].startDate,
      firstHalfEndDate: firstHalf[firstHalf.length - 1].startDate,
      secondHalfStartDate: secondHalf[0].startDate,
      secondHalfEndDate: secondHalf[secondHalf.length - 1].startDate
    };
    
    return improvements;
  }
  
  /**
   * Calculate metrics for half of the data
   * @param {Array} half - Half of the records
   * @returns {Object} Metrics for this half
   */
  _calculateHalfMetrics(half) {
    const total = half.length;
    let rftCount = 0;
    let totalDuration = 0;
    let withIssues = 0;
    
    half.forEach(record => {
      if (record.isRft) rftCount++;
      if (record.processDurationDays) totalDuration += record.processDurationDays;
      if (record.issues && record.issues.length > 0) withIssues++;
    });
    
    return {
      total,
      rftCount,
      rftRate: total > 0 ? (rftCount / total) * 100 : 0,
      avgDuration: total > 0 ? totalDuration / total : 0,
      issueRate: total > 0 ? (withIssues / total) * 100 : 0
    };
  }
  
  /**
   * Get the processed data and metrics
   * @returns {Object} The processed data
   */
  getProcessedData() {
    return this.processedData;
  }
  
  /**
   * Get data capabilities
   * @returns {Object} The capabilities object
   */
  getCapabilities() {
    return this.capabilities;
  }
  
  /**
   * Get field mapping
   * @returns {Object} The field mapping
   */
  getFieldMap() {
    return this.fieldMap;
  }
  
  /**
   * Added: Get lot data
   * @returns {Object} The lot data
   */
  getLotData() {
    return this.lotData;
  }
}

// Make available in browser and Node.js environments
if (typeof window !== 'undefined') {
  window.DataAdapter = DataAdapter;
  
  // Create a global instance for easier access
  if (!window.dataAdapter) {
    window.dataAdapter = new DataAdapter();
    
    // Add helper function to process data directly
    window.processDataAndVisualize = function(data) {
      try {
        console.log('Processing data and triggering visualization...');
        const processedData = window.dataAdapter.processRecords(data);
        
        // Store in global scope
        window.processedData = processedData;
        
        // Trigger dashboard update
        if (typeof window.enhanceDashboard === 'function') {
          window.enhanceDashboard(processedData, {
            updateElements: true,
            updateVisibility: true,
            showCapabilities: true
          });
        } else if (typeof window.updateDashboard === 'function') {
          window.updateDashboard(processedData);
        } else {
          console.warn('No dashboard update function found');
        }
        
        return processedData;
      } catch (error) {
        console.error('Error processing data:', error);
        return null;
      }
    };
  }
} else if (typeof module !== 'undefined') {
  module.exports = DataAdapter;
} 