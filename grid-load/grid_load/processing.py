import pathlib as pl

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns


def extract_data(csv_path):
    df = pd.read_csv(csv_path, sep=";")
    df["date_fmt"] = pd.to_datetime(
        df["Datum"],
        format="%d.%m.%Y %H:%M:%S %z",
        utc=True,
    )
    return df[df["Wert"] > 0]


def calc_diff_percentage(row):
    return (row["Wert"] - row["threshold"]) / row["threshold"]


def transform_data(
    df: pd.DataFrame,
    window_mean_d: int = 7,
    windows_quantile_h: int = 8,
    quantile: float = 0.75,
):
    window_mean_d = window_mean_d * 4 * 24
    windows_quantile_h = windows_quantile_h * 4
    df["moving_avg"] = df["Wert"].rolling(window=window_mean_d).mean().fillna(1)
    df["quantile"] = (
        df[["Wert", "moving_avg"]]
        .max(axis=1)
        .rolling(window=windows_quantile_h)
        .quantile(quantile)
    )
    df["threshold"] = df[["moving_avg", "quantile"]].max(axis=1)
    df["high_usage"] = df["Wert"] > df["threshold"]

    df["diff_percentage"] = df.apply(
        lambda x: calc_diff_percentage(x),
        axis=1,
    )
    df["ts"] = df["date_fmt"].apply(lambda x: x.timestamp())
    return df


def plot(df: pd.DataFrame):
    df = df.tail(3 * 4 * 24).copy()

    sns.set_theme(rc={"figure.figsize": (25, 10)})

    fig, axes = plt.subplots(2, 1)

    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter("%d.%m.%Y"))
    plt.gca().xaxis.set_minor_formatter(mdates.DateFormatter("%H"))
    plt.gca().xaxis.set_minor_locator(mdates.HourLocator(interval=6))
    plt.xticks(rotation=45)

    sns.lineplot(data=df, x="date_fmt", y="Wert", ax=axes[0])
    sns.lineplot(data=df, x="date_fmt", y="threshold", color="red", ax=axes[0])

    sns.lineplot(data=df, x="date_fmt", y="diff_percentage", ax=axes[1], color="green")
    axes[1].axhline(y=0, color="black", linestyle="--")


def correlation_matrix_stress_level(
    df_grid: pd.DataFrame,
    df_household: pd.DataFrame,
    window: float | None = None,
) -> float:
    if window is not None:
        window = int(window)
        df_grid = df_grid.tail(window)
        df_household = df_household.tail(window)

    df_grid = df_grid.loc[:, ["Datum", "diff_percentage"]]
    df_household = df_household.loc[:, ["Datum", "diff_percentage"]]

    df_grid = df_grid.rename(columns={"diff_percentage": "diff_percentage_grid"})
    df_household = df_household.rename(
        columns={"diff_percentage": "diff_percentage_household"}
    )

    merged_df = df_grid.merge(df_household, on="Datum")

    corr = merged_df[["diff_percentage_grid", "diff_percentage_household"]].corr()

    return round(corr.loc["diff_percentage_household"]["diff_percentage_grid"], 3)  # type: ignore


def household_stress_level_calculation(df_grid: pd.DataFrame) -> tuple[float, float]:
    df_grid = df_grid.copy()
    df_grid["date_fmt"] = pd.to_datetime(df_grid["date_fmt"])
    last_wert_month = df_grid["date_fmt"].iloc[-1].month
    last_wert_year = df_grid["date_fmt"].iloc[-1].year
    current_df = df_grid[
        (
            df_grid["date_fmt"].apply(lambda x: pd.to_datetime(x).month)
            == last_wert_month
        )
        & (
            df_grid["date_fmt"].apply(lambda x: pd.to_datetime(x).year)
            == last_wert_year
        )
    ]

    max_value_of_the_month = current_df["Wert"].max()
    household_stress_level = max_value_of_the_month - df_grid["Wert"].iloc[-1]
    return max_value_of_the_month, round(household_stress_level, 3)


def p_calculate(
    high_price: float, low_price: float, selected_df: pd.DataFrame
) -> float:
    # Define the time range for "high"
    start_time = pd.to_datetime("06:00:00").time()
    end_time = pd.to_datetime("22:00:00").time()

    selected_df["type_price"] = None
    # Create 'type_price' column based on the time condition
    selected_df["type_price"] = np.where(
        (selected_df["date_fmt"].dt.time >= start_time)
        & (selected_df["date_fmt"].dt.time <= end_time),
        "high",
        "low",
    )

    df_price = pd.DataFrame(
        {"type_price": ["high", "low"], "price_per_kwh": [high_price, low_price]}
    )
    selected_df = selected_df.merge(df_price, on="type_price")
    selected_df["price"] = selected_df["Wert"] * selected_df["price_per_kwh"]

    return round(selected_df["price"].sum(), 2)


def cost_of_highest_peak(price_highest: float, selected_df: pd.DataFrame) -> float:
    highest = selected_df["Wert"].max()
    return round(highest * price_highest * 0.25, 2)


def to_json(
    df: pd.DataFrame,
    path: pl.Path | None = None,
    extra_col: str | None = None,
):
    col_to_keep = [
        "ts",
        "Wert",
        "diff_percentage",
        "high_usage",
    ]

    if col_to_keep is not None:
        col_to_keep = col_to_keep + [extra_col]

    df = df[col_to_keep]
    df = df.rename(
        columns={
            "ts": "timestamp",
            "high_usage": "is_peak",
            "diff_percentage": "stress_level",
        },
    )
    json_data = df.to_json(orient="records")

    if path is not None:
        with open(path, "w") as f:
            f.write(json_data)

    return json_data
