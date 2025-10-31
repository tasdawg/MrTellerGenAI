interface ApiConfig {
    baseUrl: string;
    apiKey: string;
}

let apiConfig: ApiConfig = {
    baseUrl: '',
    apiKey: '',
};

export const setApiConfig = (config: ApiConfig) => {
    apiConfig = { ...config };
};

const getHeaders = () => {
    const headers = new Headers();
    if (apiConfig.apiKey) {
        headers.append('X-API-Key', apiConfig.apiKey);
    }
    return headers;
};

// Helper to handle API responses
const handleResponse = async (response: Response) => {
    if (response.ok) {
        // Handle cases where the response might be empty (e.g., 204 No Content)
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    }
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
};

export const testApiConnection = async (baseUrl: string): Promise<any> => {
    const response = await fetch(baseUrl); // Health check endpoint is '/'
    return handleResponse(response);
};

export const uploadFile = async (file: Blob, filename: string): Promise<any> => {
    if (!apiConfig.baseUrl) throw new Error("API Base URL not configured.");
    
    const formData = new FormData();
    formData.append('file', file, filename);

    const response = await fetch(`${apiConfig.baseUrl}/upload/`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
    });
    return handleResponse(response);
};

export const saveJson = async (filename: string, data: object): Promise<any> => {
    if (!apiConfig.baseUrl) throw new Error("API Base URL not configured.");
    
    const headers = getHeaders();
    headers.append('Content-Type', 'application/json');

    const response = await fetch(`${apiConfig.baseUrl}/save-json/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ filename, data }),
    });
    return handleResponse(response);
};

export const getJson = async (filename: string): Promise<any> => {
    if (!apiConfig.baseUrl) throw new Error("API Base URL not configured.");

    const response = await fetch(`${apiConfig.baseUrl}/get-json/${filename}`, {
        method: 'GET',
        headers: getHeaders(),
    });
    return handleResponse(response);
};

export const deleteFile = async (filename: string): Promise<any> => {
    if (!apiConfig.baseUrl) throw new Error("API Base URL not configured.");

    const response = await fetch(`${apiConfig.baseUrl}/delete/${filename}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    return handleResponse(response);
};
