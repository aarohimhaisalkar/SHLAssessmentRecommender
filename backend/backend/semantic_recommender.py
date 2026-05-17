import json
import faiss
import numpy as np

from sentence_transformers import SentenceTransformer

# -----------------------------------
# Load Catalog
# -----------------------------------

with open("documents.json", "r", encoding="utf-8") as f:
    catalog = json.load(f)

# -----------------------------------
# Load FAISS Index
# -----------------------------------

index = faiss.read_index("shl_index.faiss")

# -----------------------------------
# Load Embedding Model
# -----------------------------------

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

# -----------------------------------
# Recommendation Function
# -----------------------------------

def recommend_assessments(query, top_k=10):

    # Convert query to embedding
    query_embedding = model.encode([query])

    query_embedding = np.array(
        query_embedding,
        dtype="float32"
    )

    # Search similar items
    distances, indices = index.search(
        query_embedding,
        top_k
    )

    recommendations = []

    for idx in indices[0]:

        if idx < len(catalog):

            recommendations.append(catalog[idx])

    return recommendations

# -----------------------------------
# Compare Two Assessments
# -----------------------------------

def compare_assessments(name1, name2):

    assessment1 = None
    assessment2 = None

    # Find assessments
    for item in catalog:

        item_name = item.get("name", "").lower()

        if name1.lower() in item_name:
            assessment1 = item

        if name2.lower() in item_name:
            assessment2 = item

    # If not found
    if not assessment1 or not assessment2:

        return "I could not find both assessments in the SHL catalog."

    # Extract details
    desc1 = assessment1.get("description", "")
    desc2 = assessment2.get("description", "")

    type1 = assessment1.get("test_type", "")
    type2 = assessment2.get("test_type", "")

    duration1 = assessment1.get("duration", "")
    duration2 = assessment2.get("duration", "")

    skills1 = ", ".join(assessment1.get("skills", []))
    skills2 = ", ".join(assessment2.get("skills", []))

    # Build comparison text
    comparison = f"""
Assessment 1:
Name: {assessment1['name']}
Type: {type1}
Duration: {duration1}
Skills: {skills1}

Description:
{desc1[:500]}

-----------------------------------

Assessment 2:
Name: {assessment2['name']}
Type: {type2}
Duration: {duration2}
Skills: {skills2}

Description:
{desc2[:500]}
"""

    return comparison