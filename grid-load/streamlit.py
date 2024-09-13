#######################
# Import libraries
import datetime
import sqlite3

import altair as alt
import pandas as pd
import plotly.express as px
import streamviz as sv

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

tips = [
    "Try to shift your consumption outside of the peaks.",
    "Try to lower your correlation w.r.t. your peaks and the grid's peaks.",
]

conn = sqlite3.connect("local.db")

df_grid = pd.read_sql(
    """
    SELECT
        *
    FROM
        grid_consumption
    ORDER BY ts ASC
    """,
    conn,
)
df_grid["date_fmt"] = pd.to_datetime(df_grid["date_fmt"])

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
df_user["date_fmt"] = pd.to_datetime(df_user["date_fmt"])


with st.sidebar:
    st.title("💡 Grid Consumption Dashboard")

    first_date = df_grid["date_fmt"].iloc[0]
    last_date = df_grid["date_fmt"].iloc[-1]
    default_first_date = last_date - pd.Timedelta(days=5)

    start_date = st.date_input(
        "Select start date",
        min_value=first_date,
        max_value=last_date,
        value=default_first_date,
    )
    start_date = pd.to_datetime(start_date)  # type: ignore
    start_hour = start_time = st.time_input("Enter start time", datetime.time(6, 0))
    start_date = start_date + pd.Timedelta(
        hours=start_hour.hour, minutes=start_hour.minute
    )
    start_time_ts = start_date.timestamp()

    end_date = st.date_input(
        "Select end date",
        value=last_date,
        min_value=start_date,
        max_value=last_date,
    )
    end_date = pd.to_datetime(end_date)  # type: ignore
    end_hour = start_time = st.time_input("Enter end time", datetime.time(8, 45))
    end_date = end_date + pd.Timedelta(hours=end_hour.hour, minutes=end_hour.minute)
    end_time_ts = end_date.timestamp()

    df_grid_filtered = df_grid[
        (df_grid["ts"] >= start_time_ts) & (df_grid["ts"] <= end_time_ts)
    ]
    grid_max, grid_diff = glp.household_stress_level_calculation(df_grid_filtered)
    current_stress_level = round(df_grid_filtered["diff_percentage"].iloc[-1], 3)

    user_id = st.selectbox(
        "Select user",
        df_user["user_id"].unique(),
    )

    df_user_filtered = df_user[
        (df_user["user_id"] == user_id)
        & (df_user["ts"] >= start_time_ts)
        & (df_user["ts"] <= end_time_ts)
    ]

    user_corr = glp.correlation_matrix_stress_level(
        df_grid_filtered,
        df_user_filtered,
        window=len(df_grid_filtered),
    )

#######################
# Graph


#######################
# Dashboard Main Panel
col = st.columns((0.7, 0.3), gap="medium")

with col[0]:
    start_date_fmt = start_date.strftime("%d.%m.%Y")
    end_date_fmt = end_date.strftime("%d.%m.%Y")
    st.markdown(f"### Visualization from {start_date_fmt} to {end_date_fmt}")

    st.markdown("#### Grid Consumption")
    st.line_chart(
        df_grid_filtered.set_index("Datum")[["Wert", "threshold"]],
        color=["#29b5e8", "#FF0000"],
    )

    st.markdown(f"#### User {user_id} Consumption")
    st.line_chart(
        df_user_filtered.set_index("Datum")[["Wert", "threshold"]],
        color=["#29b5e8", "#FF0000"],
    )
    # st.dataframe(df_user_filtered[["Datum", "Wert"]])


with col[1]:
    st.markdown("#### Grid")

    # st.markdown(f"Stress level: {current_stress_level}")
    if current_stress_level > 0.0:
        st.error(
            "The grid is heavely under load. Try to lower your consumption.",
            icon="❌",
        )
    elif current_stress_level > -10:
        st.warning(
            "The grid is under load. Try to lower your consumption.",
            icon="⚠️",
        )
    else:
        st.success(
            "The grid is not under load. Use your appliances as usual.",
            icon="✅",
        )

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
    st.progress(progess, f"{grid_diff}kW (current) / {grid_max}kW (monthly highest)")

    st.markdown("#### Compute the grid highest peak's cost")
    price_highest = st.text_input("Peak price CHF/kWh")
    price_highest = (
        float(price_highest) if price_highest and price_highest != "" else None
    )
    if price_highest is not None:
        cost_of_highest_peak = glp.cost_of_highest_peak(price_highest, df_grid_filtered)
        st.metric(
            "Your highest peak is costing you :",
            cost_of_highest_peak,
            help="The highest is subject to an additional cost.",
        )

    st.markdown("#### User Profile")

    st.markdown(f"Correlation over the selected period : **{user_corr}**")
    if user_corr > 0.01:
        st.warning(
            "You are in a high correlation with the grid's peaks. Try to shift your consumption outside of the peaks.",
            icon="⚠️",
        )
    else:
        st.success(
            "That's good : you are in a low correlation with the grid. Keep it up!",
            icon="🔥",
        )

    low_price = st.text_input("Low price CHF/kWh")
    low_price = float(low_price) if low_price and low_price != "" else None
    high_price = st.text_input("High price CHF/kWh")
    high_price = float(high_price) if high_price and high_price != "" else None

    if high_price is not None and low_price is not None:
        price = glp.p_calculate(high_price, low_price, df_user_filtered)
        st.metric(
            "Price over the selected period in CHF",
            price,
            help="Your price is computed depending on the high and low price.",
        )

    st.markdown("#### Tips")
    # make a list of tips
    for i in range(len(tips)):
        st.markdown(f"* {tips[i]}")
