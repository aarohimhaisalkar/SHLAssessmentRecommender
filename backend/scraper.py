import json
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from webdriver_manager.chrome import ChromeDriverManager

# -----------------------------------
# Chrome Setup
# -----------------------------------

options = webdriver.ChromeOptions()

# COMMENTED HEADLESS FOR DEBUGGING
# options.add_argument("--headless")

options.add_argument("--start-maximized")

driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=options
)

# -----------------------------------
# Open SHL Catalog
# -----------------------------------

url = "https://www.shl.com/solutions/products/product-catalog/"

driver.get(url)

# Wait for page load
time.sleep(8)

# -----------------------------------
# Scroll Down Slowly
# -----------------------------------

for i in range(5):

    driver.execute_script(
        "window.scrollTo(0, document.body.scrollHeight);"
    )

    time.sleep(3)

# -----------------------------------
# Wait for Product Links
# -----------------------------------

try:

    WebDriverWait(driver, 20).until(
        EC.presence_of_all_elements_located(
            (By.TAG_NAME, "a")
        )
    )

except Exception as e:

    print("Elements not loaded:", e)

# -----------------------------------
# Find All Links
# -----------------------------------

links = driver.find_elements(By.TAG_NAME, "a")

print("Total links found:", len(links))

catalog = []

visited = set()

# -----------------------------------
# Extract Assessment Links
# -----------------------------------

for link in links:

    try:

        href = link.get_attribute("href")
        text = link.text.strip()

        if href and "/products/" in href:

            if href not in visited and text != "":

                visited.add(href)

                item = {
                    "name": text,
                    "url": href,
                    "description": "",
                    "test_type": "General",
                    "skills": []
                }

                catalog.append(item)

    except Exception as e:

        print("Error:", e)

# -----------------------------------
# Save JSON
# -----------------------------------

with open("catalog.json", "w", encoding="utf-8") as f:

    json.dump(catalog, f, indent=4, ensure_ascii=False)

# -----------------------------------
# Close Browser
# -----------------------------------

driver.quit()

print(f"Saved {len(catalog)} assessments")