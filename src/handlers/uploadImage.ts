/* External dependencies */
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import {DocumentClient} from "aws-sdk/clients/dynamodb";
import {SendMessageRequest} from "aws-sdk/clients/sqs";
import {PutItemInput} from "@aws-sdk/client-dynamodb";
import {PutObjectRequest} from "@aws-sdk/client-s3";
import {S3, SQS, AWSError} from 'aws-sdk';
import { v4 as uuid } from 'uuid';

/* Local dependencies */
import {BUCKET_NAME, SQS_QUEUE_URL, TABLE_NAME} from "../types/constants.js";
import {ExifData, UploadPhotoRequestBody, UploadPhotoResponseBody} from "../types/image.types.js";
import { getExifData } from "../helpers/getExifData.js";

const s3 = new S3();
const sqs = new SQS();
const docClient = new DocumentClient();

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const {content, contentType}: UploadPhotoRequestBody = JSON.parse(event.body!);
    const id: string = uuid();
    const s3Key: string = `${id}.${contentType.split('/')[1]}`;
    const sqsMessage: string = JSON.stringify({id, s3Key});

    const putObjectParams: PutObjectRequest | any = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: content,
      ContentType: contentType,
    };

    const sendMessageParams: SendMessageRequest = {
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: sqsMessage,
    };

    const uploadItem  =  {
      id,
      s3Key,
      createDate: Date.now().toString()
    }

    const putItemParams: PutItemInput | any = {
      TableName: TABLE_NAME,
      Item: { uploadItem }
    };

    // @ts-ignore
    const exifData: ExifData = await getExifData(content);

    if (exifData.location) {
      putItemParams.Item.gpsData = {
        latitude: exifData.location.latitude,
        longitude: exifData.location.longitude,
        altitude: exifData.location.altitude,
        accuracy: exifData.location.accuracy,
      };
    }

    await Promise.all([
      s3.putObject(putObjectParams).promise(),
      sqs.sendMessage(sendMessageParams).promise(),
      docClient.put(putItemParams).promise(),
    ]);

    const responseBody: UploadPhotoResponseBody = {
      id,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error(error);
    const responseBody = {
      message: (error as AWSError).message || 'Internal Server Error',
    };
    const statusCode = (error as AWSError).statusCode || 500;
    return {
      statusCode,
      body: JSON.stringify(responseBody),
    };
  }
}
