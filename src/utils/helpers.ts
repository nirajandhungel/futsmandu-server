import type {ApiResponse, PaginationInfo} from '../types/common.types.js';

// creates a standardize API response
export const createResponse = <T>(
    success:boolean,
    data?:T,
    message?:string,
    pagination?:PaginationInfo

):ApiResponse<T>=>{

    const response:ApiResponse<T>={success};
    if(message) response.message=message;
    if(data!==undefined) response.data = data;
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