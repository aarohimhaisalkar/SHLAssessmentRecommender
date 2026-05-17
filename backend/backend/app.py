from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware

import google.generativeai as genai
import os
from dotenv import load_dotenv

from semantic_recommender import (
    recommend_assessments,
    compare_assessments
)

# -----------------------------------
# Load Environment Variables
# -----------------------------------

load_dotenv()

# -----------------------------------
# Configure Gemini
# -----------------------------------

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

# -----------------------------------
# Load Gemini Model
# -----------------------------------

model = genai.GenerativeModel(
    "gemini-2.5-flash"
)

# -----------------------------------
# Create FastAPI App
# -----------------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------
# Request Models
# -----------------------------------

class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]

# -----------------------------------
# Health Endpoint
# -----------------------------------

@app.get("/health")
def health():

    return {
        "status": "ok"
    }

# -----------------------------------
# Chat Endpoint
# -----------------------------------

@app.post("/chat")
def chat(request: ChatRequest):

    # -----------------------------------
    # Get Latest Message
    # -----------------------------------

    latest_message = request.messages[-1].content

    # -----------------------------------
    # Full Conversation History
    # -----------------------------------

    conversation = " ".join(
        [msg.content for msg in request.messages]
    )

    user_text = conversation.lower()

    # -----------------------------------
    # Scope Protection
    # -----------------------------------

    off_topic_keywords = [
        "salary",
        "legal",
        "politics",
        "weather",
        "movie",
        "music"
    ]

    for word in off_topic_keywords:

        if word in user_text:

            return {
                "reply": (
                    "I can only help with SHL assessments "
                    "and hiring assessment recommendations."
                ),
                "recommendations": [],
                "end_of_conversation": False
            }

    # -----------------------------------
    # Comparison Logic
    # -----------------------------------

    if "difference between" in user_text:

        try:

            parts = user_text.split(
                "difference between"
            )[1]

            names = parts.split("and")

            if len(names) >= 2:

                name1 = names[0].strip()
                name2 = names[1].strip()

                comparison_result = compare_assessments(
                    name1,
                    name2
                )

                return {
                    "reply": comparison_result,
                    "recommendations": [],
                    "end_of_conversation": False
                }

        except Exception as e:

            print("Comparison Error:", e)

            return {
                "reply": (
                    "Please provide two assessment names "
                    "to compare."
                ),
                "recommendations": [],
                "end_of_conversation": False
            }

    # -----------------------------------
    # Role Detection
    # -----------------------------------

    role = None

    roles = [
        "java developer",
        "python developer",
        "developer",
        "software engineer",
        "sales",
        "manager",
        "analyst",
        "engineer",
        "hr",
        "marketing",
        "data analyst",
        "data scientist"
    ]

    for r in roles:

        if r in user_text:
            role = r
            break

    # -----------------------------------
    # Experience Level Detection
    # -----------------------------------

    level = None

    levels = [
        "junior",
        "mid",
        "mid-level",
        "senior",
        "entry level"
    ]

    for l in levels:

        if l in user_text:
            level = l
            break

    # -----------------------------------
    # Skills Detection
    # -----------------------------------

    skills = []

    skill_keywords = [
        "communication",
        "coding",
        "personality",
        "leadership",
        "aptitude",
        "problem solving",
        "technical",
        "behavioral",
        "stakeholder management",
        "analytics"
    ]

    for skill in skill_keywords:

        if skill in user_text:
            skills.append(skill)

    # -----------------------------------
    # Clarification Questions
    # -----------------------------------

    if role is None:

        return {
            "reply": (
                "What role are you hiring for?"
            ),
            "recommendations": [],
            "end_of_conversation": False
        }

    if level is None:

        return {
            "reply": (
                "What experience level are you hiring for? "
                "(Junior/Mid/Senior)"
            ),
            "recommendations": [],
            "end_of_conversation": False
        }

    if len(skills) == 0:

        return {
            "reply": (
                "What skills or traits would you like "
                "to assess? (Coding, communication, "
                "personality, aptitude, etc.)"
            ),
            "recommendations": [],
            "end_of_conversation": False
        }

    # -----------------------------------
    # Recommendation Logic
    # -----------------------------------

    recommendations = recommend_assessments(
        conversation
    )

    # -----------------------------------
    # No Recommendations Found
    # -----------------------------------

    if len(recommendations) == 0:

        return {
            "reply": (
                "I could not find matching SHL assessments. "
                "Please provide more role-specific details."
            ),
            "recommendations": [],
            "end_of_conversation": False
        }

    # -----------------------------------
    # Format Recommendations
    # -----------------------------------

    formatted = []

    for item in recommendations[:10]:

        formatted.append({
            "name": item.get("name", ""),
            "url": item.get("url", ""),
            "test_type": item.get(
                "test_type",
                "General"
            )
        })

    # -----------------------------------
    # Gemini Explanation Prompt
    # -----------------------------------

    prompt = f"""
    You are an SHL assessment recommendation assistant.

    Only explain assessments from the
    provided SHL catalog.

    User hiring requirements:
    {conversation}

    Recommended assessments:
    {formatted}

    Explain briefly why these assessments
    fit the hiring requirements.
    Keep response professional and concise.
    """

    response = model.generate_content(
        prompt
    )

    # -----------------------------------
    # Final Response
    # -----------------------------------

    return {
        "reply": response.text,
        "recommendations": formatted,
        "end_of_conversation": True
    }