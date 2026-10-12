"""
TF-IDF & Cosine Similarity Matcher
Computes vector representations and semantic similarity between resume and job description.
CareerSense AI - Final Year Engineering Project
"""

import math
from sklearn.feature_extraction.text import TfidfVectorizer
from services.nlp_processor import preprocess_text

def compute_similarity(resume_text: str, jd_text: str) -> dict:
    """
    Computes TF-IDF vector representations and evaluates Cosine Similarity.
    Uses scikit-learn TfidfVectorizer with L2 normalized vector dot product.
    
    Returns:
    {
        "cosine_similarity": float (0.0 to 1.0),
        "similarity_percentage": float (0.0 to 100.0),
        "vocabulary_size": int,
        "status": str
    }
    """
    if not resume_text or not jd_text:
        return {
            "cosine_similarity": 0.0,
            "similarity_percentage": 0.0,
            "vocabulary_size": 0,
            "status": "Insufficient text for vectorization"
        }

    # Preprocess both documents through NLP pipeline (cleaning, tokenization, stop-words, lemmatization)
    clean_resume = preprocess_text(resume_text)
    clean_jd = preprocess_text(jd_text)

    if not clean_resume.strip() or not clean_jd.strip():
        return {
            "cosine_similarity": 0.0,
            "similarity_percentage": 0.0,
            "vocabulary_size": 0,
            "status": "Zero valid tokens after NLP preprocessing"
        }

    try:
        # Build TF-IDF Vectorizer with unigrams and bigrams, L2 normalized
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words='english',
            norm='l2',
            max_df=1.0,
            min_df=1
        )
        tfidf_matrix = vectorizer.fit_transform([clean_resume, clean_jd])
        
        # Calculate Cosine Similarity between vector 0 (Resume) and vector 1 (JD)
        # For L2-normalized sparse vectors: cos(theta) = u . v
        sparse_dot = (tfidf_matrix[0] @ tfidf_matrix[1].T)
        if hasattr(sparse_dot, 'toarray'):
            cos_sim = float(sparse_dot.toarray()[0][0])
        else:
            cos_sim = float(sparse_dot[0, 0])
        
        # Ensure float in range [0.0, 1.0]
        cos_sim_clean = max(0.0, min(1.0, cos_sim))

        return {
            "cosine_similarity": round(cos_sim_clean, 4),
            "similarity_percentage": round(cos_sim_clean * 100, 1),
            "vocabulary_size": len(vectorizer.get_feature_names_out()),
            "status": "Calculated successfully"
        }

    except Exception as e:
        return {
            "cosine_similarity": 0.0,
            "similarity_percentage": 0.0,
            "vocabulary_size": 0,
            "status": f"Vectorization error: {str(e)}"
        }
