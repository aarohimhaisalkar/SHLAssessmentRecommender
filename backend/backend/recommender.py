import json

# -----------------------------------
# Load Catalog
# -----------------------------------

with open("catalog.json", "r", encoding="utf-8") as f:
    catalog = json.load(f)

# -----------------------------------
# Recommendation Function
# -----------------------------------

def recommend_assessments(conversation):

    conversation = conversation.lower()

    recommendations = []

    # Split user words
    user_words = conversation.split()

    for item in catalog:

        score = 0

        name = item.get("name", "").lower()

        description = item.get("description", "").lower()

        skills = item.get("skills", [])

        # -----------------------------------
        # Match Assessment Name
        # -----------------------------------

        for word in user_words:

            if word in name:
                score += 3

        # -----------------------------------
        # Match Description
        # -----------------------------------

        for word in user_words:

            if word in description:
                score += 2

        # -----------------------------------
        # Match Skills
        # -----------------------------------

        for skill in skills:

            if skill.lower() in conversation:
                score += 5

        # -----------------------------------
        # Add Relevant Items
        # -----------------------------------

        if score > 0:

            item["score"] = score

            recommendations.append(item)

    # -----------------------------------
    # Sort By Score
    # -----------------------------------

    recommendations = sorted(
        recommendations,
        key=lambda x: x["score"],
        reverse=True
    )

    # Return Top 10
    return recommendations[:10]