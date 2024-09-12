#######################
# Import libraries
import sqlite3

import altair as alt
import pandas as pd
import plotly.express as px

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
df = pd.read_sql(
    """
    SELECT
        *
    FROM
        grid_consumption
    """,
    conn,
).tail(4 * 24 * 7)

with st.sidebar:
    st.title("🏂 US Population Dashboard")


#######################
# Graph


#######################
# Dashboard Main Panel
col = st.columns((0.6, 0.2, 0.2), gap="medium")

with col[0]:
    st.markdown("#### Gains/Losses")
    st.line_chart(
        df.set_index("ts")[["Wert", "threshold"]],
        color=["#29b5e8", "#155F7A"],
    )

with col[1]:
    st.markdown("#### Total Population")


with col[2]:
    st.markdown("#### Top States")

    with st.expander("About", expanded=True):
        st.write("""
            - Data: [U.S. Census Bureau](https://www.census.gov/data/datasets/time-series/demo/popest/2010s-state-total.html).
            - :orange[**Gains/Losses**]: states with high inbound/ outbound migration for selected year
            - :orange[**States Migration**]: percentage of states with annual inbound/ outbound migration > 50,000
            """)
