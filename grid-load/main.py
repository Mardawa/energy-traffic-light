import sqlite3

import pandas as pd
from fastapi import FastAPI, Query

import grid_load.processing as glp

app = FastAPI()


@app.get("/api/hello")
def hello():
    return {"message": "Hello World"}


@app.get("/api/grid_consumption")
def read_grid_consumption(start: int = Query(...), end: int = Query(...)):
    conn = sqlite3.connect("local.db")
    sql = """
    SELECT
        *
    FROM
        grid_consumption
    WHERE
        ts >= :start
        AND ts <= :end
    """
    df = pd.read_sql(
        sql,
        conn,
        params={
            "start": start,
            "end": end,
        },
    )
    conn.close()

    # current_monthly_max, diff_w_max = glp.get_monthly_max(df)
    current_monthly_max, diff_w_max = 140, 123

    return {
        "grid_data": {
            "current_monthly_max": current_monthly_max,
            "diff_w_max": diff_w_max,
        },
        "consumption_data": glp.to_json(
            df,
            extra_col="threshold",
        ),
    }


@app.get("/api/user_consumption/{user_id}")
def read_user_consumption(
    user_id: int,
    start: int = Query(...),
    end: int = Query(...),
):
    conn = sqlite3.connect("local.db")
    sql = """
    Select
        *
    from
        user_consumption
    where
        user_id = :user_id
        AND ts >= :start
        AND ts <= :end
    """
    df_user = pd.read_sql(
        sql,
        conn,
        params={
            "user_id": user_id,
            "start": start,
            "end": end,
        },
    )

    sql_grid = """
    SELECT
        *
    FROM
        grid_consumption
    WHERE
        ts >= :start
        AND ts <= :end
    """
    df_grid = pd.read_sql(
        sql_grid,
        conn,
        params={
            "start": start,
            "end": end,
        },
    )

    corr = glp.correlation_matrix_stress_level(
        df_grid,
        df_user,
        window=7 * 24 * 4,
    )
    corr_value = round(corr.loc["diff_percentage_household"]["diff_percentage_grid"], 3)

    conn.close()
    return {
        "user_data": {
            "current_price": 1.2,
            "estimated_price": 15.7,
            "correlation": corr_value,
        },
        "consumption_data": glp.to_json(df_user),
    }
