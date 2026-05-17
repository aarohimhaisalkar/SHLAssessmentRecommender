import json
import faiss
import numpy as np

from sentence_transformers import SentenceTransformer

# -----------------------------------
# Load Catalog
# -----------------------------------

with open("catalog.json", "r", encoding="utf-8") as f:
    catalog = json.load(f)

# -----------------------------------
# Load Embedding Model
# -----------------------------------

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

# -----------------------------------
# Prepare Text Data
# -----------------------------------

documents = []

for item in catalog:

    text = f"""
    Name: {item.get('name', '')}

    Description: {item.get('description', '')}

    Skills: {' '.join(item.get('skills', []))}

    Test Type: {item.get('test_type', '')}
    """

    documents.append(text)

# -----------------------------------
# Generate Embeddings
# -----------------------------------

embeddings = model.encode(documents)

embeddings = np.array(
    embeddings,
    dtype="float32"
)

# -----------------------------------
# Create FAISS Index
# -----------------------------------

dimension = embeddings.shape[1]

index = faiss.IndexFlatL2(dimension)

index.add(embeddings)

# -----------------------------------
# Save Index
# -----------------------------------

faiss.write_index(index, "shl_index.faiss")

# Save processed documents
with open("documents.json", "w", encoding="utf-8") as f:

    json.dump(catalog, f, indent=4)

print("FAISS index created successfully")