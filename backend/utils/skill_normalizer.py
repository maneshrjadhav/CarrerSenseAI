"""
Skill Normalization Dictionary & Category Taxonomy
CareerSense AI - Final Year Engineering Project
"""

import re

# Comprehensive Master Taxonomy of Skills categorized into engineering disciplines
SKILL_TAXONOMY = {
    'Programming': [
        'Python', 'Java', 'C', 'C++', 'C#', 'JavaScript', 'TypeScript', 'Go', 'Rust',
        'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'Dart', 'Shell Scripting', 'Bash'
    ],
    'Frontend': [
        'React', 'Next.js', 'Vue.js', 'Nuxt.js', 'Angular', 'HTML', 'CSS', 'Sass',
        'Tailwind CSS', 'Bootstrap', 'Redux', 'Zustand', 'jQuery', 'Webpack', 'Vite',
        'Responsive Design', 'GraphQL Client'
    ],
    'Backend': [
        'Node.js', 'Express.js', 'Flask', 'Django', 'FastAPI', 'Spring Boot', 'ASP.NET',
        'Ruby on Rails', 'NestJS', 'REST API', 'GraphQL', 'Microservices', 'gRPC',
        'WebSockets', 'Serverless'
    ],
    'Database': [
        'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle Database', 'Cassandra',
        'Elasticsearch', 'DynamoDB', 'Firebase Firestore', 'MariaDB', 'SQL',
        'Relational Databases (SQL)', 'NoSQL Databases', 'Database Management Systems (DBMS)'
    ],
    'Cloud & DevOps': [
        'AWS', 'Microsoft Azure', 'Google Cloud (GCP)', 'Docker', 'Kubernetes', 'Terraform',
        'CI/CD', 'GitHub Actions', 'Jenkins', 'Ansible', 'Linux', 'Nginx', 'Cloudflare'
    ],
    'Tools & Architecture': [
        'Git', 'GitHub', 'GitLab', 'Postman', 'Jira', 'VS Code', 'Agile', 'Scrum',
        'System Design', 'Object-Oriented Programming (OOP)', 'Data Structures & Algorithms',
        'Design Patterns', 'Test-Driven Development (TDD)', 'Unit Testing',
        'Computer Science Fundamentals', 'Operating Systems', 'Computer Networks'
    ],
    'AI & Data Science': [
        'Machine Learning', 'Deep Learning', 'Natural Language Processing (NLP)',
        'Computer Vision', 'TensorFlow', 'PyTorch', 'Keras', 'scikit-learn', 'Pandas',
        'NumPy', 'Data Analysis', 'TF-IDF', 'Large Language Models (LLM)', 'OpenCV',
        'Sentiment Analysis'
    ],
    'Soft Skills': [
        'Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Critical Thinking',
        'Time Management', 'Adaptability', 'Collaboration', 'Analytical Thinking',
        'Presentation Skills', 'Quick Learner'
    ]
}

# Reverse lookup: skill_name -> category
SKILL_CATEGORY_MAP = {}
for category, skills in SKILL_TAXONOMY.items():
    for s in skills:
        SKILL_CATEGORY_MAP[s.lower()] = category

