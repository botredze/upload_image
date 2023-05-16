/* External dependencies */
import { SQSEvent, SQSHandler } from 'aws-lambda';
import  {S3}  from 'aws-sdk';

/* Local dependencies */
import {BUCKET_NAME, TABLE_NAME} from "../types/constants.js";
import {DocumentClient} from "aws-sdk/clients/dynamodb";

const s3 = new S3();
const docClient = new DocumentClient();

export const handler: SQSHandler = async (event: SQSEvent) => {
    const { Records: records } = event;

  await Promise.all(
    records.map(async ({ body }) => {
      const { id, s3Key } = JSON.parse(body);

      const deleteObjectParams = {
          Bucket: BUCKET_NAME,
          Key: s3Key
      };

      await s3.deleteObject(deleteObjectParams).promise();

      const deleteItemParams = {
          TableName: TABLE_NAME,
          Key: { id }
      };

      await docClient.delete(deleteItemParams).promise();
    })
  );
}
