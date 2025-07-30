
import { GoogleGenAI, Type } from "@google/genai";
import type { ApiEndpoint } from '../types';

if (!process.env.API_KEY) {
  // In a real app, you'd want to handle this more gracefully.
  // For this example, we'll throw an error to make it clear.
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const apiEndpointSchema = {
  type: Type.OBJECT,
  properties: {
    httpMethod: { 
      type: Type.STRING,
      description: 'The HTTP method for the endpoint (e.g., GET, POST, PUT, DELETE).',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
    },
    path: { 
      type: Type.STRING, 
      description: 'The API path, starting with /v1/. Use curly braces for path parameters, e.g., /v1/users/{userId}.' 
    },
    description: { 
      type: Type.STRING, 
      description: 'A brief, user-friendly description of what the API endpoint does.' 
    },
    parameters: {
      type: Type.ARRAY,
      description: 'A list of parameters for the API endpoint (path, query, or body parameters).',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'The name of the parameter.' },
          type: { type: Type.STRING, description: 'The data type of the parameter (e.g., string, integer, boolean).' },
          description: { type: Type.STRING, description: 'A brief description of the parameter.' }
        },
        required: ['name', 'type', 'description']
      }
    },
    querySuggestion: {
      type: Type.STRING,
      description: "A sample SQL query that could be used to fetch the data for this endpoint from a hypothetical legacy database. Use placeholders like {paramName} for parameters."
    }
  },
  required: ['httpMethod', 'path', 'description', 'parameters', 'querySuggestion'],
};

interface DatabaseSchema {
  database: string;
  type: string;
  tables: Array<{
    name: string;
    rowCount: number;
    columns: Array<{
      name: string;
      type: string;
      nullable: boolean;
      isPrimaryKey: boolean;
      isAutoIncrement: boolean;
    }>;
    foreignKeys: Array<{
      columnName: string;
      referencedTable: string;
      referencedColumn: string;
    }>;
  }>;
}

export const generateApiConfig = async (
  prompt: string, 
  databaseSchema?: DatabaseSchema
): Promise<Omit<ApiEndpoint, 'id' | 'status'>> => {
  try {
    // Build enhanced prompt with database context
    let enhancedPrompt = `Based on the following request, generate a REST API endpoint configuration. The user is trying to expose functionality from a legacy system. Be thoughtful about RESTful principles and common use cases. Request: "${prompt}"`;
    
    let systemInstruction = "You are an expert API designer specializing in modernizing legacy systems. Your task is to generate a JSON configuration for a new REST API endpoint based on a user's natural language request. The output must strictly follow the provided JSON schema. Focus on creating practical, well-structured APIs with appropriate parameters and realistic SQL queries.";

    // Add database schema context if provided
    if (databaseSchema) {
      const schemaContext = buildSchemaContext(databaseSchema);
      enhancedPrompt += `\n\nDATABASE CONTEXT:\n${schemaContext}`;
      systemInstruction += `\n\nIMPORTANT: You have access to the actual database schema above. Use the real table names, column names, and relationships in your API design. Generate SQL queries that work with the actual database structure. Consider the data types, foreign key relationships, and table structures when designing the API parameters and response format.`;
    }

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: enhancedPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: apiEndpointSchema,
      },
    });

    const jsonText = result.text.trim();
    const parsedConfig = JSON.parse(jsonText);
    
    // We can cast here because the schema enforcement from the API should ensure it matches our structure.
    return parsedConfig as Omit<ApiEndpoint, 'id' | 'status'>;

  } catch (error) {
    console.error("Error generating API config with Gemini:", error);
    let errorMessage = "An unknown error occurred while generating the API configuration.";
    if (error instanceof Error) {
        errorMessage = `Failed to generate API configuration: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
};

// Helper function to build database schema context for AI
function buildSchemaContext(schema: DatabaseSchema): string {
  let context = `Database: ${schema.database} (${schema.type})\n`;
  context += `Tables: ${schema.tables.length}\n\n`;
  
  schema.tables.forEach(table => {
    context += `TABLE: ${table.name} (${table.rowCount?.toLocaleString() || 'Unknown'} rows)\n`;
    context += `Columns:\n`;
    
    table.columns.forEach(column => {
      const nullable = column.nullable ? 'NULL' : 'NOT NULL';
      const pk = column.isPrimaryKey ? ' [PRIMARY KEY]' : '';
      const ai = column.isAutoIncrement ? ' [AUTO_INCREMENT]' : '';
      context += `  - ${column.name}: ${column.type} ${nullable}${pk}${ai}\n`;
    });
    
    if (table.foreignKeys && table.foreignKeys.length > 0) {
      context += `Foreign Keys:\n`;
      table.foreignKeys.forEach(fk => {
        context += `  - ${fk.columnName} → ${fk.referencedTable}.${fk.referencedColumn}\n`;
      });
    }
    
    context += `\n`;
  });
  
  return context;
}

export const testApiEndpoint = async (config: Omit<ApiEndpoint, 'id' | 'status'>, parameters: Record<string, any>) => {
  // This is a mock function for testing API endpoints
  // In a real implementation, this would make actual HTTP requests
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: 200,
        data: { message: 'Mock response', parameters },
        duration: Math.floor(Math.random() * 500) + 100
      });
    }, 1000);
  });
};
