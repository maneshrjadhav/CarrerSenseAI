"""
TF-IDF & Cosine Similarity Matcher
Computes vector representations and semantic similarity between resume and job description.
CareerSense AI - Final Year Engineering Project
"""

import re
import math
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from services.nlp_processor import preprocess_text

def normalize_whitespace(text: str) -> str:
    """Normalizes excessive spaces, tabs, and newlines into single spaces."""
    if not text or not isinstance(text, str):
        return ""
    return re.sub(r'\s+', ' ', text).strip()

def compute_similarity(resume_text: str, jd_text: str) -> dict:
    """
    Computes TF-IDF vector representations and evaluates Cosine Similarity.
    Uses scikit-learn TfidfVectorizer jointly fitted on [resume_text, jd_text]
    and computes cosine_similarity from sklearn.metrics.pairwise.

    Handles whitespace normalization, empty text, and zero-vector cases safely.
    Guarantees similarity percentage strictly between 0.0 and 100.0.

    Returns:
    {
        "cosine_similarity": float (0.0 to 1.0),
        "similarity_percentage": float (0.0 to 100.0),
        "vocabulary_size": int,
        "status": str
    }
    """
    norm_resume = normalize_whitespace(resume_text)
    norm_jd = normalize_whitespace(jd_text)

    # Handle empty or whitespace-only documents
    if not norm_resume or not norm_jd:
        return {
            "cosine_similarity": 0.0,
            "raw_cosine_similarity": 0.0,
            "similarity_percentage": 0.0,
            "vocabulary_size": 0,
            "status": "Insufficient text for vectorization"
        }

    # Preprocess both documents through NLP pipeline (cleaning, tokenization, stop-words, lemmatization)
    clean_resume = preprocess_text(norm_resume)
    clean_jd = preprocess_text(norm_jd)

    # Handle zero valid tokens after stop-word filtering and lemmatization
    if not clean_resume.strip() or not clean_jd.strip():
        return {
            "cosine_similarity": 0.0,
            "raw_cosine_similarity": 0.0,
            "similarity_percentage": 0.0,
            "vocabulary_size": 0,
            "status": "Zero valid tokens after NLP preprocessing"
        }

    try:
        # Fit vectorizer jointly on resume text and JD text
        vectorizer = TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            stop_words='english',
            norm='l2',
            max_df=1.0,
            min_df=1
        )
        tfidf_matrix = vectorizer.fit_transform([clean_resume, clean_jd])
        vocab_size = len(vectorizer.get_feature_names_out())

        # Zero-vector safety check
        if vocab_size == 0 or tfidf_matrix.shape[0] < 2:
            return {
                "cosine_similarity": 0.0,
                "raw_cosine_similarity": 0.0,
                "similarity_percentage": 0.0,
                "vocabulary_size": vocab_size,
                "status": "Zero valid vocabulary tokens in vector space"
            }

        # Calculate Cosine Similarity using sklearn.metrics.pairwise.cosine_similarity
        sim_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        raw_sim = float(sim_matrix[0, 0])

        # Handle NaN, negative, or out-of-range float cases
        if math.isnan(raw_sim) or math.isinf(raw_sim) or raw_sim < 0.0:
            cos_sim_clean = 0.0
        else:
            cos_sim_clean = min(1.0, max(0.0, raw_sim))

        similarity_pct = round(cos_sim_clean * 100.0, 1)
        similarity_pct = min(100.0, max(0.0, similarity_pct))

        return {
            "cosine_similarity": round(cos_sim_clean, 4),
            "raw_cosine_similarity": cos_sim_clean,
            "similarity_percentage": similarity_pct,
            "vocabulary_size": vocab_size,
            "status": "Calculated successfully"
        }

    except ValueError as ve:
        # Catch empty vocabulary from TfidfVectorizer safely
        return {
            "cosine_similarity": 0.0,
            "raw_cosine_similarity": 0.0,
            "similarity_percentage": 0.0,
            "vocabulary_size": 0,
            "status": f"Vectorization warning: {str(ve)}"
        }
    except Exception as e:
        return {
            "cosine_similarity": 0.0,
            "raw_cosine_similarity": 0.0,
            "similarity_percentage": 0.0,
            "vocabulary_size": 0,
            "status": f"Vectorization error: {str(e)}"
        }
