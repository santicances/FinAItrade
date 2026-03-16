-- =========================================================================
-- Supabase Schema for FinAI Trade
-- Run this in the Supabase SQL Editor to create the necessary tables
-- =========================================================================

-- 1. Crear tabla de Agentes
CREATE TABLE public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '🤖',
    description TEXT,
    architecture TEXT DEFAULT 'Dense',
    status TEXT DEFAULT 'idle',
    trading_pair TEXT DEFAULT 'BTC/USDT',
    timeframe TEXT DEFAULT '1h',
    history_length INTEGER DEFAULT 8760,
    active_model_id UUID, -- Se actualizará cuando se asigne un modelo entrenado
    data_sources JSONB DEFAULT '[]'::jsonb,
    prompt JSONB DEFAULT '{}'::jsonb,
    flow_diagram JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Crear tabla de Modelos de IA (Entrenados localmente)
CREATE TABLE public.ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    generation INTEGER NOT NULL,
    score NUMERIC,
    accuracy NUMERIC,
    model_path TEXT,
    epochs INTEGER,
    optimizer TEXT DEFAULT 'adam',
    learning_rate NUMERIC DEFAULT 0.001,
    batch_size INTEGER DEFAULT 32,
    layer_sizes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Crear restricción (Foreign Key Circular Opcional) para active_model_id
-- Esto permite que el agente apunte a un modelo específico como "activo"
ALTER TABLE public.agents
ADD CONSTRAINT fk_active_model
FOREIGN KEY (active_model_id) REFERENCES public.ai_models(id) ON DELETE SET NULL;

-- 4. Opcional: Políticas de seguridad (RLS) - Permitir todo si es un entorno local/privado
-- Quita los comentarios de abajo si tienes habilitado Row Level Security (RLS)
/*
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow All operations on agents" ON public.agents FOR ALL USING (true);
CREATE POLICY "Allow All operations on ai_models" ON public.ai_models FOR ALL USING (true);
*/
