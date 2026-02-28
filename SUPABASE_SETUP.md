# Configuración de Supabase para finAiPro

## Estado Actual

✅ La aplicación funciona con **SQLite** localmente (base de datos en `prisma/dev.db`)
⚠️ Para usar **Supabase PostgreSQL**, necesitas la contraseña correcta de la base de datos

---

## Opción 1: Ejecutar SQL directamente en Supabase (RECOMENDADO)

**No necesitas la contraseña de base de datos para esto:**

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: `hxgzvdjupioyplamdafe`
3. Ve a **SQL Editor** en el menú lateral
4. Crea una nueva query
5. Copia y pega el contenido del archivo `supabase-schema.sql`
6. Ejecuta el script (botón "Run")

Esto creará todas las tablas necesarias en Supabase.

---

## Opción 2: Obtener la contraseña correcta de base de datos

1. En Supabase Dashboard, ve a **Project Settings** (icono de engranaje ⚙️)
2. Selecciona **Database** en el menú lateral
3. Busca la sección **Connection string**
4. **IMPORTANTE:** Si no recuerdas tu contraseña, puedes resetearla:
   - Haz clic en **Reset Database Password**
   - Guarda la nueva contraseña de forma segura

5. Copia el connection string completo, debería verse así:
   ```
   postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

---

## Estructura de tablas creadas

| Tabla | Descripción |
|-------|-------------|
| `Profile` | Usuarios con saldo, tokens, modo (retail/portfolio_manager) |
| `Agent` | Agentes de trading IA configurados por usuario |
| `Prediction` | Predicciones generadas por los agentes |
| `NewsSource` | Fuentes de noticias personalizadas por usuario |
| `PricingConfig` | Precio por millón de tokens (3.5€) |

---

## Campos principales

### Profile (Usuario)
- `id`: UUID único
- `email`: Email único
- `password`: Contraseña hasheada con bcrypt
- `mode`: "retail" o "portfolio_manager"
- `balance`: Saldo en euros (€)
- `tokensUsed`: Tokens totales consumidos
- `freeCredits`: Créditos gratuitos (€0.50 iniciales)
- `preferredProducts`: Productos preferidos (crypto, stocks, forex)
- `riskTolerance`: Tolerancia al riesgo (low, medium, high)

### Agent
- Información del modelo IA (MiniMax, Grok, DeepSeek)
- Activo, timeframe, tipo de operación
- `sources`: Fuentes de noticias seleccionadas
- `predictionsCount`: Número de predicciones realizadas
- `status`: active, paused, inactive

### Prediction
- `direction`: LONG, SHORT, NEUTRAL
- `confidence`: Nivel de confianza (1-100)
- `entry`, `stopLoss`, `takeProfit`: Niveles de trading
- `tokensUsed`: Tokens usados en esta predicción
- `costEur`: Coste en euros (€3.5/millón tokens)

---

## Precios

- **€3.5 por millón de tokens**
- Los usuarios tienen €0.50 de crédito gratuito al registrarse
- El saldo se descuenta automáticamente al generar predicciones
