/* External dependencies */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3, DynamoDB } from 'aws-sdk';

/* Local dependencies */
import { BUCKET_NAME, TABLE_NAME } from "../types/constants.js";

const s3 = new S3();
const docClient = new DynamoDB.DocumentClient();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const id = event.pathParameters?.id;

        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing required 'id' parameter" })
            };
        }

        // Check if item exists
        const getItemParams = {
            TableName: TABLE_NAME,
            Key: { id }
        };

        const item = await docClient.get(getItemParams).promise();

        if (!item.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Item not found" })
            };
        }

        // Delete S3 object
        const s3Key = item.Item.s3Key;

        const deleteObjectParams = {
            Bucket: BUCKET_NAME,
            Key: s3Key
        };

        await s3.deleteObject(deleteObjectParams).promise();

        // Delete item from DynamoDB
        const deleteItemParams = {
            TableName: TABLE_NAME,
            Key: { id }
        };

        await docClient.delete(deleteItemParams).promise();

        return {
            statusCode: 204,
            body: ''
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" })
        };
    }
};
