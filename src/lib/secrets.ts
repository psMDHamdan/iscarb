import { SecretsManagerClient, PutSecretValueCommand, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-east-1" });

export async function storeSecret(name: string, secret: string): Promise<string> {
  try {
    const response = await client.send(new PutSecretValueCommand({
      Name: `iscarb/${name}`,
      SecretString: secret,
    }));
    return response.ARN || "";
  } catch (err) {
    console.error("Failed to store secret", err);
    throw err;
  }
}

export async function retrieveSecret(arn: string): Promise<string> {
  try {
    const response = await client.send(new GetSecretValueCommand({
      SecretId: arn,
    }));
    return response.SecretString || "";
  } catch (err) {
    console.error("Failed to retrieve secret", err);
    throw err;
  }
}
