import pandas as pd

df = pd.read_parquet("dataset_50k_anonymized.parquet")

# Reconstruct a conversation
conv = df[df["conv_id"] == "some-conv-id"].sort_values("date")

# All conversations for a user
user_convs = df[df["user_id"] == "USR-00042"].groupby("conv_id")