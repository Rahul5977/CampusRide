import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event) => {
  const table = process.env.CONNECTIONS_TABLE;
  if (!table) {
    return { statusCode: 500, body: "Missing CONNECTIONS_TABLE" };
  }

  const connectionId = event.requestContext.connectionId;

  await doc.send(
    new DeleteCommand({
      TableName: table,
      Key: { connectionId },
    }),
  );

  return { statusCode: 200, body: "disconnected" };
};
