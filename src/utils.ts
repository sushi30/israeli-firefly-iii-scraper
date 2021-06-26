export function validateEnv(env: string): void {
  if (!process.env[env]) {
    console.error(`Missing environment variable: ${env}`);
    throw Error(`Missing environment variable: ${env}`);
  }
}
