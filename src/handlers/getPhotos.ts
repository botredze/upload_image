/* External dependencies */
import { APIGatewayProxyResult } from 'aws-lambda';
import { S3 } from 'aws-sdk';

/* Local dependencies */
import {BUCKET_NAME, TABLE_NAME} from "../types/constants.js";
import {addGpsDataToImage} from "../helpers/addGpsDataToImage.js";
import {GetPhotoResponseBody} from "../types/image.types.js";
import {DocumentClient} from "aws-sdk/clients/dynamodb";

const s3 = new S3();
const docClient = new DocumentClient();

export const handler = async (input: GetPhotoResponseBody): Promise<APIGatewayProxyResult> => {

  const {id, event} = input

  const getItemParams = {
    TableName: TABLE_NAME,
    Key: { id }
  };

  const { Item: item } = await docClient.get(getItemParams).promise();

  if (!item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: `Photo with ID ${id} not found` }),
    };
  }

  const getObjectParams = {
    Bucket: BUCKET_NAME,
    Key: `${item.id}.jpg`
  };

  const { Body: body } = await s3.getObject(getObjectParams).promise();

  const { latitude, longitude, altitude, accuracy } = item.gpsData;

  const imageBuffer = await addGpsDataToImage(body,latitude, longitude, altitude, accuracy);

  return {
    statusCode: 200,
    body: imageBuffer.toString('base64'),
    isBase64Encoded: true,
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'max-age=31536000, immutable',
    },
  };
}
