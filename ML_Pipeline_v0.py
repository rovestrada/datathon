# %% [markdown]
# # HAVI 360 - ML PIPELINE V0 (ENTREGABLE DEFINITIVO)
# Lead Data Scientist & Engineer Edition
# 15 Usuarios (5 Storytelling + 10 Random) | Mensajería Contextual Dinámica.

# %%
import pandas as pd
import numpy as np
import json
import random
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest

# Configuración de Rutas
SCRIPT_DIR = Path(__file__).parent
BASE_DIR = SCRIPT_DIR.parent
INPUT_DIR = BASE_DIR / "Input Data"
MOCK_DIR = SCRIPT_DIR / "mock"
SCREEN_DIR = MOCK_DIR / "screen_data"

MOCK_DIR.mkdir(parents=True, exist_ok=True)
SCREEN_DIR.mkdir(parents=True, exist_ok=True)

# Limpiar previos
for f in SCREEN_DIR.glob("*.json"):
    f.unlink()

# %% [markdown]
# ## MÓDULO 1: ETL & FEATURE ENGINEERING
# %%
print("Cargando datos maestros...")
df_clientes = pd.read_csv(INPUT_DIR / "hey_clientes.csv")
df_productos = pd.read_csv(INPUT_DIR / "hey_productos.csv")
df_trans = pd.read_csv(INPUT_DIR / "hey_transacciones.csv", low_memory=False)

tx_agg = df_trans.groupby('user_id').agg(
    gasto_total_mxn=('monto', 'sum'),
    num_tx=('transaccion_id', 'count'),
    num_rechazos=('estatus', lambda x: (x == 'no_procesada').sum()),
    cashback_total=('cashback_generado', 'sum'),
    max_monto_tx=('monto', 'max')
).reset_index()

prod_agg = df_productos.groupby('user_id').agg(
    saldo_debito=('saldo_actual', lambda x: df_productos.loc[x.index[df_productos.loc[x.index, 'tipo_producto'] == 'cuenta_debito'], 'saldo_actual'].sum()),
    utilizacion_credito_pct=('utilizacion_pct', 'mean'),
    limite_total=('limite_credito', 'sum')
).reset_index()

features_df = df_clientes.merge(tx_agg, on='user_id', how='left').merge(prod_agg, on='user_id', how='left')

# Sanitización Total
numeric_cols = features_df.select_dtypes(include=[np.number]).columns
features_df[numeric_cols] = features_df[numeric_cols].fillna(0)
features_df = features_df.replace({np.nan: None})

# %% [markdown]
# ## MÓDULO 2: MODELOS ML
# %%
print("Ejecutando Modelos de Segmentación y Riesgo...")
ml_features = ['edad', 'ingreso_mensual_mxn', 'score_buro', 'antiguedad_dias', 'gasto_total_mxn', 'utilizacion_credito_pct']
scaler = StandardScaler()
X_scaled = scaler.fit_transform(features_df[ml_features].fillna(0))

kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
features_df['cluster_id'] = kmeans.fit_predict(X_scaled)
archetype_map = {0: "Ahorrador Consolidado", 1: "Joven Digital", 2: "Heavy User Crédito"}
features_df['archetype_name'] = features_df['cluster_id'].map(archetype_map)

iforest = IsolationForest(contamination=0.05, random_state=42)
features_df['anomaly_score'] = 1 - ((iforest.fit(X_scaled).decision_function(X_scaled) - iforest.decision_function(X_scaled).min()) / (iforest.decision_function(X_scaled).max() - iforest.decision_function(X_scaled).min()))

# %% [markdown]
# ## MÓDULO 3: MOTOR DE TRIGGERS
# %%
def assign_smart_trigger(row):
    uid = row['user_id']
    overrides = {
        "USR-00042": {"trigger_id": "T06", "name": "Inversión desaprovechada", "ctas": ["Ver inversión", "Simular", "Ahora no"]},
        "USR-00101": {"trigger_id": "T03", "name": "Oportunidad Hey Pro", "ctas": ["Ver beneficios", "Activar", "Ahora no"]},
        "USR-00207": {"trigger_id": "T01", "name": "Pago fallido reciente", "ctas": ["Ver motivo", "Reintentar", "Ahora no"]},
        "USR-00315": {"trigger_id": "T08", "name": "Inactividad de app", "ctas": ["Ver resumen", "Explorar", "Ahora no"]},
        "USR-00489": {"trigger_id": "T02", "name": "Suscripciones dormidas", "ctas": ["Revisar", "Gestionar", "Ahora no"]}
    }
    if uid in overrides: return overrides[uid]
    
    if row['anomaly_score'] > 0.8: return {"trigger_id": "T01", "name": "Alerta de Seguridad", "ctas": ["Verificar", "Bloquear", "No"]}
    if row['utilizacion_credito_pct'] > 0.85: return {"trigger_id": "T02", "name": "Optimización de Límite", "ctas": ["Ver plan", "Ajustar", "No"]}
    if row['saldo_debito'] > 15000: return {"trigger_id": "T06", "name": "Inversión Inteligente", "ctas": ["Invertir", "Simular", "No"]}
    return {"trigger_id": "T08", "name": "Reporte de Salud", "ctas": ["Ver score", "Tips", "Ok"]}

features_df['trigger_active'] = features_df.apply(assign_smart_trigger, axis=1)

# %% [markdown]
# ## MÓDULO 4: MUESTREO DE 15 USUARIOS
# %%
priority_uids = ["USR-00042", "USR-00101", "USR-00207", "USR-00315", "USR-00489"]
priority_df = features_df[features_df['user_id'].isin(priority_uids)].copy()
others_df = features_df[~features_df['user_id'].isin(priority_uids)].sample(10, random_state=42)
demo_df = pd.concat([priority_df, others_df]).reset_index(drop=True)

