import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function managementClient(event) {
  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  return new ApiGatewayManagementApiClient({
    endpoint: `https://${domain}/${stage}`,
  });
}

/**
 * Persists a plaintext chat message to DynamoDB and fans out to connections in the group.
 * Body JSON: { "groupId": "...", "userId": "...", "text": "..." }
 */
export const handler = async (event) => {
  const { CONNECTIONS_TABLE, MESSAGES_TABLE } = process.env;
  if (!CONNECTIONS_TABLE || !MESSAGES_TABLE) {
    return { statusCode: 500, body: "Missing table env" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "invalid json" };
  }

  const { groupId, text, userId } = body;
  if (!groupId || text === undefined || text === null) {
    return { statusCode: 400, body: "groupId and text are required" };
  }

  const messageId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ts = Date.now();
  const payload = JSON.stringify({
    type: "message",
    groupId,
    userId: userId || "unknown",
    text: String(text).slice(0, 2000),
    ts,
  });

  await doc.send(
    new PutCommand({
      TableName: MESSAGES_TABLE,
      Item: {
        pk: `GROUP#${groupId}`,
        sk: `${ts}#${messageId}`,
        groupId,
        userId: userId || "unknown",
        text: String(text).slice(0, 2000),
        createdAt: new Date().toISOString(),
      },
    }),
  );

  const connections = await doc.send(
    new QueryCommand({
      TableName: CONNECTIONS_TABLE,
      IndexName: "byGroup",
      KeyConditionExpression: "groupId = :g",
      ExpressionAttributeValues: { ":g": groupId },
    }),
  );

  const mgmt = managementClient(event);
  const stale = [];

  await Promise.all(
    (connections.Items || []).map(async (row) => {
      try {
        await mgmt.send(
          new PostToConnectionCommand({
            ConnectionId: row.connectionId,
            Data: Buffer.from(payload),
          }),
        );
      } catch (e) {
        if (
          e?.name === "GoneException" ||
          e?.$metadata?.httpStatusCode === 410
        ) {
          stale.push(row.connectionId);
        }
      }
    }),
  );

  for (const id of stale) {
    await doc.send(
      new DeleteCommand({
        TableName: CONNECTIONS_TABLE,
        Key: { connectionId: id },
      }),
    );
  }

  return { statusCode: 200, body: "ok" };
};
