// Prevent client-side import
if (typeof window !== 'undefined') {
  throw new Error('env.ts should not be imported on the client side');
}

// Environment configuration with fallbacks
export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 
    "postgresql://postgres.ixqjqhqjqhqjqhqjqhqj:Omer123456789@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1",
  
  // NextAuth
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 
    "fallback-secret-key-for-development-only",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 
    "https://ixqjqhqjqhqjqhqjqhqj.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHFqcWhxanFocWpxaHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5NTU5NzQsImV4cCI6MjA0OTUzMTk3NH0.example-key",
  
  // PriceEmpire
  PRICEMPIRE_API_KEY: process.env.PRICEMPIRE_API_KEY || 
    "3d5a32f3-2a0c-414e-b98e-17160197f254",
  PRICEMPIRE_RATE_LIMIT: parseInt(process.env.PRICEMPIRE_RATE_LIMIT || "100"),
  PRICEMPIRE_TIMEOUT: parseInt(process.env.PRICEMPIRE_TIMEOUT || "10000"),
  
  // Debug
  DEBUG_PRICE_SERVICE: process.env.DEBUG_PRICE_SERVICE === "true",
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // Vercel
  VERCEL_URL: process.env.VERCEL_URL,
  
  // Check if we're in production
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  
  // Validate critical environment variables
  validate() {
    const missing = [];
    
    if (!this.DATABASE_URL) missing.push("DATABASE_URL");
    if (!this.NEXTAUTH_SECRET && this.isProduction) missing.push("NEXTAUTH_SECRET");
    
    if (missing.length > 0) {
      console.warn("⚠️ Missing environment variables:", missing);
      if (this.isProduction) {
        throw new Error(`Missing critical environment variables: ${missing.join(", ")}`);
      }
    }
    
    console.log("✅ Environment configuration loaded successfully");
    return true;
  }
};

// Validate on import
env.validate(); 