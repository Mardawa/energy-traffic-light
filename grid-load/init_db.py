import importlib
import pathlib as pl
import sqlite3

import pandas as pd
from tqdm import tqdm

import grid_load.processing as glp

importlib.reload(glp)


def init_db():
    if pl.Path("local.db").exists():
        pl.Path("local.db").unlink()

    conn = sqlite3.connect("local.db")

    files = list(pl.Path("../data").glob("*.csv"))
    for file in tqdm(files, total=len(files)):
        df = glp.extract_data(file)
        df = glp.transform_data(df)
        if "Trafostation" in file.stem:
            df.to_sql("grid_consumption", conn, if_exists="append", index=False)
        elif "Wohnung" in file.stem:
            user_id = int(file.stem.split("_")[0])
            df["user_id"] = user_id
            df.to_sql("user_consumption", conn, if_exists="append", index=False)
    conn.close()


if __name__ == "__main__":
    init_db()
