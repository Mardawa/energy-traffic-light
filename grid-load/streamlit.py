#######################
# Import libraries
import sqlite3

import altair as alt
import pandas as pd
import plotly.express as px

import grid_load.processing as glp
import streamlit as st

#######################
# Page configuration
st.set_page_config(
    page_title="Grid Consumption Dashboard",
    page_icon="💡",
    layout="wide",
    initial_sidebar_state="expanded",
)

alt.themes.enable("dark")

#######################
# CSS styling
st.markdown(
    """
<style>

[data-testid="block-container"] {
    padding-left: 2rem;
    padding-right: 2rem;
    padding-top: 1rem;
    padding-bottom: 0rem;
    margin-bottom: -7rem;
}

[data-testid="stVerticalBlock"] {
    padding-left: 0rem;
    padding-right: 0rem;
}

[data-testid="stMetric"] {
    background-color: #393939;
    text-align: center;
    padding: 15px 0;
}

[data-testid="stMetricLabel"] {
  display: flex;
  justify-content: center;
  align-items: center;
}

[data-testid="stMetricDeltaIcon-Up"] {
    position: relative;
    left: 38%;
    -webkit-transform: translateX(-50%);
    -ms-transform: translateX(-50%);
    transform: translateX(-50%);
}

[data-testid="stMetricDeltaIcon-Down"] {
    position: relative;
    left: 38%;
    -webkit-transform: translateX(-50%);
    -ms-transform: translateX(-50%);
    transform: translateX(-50%);
}

</style>
""",
    unsafe_allow_html=True,
)


#######################

conn = sqlite3.connect("local.db")

nb_row = 4 * 24 * 7

df_grid = pd.read_sql(
    """
    SELECT
        *
    FROM
        grid_consumption
    ORDER BY ts ASC
    """,
    conn,
).tail(nb_row)
grid_max, grid_diff = glp.household_stress_level_calculation(df_grid)

df_user = pd.read_sql(
    """
    Select
        *
    from
        user_consumption
    ORDER BY ts ASC
    """,
    conn,
)

user_id = 64
df_user = df_user[df_user["user_id"] == user_id].tail(nb_row)
user_corr = glp.correlation_matrix_stress_level(df_grid, df_user)

with st.sidebar:
    st.title("🏂 US Population Dashboard")


#######################
# Graph


#######################
# Dashboard Main Panel
col = st.columns((0.7, 0.3), gap="medium")

with col[0]:
    st.markdown("#### Grid Consumption")
    st.line_chart(
        df_grid.set_index("Datum")[["Wert", "threshold"]],
        color=["#29b5e8", "#FF0000"],
    )
    st.markdown("#### User Consumption")
    st.line_chart(
        df_user.set_index("Datum")[["Wert", "threshold"]],
        color=["#29b5e8", "#FF0000"],
    )


with col[1]:
    st.markdown("#### Grid")
    progess = grid_diff / grid_max
    color = None
    if progess > 0.80:
        color = "#FF0000"
    elif progess > 0.60:
        color = "#FFA500"
    elif progess > 0.40:
        color = "#FFFF00"
    st.markdown(
        f"""
    <style>
        .stProgress > div > div > div > div {{
            background-color: {color};
        }} …
    </style>""",
        unsafe_allow_html=True,
    )
    st.progress(progess, f"{grid_diff}kW / {grid_max}kW")

    st.markdown("#### User Consumption")

    st.markdown("Current price: 1.5CHF/kWh")
    st.markdown("Estimated price: 15.7CHF/kWh")
    st.markdown(f"Correlation over the last 30 days: {user_corr}")
