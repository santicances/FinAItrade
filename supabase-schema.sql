-- finAiPro - Supabase Database Schema (Idempotent)
-- Ejecuta este script en el Editor SQL de Supabase (Dashboard > SQL Editor)
-- Este script es seguro de ejecutar múltiples veces

-- Eliminar triggers existentes primero
DROP TRIGGER IF EXISTS update_Profile_updatedAt ON "Profile";
DROP TRIGGER IF EXISTS update_Agent_updatedAt ON "Agent";
DROP TRIGGER IF EXISTS update_NewsSource_updatedAt ON "NewsSource";
DROP TRIGGER IF EXISTS update_PricingConfig_updatedAt ON "PricingConfig";

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS "Profile" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "mode" TEXT DEFAULT 'retail' NOT NULL,
    "balance" DOUBLE PRECISION DEFAULT 0 NOT NULL,
    "tokensUsed" INTEGER DEFAULT 0 NOT NULL,
    "freeCredits" DOUBLE PRECISION DEFAULT 0.5 NOT NULL,
    "preferredProducts" TEXT DEFAULT '' NOT NULL,
    "riskTolerance" TEXT DEFAULT 'medium' NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL
);

-- Tabla de agentes de trading
CREATE TABLE IF NOT EXISTS "Agent" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT DEFAULT 'spot' NOT NULL,
    "operationType" TEXT DEFAULT 'market' NOT NULL,
    "status" TEXT DEFAULT 'paused' NOT NULL,
    "model" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "prompt" TEXT,
    "sources" TEXT DEFAULT '' NOT NULL,
    "tvSymbol" TEXT NOT NULL,
    "provider" TEXT DEFAULT 'BINANCE' NOT NULL,
    "timeframe" TEXT DEFAULT '60' NOT NULL,
    "candleCount" INTEGER DEFAULT 50 NOT NULL,
    "predictionsCount" INTEGER DEFAULT 0 NOT NULL,
    "lastPredictionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL
);

-- Tabla de predicciones
CREATE TABLE IF NOT EXISTS "Prediction" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "tvSymbol" TEXT NOT NULL,
    "provider" TEXT DEFAULT 'BINANCE' NOT NULL,
    "direction" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "entry" DOUBLE PRECISION NOT NULL,
    "stopLoss" DOUBLE PRECISION NOT NULL,
    "takeProfit" DOUBLE PRECISION NOT NULL,
    "riskReward" DOUBLE PRECISION NOT NULL,
    "analysis" TEXT,
    "timeframe" TEXT NOT NULL,
    "tokensUsed" INTEGER DEFAULT 0 NOT NULL,
    "costEur" DOUBLE PRECISION DEFAULT 0 NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL
);

-- Tabla de fuentes de noticias
CREATE TABLE IF NOT EXISTS "NewsSource" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "enabled" BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL
);

-- Tabla de configuración de precios
CREATE TABLE IF NOT EXISTS "PricingConfig" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "pricePerMillion" DOUBLE PRECISION DEFAULT 3.5 NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL
);

-- Añadir foreign keys (solo si no existen)
DO $$
BEGIN
    -- Agent -> Profile
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Agent_userId_fkey' AND table_name = 'Agent'
    ) THEN
        ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Prediction -> Profile
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Prediction_userId_fkey' AND table_name = 'Prediction'
    ) THEN
        ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Prediction -> Agent
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Prediction_agentId_fkey' AND table_name = 'Prediction'
    ) THEN
        ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_agentId_fkey" 
        FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- NewsSource -> Profile
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'NewsSource_userId_fkey' AND table_name = 'NewsSource'
    ) THEN
        ALTER TABLE "NewsSource" ADD CONSTRAINT "NewsSource_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Crear índices (no fallan si ya existen)
CREATE INDEX IF NOT EXISTS "Agent_userId_idx" ON "Agent"("userId");
CREATE INDEX IF NOT EXISTS "Prediction_userId_idx" ON "Prediction"("userId");
CREATE INDEX IF NOT EXISTS "Prediction_agentId_idx" ON "Prediction"("agentId");
CREATE INDEX IF NOT EXISTS "NewsSource_userId_idx" ON "NewsSource"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "NewsSource_userId_sourceId_key" ON "NewsSource"("userId", "sourceId");

-- Insertar configuración de precios si no existe
INSERT INTO "PricingConfig" ("pricePerMillion") VALUES (3.5) 
ON CONFLICT DO NOTHING;

-- Función para actualizar updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers
CREATE TRIGGER update_Profile_updatedAt BEFORE UPDATE ON "Profile"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_Agent_updatedAt BEFORE UPDATE ON "Agent"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_NewsSource_updatedAt BEFORE UPDATE ON "NewsSource"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_PricingConfig_updatedAt BEFORE UPDATE ON "PricingConfig"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Agent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Prediction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewsSource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PricingConfig" ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS (eliminar existentes primero)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON "Profile";
DROP POLICY IF EXISTS "Allow all for authenticated users" ON "Agent";
DROP POLICY IF EXISTS "Allow all for authenticated users" ON "Prediction";
DROP POLICY IF EXISTS "Allow all for authenticated users" ON "NewsSource";
DROP POLICY IF EXISTS "Allow all for authenticated users" ON "PricingConfig";

CREATE POLICY "Allow all for authenticated users" ON "Profile" FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON "Agent" FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON "Prediction" FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON "NewsSource" FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON "PricingConfig" FOR ALL USING (true);

-- Mensaje de éxito
SELECT '✅ Tablas de finAiPro creadas/actualizadas correctamente' AS status;
