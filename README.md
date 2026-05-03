🚀 Roadmap AI – Smart Study Planner

Roadmap AI is an intelligent, full-stack educational ecosystem designed to help engineering students transform overwhelming syllabi into structured, actionable, and resource-rich study plans.

📖 Table of Contents
Overview

Key Features

Tech Stack

Architecture

How It Works

Future Scope

🌟 Overview
      Most students face significant stress during exam preparation due to a lack of structured planning and the time-consuming process of searching      for quality tutorials. 
      Roadmap AI solves this by using Generative AI to automate the creation of day-wise roadmaps and mapping them directly to relevant YouTube            educational resources.

✨ Key Features
              AI-Generated Roadmaps: Leverages the Llama 3.3 model (via Groq API) to generate customized schedules based on subject complexity and user deadlines.
            
              Integrated YouTube Resources: Automatically suggests the best YouTube lectures for every topic, eliminating manual research time.
            
              Real-time AI Chatbot: An integrated assistant for instant doubt resolution and technical guidance.
            
              Smart Date Validation: Ensures all study plans start strictly from the current date for realistic goal setting.
            
              Progress Tracking: Visual progress bars and a built-in Pomodoro Timer to keep students focused and motivated.

🛠 Tech Stack
        Frontend: React.js, Tailwind CSS, Vite
        
        Backend: Django REST Framework (DRF), Python
        
           AI Engine: Groq Cloud API (LPU Technology for ultra-fast inference)
        
        Database: PostgreSQL / Supabase
        
           LLM: Meta Llama 3.3

🏗 Architecture
            The application follows a decoupled full-stack architecture:
            
            Client: React-based dashboard sends user requirements via Axios.
            
            API Layer: Django REST Framework handles requests, prompt engineering, and security.
            
            AI Layer: Groq API processes the prompt and returns structured JSON data.
            
            Database: Stores user-generated roadmaps and tracking progress.

🚀 How It Works
              Input: User enters the Subject Name and Number of Days available.
        
              AI Processing: Django sends a structured prompt to Llama 3.3 via Groq.
              
               Parsing: The AI returns a JSON object containing topics and search keywords.
              
              Resource Mapping: The system maps these keywords to YouTube tutorial links.
              
              Execution: The student views a clean, day-wise table with "Watch Video" buttons and a dedicated chat assistant.

🔮 Future Scope
            PDF Parsing: Directly upload university syllabus PDFs to generate roadmaps.

            Peer Collaboration: Group study features and progress sharing.

            Multi-language Support: AI explanations in regional languages like Telugu for better understanding.

👨‍💻 Developed By
           Srinu Information Technology Undergraduate BVC College of Engineering
