

'use server';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import { getJsaAnalysisAction, getInvestigationAnalysisAction, getKpiSummaryAction, generateToolboxTalkAction } from './actions.google';
import { collection, getDocs } from 'firebase/firestore';

export { getJsaAnalysisAction, getInvestigationAnalysisAction, getKpiSummaryAction, generateToolboxTalkAction };

export async function fetchAndUploadImageAction(imageUrlOrId: string): Promise<string> {
  if (!imageUrlOrId) {
    throw new Error('Invalid input: Image URL or ID cannot be empty.');
  }

  let effectiveUrl = imageUrlOrId;

  // Check if it's a potential Google Drive ID (and not a full URL).
  // A simple heuristic: it's a long string without slashes.
  const isLikelyId = !imageUrlOrId.includes('/') && imageUrlOrId.length > 20;

  if (isLikelyId) {
    effectiveUrl = `https://drive.google.com/uc?export=view&id=${imageUrlOrId}`;
    console.log(`Treated input as Google Drive ID. Constructed URL: ${effectiveUrl}`);
  } else if (imageUrlOrId.includes('drive.google.com')) {
    // Regex to capture file ID from formats like:
    // - /file/d/ID/...
    // - ?id=ID
    const regex = /\/file\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/;
    const match = imageUrlOrId.match(regex);
    
    if (match && (match[1] || match[2])) {
      const fileId = match[1] || match[2];
      effectiveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      console.log(`Transformed Google Drive URL to direct view link: ${effectiveUrl}`);
    } else {
      console.warn(`Could not extract file ID from Google Drive URL. Attempting to use original URL: ${imageUrlOrId}`);
    }
  }

  try {
    const response = await fetch(effectiveUrl, {
      redirect: 'follow', // Important for Google Drive links
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      const responseBody = await response.text();
      console.error(`Server failed to fetch image from ${effectiveUrl}. Status: ${response.status} ${response.statusText}`);
      console.error(`Response body: ${responseBody}`);
      throw new Error(`Server failed to fetch image. Status: ${response.status} ${response.statusText}. See server console for response body.`);
    }

    const contentType = response.headers.get('content-type');
    const imageBuffer = await response.arrayBuffer();

    if (!contentType || !contentType.startsWith('image/')) {
        // Decode the first part of the buffer to see what we got
        const responseBodyPreview = Buffer.from(imageBuffer.slice(0, 500)).toString('utf-8');
        console.error(`URL did not return an image. Content-Type: ${contentType}. Body preview: ${responseBodyPreview}`);
        throw new Error(`URL did not return an image. The server received '${contentType}'. The content starts with: "${responseBodyPreview.substring(0, 200)}..."`);
    }

    if (imageBuffer.byteLength === 0) {
      console.error(`Fetched empty image buffer from ${effectiveUrl}.`);
      throw new Error('Fetched an empty image buffer from the URL.');
    }
    
    // Convert to a data URI to send back to the client
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const dataUri = `data:${contentType};base64,${base64}`;

    return dataUri;

  } catch (error) {
    console.error(`Error in fetchAndUploadImageAction for URL ${effectiveUrl}:`, error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('An unknown error occurred during image fetching and uploading.');
  }
}

const getCollectionData = async (collectionName: string) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const escapeSqlValue = (value: any): string => {
    if (value === null || typeof value === 'undefined') return 'NULL';
    if (typeof value === 'boolean') return value ? '1' : '0';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`; // Store objects/arrays as JSON strings
    return `'${value.toString().replace(/'/g, "''")}'`;
};

const generateCreateTableSql = (tableName: string, allData: Record<string, any>[]): string => {
    if (allData.length === 0) {
        return `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n  \`id\` VARCHAR(255) PRIMARY KEY\n);\n\n`;
    }

    const allKeys = new Set<string>();
    allData.forEach(doc => {
        Object.keys(doc).forEach(key => allKeys.add(key));
    });

    let columns = '`id` VARCHAR(255) PRIMARY KEY';
    
    allKeys.forEach(key => {
        if (key === 'id') return;

        // Find the first non-null/undefined value for this key to infer type
        const sampleValue = allData.find(doc => doc[key] !== null && doc[key] !== undefined)?.[key];
        
        let type = 'TEXT'; // Default type
        if (typeof sampleValue === 'number') type = 'FLOAT';
        else if (typeof sampleValue === 'boolean') type = 'TINYINT(1)';
        
        columns += `,\n  \`${key}\` ${type}`;
    });

    return `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n  ${columns}\n);\n\n`;
};


export async function exportDatabaseToSqlAction(): Promise<string> {
  const collectionNames = [
    'users', 'areas', 'forklifts', 'predefinedChecklistItems', 'jsas',
    'incidents', 'observations', 'safetyWalks', 'forkliftInspections',
    'correctiveActions', 'investigations', 'safetyDocs', 'complianceRecords',
    'hotWorkPermits', 'confinedSpacePermits'
  ];

  let sqlOutput = '-- RDT360-Safety SQL Export\n';
  sqlOutput += `-- Generated on: ${new Date().toISOString()}\n\n`;

  for (const name of collectionNames) {
    try {
      const data = await getCollectionData(name);
      
      sqlOutput += `-- Data for collection: ${name}\n`;
      sqlOutput += generateCreateTableSql(name, data);

      if (data.length > 0) {
          data.forEach(doc => {
              const keys = Object.keys(doc).map(k => `\`${k}\``).join(', ');
              const values = Object.values(doc).map(escapeSqlValue).join(', ');
              sqlOutput += `INSERT INTO \`${name}\` (${keys}) VALUES (${values});\n`;
          });
      } else {
          sqlOutput += `-- Collection '${name}' is empty. No INSERT statements generated.\n`;
      }
      sqlOutput += '\n';

    } catch (e) {
      console.error(`Failed to export collection ${name}:`, e);
      sqlOutput += `-- Failed to export collection '${name}'. Error: ${(e as Error).message}\n\n`;
    }
  }

  return sqlOutput;
}
