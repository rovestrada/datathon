# %% [markdown]
# # HAVI 360 - ML PIPELINE V0 (FULL PRODUCTION MOCK)
# Lead Data Scientist & Engineer Edition
# Genera 7 pantallas completas para 50 usuarios demo con lógica ML real.

# %%
import pandas as pd
import numpy as np
import json
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest

# Configuración de Rutas
INPUT_DIR = Path("Input Data")
MOCK_DIR = Path("mock")
SCREEN_DIR = MOCK_DIR / "screen_data"
MOCK_DIR.mkdir(parents=True, exist_ok=True)
SCREEN_DIR.mkdir(parents=True, exist_ok=True)

# %% [markdown]
# ## MÓDULO 1: ETL / Feature Engineering
# %%
print("Iniciando ETL de alto volumen...")
df_clientes = pd.read_csv(INPUT_DIR / "hey_clientes.csv")
df_productos = pd.read_csv(INPUT_DIR / "hey_productos.csv")
df_trans = pd.read_csv(INPUT_DIR / "hey_transacciones.csv")

# Agregaciones de transacciones
tx_agg = df_trans.groupby('user_id').agg(
    gasto_total_mxn=('monto', 'sum'),
    num_tx=('transaccion_id', 'count'),
    num_rechazos=('estatus', lambda x: (x == 'no_procesada').sum()),
    cashback_total=('cashback_generado', 'sum'),
    max_monto_tx=('monto', 'max')
).reset_index()

# Agregaciones de productos
prod_agg = df_productos.groupby('user_id').agg(
    saldo_debito=('saldo_actual', lambda x: df_productos.loc[x.index[df_productos.loc[x.index, 'tipo_producto'] == 'cuenta_debito'], 'saldo_actual'].sum()),
    utilizacion_credito_pct=('utilizacion_pct', 'mean'),
    limite_total=('limite_credito', 'sum')
).reset_index()

# DataFrame Maestro
features_df = df_clientes.merge(tx_agg, on='user_id', how='left').merge(prod_agg, on='user_id', how='left')

# Fix para Pandas 3.0+: solo llenar con 0 las columnas numéricas
numeric_cols = features_df.select_dtypes(include=[np.number]).columns
features_df[numeric_cols] = features_df[numeric_cols].fillna(0)
print(f"ETL Completado: {len(features_df)} perfiles unificados.")

# %% [markdown]
# ## MÓDULO 2: Modelos ML (Clustering + Anomalías)
# %%
print("Entrenando modelos estadísticos reales...")
ml_features = ['edad', 'ingreso_mensual_mxn', 'score_buro', 'antiguedad_dias', 'gasto_total_mxn', 'utilizacion_credito_pct']
X_scaled = StandardScaler().fit_transform(features_df[ml_features])

# K-Means
kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
features_df['cluster_id'] = kmeans.fit_predict(X_scaled)
archetype_map = {0: "Joven Profesional Urbano", 1: "Estudiante Digital", 2: "Ahorrador Precavido", 3: "Emprendedor Digital", 4: "Usuario Inactivo"}
features_df['archetype_name'] = features_df['cluster_id'].map(archetype_map)

# Isolation Forest (Anomalías)
iforest = IsolationForest(contamination=0.05, random_state=42)
raw_scores = iforest.fit(X_scaled).decision_function(X_scaled)
features_df['anomaly_score'] = 1 - ((raw_scores - raw_scores.min()) / (raw_scores.max() - raw_scores.min()))

# Top Features por desviación
centroids = kmeans.cluster_centers_
def get_tags(row, centroids, feature_names):
    c_idx = int(row['cluster_id'])
    diffs = row[feature_names].values - centroids[c_idx]
    top_indices = np.argsort(np.abs(diffs))[::-1][:3]
    return [f"{feature_names[i].replace('_mxn','')}_{'alto' if diffs[i] > 0 else 'bajo'}" for i in top_indices]

features_df['top_features'] = features_df.apply(lambda r: get_tags(r, centroids, ml_features), axis=1)

