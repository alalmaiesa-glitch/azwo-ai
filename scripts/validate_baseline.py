from pathlib import Path
import csv
ROOT = Path(__file__).resolve().parents[1]
required = [
    "BASELINE.md","CHANGELOG_CHALLENGE.md","README.md",
    "docs/ARCHITECTURE.md","docs/SOURCES_AND_LICENSES.csv",
    "docs/TEST_PLAN.md","prototype/index.html","prototype/styles.css","prototype/app.js"
]
missing=[p for p in required if not (ROOT/p).exists()]
if missing:
    raise SystemExit(f"Missing required files: {missing}")
csv_path=ROOT/"data/test_cases.csv"
if csv_path.exists():
    with open(csv_path,encoding="utf-8-sig",newline="") as f:
        rows=list(csv.DictReader(f))
    assert len(rows)==120, f"Expected 120 test cases, found {len(rows)}"
html=(ROOT/"prototype/index.html").read_text(encoding="utf-8")
assert "بيانات تجريبية" in html and "لا يوجد محرك تحقق فعلي" in html
print("OK: baseline structure and demo disclaimer verified.")
