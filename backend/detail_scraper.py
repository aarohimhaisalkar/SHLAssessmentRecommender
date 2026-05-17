import json
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service

from webdriver_manager.chrome import ChromeDriverManager

# -----------------------------------
# Load Existing Catalog
# -----------------------------------

with open("catalog.json", "r", encoding="utf-8") as f:
    catalog = json.load(f)

# -----------------------------------
# Chrome Setup
# -----------------------------------

options = webdriver.ChromeOptions()

# options.add_argument("--headless")

driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=options
)

updated_catalog = []

# -----------------------------------
# Visit Each Assessment Page
# -----------------------------------

for item in catalog:

    try:

        url = item["url"]

        print("Opening:", url)

        driver.get(url)

        time.sleep(5)

        page_text = driver.find_element(By.TAG_NAME, "body").text

        lower_text = page_text.lower()

        # -----------------------------------
        # Detect Test Type
        # -----------------------------------

        test_type = "General"

        if "personality" in lower_text:
            test_type = "Personality"

        elif "cognitive" in lower_text:
            test_type = "Cognitive"

        elif "technical" in lower_text:
            test_type = "Technical"

        # -----------------------------------
        # Extract Skills
        # -----------------------------------

        skills = []

        keywords = [
            "java",
            "python",
            "leadership",
            "communication",
            "sales",
            "management",
            "problem solving",
            "developer",
            "analytics",
            "data",
            "cloud"
        ]

        for keyword in keywords:

            if keyword in lower_text:
                skills.append(keyword)

        # -----------------------------------
        # Extract Duration
        # -----------------------------------

        duration = ""

        possible_durations = [
            "15 minutes",
            "20 minutes",
            "30 minutes",
            "45 minutes",
            "60 minutes"
        ]

        for d in possible_durations:

            if d in lower_text:
                duration = d
                break

        # -----------------------------------
        # Update Item
        # -----------------------------------

        updated_item = {
            "name": item.get("name", ""),
            "url": url,
            "description": page_text[:1500],
            "test_type": test_type,
            "duration": duration,
            "skills": skills
        }

        updated_catalog.append(updated_item)

    except Exception as e:

        print("Error:", e)

# -----------------------------------
# Save Updated Catalog
# -----------------------------------

with open("catalog.json", "w", encoding="utf-8") as f:

    json.dump(updated_catalog, f, indent=4, ensure_ascii=False)

# -----------------------------------
# Close Browser
# -----------------------------------

driver.quit()

print("Detailed catalog saved successfully")