/* External dependencies */
import { S3Handler } from 'aws-lambda';
import AWS from 'aws-sdk';
import Exif from 'exif';

/* Local dependencies */
import { AWS_ACCOUNT_ID, AWS_REGION, BUCKET_NAME, SQS_QUEUE_URL, TABLE_NAME } from '../types/constants.js';

const s3 = new AWS.S3();
const docClient = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

export const handler: S3Handler = async (event, context) => {
    try {
        const { Records: records } = event;

        for (const record of records) {
            const s3Record = record.s3;
            const objectKey = s3Record.object.key;

            // Read the image object from S3
            const imageObject = await s3.getObject({ Bucket: BUCKET_NAME, Key: objectKey }).promise();

            // Convert the image buffer to a string
            const imageBuffer = imageObject.Body;
            if (!imageBuffer) {
                console.log(`Image buffer is undefined for ${objectKey}`);
                continue;
            }
            const imageString = imageBuffer.toString('binary');

            // Extract EXIF metadata using exif
            const exifData: any = await new Promise((resolve, reject) => {
                Exif(imageString, (error, exifResult) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(exifResult);
                    }
                });
            });

            const gpsData = {
                latitude: exifData.gps?.GPSLatitude,
                longitude: exifData.gps?.GPSLongitude,
                altitude: exifData.gps?.GPSAltitude,
                accuracy: exifData.gps?.GPSHPositioningError,
            };

            // Store the GPS data in DynamoDB
            await docClient
                .put({
                    TableName: TABLE_NAME,
                    Item: {
                        imageKey: objectKey,
                        gpsData,
                    },
                })
                .promise();

            // Send a message to the SQS queue to trigger the next Lambda function
            await sqs
                .sendMessage({
                    QueueUrl: `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT_ID}/${SQS_QUEUE_URL}`,
                    MessageBody: objectKey,
                })
                .promise();

            console.log(`Successfully processed ${objectKey}.`);
        }
    } catch (error) {
        console.error(error);
    }
};
