export const TABLE_NAME: string = process.env.TABLE_NAME || 'images-table'
export  const BUCKET_NAME: string =  process.env.BUCKET_NAME || 'dama-upload-image-service-bucket-dev'

export const SQS_QUEUE_URL: string =  process.env.SQS_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/944734435805/upload-image-queue'

export  const AWS_REGION: string =  process.env.AWS_RERION || 'us-east-1'

export const AWS_ACCOUNT_ID: string = process.env.AWS_ACCAOUNT_ID || '944734435805'