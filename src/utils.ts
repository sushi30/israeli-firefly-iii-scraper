export function validateEnv(env: string): void {
  if (!process.env[env]) {
    console.error(`Missing environment variable: ${env}`);
    throw Error(`Missing environment variable: ${env}`);
  }
}

export function envToBool(env: string): boolean {
  if (!process.env[env]) {
    return false;
  } else if (["true", "yes", "True", "Yes"].includes(process.env[env])) {
    return true;
  } else {
    try {
      return Number.parseInt(process.env[env]) == 1;
    } catch (error) {
      if (error instanceof ReferenceError) {
        return false;
      } else {
        throw error;
      }
    }
  }
}
