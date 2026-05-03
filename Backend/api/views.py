import json, os, re, ast
from groq import Groq
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Subject, StudyTask
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# 1. Dashboard Subjects List
@api_view(['GET'])
def get_subjects(request):
    try:
        subjects = Subject.objects.all().order_by('-id')
        data = []
        for s in subjects:
            total = s.tasks.count()
            completed = s.tasks.filter(is_completed=True).count()
            progress = int((completed / total) * 100) if total > 0 else 0
            data.append({
                "id": s.id, "name": s.name, 
                "exam_date": str(s.exam_date), "progress": progress
            })
        return Response(data)
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=400)

# 2. Delete Subject
@api_view(['DELETE'])
def delete_subject(request, sub_id):
    try:
        subject = Subject.objects.get(id=sub_id)
        subject.delete()
        return Response({"status": "success"})
    except Subject.DoesNotExist:
        return Response({"status": "error", "message": "Not found"}, status=404)

# 3. Generate AI Plan
class GeneratePlanView(APIView):
    def post(self, request):
        data = request.data
        try:
            today_date = datetime.now().strftime("%Y-%m-%d")
            
            subject = Subject.objects.create(
                name=data.get('name'),
                exam_date=data.get('exam_date'),
                difficulty=data.get('difficulty', 'Medium'),
                total_units=0
            )

            prompt = (
                f"Create a study plan for {data['name']}. "
                f"The plan MUST start from today ({today_date}) and end by {data['exam_date']}. "
                f"Distribute tasks logically. Return ONLY a valid Python list of dictionaries: "
                f"[{{'date': 'YYYY-MM-DD', 'task': 'topic name'}}]. No extra text."
            )
            
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}]
            )
            
            raw_text = completion.choices[0].message.content.strip()
            list_match = re.search(r'\[.*\]', raw_text, re.DOTALL)
            
            if list_match:
                plan_data = ast.literal_eval(list_match.group())
            else:
                plan_data = []
            
            saved_tasks = []
            for item in plan_data:
                task = StudyTask.objects.create(
                    subject=subject,
                    date=item['date'],
                    task_description=item['task']
                )
                saved_tasks.append({
                    "id": task.id, 
                    "date": str(task.date), 
                    "task": task.task_description, 
                    "completed": task.is_completed
                })
            
            return Response({"status": "success", "plan": saved_tasks})
        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=400)

# 4. Update Task Status
class UpdateTaskStatusView(APIView):
    def post(self, request, task_id):
        try:
            task = StudyTask.objects.get(id=task_id)
            task.is_completed = request.data.get('completed', task.is_completed)
            task.save()
            return Response({"status": "success"})
        except Exception as e:
            return Response({"status": "error"}, status=400)

# --- UPDATED FOR DEEP EXPLANATION ---
class ExplainTopicView(APIView):
    def post(self, request):
        topic = request.data.get('topic')
        # Prompt update: Added "In-depth" and "Detailed" requirements
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert professor."},
                {"role": "user", "content": f"Provide an in-depth, detailed explanation for: {topic}. Include concepts, real-world examples, and key technical details. Make it long enough for a deep study session."}
            ]
        )
        return Response({"explanation": completion.choices[0].message.content})

# --- UPDATED FOR 5 QUESTIONS ---
@api_view(['POST'])
def generate_quiz(request):
    topic = request.data.get("topic")
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile", 
            messages=[
                {"role": "system", "content": "Generate exactly 5 challenging MCQs with options and correct answers."},
                {"role": "user", "content": f"Create a 5-question technical quiz for: {topic}"}
            ]
        )
        return Response({"quiz": completion.choices[0].message.content})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def get_subject_tasks(request, sub_id):
    try:
        tasks = StudyTask.objects.filter(subject_id=sub_id).order_by('date')
        data = [{"id": t.id, "date": str(t.date), "task": t.task_description, "completed": t.is_completed} for t in tasks]
        return Response(data)
    except Exception as e:
        return Response({"status": "error"}, status=400)
    
class FlashcardView(APIView):
    def post(self, request):
        topic = request.data.get('topic')
        try:
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "user", "content": f"Create 5 flashcards for: {topic}. Format: Question: [question] | Answer: [answer]."}
                ]
            )
            return Response({"flashcards": completion.choices[0].message.content})
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class AIChatView(APIView):
    def post(self, request):
        user_prompt = request.data.get('prompt')
        if not user_prompt:
            return Response({"status": "error", "message": "No prompt provided"}, status=400)
        try:
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are Study.AI, a helpful assistant for Srinu."},
                    {"role": "user", "content": user_prompt}
                ],
            )
            return Response({"status": "success", "answer": completion.choices[0].message.content})
        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=400)