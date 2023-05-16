/* External dependencies */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ScanInput } from '@aws-sdk/client-dynamodb';
import { S3 } from 'aws-sdk';
import { DocumentClient } from "aws-sdk/clients/dynamodb";

/* Local dependencies */
import { BUCKET_NAME, TABLE_NAME } from '../types/constants.js';

const docClient = new DocumentClient();
const s3 = new S3();

export const handler  = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  const scanParams: ScanInput | any = {
    TableName: TABLE_NAME ,
  };

  const { Items: items } = await docClient.scan(scanParams).promise();

  const photosWithGpsData = await Promise.all(
      items?.map(async (item) => {
        const getObjectParams = {
          Bucket: BUCKET_NAME,
          Key: `${item.id}.jpg`,
        };

        const { Body: body } = await s3.getObject(getObjectParams).promise();

        return {
          id: item.id,
          latitude: item.gpsData.latitude,
          longitude: item.gpsData.longitude,
          altitude: item.gpsData.altitude,
          accuracy: item.gpsData.accuracy,
          image: body?.toString('base64'),
        };
      }) ?? [],
  );

  return {
    statusCode: 200,
    body: JSON.stringify(photosWithGpsData),
    headers: {
      'Content-Type': 'application/json',
    },
  };
}
