import ast
import re
from pathlib import Path

from app_core import COLLECTIONS, db

SQL_FILE = Path(__file__).parent / "legacy_data.sql"

def split_sql_values(block: str):
    rows, current, depth, quote, escaped = [], [], 0, None, False
    for char in block:
        if quote:
            current.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue
        if char in "'\"":
            quote = char; current.append(char)
        elif char == "(":
            depth += 1
            if depth > 1: current.append(char)
        elif char == ")":
            depth -= 1
            if depth == 0:
                rows.append("".join(current)); current = []
            else: current.append(char)
        elif depth > 0:
            current.append(char)
    return rows

def split_fields(row: str):
    fields, current, quote, escaped = [], [], None, False
    for char in row + ",":
        if quote:
            current.append(char)
            if escaped: escaped = False
            elif char == "\\": escaped = True
            elif char == quote: quote = None
        elif char in "'\"": quote = char; current.append(char)
        elif char == ",": fields.append("".join(current).strip()); current = []
        else: current.append(char)
    return fields

def parse_value(value: str):
    if value.upper() == "NULL": return None
    if value.startswith("'"):
        raw = value[1:-1]
        return (raw.replace("\\'", "'").replace('\\"', '"').replace("\\r", "\r")
                   .replace("\\n", "\n").replace("\\t", "\t").replace("\\\\", "\\"))
    try:
        return float(value) if "." in value else int(value)
    except ValueError:
        return value

def parse_dump():
    text = SQL_FILE.read_text(encoding="utf-8", errors="replace")
    pattern = re.compile(r"INSERT INTO `([^`]+)`\s*\((.*?)\)\s*VALUES\s*(.*?);", re.S | re.I)
    grouped = {}
    for match in pattern.finditer(text):
        table = match.group(1)
        if table not in COLLECTIONS: continue
        columns = re.findall(r"`([^`]+)`", match.group(2))
        for row in split_sql_values(match.group(3)):
            values = [parse_value(v) for v in split_fields(row)]
            if len(values) == len(columns):
                grouped.setdefault(table, []).append(dict(zip(columns, values)))
    return grouped

async def seed_legacy_data():
    if await db.migration_state.find_one({"name": "playmenu_sql_v1"}, {"_id": 1}):
        return
    if not SQL_FILE.exists():
        return
    grouped = parse_dump()
    for table, rows in grouped.items():
        if rows and await db[table].count_documents({}) == 0:
            await db[table].insert_many(rows, ordered=False)
    await db.migration_state.insert_one({"name": "playmenu_sql_v1", "tables": {k: len(v) for k, v in grouped.items()}})