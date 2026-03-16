import re
import os

def extract_agents():
    path = r'c:\Users\santi\source\repos\FinAItrade\src\app\page.tsx'
    if not os.path.exists(path):
        return []
        
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Find the start of the object and match until the last closing brace of the object
    start_match = re.search(r'const defaultAgentsByMarket.*?\s*=\s*{', content, re.DOTALL)
    if not start_match:
        return []
    
    start_pos = start_match.end() - 1
    brace_count = 0
    end_pos = -1
    for i in range(start_pos, len(content)):
        if content[i] == '{': brace_count += 1
        elif content[i] == '}': 
            brace_count -= 1
            if brace_count == 0:
                end_pos = i + 1
                break
    
    if end_pos == -1: return []
    agents_raw = content[start_pos:end_pos]
    # This is a bit tricky because objects can span lines and have nested brackets.
    # We'll try to find each individual object block.
    # Every agent block starts with { id: '...' and ends with }
    # Find all occurrences of "{ id: '"
    blocks = []
    pos = 0
    while True:
        pos = agents_raw.find("{ id: '", pos)
        if pos == -1:
            pos = agents_raw.find("{ id: \"", pos) # Try double quotes
            if pos == -1: break
            
        start_pos = pos
        brace_count = 0
        end_pos = -1
        for i in range(start_pos, len(agents_raw)):
            if agents_raw[i] == '{': brace_count += 1
            elif agents_raw[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_pos = i + 1
                    break
        if end_pos != -1:
            blocks.append(agents_raw[start_pos:end_pos])
            pos = end_pos
        else:
            pos += 1

    agents = []
    for b in blocks:
        # Helper to extract field values
        def get_val(field):
            # Matches field: 'value', or field: value,
            # Handle both single and double quotes
            pattern = rf"{field}:\s*(['\"])(.*?)\1"
            m = re.search(pattern, b, re.DOTALL)
            if m:
                return m.group(2)
            # Try numeric
            m = re.search(rf"{field}:\s*(\d+)", b)
            if m:
                return m.group(1)
            # Try array
            m = re.search(rf"{field}:\s*\[(.*?)\]", b, re.DOTALL)
            if m:
                return m.group(1).replace("'", "").replace('"', "").replace(" ", "")
            return ""

        agents.append({
            'name': get_val('name'),
            'type': get_val('type'),
            'operationType': get_val('operationType'),
            'status': get_val('status'),
            'model': get_val('model'),
            'modelId': get_val('modelId'),
            'asset': get_val('asset'),
            'assetId': get_val('assetId'),
            'assetType': get_val('assetType'),
            'prompt': get_val('prompt'),
            'tvSymbol': get_val('tvSymbol'),
            'provider': get_val('provider'),
            'timeframe': get_val('timeframe'),
            'candleCount': get_val('candleCount') or "50",
            'sources': get_val('sources'),
            'predictionType': get_val('predictionType'),
            'market': get_val('market')
        })
    return agents

def generate_sql(agents):
    sql = [
        '-- Seed Data Script for finAiPro',
        '-- Creates Model table and populates defaults',
        '',
        'CREATE TABLE IF NOT EXISTS "Model" (',
        '    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),',
        '    "agentId" TEXT,',
        '    "name" TEXT NOT NULL,',
        '    "architecture" TEXT NOT NULL,',
        '    "accuracy" DOUBLE PRECISION DEFAULT 0,',
        '    "fitness" DOUBLE PRECISION DEFAULT 0,',
        '    "generation" INTEGER DEFAULT 1,',
        '    "modelPath" TEXT,',
        '    "optimizer" TEXT DEFAULT \'adam\',',
        '    "score" DOUBLE PRECISION DEFAULT 0,',
        '    "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,',
        '    "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL',
        ');',
        '',
        '-- Template table for default agents',
        'CREATE TABLE IF NOT EXISTS "SeedAgent" (',
        '    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),',
        '    "name" TEXT NOT NULL,',
        '    "type" TEXT NOT NULL,',
        '    "operationType" TEXT NOT NULL,',
        '    "status" TEXT NOT NULL,',
        '    "model" TEXT NOT NULL,',
        '    "modelId" TEXT NOT NULL,',
        '    "asset" TEXT NOT NULL,',
        '    "assetId" TEXT NOT NULL,',
        '    "assetType" TEXT NOT NULL,',
        '    "prompt" TEXT,',
        '    "tvSymbol" TEXT NOT NULL,',
        '    "provider" TEXT NOT NULL,',
        '    "timeframe" TEXT NOT NULL,',
        '    "candleCount" INTEGER NOT NULL,',
        '    "sources" TEXT,',
        '    "predictionType" TEXT,',
        '    "market" TEXT',
        ');',
        '',
        'DELETE FROM "SeedAgent";',
        '',
        '-- Ensure Agent table has all columns required by Prisma and triggers',
        'ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "predictionType" TEXT DEFAULT \'swing\';',
        'ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "isMultiPrediction" BOOLEAN DEFAULT false;',
        'ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "multiAssets" TEXT DEFAULT \'\';',
        ''
    ]
    
    for a in agents:
        prompt = a['prompt'].replace("'", "''")
        sources = a['sources'] # Already a string like "source1,source2" (extracted from [s1, s2])
        sql.append(f"INSERT INTO \"SeedAgent\" (name, type, \"operationType\", status, model, \"modelId\", asset, \"assetId\", \"assetType\", prompt, \"tvSymbol\", provider, timeframe, \"candleCount\", sources, \"predictionType\", market) "
                   f"VALUES ('{a['name']}', '{a['type']}', '{a['operationType']}', '{a['status']}', '{a['model']}', '{a['modelId']}', '{a['asset']}', '{a['assetId']}', '{a['assetType']}', '{prompt}', '{a['tvSymbol']}', '{a['provider']}', '{a['timeframe']}', {a['candleCount']}, '{sources}', '{a['predictionType']}', '{a['market']}');")

    sql.append('')
    sql.append('-- Sample Models (50 models)')
    sql.append('DELETE FROM "Model";')
    architectures = ['LSTM-v4', 'Transformer-v2', 'Ensemble-X', 'GRN-Alpha', 'MiniMax-2.5']
    for i in range(1, 51):
        arch = architectures[i % 5]
        acc = round(70 + (i % 25) + (i/10.0), 2)
        fit = round(0.8 + (i % 20) / 100, 4)
        sql.append(f"INSERT INTO \"Model\" (name, architecture, accuracy, fitness, generation, score, optimizer) "
                   f"VALUES ('Model_{i:03d}', '{arch}', {acc}, {fit}, {1 + (i//10)}, {acc * fit}, 'adam');")
    
    sql.append('')
    sql.append('-- Trigger to initialize new user profiles with default agents')
    sql.append('CREATE OR REPLACE FUNCTION initialize_user_agents()')
    sql.append('RETURNS TRIGGER AS $$')
    sql.append('BEGIN')
    sql.append('    INSERT INTO "Agent" ("userId", name, type, "operationType", status, model, "modelId", asset, "assetId", "assetType", prompt, "tvSymbol", provider, timeframe, "candleCount", sources, "predictionType", "isMultiPrediction", "multiAssets")')
    sql.append('    SELECT NEW."id", name, type, "operationType", status, model, "modelId", asset, "assetId", "assetType", prompt, tvSymbol, provider, timeframe, "candleCount", sources, "predictionType", false, \'\'')
    sql.append('    FROM "SeedAgent";')
    sql.append('    RETURN NEW;')
    sql.append('END;')
    sql.append('$$ LANGUAGE plpgsql;')
    sql.append('')
    sql.append('DROP TRIGGER IF EXISTS tr_initialize_user_agents ON "Profile";')
    sql.append('CREATE TRIGGER tr_initialize_user_agents')
    sql.append('AFTER INSERT ON "Profile"')
    sql.append('FOR EACH ROW')
    sql.append('EXECUTE FUNCTION initialize_user_agents();')
    
    with open('seed_data.sql', 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql))
    print(f"Generated seed_data.sql with {len(agents)} agents and 50 models.")

if __name__ == "__main__":
    agents = extract_agents()
    if agents:
        generate_sql(agents)
    else:
        print("No agents found.")
