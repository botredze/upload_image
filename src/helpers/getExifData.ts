import * as piexif from 'piexif-ts';
import { S3 } from 'aws-sdk';
import {GpsData} from "../types/image.types.js";
interface ExifData {
    gps?: GpsData;
}

export async function getExifData(content: S3.Body | undefined): Promise<ExifData> {
    if (!content) {
        throw new Error('No content provided.');
    }

    const exifData = piexif.load(content.toString('binary'));

    if (exifData && exifData['GPS']) {

        // @ts-ignore
        const [latitude, longitude, altitude, accuracy] = exifData['GPS'];

        const gps: GpsData = {
            latitude: `${latitude[0] / latitude[1]} ${latitude[2] / latitude[3]} ${latitude[4] / latitude[5]}`,
            longitude: `${longitude[0] / longitude[1]} ${longitude[2] / longitude[3]} ${longitude[4] / longitude[5]}`,
            altitude: altitude ? altitude[0] / altitude[1] : undefined,
            accuracy: accuracy ? accuracy[0] / accuracy[1] : undefined,
        };

        return { gps };

    } else {
        throw new Error('GPS data not found.');
    }
}
