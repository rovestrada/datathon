# Datathon 2026

## Setup

Install dependencies:

```bash
pip install -r requirements.txt
```

## Dataset

The dataset (`dataset_50k_anonymized.parquet`) is excluded from version control via `.gitignore` and must be obtained separately.

## Usage

```python
import pandas as pd

df = pd.read_parquet("dataset_50k_anonymized.parquet")

# Reconstruct a single conversation
conv = df[df["conv_id"] == "some-conv-id"].sort_values("date")

# All conversations for a user
user_convs = df[df["user_id"] == "USR-00042"].groupby("conv_id")
```

