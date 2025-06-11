const fs = require('fs');

const envContent = `DATABASE_URL="postgresql://postgres.oaobkrhfctwjoyibctun:B60ctvoybj@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?connection_limit=20&pool_timeout=20&statement_timeout=30s"
NEXT_PUBLIC_SUPABASE_URL=https://oaobkrhfctwjoyibctun.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb2JrcmhmY3R3am95aWJjdHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NDIxODEsImV4cCI6MjA2NTIxODE4MX0.X1l5FAhHKtJVyXi5B57p6bpTtDN1Vanc9anlRbq6eec
NEXTAUTH_SECRET=cs2-trading-secret-key
NEXTAUTH_URL=http://localhost:3000
`;

fs.writeFileSync('.env', envContent);
console.log('✅ .env file updated with session pooler connection!'); 