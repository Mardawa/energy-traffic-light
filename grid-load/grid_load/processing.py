import pathlib as pl

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
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
    plt.gca().xaxis.set_minor_locator(mdates.HourLocator(interval=1))
    plt.xticks(rotation=45)

    sns.lineplot(data=df, x="date_fmt", y="Wert", ax=axes[0])
    sns.lineplot(data=df, x="date_fmt", y="threshold", color="red", ax=axes[0])

    sns.lineplot(data=df, x="date_fmt", y="diff_percentage", ax=axes[1], color="green")
    axes[1].axhline(y=0, color="black", linestyle="--")


def correlation_matrix_stress_level(
    df_grid: pd.DataFrame,
    df_household: pd.DataFrame,
    window: float | None = None,
) -> pd.DataFrame:
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

    return merged_df[["diff_percentage_grid", "diff_percentage_household"]].corr()


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
