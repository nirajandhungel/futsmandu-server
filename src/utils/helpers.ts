import type {ApiResponse, PaginationInfo} from '../types/common.types.js';

// creates a standardize API response
export const createResponse = <T>(
    success:boolean,
    data?:T,
    message?:string,
    statusCode?:number,
    pagination?:PaginationInfo

):ApiResponse<T>=>{

    const response:ApiResponse<T>={success};
    if(message) response.message=message;
    if(data!==undefined) response.data = data;
    if(statusCode!==undefined) response.statusCode = statusCode;
    if(pagination)response.pagination = pagination;
    
    return response;
} ;

// calculates pagination info

export const calculatePagination = (
    page:number,
    limit:number,
    totalItems:number
):PaginationInfo =>{
    const totalPages = Math.ceil(totalItems/limit);

    return{
        page, limit, totalPages, totalItems
    };
};

//validates time format (HH:MM)

export const isvalidTime = (time:string):boolean=>{
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
}

//comapres two times (HH: MM format)

export const compareTime = (time1:string, time2:string):number =>{

    const [h1=0,m1=0] = time1.split(':').map(Number);
    const [h2=0,m2=0] = time2.split(':').map(Number);

    const minutes1 = h1* 60 + m1;
    const minutes2 = h2* 60 + m2;

    return minutes1 - minutes2;
}

// checks if a date is in the future

export const isFutureDate = (date:Date): boolean=>{
    const today = new Date();
    today.setHours(0,0,0,0);
    const checkdate = new Date(date);
    checkdate.setHours(0,0,0,0);
    return checkdate>=today;
};

// format date to YYYY-MM-DD
export const formatDate = (date:Date):string=>{
    return date.toISOString().substring(0,10);
}

/**
 * Parse nested FormData fields like courts[0][name] into structured objects
 * Handles both flat and nested FormData structures
 * Supports array notation: amenities[], courts[0][amenities][]
 */
export const parseFormData = (body: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(body)) {
        // Handle array notation with empty brackets: amenities[], courts[0][amenities][]
        // Pattern: fieldName[] or parent[index][fieldName][]
        const arrayBracketMatch = key.match(/^(.+)\[\]$/);
        if (arrayBracketMatch) {
            const fieldPath = arrayBracketMatch[1];
            
            // Check if it's a nested array like courts[0][amenities][]
            const nestedArrayMatch = fieldPath.match(/^(\w+)\[(\d+)\]\[(\w+)\]$/);
            if (nestedArrayMatch) {
                const [, arrayName, index, fieldName] = nestedArrayMatch;
                const idx = parseInt(index, 10);
                
                if (!result[arrayName]) {
                    result[arrayName] = [];
                }
                
                if (!result[arrayName][idx]) {
                    result[arrayName][idx] = {};
                }
                
                if (!result[arrayName][idx][fieldName]) {
                    result[arrayName][idx][fieldName] = [];
                }
                
                result[arrayName][idx][fieldName].push(value);
                continue;
            }
            
            // Handle top-level array like amenities[]
            if (!result[fieldPath]) {
                result[fieldPath] = [];
            }
            result[fieldPath].push(value);
            continue;
        }
        
        // Handle nested arrays like courts[0][name] (number in brackets = array index)
        const arrayMatch = key.match(/^(\w+)\[(\d+)\]\[(\w+)\]$/);
        if (arrayMatch) {
            const [, arrayName, index, fieldName] = arrayMatch;
            const idx = parseInt(index, 10);
            
            if (!result[arrayName]) {
                result[arrayName] = [];
            }
            
            if (!result[arrayName][idx]) {
                result[arrayName][idx] = {};
            }
            
            result[arrayName][idx][fieldName] = value;
            continue;
        }
        
        // Handle deeply nested objects like openingHours[monday][open] or location[coordinates][latitude]
        // (word in brackets = object key, not array index)
        const deepObjectMatch = key.match(/^(\w+)\[(\w+)\]\[(\w+)\]$/);
        if (deepObjectMatch) {
            const [, parentName, childName, fieldName] = deepObjectMatch;
            
            if (!result[parentName]) {
                result[parentName] = {};
            }
            
            if (!result[parentName][childName]) {
                result[parentName][childName] = {};
            }
            
            // Convert numeric fields for coordinates
            if (fieldName === 'latitude' || fieldName === 'longitude') {
                result[parentName][childName][fieldName] = parseFloat(value);
            } else {
                result[parentName][childName][fieldName] = value;
            }
            continue;
        }
        
        // Handle simple nested objects like location[address]
        const objectMatch = key.match(/^(\w+)\[(\w+)\]$/);
        if (objectMatch) {
            const [, objectName, fieldName] = objectMatch;
            
            if (!result[objectName]) {
                result[objectName] = {};
            }
            
            result[objectName][fieldName] = value;
            continue;
        }
        
        // Handle simple fields
        // Convert numeric fields
        if (key === 'hourlyRate' || key === 'maxPlayers' || key === 'peakHourRate') {
            result[key] = parseFloat(value);
        } else if (key === 'isActive' || key === 'isAvailable') {
            result[key] = value === 'true' || value === true;
        } else {
            result[key] = value;
        }
    }
    
    // Process courts array to convert numeric fields and ensure amenities are arrays
    if (result.courts && Array.isArray(result.courts)) {
        result.courts = result.courts.map((court: any) => {
            if (court.hourlyRate) court.hourlyRate = parseFloat(court.hourlyRate);
            if (court.maxPlayers) court.maxPlayers = parseFloat(court.maxPlayers);
            if (court.peakHourRate) court.peakHourRate = parseFloat(court.peakHourRate);
            if (court.isActive !== undefined) court.isActive = court.isActive === 'true' || court.isActive === true;
            if (court.isAvailable !== undefined) court.isAvailable = court.isAvailable === 'true' || court.isAvailable === true;
            // Ensure amenities is always an array
            if (court.amenities && !Array.isArray(court.amenities)) {
                court.amenities = typeof court.amenities === 'string' 
                    ? court.amenities.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0)
                    : [court.amenities];
            } else if (!court.amenities) {
                court.amenities = [];
            }
            return court;
        });
    }
    
    // Ensure venue amenities is always an array
    if (result.amenities && !Array.isArray(result.amenities)) {
        result.amenities = typeof result.amenities === 'string'
            ? result.amenities.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0)
            : [result.amenities];
    } else if (!result.amenities) {
        result.amenities = [];
    }
    
    return result;
}