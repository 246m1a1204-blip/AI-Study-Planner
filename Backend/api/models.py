from django.db import models

class Subject(models.Model):
    user_id = models.IntegerField(default=1) # Migration issue fix
    name = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=50)
    total_units = models.IntegerField(default=5)
    exam_date = models.DateField()

class StudyTask(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='tasks')
    date = models.DateField()
    task_description = models.TextField()
    is_completed = models.BooleanField(default=False) # Status tracking kosam