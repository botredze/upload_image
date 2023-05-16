import {APIGatewayProxyEvent} from "aws-lambda";

export interface UploadPhotoRequestBody {
    content: Buffer;
    contentType: string;
}

export interface UploadPhotoResponseBody {
    id: string;
}
export interface GetPhotoResponseBody {
    id: string;
    event: APIGatewayProxyEvent
}

export interface LocationData {
    latitude: string;
    longitude: string;
    altitude?: number;
    accuracy?: number;
}

export interface ExifDataType {
    location?: LocationData;
}

export type ExifData = ExifDataType

export interface GpsData {
    latitude: string;
    longitude: string;
    altitude?: number;
    accuracy?: number;
}