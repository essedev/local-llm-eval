"""Fonde i pesi del drafter MTP dentro il checkpoint target di Qwen3.8-27B.

Il target pubblicato da lmstudio-community e mlx-community non contiene la testa
MTP (0 chiavi su 2180), mentre il config la dichiara. Il fork con supporto MTP
rifiuta di caricare in quella condizione. Qui creiamo una directory che punta ai
pesi originali via symlink e aggiunge un solo file con le chiavi del drafter
rinominate sotto `language_model.mtp.*`, che è dove TextModel se le aspetta.
"""

import glob
import json
import os
import shutil
import sys

import mlx.core as mx

TARGET = "/Users/doppia/.lmstudio/models/lmstudio-community/Qwen3.8-27B-MLX-4bit"
DRAFTER_GLOB = "/Users/doppia/.cache/huggingface/hub/models--mlx-community--Qwen3.8-27B-MTP-4bit/snapshots/*/model.safetensors"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/private/tmp/claude-501/-Users-doppia-Development-Projects-doppia-linkedin/1305d7b9-ec4d-44be-bd83-1acf4280b9fa/scratchpad/qwen38-27b-mtp-fused"

PREFIX = "language_model.mtp."
MTP_FILE = "model-mtp.safetensors"

os.makedirs(OUT, exist_ok=True)

# 1. symlink di tutto tranne l'index (che riscriviamo)
for name in os.listdir(TARGET):
    if name == "model.safetensors.index.json":
        continue
    src = os.path.join(TARGET, name)
    dst = os.path.join(OUT, name)
    if os.path.lexists(dst):
        os.remove(dst)
    os.symlink(src, dst)

# 2. leggo il drafter e rinomino le chiavi
drafter_path = glob.glob(DRAFTER_GLOB)[0]
raw = mx.load(drafter_path)
tensors = {PREFIX + k: v for k, v in raw.items()}

print(f"drafter: {len(tensors)} tensori rinominati sotto {PREFIX}")
for k in sorted(tensors)[:6]:
    print("  ", k, tensors[k].dtype, tensors[k].shape)

mx.save_safetensors(os.path.join(OUT, MTP_FILE), tensors)

# 3. index unificato
index = json.load(open(os.path.join(TARGET, "model.safetensors.index.json")))
wmap = index["weight_map"]
before = len(wmap)
for k in tensors:
    wmap[k] = MTP_FILE
index["weight_map"] = wmap
json.dump(index, open(os.path.join(OUT, "model.safetensors.index.json"), "w"), indent=1)
print(f"index: {before} -> {len(wmap)} chiavi")

# 4. sanity check sul config
cfg = json.load(open(os.path.join(TARGET, "config.json")))
tc = cfg.get("text_config", {})
print("mtp_num_hidden_layers nel target:", tc.get("mtp_num_hidden_layers"))
print("quantization:", cfg.get("quantization") or tc.get("quantization"))
print("\ncheckpoint fuso pronto in:", OUT)
