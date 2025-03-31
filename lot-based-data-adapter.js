/**
 * Pharmaceutical Process & Quality KPI Dashboard - Lot-Based Data Adapter
 * 
 * Enhanced version of the data adapter that processes pharmaceutical manufacturing data 
 * at the lot level rather than individual records.
 */

class LotBasedDataAdapter {
  constructor() {
    this.data = null;
    this.processedData = null;
    this.fieldMap = {};
    this.lotData = {}; // Store lot-based grouped data
    this.capabilities = {
      hasRftData: false,
      hasProcessTimeData: false,
      hasIssueData: false,
      hasExternalSubmissionData: false,
      hasHistoricalData: false
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
      assemblyWo: 'assembly_wo',
      cartoningWo: 'cartoning_wo',
      
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
      
      // Set default values for fields that would otherwise be null
      type: 'source', // Will be derived from batchId in _processRecord
      department: 'room_#', // Use room_# as fallback for department
      startDate: 'bulk_receipt_date',
      endDate: 'release',
      rftStatus: 'hasErrors', // Will be computed from hasErrors or errorCount
      
      // Structure for issues - will be populated during processing
      issues: 'errorType', // Will build an object in _processRecord
      
      // Structure for external submissions - will be populated during processing
      externalSubmission: 'category', // Will build an object in _processRecord
      
      // NN and PCI Review fields - set to null as not used for lot analysis
      pciReviewStart: null,
      pciReviewEnd: null,
      nnReviewStart: null,
      nnReviewEnd: null,
      pciCorrectionsStart: null,
      pciCorrectionsEnd: null,
      nnCorrectionsReviewStart: null,
      nnCorrectionsReviewEnd: null
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
    
    console.log('Data capabilities all enabled:', this.capabilities);
  }
  
  /**
   * Process the records to extract KPI metrics
   * @param {Array|Object} data - The data to process
   * @returns {Object} The processed data with metrics
   */
  processRecords(data) {
    console.log('Processing pharmaceutical records with lot-based analysis...');
    
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
    
    // Build work order to lot mapping before grouping
    const workOrderToLotMap = this._buildWorkOrderToLotMapping(processedRecords);
    console.log(`Built work order to lot mapping with ${Object.keys(workOrderToLotMap).length} work orders`);
    
    // Group records by lot
    this.lotData = this._groupRecordsByLot(processedRecords, workOrderToLotMap);
    
    // Calculate lot-level metrics
    const lotMetrics = this._calculateLotMetrics(this.lotData);
    
    // Calculate metrics (now including lot-based metrics)
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
   * Build a mapping from work orders to lot numbers
   * @param {Array} records - Processed records
   * @returns {Object} Map of work order to lot number
   */
  _buildWorkOrderToLotMapping(records) {
    console.log('Building comprehensive work order to lot mapping...');
    const workOrderToLotMap = {};
    
    // Track lot and work order fields for debug
    const lotsFound = new Set();
    const workOrdersFound = new Set();
    const realLotIds = new Set();
    
    // Phase 0: First identify all proper lot IDs in the dataset
    records.forEach(record => {
      if (record.lot && this._isProperLotId(record.lot)) {
        realLotIds.add(this._normalizeLotId(record.lot));
      }
    });
    
    console.log(`Found ${realLotIds.size} proper lot IDs in the dataset`);
    
    // Phase 1: Find all process metrics records with lots and work orders
    records.forEach(record => {
      if (this._isProcessRecord(record)) {
        const lotId = record.lot ? this._normalizeLotId(record.lot) : null;
        
        if (lotId) {
          lotsFound.add(lotId);
          
          // Map assembly work order to lot
          if (record.assemblyWo) {
            const workOrder = record.assemblyWo.toString().trim();
            workOrderToLotMap[workOrder] = lotId;
            workOrdersFound.add(workOrder);
          }
          
          // Map cartoning work order to lot
          if (record.cartoningWo) {
            const workOrder = record.cartoningWo.toString().trim();
            workOrderToLotMap[workOrder] = lotId;
            workOrdersFound.add(workOrder);
          }
          
          // Check original record for any other potential work order fields
          if (record.originalRecord) {
            const origRecord = record.originalRecord;
            
            // Check for other possible work order fields
            ['work_order', 'wo', 'workorder', 'work_order_number'].forEach(field => {
              if (origRecord[field] && typeof origRecord[field] === 'string' && origRecord[field].trim()) {
                const workOrder = origRecord[field].toString().trim();
                workOrderToLotMap[workOrder] = lotId;
                workOrdersFound.add(workOrder);
              }
            });
          }
        }
      }
    });
    
    // Phase 2: Analyze Internal RFT records for work order patterns and try to map them
    let internalRecordsByWO = {};
    
    // Group internal records by work order
    records.forEach(record => {
      if (this._isInternalRftRecord(record) && record.workOrder) {
        const workOrder = record.workOrder.toString().trim();
        workOrdersFound.add(workOrder);
        
        if (!internalRecordsByWO[workOrder]) {
          internalRecordsByWO[workOrder] = [];
        }
        
        internalRecordsByWO[workOrder].push(record);
      }
    });
    
    // Now try to map each work order group to a lot
    Object.entries(internalRecordsByWO).forEach(([workOrder, records]) => {
      // Skip if this work order is already mapped
      if (workOrderToLotMap[workOrder]) return;
      
      // Check if work order contains a reference to a real lot ID
      const normalizedWO = workOrder.toUpperCase();
      
      // Try to find any real lot ID that's contained in this work order
      let foundLotInWO = false;
      
      realLotIds.forEach(lotId => {
        if (normalizedWO.includes(lotId)) {
          workOrderToLotMap[workOrder] = lotId;
          console.log(`Found lot ${lotId} referenced in work order ${workOrder}`);
          foundLotInWO = true;
        }
      });
      
      if (foundLotInWO) return;
      
      // Try to find a lot match based on shared fields in external records
      records.forEach(internalRecord => {
        if (internalRecord.originalRecord) {
          const internalFields = Object.keys(internalRecord.originalRecord);
          
          // Look for matching external records
          records.forEach(externalRecord => {
            if (this._isExternalRftRecord(externalRecord) && 
                externalRecord.lot && 
                this._isProperLotId(externalRecord.lot)) {
              
              // Check for shared field values
              internalFields.forEach(field => {
                if (externalRecord.originalRecord && 
                    externalRecord.originalRecord[field] && 
                    internalRecord.originalRecord[field] === externalRecord.originalRecord[field]) {
                  
                  workOrderToLotMap[workOrder] = this._normalizeLotId(externalRecord.lot);
                  console.log(`Mapped work order ${workOrder} to lot ${externalRecord.lot} based on shared field ${field}`);
                }
              });
            }
          });
        }
      });
    });
    
    // Phase 3: Try to use partial matching for work orders that contain lot numbers
    // (e.g., sometimes a work order might be "WO12345-LOTABC")
    Array.from(workOrdersFound).forEach(workOrder => {
      // Skip if already mapped
      if (workOrderToLotMap[workOrder]) return;
      
      // Skip if this is actually a proper lot ID itself
      if (this._isProperLotId(workOrder)) return;
      
      // Check if any lot ID is contained within this work order
      for (const lotId of lotsFound) {
        if (workOrder.includes(lotId) || lotId.includes(workOrder)) {
          workOrderToLotMap[workOrder] = lotId;
          break;
        }
      }
    });
    
    // Phase 4: Map numeric work orders to their corresponding lots based on dates
    // Get all numeric work orders that still aren't mapped
    const unmappedNumericWOs = Array.from(workOrdersFound).filter(wo => {
      return !workOrderToLotMap[wo] && !isNaN(Number(wo));
    });
    
    if (unmappedNumericWOs.length > 0) {
      console.log(`Found ${unmappedNumericWOs.length} unmapped numeric work orders - attempting to map by date correlation`);
      
      // Get all records with dates for these work orders
      const woDateMap = {};
      unmappedNumericWOs.forEach(wo => {
        records.forEach(record => {
          if (this._isInternalRftRecord(record) && 
              record.workOrder === wo && 
              record.startDate) {
            
            if (!woDateMap[wo]) {
              woDateMap[wo] = [];
            }
            
            woDateMap[wo].push(record.startDate);
          }
        });
      });
      
      // Now correlate with lot dates
      const lotDateMap = {};
      records.forEach(record => {
        if (this._isProcessRecord(record) && 
            record.lot && 
            this._isProperLotId(record.lot) && 
            record.startDate) {
          
          const lotId = this._normalizeLotId(record.lot);
          
          if (!lotDateMap[lotId]) {
            lotDateMap[lotId] = [];
          }
          
          lotDateMap[lotId].push(record.startDate);
        }
      });
      
      // Try to match WOs to lots based on date proximity
      Object.entries(woDateMap).forEach(([wo, woDates]) => {
        if (woDates.length === 0) return;
        
        let bestLotId = null;
        let smallestDateDiff = Infinity;
        
        // Calculate average date for WO
        const woAvgDate = new Date(woDates.reduce((sum, date) => sum + date.getTime(), 0) / woDates.length);
        
        // Find lot with closest average date
        Object.entries(lotDateMap).forEach(([lotId, lotDates]) => {
          if (lotDates.length === 0) return;
          
          // Calculate average date for lot
          const lotAvgDate = new Date(lotDates.reduce((sum, date) => sum + date.getTime(), 0) / lotDates.length);
          
          // Calculate difference in days
          const dateDiff = Math.abs(woAvgDate.getTime() - lotAvgDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (dateDiff < smallestDateDiff) {
            smallestDateDiff = dateDiff;
            bestLotId = lotId;
          }
        });
        
        if (bestLotId && smallestDateDiff < 30) { // Only map if within a month
          workOrderToLotMap[wo] = bestLotId;
          console.log(`Mapped work order ${wo} to lot ${bestLotId} based on date correlation (diff: ${smallestDateDiff.toFixed(1)} days)`);
        }
      });
    }
    
    console.log(`Built work order to lot mapping with ${Object.keys(workOrderToLotMap).length} work orders`);
    console.log(`Found ${lotsFound.size} unique lot IDs and ${workOrdersFound.size} unique work orders`);
    
    // Log sample mappings for debugging
    const sampleEntries = Object.entries(workOrderToLotMap).slice(0, 5);
    if (sampleEntries.length > 0) {
      console.log('Sample work order to lot mappings:');
      sampleEntries.forEach(([wo, lot]) => {
        console.log(`  ${wo} -> ${lot}`);
      });
    }
    
    return workOrderToLotMap;
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
    
    // Source is similar to type
    processed.source = record.source || processed.type;
    
    // Process by record type
    if (this._isProcessRecord(record)) {
      // Process Metrics Record
      if (this.fieldMap.fgBatch && record[this.fieldMap.fgBatch]) {
        processed.lot = this._normalizeLotId(record[this.fieldMap.fgBatch]);
      } else if (record.fg_batch) {
        processed.lot = this._normalizeLotId(record.fg_batch);
      }
      
      // Extract bulk batch
      if (this.fieldMap.bulkBatch && record[this.fieldMap.bulkBatch]) {
        processed.bulkBatch = record[this.fieldMap.bulkBatch];
      }
      
      // Extract work orders
      if (this.fieldMap.assemblyWo && record[this.fieldMap.assemblyWo]) {
        processed.assemblyWo = record[this.fieldMap.assemblyWo];
      }
      
      if (this.fieldMap.cartoningWo && record[this.fieldMap.cartoningWo]) {
        processed.cartoningWo = record[this.fieldMap.cartoningWo];
      }
      
      // Process key dates for Process records
      if (this.fieldMap.bulkReceiptDate && record[this.fieldMap.bulkReceiptDate]) {
        processed.startDate = new Date(record[this.fieldMap.bulkReceiptDate]);
      }
      
      if (this.fieldMap.release && record[this.fieldMap.release]) {
        processed.endDate = new Date(record[this.fieldMap.release]);
      }
      
      // Process records are always RFT by default
      processed.isRft = true;
      processed.rftStatus = 'PASS';
      
      // Determine department/stage - use line field if available
      if (record.line) {
        processed.department = `Line ${record.line}`;
      } else if (record.strength) {
        processed.department = `Strength ${record.strength}`;
      }
      
      // Create an empty issues object for consistency
      processed.issues = {
        count: 0,
        type: null,
        form: null
      };
      
      // Create an empty externalSubmission object for consistency
      processed.externalSubmission = {
        category: null,
        comment: null,
        stage: 'Process',
        isRft: true
      };
    } 
    else if (this._isInternalRftRecord(record)) {
      // Internal RFT Record
      // Get the work order which is used to correlate to a lot
      if (this.fieldMap.workOrder) {
        processed.workOrder = record[this.fieldMap.workOrder] ? 
            record[this.fieldMap.workOrder].toString() : null;
      } else if (record['wo/lot#']) {
        processed.workOrder = record['wo/lot#'].toString();
      }
      
      // If work order not found, try to extract from batchId
      if (!processed.workOrder && record.batchId) {
        const parts = record.batchId.split('_');
        if (parts.length > 1) {
          processed.workOrder = parts[1];
        }
      }
      
      // Get error count for RFT status
      if (this.fieldMap.errorCount && record[this.fieldMap.errorCount] !== undefined) {
        const errorCount = parseInt(record[this.fieldMap.errorCount], 10);
        processed.errorCount = isNaN(errorCount) ? 0 : errorCount;
      } else if (record['#_of_errors'] !== undefined) {
        const errorCount = parseInt(record['#_of_errors'], 10);
        processed.errorCount = isNaN(errorCount) ? 0 : errorCount;
      } else {
        processed.errorCount = 0;
      }
      
      // RFT status based on error count
      processed.isRft = processed.errorCount === 0;
      processed.rftStatus = processed.isRft ? 'PASS' : 'FAIL';
      
      // Get error details
      if (this.fieldMap.errorType) {
        processed.errorType = record[this.fieldMap.errorType];
      } else if (record.error_type) {
        processed.errorType = record.error_type;
      }
      
      if (this.fieldMap.formTitle) {
        processed.formTitle = record[this.fieldMap.formTitle];
      } else if (record.form_title) {
        processed.formTitle = record.form_title;
      }
      
      // Build issues object
      processed.issues = {
        count: processed.errorCount || 0,
        type: processed.errorType || 'Unknown',
        form: processed.formTitle || 'Unknown',
        page: record.page || null,
        madeBy: record.error_made_by || null,
        reviewer: record.qa_reviewer || null,
        shift: record.shift_error__occurred_on || null,
        room: record['room_#'] || null
      };
      
      // Input date
      if (this.fieldMap.inputDate && record[this.fieldMap.inputDate]) {
        processed.startDate = new Date(record[this.fieldMap.inputDate]);
        processed.endDate = processed.startDate; // Same date for start and end
      }
      
      // Use room_# as department if available
      if (record['room_#']) {
        processed.department = record['room_#'];
      }
    }
    else if (this._isExternalRftRecord(record)) {
      // External RFT Record
      // Get the lot number 
      if (this.fieldMap.lotNumber && record[this.fieldMap.lotNumber]) {
        processed.lot = this._normalizeLotId(record[this.fieldMap.lotNumber]);
      } else if (record.lot) {
        processed.lot = this._normalizeLotId(record.lot);
      }
      
      // External submission details
      if (this.fieldMap.category) {
        processed.category = record[this.fieldMap.category] || 'Unknown';
      } else if (record.category) {
        processed.category = record.category;
      }
      
      if (this.fieldMap.comment) {
        processed.comment = record[this.fieldMap.comment] || '';
      } else if (record.comment) {
        processed.comment = record.comment;
      }
      
      if (this.fieldMap.stage) {
        processed.stage = record[this.fieldMap.stage] || 'Unknown';
      } else if (record.stage) {
        processed.stage = record.stage;
      }
      
      // RFT based on category - only "Missing Documents" and "Documentation Update" fail RFT
      const category = (processed.category || '').toString().toLowerCase();
      processed.isRft = !(category.includes('missing document') || category.includes('update documentation'));
      processed.rftStatus = processed.isRft ? 'PASS' : 'FAIL';
      
      // Build externalSubmission object
      processed.externalSubmission = {
        category: processed.category || 'Unknown',
        comment: processed.comment || '',
        stage: processed.stage || 'Unknown',
        isRft: processed.isRft,
        lot: processed.lot || null
      };
    }
    else {
      // Unknown record type
      processed.isRft = this.fieldMap.hasErrors ? !record[this.fieldMap.hasErrors] : true;
      processed.rftStatus = processed.isRft ? 'PASS' : 'FAIL';
      
      // Set default values for all required fields
      processed.issues = {
        count: 0,
        type: 'Unknown',
        form: 'Unknown'
      };
      
      processed.externalSubmission = {
        category: 'Unknown',
        comment: '',
        stage: 'Unknown',
        isRft: processed.isRft
      };
      
      // Try to extract dates if available
      if (record.date) {
        processed.startDate = new Date(record.date);
        processed.endDate = new Date(record.date);
      }
      
      // Set department if any location info is available
      if (record.department) {
        processed.department = record.department;
      } else if (record.room) {
        processed.department = record.room;
      } else if (record.location) {
        processed.department = record.location;
      } else {
        processed.department = 'Unknown';
      }
    }
    
    return processed;
  }
  
  /**
   * Determine if a record is a Process Metrics record
   * @param {Object} record - The record to check
   * @returns {boolean} True if it's a Process Metrics record
   */
  _isProcessRecord(record) {
    // Use different detection methods in this priority order
    if (record.source === 'Process') {
      return true;
    }
    
    if (record.originalRecord) {
      // Check batchId format 
      if (record.originalRecord.batchId && 
          (record.originalRecord.batchId.startsWith('Commercial Process') || 
           record.originalRecord.batchId.includes('Process'))) {
        return true;
      }
      
      // Check if it has fg_batch which is a key field for Process records
      if (record.originalRecord.fg_batch) {
        return true;
      }
      
      // Check if it has assembly_wo or cartoning_wo which are unique to Process records
      if (record.originalRecord.assembly_wo || record.originalRecord.cartoning_wo) {
        return true;
      }
    } else {
      // Direct record access if originalRecord not available
      if (record.batchId && 
          (record.batchId.startsWith('Commercial Process') || 
           record.batchId.includes('Process'))) {
        return true;
      }
      
      if (record.fg_batch) {
        return true;
      }
      
      if (record.assembly_wo || record.cartoning_wo) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Determine if a record is an Internal RFT record
   * @param {Object} record - The record to check
   * @returns {boolean} True if it's an Internal RFT record
   */
  _isInternalRftRecord(record) {
    // Use different detection methods in this priority order
    if (record.source === 'Internal') {
      return true;
    }
    
    if (record.originalRecord) {
      // Check batchId format
      if (record.originalRecord.batchId && 
          (record.originalRecord.batchId.startsWith('Internal RFT') || 
           record.originalRecord.batchId.includes('Internal'))) {
        return true;
      }
      
      // Check for internal RFT specific fields
      if (record.originalRecord["wo/lot#"] && !record.originalRecord.fg_batch) {
        return true;
      }
      
      // Check for form field which is common in Internal RFT records
      if (record.originalRecord.form && 
          !this._isExternalRftRecord(record) && 
          !this._isProcessRecord(record)) {
        return true;
      }
    } else {
      // Direct record access if originalRecord not available
      if (record.batchId && 
          (record.batchId.startsWith('Internal RFT') || 
           record.batchId.includes('Internal'))) {
        return true;
      }
      
      if (record["wo/lot#"] && !record.fg_batch) {
        return true;
      }
      
      if (record.form && 
          !this._isExternalRftRecord(record) && 
          !this._isProcessRecord(record)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Determine if a record is an External RFT record
   * @param {Object} record - The record to check
   * @returns {boolean} True if it's an External RFT record
   */
  _isExternalRftRecord(record) {
    // Use different detection methods in this priority order
    if (record.source === 'External') {
      return true;
    }
    
    if (record.originalRecord) {
      // Check batchId format
      if (record.originalRecord.batchId && 
          (record.originalRecord.batchId.startsWith('External RFT') || 
           record.originalRecord.batchId.includes('External'))) {
        return true;
      }
      
      // Check for external specific fields
      if (record.originalRecord.lot && 
          !record.originalRecord.fg_batch &&
          !record.originalRecord["wo/lot#"]) {
        return true;
      }
      
      // Check for customer field common in External RFT
      if (record.originalRecord.customer && 
          !this._isProcessRecord(record) && 
          !this._isInternalRftRecord(record)) {
        return true;
      }
    } else {
      // Direct record access if originalRecord not available
      if (record.batchId && 
          (record.batchId.startsWith('External RFT') || 
           record.batchId.includes('External'))) {
        return true;
      }
      
      if (record.lot && 
          !record.fg_batch &&
          !record["wo/lot#"]) {
        return true;
      }
      
      if (record.customer && 
          !this._isProcessRecord(record) && 
          !this._isInternalRftRecord(record)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Normalize a lot ID to ensure consistent format
   * @param {string} lotId - The raw lot ID
   * @returns {string} The normalized lot ID
   */
  _normalizeLotId(lotId) {
    if (!lotId) return 'UNKNOWN';
    
    // Convert to string, trim whitespace, and convert to uppercase
    const normalized = lotId.toString().trim().toUpperCase();
    
    // Return normalized lot ID
    return normalized;
  }
  
  /**
   * Check if an ID is a proper lot number vs a work order number
   * @param {string} id - The ID to check
   * @returns {boolean} True if it's a proper lot ID
   */
  _isProperLotId(id) {
    if (!id) return false;
    
    // Most real lot IDs follow patterns like PAR0123, NAR0456, etc.
    // Work order numbers are typically just numeric (e.g., 2077291)
    const lotPattern = /^[A-Z]{3}\d{4}$/;
    const pendingPattern = /^PENDING$/i;
    
    return lotPattern.test(id) || pendingPattern.test(id);
  }
  
  /**
   * Group records by lot number using work order mapping for Internal RFT records
   * @param {Array} processedRecords - The processed records
   * @param {Object} workOrderToLotMap - Map of work order to lot number
   * @returns {Object} Records grouped by lot number
   */
  _groupRecordsByLot(processedRecords, workOrderToLotMap) {
    console.log('Grouping records by lot number...');
    console.log(`Work order mapping contains ${Object.keys(workOrderToLotMap).length} entries`);
    
    // Count record types for debugging
    const processRecords = processedRecords.filter(r => this._isProcessRecord(r));
    const internalRecords = processedRecords.filter(r => this._isInternalRftRecord(r));
    const externalRecords = processedRecords.filter(r => this._isExternalRftRecord(r));
    
    console.log(`Record counts by type: Process=${processRecords.length}, Internal=${internalRecords.length}, External=${externalRecords.length}`);
    
    // First, log a sample of the work order mapping for debugging
    const sampleWorkOrders = Object.keys(workOrderToLotMap).slice(0, 5);
    sampleWorkOrders.forEach(wo => {
      console.log(`Sample WO mapping: ${wo} -> ${workOrderToLotMap[wo]}`);
    });
    
    const lotGroups = {};
    let unmappableCounts = { internal: 0, external: 0 };
    
    // Phase 1: First add all Process records, which provide our lot structure
    processRecords.forEach(record => {
      if (record.lot) {
        const normalizedLot = this._normalizeLotId(record.lot);
        if (!lotGroups[normalizedLot]) {
          lotGroups[normalizedLot] = [];
        }
        lotGroups[normalizedLot].push(record);
      }
    });
    
    console.log(`After Phase 1 (Process records): ${Object.keys(lotGroups).length} lot groups`);
    
    // Phase 2: Add all External RFT records with known lot numbers
    externalRecords.forEach(record => {
      if (record.lot) {
        const normalizedLot = this._normalizeLotId(record.lot);
        if (!lotGroups[normalizedLot]) {
          lotGroups[normalizedLot] = [];
        }
        lotGroups[normalizedLot].push(record);
      } else {
        unmappableCounts.external++;
      }
    });
    
    console.log(`After Phase 2 (External RFT records): ${Object.keys(lotGroups).length} lot groups`);
    
    // Phase 3: Map Internal RFT records using work order
    const mappedInternalRecords = new Set(); // Track which records we've mapped
    
    internalRecords.forEach(record => {
      if (record.workOrder) {
        // Try to find the lot using the work order mapping
        const lotId = workOrderToLotMap[record.workOrder];
        
        if (lotId) {
          // Found a lot mapping via work order
          const normalizedLot = this._normalizeLotId(lotId);
          if (!lotGroups[normalizedLot]) {
            lotGroups[normalizedLot] = [];
          }
          
          // Add the lot ID to the record for future reference
          record.lot = normalizedLot;
          
          lotGroups[normalizedLot].push(record);
          mappedInternalRecords.add(record);
        }
      }
    });
    
    console.log(`After Phase 3 (Internal RFT with WO mapping): ${Object.keys(lotGroups).length} lot groups`);
    console.log(`Mapped ${mappedInternalRecords.size} Internal RFT records to lots via work order`);
    
    // Phase 4: Make another pass to map numeric work orders to proper lot IDs
    // This helps ensure numeric work orders aren't treated as lots
    const numericWorkOrders = new Set();
    const remappedWorkOrders = {};
    
    // First, identify all numeric work order IDs that might be mistaken for lots
    internalRecords.forEach(record => {
      if (!mappedInternalRecords.has(record) && record.workOrder && !this._isProperLotId(record.workOrder)) {
        numericWorkOrders.add(record.workOrder);
      }
    });
    
    console.log(`Found ${numericWorkOrders.size} numeric work orders to remap`);
    
    // Now try to find if any of these work orders have been grouped mistakenly as lots
    // and map them to correct lot numbers if possible
    numericWorkOrders.forEach(workOrder => {
      // Normalize work order for consistency
      const normalizedWO = this._normalizeLotId(workOrder);
      
      // If this work order has been used as a lot ID but isn't a proper lot pattern
      if (lotGroups[normalizedWO] && !this._isProperLotId(normalizedWO)) {
        console.log(`Found mistakenly grouped work order as lot: ${normalizedWO}`);
        
        // Look for any proper lot ID in the same group that has process records
        const realLotRecords = Object.entries(lotGroups).filter(([lotId, records]) => {
          return this._isProperLotId(lotId) && records.some(r => this._isProcessRecord(r));
        });
        
        // If we found any real lots, try to match based on dates or other correlation
        if (realLotRecords.length > 0) {
          // For now, use the first one with the closest date match
          // This is a simplified approach - could be improved with more sophisticated matching
          let bestMatchLotId = realLotRecords[0][0];
          
          // Map this work order to the real lot
          remappedWorkOrders[normalizedWO] = bestMatchLotId;
          console.log(`Remapping work order ${normalizedWO} to lot ${bestMatchLotId}`);
          
          // Move the records to the proper lot
          const recordsToMove = lotGroups[normalizedWO];
          
          if (!lotGroups[bestMatchLotId]) {
            lotGroups[bestMatchLotId] = [];
          }
          
          // Add all records from the work order "lot" to the real lot
          recordsToMove.forEach(record => {
            // Update the record's lot ID reference
            record.lot = bestMatchLotId;
            lotGroups[bestMatchLotId].push(record);
            
            // If it's an internal record, mark as mapped
            if (this._isInternalRftRecord(record)) {
              mappedInternalRecords.add(record);
            }
          });
          
          // Delete the improper lot group
          delete lotGroups[normalizedWO];
        }
      }
    });
    
    if (Object.keys(remappedWorkOrders).length > 0) {
      console.log(`Remapped ${Object.keys(remappedWorkOrders).length} work orders to proper lots`);
    }
    
    // Phase 5: Try to map remaining Internal RFT records 
    // (This is a fallback when workOrder mapping fails)
    internalRecords.forEach(record => {
      if (!mappedInternalRecords.has(record)) {
        // This record wasn't mapped in earlier phases
        
        // Option 1: If the record has a workOrder that matches a lot ID directly
        if (record.workOrder) {
          const normalizedWO = this._normalizeLotId(record.workOrder);
          
          // Check if the work order has been remapped in our earlier process
          if (remappedWorkOrders[normalizedWO]) {
            // Use the remapped lot ID
            const mappedLotId = remappedWorkOrders[normalizedWO];
            record.lot = mappedLotId;
            
            if (!lotGroups[mappedLotId]) {
              lotGroups[mappedLotId] = [];
            }
            
            lotGroups[mappedLotId].push(record);
            mappedInternalRecords.add(record);
          }
          // If this work order is already a proper lot ID
          else if (this._isProperLotId(normalizedWO) && lotGroups[normalizedWO]) {
            // The work order happens to match an existing lot ID
            record.lot = normalizedWO;
            lotGroups[normalizedWO].push(record);
            mappedInternalRecords.add(record);
          } 
          // Only create new lot groups for proper lot IDs
          else if (this._isProperLotId(normalizedWO)) {
            record.lot = normalizedWO;
            lotGroups[normalizedWO] = [record];
            mappedInternalRecords.add(record);
          } else {
            unmappableCounts.internal++;
          }
        } else {
          unmappableCounts.internal++;
        }
      }
    });
    
    console.log(`After final mapping phase: ${Object.keys(lotGroups).length} lot groups`);
    console.log(`Final mapping: ${mappedInternalRecords.size}/${internalRecords.length} Internal RFT records mapped`);
    
    // Final phase: Filter out "invalid" lot groups that only have internal records
    // and no process records (these are likely misidentified work orders)
    const filteredLotGroups = {};
    let filteredOutLots = 0;
    
    Object.entries(lotGroups).forEach(([lotId, records]) => {
      const hasProcessRecords = records.some(r => this._isProcessRecord(r));
      const isProperLotId = this._isProperLotId(lotId);
      
      // Keep real lots with process records, or lots with proper ID patterns
      if (hasProcessRecords || isProperLotId) {
        filteredLotGroups[lotId] = records;
      } else {
        filteredOutLots++;
        console.log(`Filtering out invalid lot group: ${lotId} (${records.length} records, no process data)`);
      }
    });
    
    console.log(`Filtered out ${filteredOutLots} invalid lot groups`);
    console.log(`Final lot count: ${Object.keys(filteredLotGroups).length}`);
    
    // Log overall results
    let totalMappedRecords = 0;
    Object.values(filteredLotGroups).forEach(records => {
      totalMappedRecords += records.length;
    });
    
    console.log(`Grouped ${totalMappedRecords} records into ${Object.keys(filteredLotGroups).length} lots`);
    console.log(`Unmappable records: ${unmappableCounts.internal} internal, ${unmappableCounts.external} external`);
    
    // Log the size of each lot group
    const lotSizes = Object.entries(filteredLotGroups)
      .map(([lot, records]) => ({ 
        lot, 
        size: records.length,
        processCount: records.filter(r => this._isProcessRecord(r)).length,
        internalCount: records.filter(r => this._isInternalRftRecord(r)).length,
        externalCount: records.filter(r => this._isExternalRftRecord(r)).length
      }))
      .sort((a, b) => b.size - a.size);
    
    console.log("Top 10 largest lot groups:");
    lotSizes.slice(0, 10).forEach(({lot, size, processCount, internalCount, externalCount}) => {
      console.log(`Lot ${lot}: ${size} records (${processCount} process, ${internalCount} internal, ${externalCount} external)`);
    });
    
    // Check for potential issues in grouping
    const potentialIssues = lotSizes.filter(({processCount, internalCount, externalCount}) => {
      return processCount === 0 || internalCount > processCount * 50 || externalCount > processCount * 50;
    });
    
    if (potentialIssues.length > 0) {
      console.warn(`Found ${potentialIssues.length} lots with potential grouping issues`);
      potentialIssues.slice(0, 5).forEach(({lot, size, processCount, internalCount, externalCount}) => {
        console.warn(`Issue with lot ${lot}: ${size} records (${processCount} process, ${internalCount} internal, ${externalCount} external)`);
      });
    }
    
    return filteredLotGroups;
  }
  
  /**
   * Calculate lot-level metrics
   * @param {Object} lotGroups - Records grouped by lot
   * @returns {Object} Lot metrics
   */
  _calculateLotMetrics(lotGroups) {
    console.log('Calculating lot-level metrics...');
    
    const metrics = {
      totalLots: Object.keys(lotGroups).length,
      rftLots: 0,
      nonRftLots: 0,
      lotRftPercentage: 0,
      wipLots: 0,
      fgLots: 0,
      lotsByType: {},
      averageTimeMetrics: {
        avgCycleTime: 0,
        avgWipTime: 0,
        avgFgTime: 0
      },
      lotStatuses: []
    };
    
    let totalCycleTime = 0;
    let lotsWithCycleTime = 0;
    
    // Calculate metrics for each lot
    Object.entries(lotGroups).forEach(([lotId, records]) => {
      // Get internal and external RFT records (ignore Process records for RFT determination)
      const internalRecords = records.filter(r => this._isInternalRftRecord(r));
      const externalRecords = records.filter(r => this._isExternalRftRecord(r));
      
      // A lot is RFT only if ALL its internal and external records are RFT
      let isRft = true;
      let hasRftableRecords = false;
      
      // Check internal RFT records
      if (internalRecords.length > 0) {
        hasRftableRecords = true;
        // If any internal record is not RFT, the lot is not RFT
        if (internalRecords.some(record => record.isRft === false)) {
          isRft = false;
        }
      }
      
      // Check external RFT records
      if (externalRecords.length > 0) {
        hasRftableRecords = true;
        // If any external record is not RFT, the lot is not RFT
        if (externalRecords.some(record => record.isRft === false)) {
          isRft = false;
        }
      }
      
      // If the lot has no internal or external records, its RFT status is null
      if (!hasRftableRecords) {
        isRft = null;
      }
      
      // Count RFT lots (only if they have internal or external records to evaluate)
      if (isRft === true) {
        metrics.rftLots++;
      } else if (isRft === false) {
        metrics.nonRftLots++;
      }
      
      // Determine lot stage (WIP vs FG)
      const hasWipRecords = records.some(record => record.type === 'WIP');
      const hasFgRecords = records.some(record => record.type === 'FG');
      
      if (hasWipRecords) metrics.wipLots++;
      if (hasFgRecords) metrics.fgLots++;
      
      // Count by record source type
      const sourceCounts = this._countRecordsBySource(records);
      
      // Calculate cycle time if available
      let cycleTime = 0;
      const processRecords = records.filter(record => this._isProcessRecord(record));
      
      if (processRecords.length > 0) {
        // Use the cycle time from the process record if available
        const cycleTimeValues = processRecords
          .map(record => record.originalRecord.total_cycle_time_days || record.originalRecord['total_cycle_time_(days)'])
          .filter(value => value !== undefined && value !== null);
        
        if (cycleTimeValues.length > 0) {
          cycleTime = Math.max(...cycleTimeValues);
          totalCycleTime += cycleTime;
          lotsWithCycleTime++;
        }
      }
      
      // Add lot status to the collection
      metrics.lotStatuses.push({
        lotId,
        isRft,
        recordCount: records.length,
        cycleTime,
        sourceCounts
      });
    });
    
    // Calculate RFT percentage (only for lots that have RFT status)
    const lotsWithRftStatus = metrics.rftLots + metrics.nonRftLots;
    metrics.lotRftPercentage = lotsWithRftStatus > 0 
      ? (metrics.rftLots / lotsWithRftStatus) * 100 
      : 0;
    
    // Calculate average cycle time
    metrics.averageTimeMetrics.avgCycleTime = lotsWithCycleTime > 0 
      ? totalCycleTime / lotsWithCycleTime 
      : 0;
    
    console.log('Lot metrics calculated:', metrics);
    
    return metrics;
  }
  
  /**
   * Count records by source type
   * @param {Array} records - Records to count
   * @returns {Object} Counts by source type
   */
  _countRecordsBySource(records) {
    const counts = {
      process: 0,
      internal: 0,
      external: 0,
      unknown: 0
    };
    
    records.forEach(record => {
      if (this._isProcessRecord(record)) {
        counts.process++;
      } else if (this._isInternalRftRecord(record)) {
        counts.internal++;
      } else if (this._isExternalRftRecord(record)) {
        counts.external++;
      } else {
        counts.unknown++;
      }
    });
    
    return counts;
  }
  
  /**
   * Calculate day difference between two dates
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {number} Difference in days
   */
  _calculateDaysDifference(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Calculate overall metrics
   * @param {Array} processedRecords - All processed records
   * @param {Object} lotMetrics - Lot-level metrics
   * @returns {Object} Overall metrics
   */
  _calculateMetrics(processedRecords, lotMetrics) {
    console.log('Calculating overall metrics...');
    
    // Count records by type for analysis
    const processRecords = processedRecords.filter(r => this._isProcessRecord(r));
    const internalRecords = processedRecords.filter(r => this._isInternalRftRecord(r));
    const externalRecords = processedRecords.filter(r => this._isExternalRftRecord(r));
    
    // Calculate RFT status only for Internal and External records (ignore Process records)
    const rftableRecords = [...internalRecords, ...externalRecords];
    const rftCount = rftableRecords.filter(r => r.isRft === true).length;
    const nonRftCount = rftableRecords.filter(r => r.isRft === false).length;
    
    const metrics = {
      totalRecords: processedRecords.length,
      rftCount: rftCount,
      nonRftCount: nonRftCount,
      rftPercentage: 0,
      avgProcessDurationDays: 0,
      lotMetrics: lotMetrics,
      recordsBySource: {
        process: processRecords.length,
        internal: internalRecords.length,
        external: externalRecords.length
      },
      rftBySource: {
        internal: {
          total: internalRecords.length,
          rft: internalRecords.filter(r => r.isRft === true).length,
          nonRft: internalRecords.filter(r => r.isRft === false).length,
          percentage: internalRecords.length > 0 
            ? (internalRecords.filter(r => r.isRft === true).length / internalRecords.length) * 100 
            : 0
        },
        external: {
          total: externalRecords.length,
          rft: externalRecords.filter(r => r.isRft === true).length,
          nonRft: externalRecords.filter(r => r.isRft === false).length,
          percentage: externalRecords.length > 0 
            ? (externalRecords.filter(r => r.isRft === true).length / externalRecords.length) * 100 
            : 0
        }
      }
    };
    
    // Calculate overall RFT percentage (only for Internal and External records)
    const totalRftableRecords = rftCount + nonRftCount;
    metrics.rftPercentage = totalRftableRecords > 0 
      ? (rftCount / totalRftableRecords) * 100 
      : 0;
    
    // Calculate average process duration
    const recordsWithDuration = processedRecords.filter(r => r.processDurationDays > 0);
    metrics.avgProcessDurationDays = recordsWithDuration.length > 0 
      ? recordsWithDuration.reduce((sum, r) => sum + r.processDurationDays, 0) / recordsWithDuration.length 
      : 0;
    
    console.log('Overall metrics calculated:', {
      totalRecords: metrics.totalRecords,
      processRecords: metrics.recordsBySource.process,
      internalRecords: metrics.recordsBySource.internal,
      externalRecords: metrics.recordsBySource.external,
      internalRftPercentage: metrics.rftBySource.internal.percentage.toFixed(1) + '%',
      externalRftPercentage: metrics.rftBySource.external.percentage.toFixed(1) + '%',
      overallRftPercentage: metrics.rftPercentage.toFixed(1) + '%'
    });
    
    return metrics;
  }
  
  /**
   * Calculate monthly trend data
   * @returns {Object} Monthly trend data
   */
  _calculateMonthlyTrends() {
    // Extract records with dates
    const recordsWithDates = Object.values(this.lotData)
      .flat()
      .filter(record => record.startDate);
    
    // Group by month
    const monthlyData = {};
    
    recordsWithDates.forEach(record => {
      const monthKey = `${record.startDate.getFullYear()}-${record.startDate.getMonth() + 1}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          totalRecords: 0,
          rftRecords: 0,
          nonRftRecords: 0
        };
      }
      
      monthlyData[monthKey].totalRecords++;
      
      if (record.isRft) {
        monthlyData[monthKey].rftRecords++;
      } else {
        monthlyData[monthKey].nonRftRecords++;
      }
    });
    
    // Convert to array and calculate percentages
    const trendData = Object.entries(monthlyData).map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        year,
        label: `${date.toLocaleString('default', { month: 'short' })} ${year}`,
        totalRecords: data.totalRecords,
        rftRecords: data.rftRecords,
        nonRftRecords: data.nonRftRecords,
        rftPercentage: data.totalRecords > 0 ? (data.rftRecords / data.totalRecords) * 100 : 0
      };
    });
    
    // Sort by date
    trendData.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const monthOrder = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
      return monthOrder[a.month] - monthOrder[b.month];
    });
    
    return trendData;
  }
  
  /**
   * Calculate improvement metrics
   * @returns {Object} Improvement metrics
   */
  _calculateImprovementMetrics() {
    const monthlyTrends = this._calculateMonthlyTrends();
    
    // Skip if not enough data
    if (monthlyTrends.length < 2) {
      return {
        rftTrend: 0,
        cycleTrend: 0,
        throughputTrend: 0
      };
    }
    
    // Calculate RFT trend (current month vs. previous month)
    const currentMonth = monthlyTrends[monthlyTrends.length - 1];
    const previousMonth = monthlyTrends[monthlyTrends.length - 2];
    
    const rftTrend = currentMonth.rftPercentage - previousMonth.rftPercentage;
    const throughputTrend = currentMonth.totalRecords - previousMonth.totalRecords;
    
    return {
      rftTrend,
      cycleTrend: 0, // Would need more data to calculate this
      throughputTrend
    };
  }
  
  /**
   * Get detailed debug information about lot grouping
   * @returns {Object} Detailed information about lots
   */
  debugLotData() {
    if (!this.lotData) {
      return { error: "No lot data available" };
    }
    
    const lotDebugInfo = {};
    
    // For each lot, gather detailed information
    Object.entries(this.lotData).forEach(([lotId, records]) => {
      const processRecords = records.filter(r => this._isProcessRecord(r));
      const internalRecords = records.filter(r => this._isInternalRftRecord(r));
      const externalRecords = records.filter(r => this._isExternalRftRecord(r));
      
      lotDebugInfo[lotId] = {
        lotId,
        totalRecords: records.length,
        recordCounts: {
          process: processRecords.length,
          internal: internalRecords.length,
          external: externalRecords.length
        },
        // Get sample record details
        processRecordSample: processRecords.length > 0 ? this._getSampleRecordInfo(processRecords[0]) : null,
        internalRecordSample: internalRecords.length > 0 ? this._getSampleRecordInfo(internalRecords[0]) : null,
        externalRecordSample: externalRecords.length > 0 ? this._getSampleRecordInfo(externalRecords[0]) : null,
        // Check if this lot has odd record distribution
        potentialAnomaly: this._checkForLotAnomaly(processRecords, internalRecords, externalRecords)
      };
    });
    
    // Summary statistics
    const summary = {
      totalLots: Object.keys(this.lotData).length,
      lotsWithProcessRecords: Object.values(lotDebugInfo).filter(l => l.recordCounts.process > 0).length,
      lotsWithInternalRecords: Object.values(lotDebugInfo).filter(l => l.recordCounts.internal > 0).length,
      lotsWithExternalRecords: Object.values(lotDebugInfo).filter(l => l.recordCounts.external > 0).length,
      potentialAnomalies: Object.values(lotDebugInfo).filter(l => l.potentialAnomaly).length
    };
    
    return { 
      summary,
      lotDetails: lotDebugInfo 
    };
  }
  
  /**
   * Get sample information from a record for debugging
   * @param {Object} record - Record to extract information from
   * @returns {Object} Sample information
   */
  _getSampleRecordInfo(record) {
    if (!record) return null;
    return {
      lot: record.lot,
      workOrder: record.workOrder,
      assemblyWo: record.assemblyWo,
      cartoningWo: record.cartoningWo,
      source: this._detectRecordSource(record),
      originalId: record.originalRecord[this.fieldMap.id]
    };
  }
  
  /**
   * Detect record source type
   * @param {Object} record - Record to check
   * @returns {string} Source type
   */
  _detectRecordSource(record) {
    if (this._isProcessRecord(record)) return 'Process';
    if (this._isInternalRftRecord(record)) return 'Internal';
    if (this._isExternalRftRecord(record)) return 'External';
    return 'Unknown';
  }
  
  /**
   * Check if a lot has anomalous record distribution
   * @param {Array} processRecords - Process records
   * @param {Array} internalRecords - Internal RFT records
   * @param {Array} externalRecords - External RFT records
   * @returns {boolean} True if anomaly detected
   */
  _checkForLotAnomaly(processRecords, internalRecords, externalRecords) {
    // Lots with no Process records are suspicious
    if (processRecords.length === 0 && (internalRecords.length > 0 || externalRecords.length > 0)) {
      return true;
    }
    
    // Lots with excessive Internal or External records compared to Process records
    // may indicate incorrect grouping
    if (processRecords.length > 0 && 
        (internalRecords.length > processRecords.length * 50 || 
         externalRecords.length > processRecords.length * 50)) {
      return true;
    }
    
    return false;
  }
}

// Export the adapter
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LotBasedDataAdapter;
} else if (typeof window !== 'undefined') {
  window.LotBasedDataAdapter = LotBasedDataAdapter;
}

// Add table styling CSS
const tableStyles = document.createElement('style');
tableStyles.id = 'lot-data-table-styles';
tableStyles.textContent = `
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
    font-size: 14px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #e1e1e1;
  }
  
  .data-table th {
    background-color: #f5f7fa;
    font-weight: bold;
    border-top: 1px solid #e1e1e1;
    border-bottom: 2px solid #ddd;
  }
  
  .data-table tr:hover td {
    background-color: #f9f9f9;
  }
  
  .impact-high {
    color: #e74c3c;
    font-weight: bold;
  }
  
  .impact-medium {
    color: #f39c12;
    font-weight: bold;
  }
  
  .impact-low {
    color: #2ecc71;
  }
  
  .status-pass {
    background-color: #2ecc71;
    color: white;
    padding: 3px 8px;
    border-radius: 3px;
    display: inline-block;
  }
  
  .status-fail {
    background-color: #e74c3c;
    color: white;
    padding: 3px 8px;
    border-radius: 3px;
    display: inline-block;
  }
  
  .comment-cell {
    max-width: 300px;
    white-space: normal;
    word-break: break-word;
  }
`;
document.head.appendChild(tableStyles); 