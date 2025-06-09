function parseCSV(csvText) {
    if (!csvText || typeof csvText !== 'string') {
        console.error("Worker: CSV text is empty or not a string.");
        return [];
    }
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        console.error("Worker: CSV has no data rows.");
        return []; // No data if only header or empty
    }

    // Correct delimiter: comma
    const originalRawHeaders = lines[0].split(',').map(header => header.trim());

    // Processed headers for internal use (lowercase, underscore)
    const processedCsvHeaders = originalRawHeaders.map(header => {
        return header.toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/gi, '');
    });

    const data = [];
    console.log("Worker: Original CSV Headers:", originalRawHeaders);
    console.log("Worker: Processed CSV Headers (for internal matching):", processedCsvHeaders);

    // Define the mapping from *processed* CSV header to JS object key
    const headerMapping = {
        'papel': 'ticker',
        'segmento': 'setor', // Standardize to 'setor' for JS objects
        'preco': 'cotacao',
        'p_vp': 'pvp',
        'dy': 'dividendYield',
        'liquidez_media': 'liquidez', // CSV header is 'LIQUIDEZ MÉDIA DIÁRIA' -> 'liquidez_media_diaria'
                                      // Let's assume the provided list in subtask was simplified.
                                      // The important thing is 'liquidez_media' or 'liquidez_media_diaria' from CSV
                                      // maps to 'liquidez' in JS.
                                      // The current processing will make 'liquidez_média_diária' -> 'liquidez_mdia_diria'
                                      // This needs to be robust. Let's use a direct map from original header if possible or ensure processed ones are predictable.
                                      // For now, I'll stick to the subtask's list of processed headers:
                                      // papel, segmento, preco, p_vp, dy, liquidez_media, patrimonio, vacancia_fisica
        'patrimonio': 'patrimonioLiquido', // CSV: 'PATRIMÔNIO'
        'vacancia_fisica': 'vacancia'   // CSV: 'VACÂNCIA FÍSICA'
    };
    // A more robust mapping might be needed if processedCsvHeaders are not exactly matching the keys in headerMapping.
    // For this subtask, we assume the simplified list of processed headers from the prompt will be found.

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === "") continue; // Skip empty lines

        const values = lines[i].split(','); // Correct delimiter

        if (values.length === originalRawHeaders.length) {
            const rawEntry = {};
            processedCsvHeaders.forEach((processedHeader, index) => {
                rawEntry[processedHeader] = values[index] ? values[index].trim() : '';
            });

            const finalEntry = {};

            // Map CSV data to JS object keys
            for (const csvKeyToMap in headerMapping) {
                const jsKey = headerMapping[csvKeyToMap];
                let value = rawEntry[csvKeyToMap]; // Value from CSV using the processed key

                if (value === undefined) { // Should not happen if processedCsvHeaders are derived correctly
                    finalEntry[jsKey] = null;
                    console.warn(`Worker: Key ${csvKeyToMap} not found in rawEntry for line ${i+1}`);
                    continue;
                }

                const numericJsKeys = ['cotacao', 'pvp', 'dividendYield', 'liquidez', 'patrimonioLiquido', 'vacancia'];

                if (numericJsKeys.includes(jsKey)) {
                    if (typeof value === 'string' && value.endsWith('%')) {
                        // For 'dividendYield' and 'vacancia', the CSV values are direct numbers (e.g., "12,10" for 12.1%)
                        // The formatting to '%' string is done by Formatters.js.
                        // So, for DY and Vacancia, we need to parse them as numbers directly.
                         if (jsKey === 'dividendYield' || jsKey === 'vacancia') {
                             finalEntry[jsKey] = parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0; // Keep as number, e.g. 12.1
                        } else {
                             // For other potential future % fields that are actual percentages in CSV (e.g. "0.121")
                             finalEntry[jsKey] = parseFloat(value.replace(/\./g, '').replace('%', '').replace(',', '.')) / 100 || 0;
                        }
                    } else if (typeof value === 'string' && (value.match(/^[0-9\.,R$\s]+$/) || value.match(/^-?[0-9\.,R$\s]+$/))) {
                        let cleanedValue = value.replace('R$', '').trim();
                        cleanedValue = cleanedValue.replace(/\./g, ''); // Remove thousand separators
                        cleanedValue = cleanedValue.replace(',', '.');   // Replace decimal comma
                        finalEntry[jsKey] = parseFloat(cleanedValue) || 0; // Default to 0 if parsing fails
                    } else if (value === "N/A" || value === "" || value === "-") {
                        finalEntry[jsKey] = null;
                    } else {
                        const parsedAttempt = parseFloat(String(value).replace(',', '.'));
                        finalEntry[jsKey] = isNaN(parsedAttempt) ? null : parsedAttempt;
                    }
                } else {
                    finalEntry[jsKey] = value; // Assign string value directly for non-numeric fields
                }
            }

            // Ensure all mapped keys exist in finalEntry, even if they were not in CSV or value was undefined
            Object.values(headerMapping).forEach(mappedKey => {
                if (!(mappedKey in finalEntry)) {
                    finalEntry[mappedKey] = null;
                }
            });

            data.push(finalEntry);
        } else {
            console.warn(`Worker: Skipping malformed CSV line ${i + 1} (length ${values.length}, expected ${originalRawHeaders.length}): ${lines[i]}`);
        }
    }
    console.log(`Worker: parseCSV processed ${data.length} records.`);
    return data;
}

self.addEventListener('message', (event) => {
    console.log("Worker: Received message from main thread.");
    const { csvText } = event.data;
    // console.log("Worker: CSV text received in worker:", csvText ? csvText.substring(0, 100) + '...' : 'EMPTY'); // Log snippet
    
    try {
        // No importScripts needed here anymore
        console.log("Worker: Starting CSV parsing using internal parseCSV function...");
        const result = parseCSV(csvText); // Use the function defined above
        console.log("Worker: CSV parsing completed. Number of records:", result.length);
        
        if (result.length > 0) {
            console.log("Worker: First parsed record:", result[0]);
        }

        console.log("Worker: Sending result back to main thread.");
        self.postMessage({ success: true, data: result });
    } catch (e) {
        console.error("Worker: Error during CSV parsing or message posting:", e);
        self.postMessage({ success: false, error: e.message || 'Unknown worker error' });
    }
});