# Normalization dictionary: variations / acronyms -> canonical skill name
NORMALIZATION_MAP = {
    # Programming
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'ts': 'TypeScript',
    'typescript': 'TypeScript',
    'py': 'Python',
    'python': 'Python',
    'python3': 'Python',
    'c++': 'C++',
    'cpp': 'C++',
    'c#': 'C#',
    'csharp': 'C#',
    'golang': 'Go',
    'go': 'Go',
    'ruby': 'Ruby',
    'php': 'PHP',
    'java': 'Java',
    'kotlin': 'Kotlin',
    'swift': 'Swift',
    'rust': 'Rust',
    'scala': 'Scala',
    'bash': 'Bash',
    'shell': 'Shell Scripting',
    'shell script': 'Shell Scripting',
    'shell scripting': 'Shell Scripting',

    # Frontend
    'react': 'React',
    'react js': 'React',
    'react.js': 'React',
    'reactjs': 'React',
    'next': 'Next.js',
    'next js': 'Next.js',
    'next.js': 'Next.js',
    'nextjs': 'Next.js',
    'vue': 'Vue.js',
    'vue js': 'Vue.js',
    'vue.js': 'Vue.js',
    'vuejs': 'Vue.js',
    'angular': 'Angular',
    'angularjs': 'Angular',
    'html': 'HTML',
    'html5': 'HTML',
    'css': 'CSS',
    'css3': 'CSS',
    'tailwind': 'Tailwind CSS',
    'tailwind css': 'Tailwind CSS',
    'tailwindcss': 'Tailwind CSS',
    'bootstrap': 'Bootstrap',
    'bootstrap 5': 'Bootstrap',
    'redux': 'Redux',
    'redux toolkit': 'Redux',
    'zustand': 'Zustand',
    'vite': 'Vite',
    'webpack': 'Webpack',
    'jquery': 'jQuery',
    'responsive design': 'Responsive Design',
    'responsive web design': 'Responsive Design',
    'responsive web development': 'Responsive Design',

    # Backend
    'node': 'Node.js',
    'node js': 'Node.js',
    'node.js': 'Node.js',
    'nodejs': 'Node.js',
    'express': 'Express.js',
    'express js': 'Express.js',
    'express.js': 'Express.js',
    'expressjs': 'Express.js',
    'flask': 'Flask',
    'django': 'Django',
    'fastapi': 'FastAPI',
    'fast api': 'FastAPI',
    'spring': 'Spring Boot',
    'spring boot': 'Spring Boot',
    'springboot': 'Spring Boot',
    'asp.net': 'ASP.NET',
    'asp net': 'ASP.NET',
    '.net': 'ASP.NET',
    'dotnet': 'ASP.NET',
    'nest js': 'NestJS',
    'nestjs': 'NestJS',
    'rest': 'REST API',
    'rest api': 'REST API',
    'rest apis': 'REST API',
    'restful': 'REST API',
    'restful api': 'REST API',
    'restful apis': 'REST API',
    'graphql': 'GraphQL',
    'microservices': 'Microservices',
    'microservice': 'Microservices',

    # Database
    'sql': 'SQL',
    'mysql': 'MySQL',
    'my sql': 'MySQL',
    'postgres': 'PostgreSQL',
    'postgresql': 'PostgreSQL',
    'psql': 'PostgreSQL',
    'mongodb': 'MongoDB',
    'mongo db': 'MongoDB',
    'mongo': 'MongoDB',
    'redis': 'Redis',
    'sqlite': 'SQLite',
    'sqlite3': 'SQLite',
    'oracle': 'Oracle Database',
    'elasticsearch': 'Elasticsearch',
    'dynamodb': 'DynamoDB',
    'firestore': 'Firebase Firestore',
    'mariadb': 'MariaDB',
    'relational': 'Relational Databases (SQL)',
    'relational database': 'Relational Databases (SQL)',
    'relational databases': 'Relational Databases (SQL)',
    'rdbms': 'Relational Databases (SQL)',
    'nosql': 'NoSQL Databases',
    'nosql database': 'NoSQL Databases',
    'nosql databases': 'NoSQL Databases',
    'dbms': 'Database Management Systems (DBMS)',
    'database management system': 'Database Management Systems (DBMS)',
    'database management systems': 'Database Management Systems (DBMS)',

    # Cloud & DevOps
    'aws': 'AWS',
    'amazon web services': 'AWS',
    'azure': 'Microsoft Azure',
    'microsoft azure': 'Microsoft Azure',
    'gcp': 'Google Cloud (GCP)',
    'google cloud': 'Google Cloud (GCP)',
    'google cloud platform': 'Google Cloud (GCP)',
    'docker': 'Docker',
    'containerization': 'Docker',
    'k8s': 'Kubernetes',
    'kubernetes': 'Kubernetes',
    'terraform': 'Terraform',
    'ci/cd': 'CI/CD',
    'cicd': 'CI/CD',
    'github actions': 'GitHub Actions',
    'jenkins': 'Jenkins',
    'linux': 'Linux',
    'nginx': 'Nginx',

    # Tools
    'git': 'Git',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'postman': 'Postman',
    'jira': 'Jira',
    'vs code': 'VS Code',
    'vscode': 'VS Code',
    'agile': 'Agile',
    'scrum': 'Scrum',
    'system design': 'System Design',
    'oop': 'Object-Oriented Programming (OOP)',
    'object oriented programming': 'Object-Oriented Programming (OOP)',
    'object-oriented programming': 'Object-Oriented Programming (OOP)',
    'tdd': 'Test-Driven Development (TDD)',
    'unit testing': 'Unit Testing',
    'dsa': 'Data Structures & Algorithms',
    'data structures': 'Data Structures & Algorithms',
    'algorithms': 'Data Structures & Algorithms',
    'data structures & algorithms': 'Data Structures & Algorithms',
    'data structures and algorithms': 'Data Structures & Algorithms',
    'computer science fundamentals': 'Computer Science Fundamentals',
    'cs fundamentals': 'Computer Science Fundamentals',
    'operating systems': 'Operating Systems',
    'operating system': 'Operating Systems',
    'computer networks': 'Computer Networks',
    'computer network': 'Computer Networks',
    'networking': 'Computer Networks',

    # AI / ML
    'machine learning': 'Machine Learning',
    'ml': 'Machine Learning',
    'deep learning': 'Deep Learning',
    'dl': 'Deep Learning',
    'nlp': 'Natural Language Processing (NLP)',
    'natural language processing': 'Natural Language Processing (NLP)',
    'tensorflow': 'TensorFlow',
    'tf': 'TensorFlow',
    'pytorch': 'PyTorch',
    'keras': 'Keras',
    'scikit learn': 'scikit-learn',
    'scikit-learn': 'scikit-learn',
    'sklearn': 'scikit-learn',
    'pandas': 'Pandas',
    'numpy': 'NumPy',
    'data analysis': 'Data Analysis',
    'tfidf': 'TF-IDF',
    'tf-idf': 'TF-IDF',
    'llm': 'Large Language Models (LLM)',
    'llms': 'Large Language Models (LLM)',
    'opencv': 'OpenCV',
    'sentiment analysis': 'Sentiment Analysis',

    # Soft Skills
    'communication': 'Communication',
    'effective communication': 'Communication',
    'leadership': 'Leadership',
    'problem solving': 'Problem Solving',
    'problem-solving': 'Problem Solving',
    'teamwork': 'Teamwork',
    'collaboration': 'Collaboration',
    'team collaboration': 'Collaboration',
    'critical thinking': 'Critical Thinking',
    'time management': 'Time Management',
    'adaptability': 'Adaptability',
    'analytical thinking': 'Analytical Thinking',
    'presentation': 'Presentation Skills',
    'presentation skills': 'Presentation Skills',
    'quick learner': 'Quick Learner',
    'fast learner': 'Quick Learner'
}

def normalize_skill(term: str) -> str:
    """Normalize a raw skill string to standard taxonomy canonical form."""
    cleaned = term.strip().lower()
    # Remove surrounding punctuation
    cleaned = re.sub(r'^[^\w+#.]+|[^\w+#.]+$', '', cleaned)
    if cleaned in NORMALIZATION_MAP:
        return NORMALIZATION_MAP[cleaned]
    # Check taxonomy exact matches (case-insensitive)
    for cat, skills in SKILL_TAXONOMY.items():
        for s in skills:
            if s.lower() == cleaned:
                return s
    # Default capitalized title
    return term.strip()

def get_skill_category(skill_name: str) -> str:
    """Return the category for a given normalized skill name."""
    canonical = normalize_skill(skill_name)
    lowered = canonical.lower()
    if lowered in SKILL_CATEGORY_MAP:
        return SKILL_CATEGORY_MAP[lowered]
    # Fallback heuristic
    return 'Tools & Architecture'

