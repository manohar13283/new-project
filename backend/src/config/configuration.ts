export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },
  otp: {
    providerApiKey: process.env.OTP_PROVIDER_API_KEY ?? '',
    ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS ?? '300', 10),
  },
  coupons: {
    breakfastTea: parseInt(process.env.MONTHLY_BREAKFAST_TEA_COUPONS ?? '26', 10),
    meal: parseInt(process.env.MONTHLY_MEAL_COUPONS ?? '26', 10),
    tea: parseInt(process.env.MONTHLY_TEA_COUPONS ?? '26', 10),
  },
});
