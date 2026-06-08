import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`[shumoukh-api] 🚀 Server running on port ${env.port}`);
  console.log(`[shumoukh-api] 🌍 Environment: ${env.nodeEnv}`);
  console.log(`[shumoukh-api] 🔗 http://localhost:${env.port}/api/v1`);
});

// Export for Firebase Cloud Function deployment
export const api = app;