# %% [markdown]
# ## MÓDULO 3: Motor de Triggers Inteligente (ML-Driven)
# %%
def evaluate_trigger(row):
    """
    Motor de decisión que prioriza los outputs de ML.
    Mantiene la estructura de llaves exacta para no romper el Módulo 5.
    """
    # 1. SEGURIDAD (Basado en Isolation Forest)
    if row['anomaly_score'] > 0.8:
        return {
            "trigger_id": "T01",
            "name": "Alerta de Seguridad",
            "opening_message": "Detectamos actividad inusual en tu perfil. ¿Eres tú?",
            "ctas": ["Sí, fui yo", "Bloquear", "Ahora no"]
        }

    # 2. GESTIÓN DE RIESGO (Basado en Top Features)
    if 'utilizacion_credito_pct_alto' in row['top_features']:
        return {
            "trigger_id": "T02",
            "name": "Optimización de Límite",
            "opening_message": "Tu uso de crédito es alto este mes. ¿Quieres un plan de pagos?",
            "ctas": ["Ver plan", "Ajustar", "Ahora no"]
        }

    # 3. CRECIMIENTO (Basado en Clúster + Ingresos)
    if row['archetype_name'] == "Joven Profesional Urbano" and row['saldo_debito'] > 15000:
        return {
            "trigger_id": "T06",
            "name": "Inversión Inteligente",
            "opening_message": f"Tus ${row['saldo_debito']:,.0f} podrían generar rendimientos hoy.",
            "ctas": ["Simular", "Invertir", "Ahora no"]
        }

    # 4. FIDELIZACIÓN (Basado en Clúster)
    if row['archetype_name'] == "Usuario Inactivo":
        return {
            "trigger_id": "T04",
            "name": "Reactivación",
            "opening_message": "Te extrañamos. ¡Usa tu tarjeta y gana cashback doble!",
            "ctas": ["Ver promos", "Activar", "Ahora no"]
        }

    # 5. DEFAULT (Salud Financiera)
    return {
        "trigger_id": "T08",
        "name": "Salud Financiera",
        "opening_message": "Tu salud financiera es nuestra prioridad. Mira tu score.",
        "ctas": ["Ver score", "Tips", "Ok"]
    }

features_df['trigger_active'] = features_df.apply(evaluate_trigger, axis=1)
print("Módulo 3 actualizado: El ML ahora dicta la experiencia del usuario.")

# %% [markdown]
# ## MÓDULO 4 Y 5: Serialización Masiva (7 Pantallas x 50 Usuarios)
# %%
print("Generando dataset completo de pantallas...")
PET_MAP = {"Joven Profesional Urbano": ("fox","red"), "Estudiante Digital": ("panda","black"), "Ahorrador Precavido": ("dog","white"), "Emprendedor Digital": ("panda","brown"), "Usuario Inactivo": ("dog","brown")}

demo_df = features_df.head(50)
screens = ["home", "health", "cards", "inbox", "payments", "transfer", "profile"]

for _, row in demo_df.iterrows():
    uid = row['user_id']
    trigger = row['trigger_active']
    score_f = int(max(10, min(100, 100 - (row['anomaly_score']*25) - (row['utilizacion_credito_pct']*15))))
    pet = PET_MAP.get(row['archetype_name'], ("fox","red"))

    for sid in screens:
        # Generar contexto HAVI por pantalla
        context_natural = {
            "home": f"El usuario está en inicio. Saldo: ${row['saldo_debito']:,.0f}. Sugerencia: {trigger['name']}.",
            "health": f"Salud financiera. Score: {score_f}/100. Utilización: {row['utilizacion_credito_pct']*100:.0f}%.",
            "cards": f"Viendo tarjetas. Límite: ${row['limite_total']:,.0f}. Saldo disponible: ${row['saldo_debito']:,.0f}.",
            "inbox": f"Buzón con 1 mensaje de {trigger['name']}.",
            "payments": f"Sección de pagos. Saldo disponible para servicios: ${row['saldo_debito']:,.0f}.",
            "transfer": f"Listo para transferir. Saldo disponible: ${row['saldo_debito']:,.0f}.",
            "profile": f"Perfil. Arquetipo: {row['archetype_name']}. Score Buró: {int(row['score_buro'])}."
        }.get(sid)

        screen_data = {
            "screen_id": sid,
            "user_id": uid,
            "havi_context": context_natural,
            "havi_context_short": f"Balance: ${row['saldo_debito']:,.0f}"[:60],
            "data": {
                "score_financiero": score_f,
                "saldo_disponible": float(row['saldo_debito']),
                "archetype": row['archetype_name'],
                "trigger_active": trigger
            }
        }
        with open(SCREEN_DIR / f"{uid.lower()}_{sid}.json", "w", encoding="utf-8") as f:
            json.dump(screen_data, f, ensure_ascii=False, indent=2)

# Exportar perfiles final
profiles = []
for _, row in demo_df.iterrows():
    pet = PET_MAP.get(row['archetype_name'], ("fox","red"))
    profiles.append({
        "user_id": row['user_id'], "password": "demo", "archetype_name": row['archetype_name'],
        "cluster_id": int(row['cluster_id']), "anomaly_score": round(float(row['anomaly_score']), 4),
        "top_features": row['top_features'], "default_pet": {"petType": pet[0], "petVariant": pet[1]},
        "trigger_active": row['trigger_active']
    })

with open(MOCK_DIR / "user_profiles.json", "w", encoding="utf-8") as f:
    json.dump(profiles, f, ensure_ascii=False, indent=2)

print(f"Éxito: user_profiles.json y 350 archivos en screen_data/ listos.")

