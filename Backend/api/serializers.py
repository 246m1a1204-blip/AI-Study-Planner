from rest_framework import serializers
from .models import Subject, StudyTask

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyTask
        fields = '__all__'

class SubjectSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Subject
        fields = '__all__'