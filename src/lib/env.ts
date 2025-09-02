import { z } from "zod";

const envSchema = z.object({
  // Site Configuration
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // Stripe Configuration
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  // AI Provider Configuration
  AI_PROVIDER: z.enum(["mock", "openai", "anthropic", "deepseek"]).default("mock"),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  
  // Email Configuration
  RESEND_API_KEY: z.string().optional(),
  
  // Monitoring & Error Tracking
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    // Invalid environment variables - fallback to defaults
    throw new Error("Environment configuration invalid");
  }
};

export const env = parseEnv();

// Helper to check if required services are configured
export const isSupabaseConfigured = () => 
  !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const isStripeConfigured = () => 
  !!(env.STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export const isAIConfigured = () => {
  switch (env.AI_PROVIDER) {
    case "openai": return !!env.OPENAI_API_KEY;
    case "anthropic": return !!env.ANTHROPIC_API_KEY;
    case "deepseek": return !!env.DEEPSEEK_API_KEY;
    case "mock": return true;
    default: return false;
  }
};

export const isResendConfigured = () => !!env.RESEND_API_KEY;
export const isSentryConfigured = () => !!env.SENTRY_DSN;
