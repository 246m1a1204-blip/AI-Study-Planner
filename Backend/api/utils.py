import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

# Gemini Config
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_ai_schedule(subject_name, difficulty, total_units, exam_date):
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""
    Act as a professional study planner. A student has an exam for {subject_name} on {exam_date}.
    The subject has {total_units} units and the student feels it is {difficulty} level.
    Create a daily study plan from today until the exam date.
    
    Response format should be a clean JSON list of objects like this:
    [
      {{"date": "YYYY-MM-DD", "task": "Study Unit 1: Introduction"}},
      ...
    ]
    Only return the JSON list, no extra text.
    """
    
    response = model.generate_content(prompt)
    return response.text