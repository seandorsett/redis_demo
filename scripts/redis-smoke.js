const { createClient } = require("redis");

async function main() {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const client = createClient({ url });

  client.on("error", (err) => {
    console.error("Redis client error:", err);
    process.exitCode = 1;
  });

  console.log(`Connecting to Redis at ${url.replace(/:\/\/:.*@/, "://:***@")}`);
  await client.connect();

  // Prove server responds
  const pong = await client.ping();
  console.log("PING ->", pong);

  // Prove our command-line config flags applied
  const appendonly = await client.configGet("appendonly");
  console.log("CONFIG GET appendonly ->", appendonly);

  if (appendonly.appendonly !== "yes") {
    throw new Error(`Expected appendonly=yes but got ${appendonly.appendonly}`);
  }

  // Prove read/write works
  const key = `demo:${Date.now()}`;
  await client.set(key, "hello-from-actions", { EX: 30 });
  const val = await client.get(key);
  console.log(`GET ${key} ->`, val);

  if (val !== "hello-from-actions") {
    throw new Error("Unexpected value from Redis");
  }

  console.log("✅ Redis entrypoint/command demo succeeded.");
  await client.quit();
}

main().catch((err) => {
  console.error("❌ Demo failed:", err);
  process.exit(1);
});
