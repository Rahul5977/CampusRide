import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/**
 * WebSocket $connect — stores connection metadata for fan-out in $default.
 * Pass `groupId` and `userId` as query string parameters when opening the socket.
 */
export const handler = async (event) => {
  const table = process.env.CONNECTIONS_TABLE;
  if (!table) {
    return { statusCode: 500, body: "Missing CONNECTIONS_TABLE" };
  }

  const connectionId = event.requestContext.connectionId;
  const qs = event.queryStringParameters || {};
  const groupId = qs.groupId || "lobby";
  const userId = qs.userId || "anonymous";

  await doc.send(
    new PutCommand({
      TableName: table,
      Item: {
        connectionId,
        groupId,
        userId,
      },
    }),
  );

  return { statusCode: 200, body: "connected" };
};