# %% [markdown]
# ## MÓDULO 5: SERIALIZACIÓN (MENSAJERÍA CONTEXTUAL DINÁMICA)
# %%

def get_contextual_message(tid, sid, row):
    saldo = f"${row['saldo_debito']:,.0f}"
    messages = {
        "T06": {
            "home": f"Hola 👋 Tienes {saldo} sin generar rendimiento. ¡Hazlo crecer!",
            "health": f"Tu salud financiera mejoraría invirtiendo tus {saldo} hoy.",
            "cards": f"Usa tus tarjetas, pero no olvides poner a trabajar tu débito.",
            "profile": f"Perfil detectado con excedente. ¿Simulamos una inversión?",
            "default": f"Detectamos una oportunidad de inversión por {saldo}."
        },
        "T01": {
            "home": "Detectamos actividad inusual en tu cuenta. ¿Eres tú?",
            "health": "Tu score se ve afectado por movimientos atípicos. Verifica.",
            "cards": "Notamos un cargo extraño. Revisa tus tarjetas activas.",
            "default": "Alerta de Seguridad: Revisa tu actividad reciente."
        },
        "T03": {
            "home": "¡Felicidades! Calificas para beneficios Hey Pro.",
            "health": "Tu excelente score te da acceso a tasas VIP.",
            "default": "Tu nivel de uso califica para beneficios Hey Pro."
        },
        "T08": {
            "home": "Tu salud financiera es estable. Mira tu resumen.",
            "health": "Score financiero en nivel óptimo. Sigue así.",
            "default": "Tu salud financiera es nuestra prioridad."
        },
        "T02": {
            "home": "Estás cerca de tu límite. ¿Quieres un plan de pago?",
            "default": "Detectamos cargos recurrentes inactivos. ¿Quieres gestionarlos?"
        }
    }
    trigger_msgs = messages.get(tid, {})
    return trigger_msgs.get(sid, trigger_msgs.get("default", "Tienes una sugerencia de Hey Sense."))

for _, row in demo_df.iterrows():
    uid = row['user_id']
    score_f = int(max(10, min(100, 100 - (row['anomaly_score'] * 20) - (row['utilizacion_credito_pct'] * 15))))
    trigger_base = row['trigger_active']
    
    # Extraer datos reales
    user_txs = df_trans[df_trans['user_id'] == uid].sort_values('fecha_hora', ascending=False).head(5)
    movimientos = [{"fecha": str(t['fecha_hora'])[:10], "comercio": str(t['comercio_nombre'] if pd.notna(t['comercio_nombre']) else t['tipo_operacion']), "monto": float(t['monto']), "categoria": str(t['categoria_mcc']), "tipo": str(t['tipo_operacion'])} for _, t in user_txs.iterrows()]
    
    user_prods = df_productos[df_productos['user_id'] == uid]
    tarjetas = [{"producto_id": str(p['producto_id']), "tipo": str(p['tipo_producto']), "limite": float(p['limite_credito']), "saldo_actual": float(p['saldo_actual']), "utilizacion_pct": float(p['utilizacion_pct']), "estatus": str(p['estatus'])} for _, p in user_prods.iterrows() if "credito" in str(p['tipo_producto']).lower()]

    for sid in ["home", "health", "cards", "inbox", "payments", "transfer", "profile"]:
        # Aplicar Mensaje Contextual sin cambiar estructura
        current_trigger = trigger_base.copy()
        current_trigger['opening_message'] = get_contextual_message(current_trigger['trigger_id'], sid, row)
        
        data_obj = {
            "score_financiero": score_f,
            "saldo_disponible": float(row['saldo_debito']),
            "archetype": row['archetype_name'],
            "trigger_active": current_trigger,
            "movimientos_recientes": movimientos[:3],
            "tarjetas_credito": tarjetas,
            "cuenta_debito": {"saldo": float(row['saldo_debito']), "numero": "*1234"},
            "notificaciones": [
                {"id": "notif-01", "titulo": current_trigger['name'], "cuerpo": current_trigger['opening_message'], "cta": current_trigger['ctas'][0], "leida": False},
                {"id": "notif-02", "titulo": "Promo MSI", "cuerpo": "Aprovecha meses sin intereses.", "cta": "Ver más", "leida": True}
            ],
            "servicios": [{"nombre": "CFE", "monto": 450.0}, {"nombre": "Telmex", "monto": 389.0}],
            "destinatarios": [{"nombre": "Mamá", "cuenta": "0123..."}, {"nombre": "Ahorro", "cuenta": "9876..."}]
        }

        screen_json = {"screen_id": sid, "user_id": uid, "havi_context": f"Usuario en {sid}. Saldo: ${row['saldo_debito']:,.0f}. Sugerencia: {current_trigger['name']}.", "havi_context_short": f"Balance: ${row['saldo_debito']:,.0f}", "data": data_obj}
        with open(SCREEN_DIR / f"{uid.lower()}_{sid}.json", "w", encoding="utf-8") as f:
            json.dump(screen_json, f, indent=2, ensure_ascii=False)

# Exportar perfiles final
profiles = [{"user_id": r['user_id'], "password": "demo", "archetype_name": r['archetype_name'], "anomaly_score": round(float(r['anomaly_score']), 4), "trigger_active": r['trigger_active']} for _, r in demo_df.iterrows()]
with open(MOCK_DIR / "user_profiles.json", "w", encoding="utf-8") as f:
    json.dump(profiles, f, indent=2, ensure_ascii=False)

print(f"ÉXITO FINAL: 15 usuarios generados con mensajería contextual dinámica.")
