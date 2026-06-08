import io
import pandas as pd
import pytest
from app.services.file_parser import parse_file


def _make_csv(rows: list[dict]) -> bytes:
    df = pd.DataFrame(rows)
    return df.to_csv(index=False).encode()


VALID_ROW = {
    "項次": 1,
    "B開幅(%)": 78,
    "C開幅(%)": 0,
    "D開幅(%)": 50,
    "R開幅(%)": 0,
    "槽增加量(%)": 9,
    "實際用量(kg)": 0,
}


def test_parse_valid_csv():
    content = _make_csv([VALID_ROW])
    df = parse_file("data.csv", content)
    assert "B_open_pct" in df.columns
    assert "usage_kg" in df.columns
    assert len(df) == 1


def test_parse_valid_xlsx():
    buf = io.BytesIO()
    pd.DataFrame([VALID_ROW]).to_excel(buf, index=False)
    df = parse_file("data.xlsx", buf.getvalue())
    assert "B_open_pct" in df.columns


def test_unsupported_extension():
    with pytest.raises(ValueError, match="不支援"):
        parse_file("data.txt", b"hello")


def test_empty_file():
    with pytest.raises(ValueError):
        parse_file("data.csv", b"")


def test_missing_required_column():
    bad_row = {k: v for k, v in VALID_ROW.items() if k != "實際用量(kg)"}
    content = _make_csv([bad_row])
    with pytest.raises(ValueError, match="缺少必要欄位"):
        parse_file("data.csv", content)


def test_record_id_optional():
    row_no_id = {k: v for k, v in VALID_ROW.items() if k != "項次"}
    content = _make_csv([row_no_id])
    df = parse_file("data.csv", content)
    assert "record_id" not in df.columns
