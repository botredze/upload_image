import { S3Event, S3Handler } from 'aws-lambda';
import { S3, SQS } from 'aws-sdk';
import { GetObjectRequest } from 'aws-sdk/clients/s3';
import { SendMessageRequest } from 'aws-sdk/clients/sqs';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { PutItemInput } from "@aws-sdk/client-dynamodb";

import { SQS_QUEUE_URL, TABLE_NAME } from "../types/constants";
import { getExifData } from "../helpers/getExifData";

const s3 = new S3();
const sqs = new SQS();
const docClient = new DocumentClient();

export const handler: S3Handler = async (event: S3Event, _context, _callback):  Promise<"Success" | any> => {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));

        await Promise.all(
            event.Records.map(async (record) => {
                const s3Record = record.s3;
                const bucketName = s3Record.bucket.name;
                const objectKey = s3Record.object.key;

                await processS3Event({ bucketName, objectKey });
            })
        );

        console.log('Processing completed.');
        return 'Success';
    } catch (error) {
        console.error('Error processing S3 event:', error);
        throw error;
    }
};

async function processS3Event({ bucketName, objectKey }: { bucketName: string, objectKey: string }) {
    try {
        const getObjectParams: GetObjectRequest = { Bucket: bucketName, Key: objectKey };
        const s3Object = await s3.getObject(getObjectParams).promise();

        const exifData = await getExifData(s3Object.Body);
        if (exifData && exifData.gps) {
            const { latitude, longitude, altitude, accuracy } = exifData.gps;

            const putItemParams: PutItemInput | any = {
                TableName: TABLE_NAME,
                Item: {
                    id: objectKey.split('.')[0],
                    gpsData: { latitude, longitude, altitude, accuracy },
                },
            };

            await docClient.put(putItemParams).promise();
        }

        const sqsMessage = JSON.stringify({ id: objectKey.split('.')[0], s3Key: objectKey });

        const sendMessageParams: SendMessageRequest = {
            QueueUrl: SQS_QUEUE_URL,
            MessageBody: sqsMessage,
        };

        await sqs.sendMessage(sendMessageParams).promise();

        console.log(`Successfully processed ${objectKey}.`);
    } catch (error) {
        console.error('Error processing S3 event:', error);
        throw error;
    }
}
