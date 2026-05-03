from django.urls import path
from . import views

urlpatterns = [
    # 1. Dashboard & Subjects
    path('subjects/', views.get_subjects, name='get_subjects'),
    path('subjects/<int:sub_id>/delete/', views.delete_subject, name='delete_subject'),
    path('subjects/<int:sub_id>/tasks/', views.get_subject_tasks, name='get_subject_tasks'),
    
    # 2. Plan Generation
    path('generate/', views.GeneratePlanView.as_view(), name='generate_plan'),
    
    # 3. AI Features (Groq Logic)
    path('explain/', views.ExplainTopicView.as_view(), name='explain_topic'),
    
    # --- IKKADA FIX CHESA ---
    path('quiz/', views.generate_quiz, name='generate_quiz'), 
    
    # 4. Task Management
    path('task/<int:task_id>/update/', views.UpdateTaskStatusView.as_view(), name='update_task'),

    path('flashcards/', views.FlashcardView.as_view(), name='flashcards'),

    path('ask-ai/', views.AIChatView.as_view(), name='ask-ai'),
]