"""
NLP Processing Service
Tokenization, lowercase normalization, stop-word removal, and lemmatization.
CareerSense AI - Final Year Engineering Project
"""

import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize, sent_tokenize

# Fallback basic stopwords set in case NLTK corpus cannot be accessed
DEFAULT_STOPWORDS = {
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've",
    'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself', 'it', "it's",
    'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this',
    'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
    'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
    'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against',
    'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from',
    'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
    'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', "should've", 'now'
}

try:
    STOP_WORDS = set(stopwords.words('english'))
except Exception:
    STOP_WORDS = DEFAULT_STOPWORDS

try:
    LEMMATIZER = WordNetLemmatizer()
except Exception:
    LEMMATIZER = None

def normalize_text_artifacts(text: str) -> str:
    """
    Normalizes common formatting artifacts in resume and JD text:
    - Adds missing spaces around ampersands (e.g. 'Structures&Algorithms' -> 'Structures & Algorithms')
    - Replaces unicode bullets with standard bullet markers on new lines
    - Normalizes unicode dashes, apostrophes, and ligatures
    """
    if not text:
        return ""

    # Fix glued words with ampersands
    text = re.sub(r'([A-Za-z0-9])&([A-Za-z0-9])', r'\1 & \2', text)
    # Fix glued words with slashes (except in common technical terms like CI/CD)
    text = re.sub(r'(?<!CI)/(?!CD)([A-Za-z])', r' / \1', text)

    # Normalize unicode quotation marks and apostrophes
    text = text.replace('“', '"').replace('”', '"').replace('’', "'").replace('‘', "'")
    # Normalize unicode dashes / hyphens
    text = text.replace('–', '-').replace('—', '-').replace('−', '-')

    # Normalize bullets to newline + standard dash
    bullet_chars = r'[\u2022\u2023\u25E6\u2043\u2219\uf0b7\u25cf\u25cb\u25aa\u25ab]'
    text = re.sub(bullet_chars, '\n- ', text)

    # Normalize carriage returns
    text = text.replace('\r\n', '\n').replace('\r', '\n')

    # Remove non-printable control characters except standard whitespace
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)

    return text

def clean_text(text: str) -> str:
    """
    Cleans raw text for NLP representation by stripping URLs, emails, phone numbers,
    and normalizing whitespaces, while carefully preserving skill characters like C++, C#, .NET, Node.js.
    """
    if not text:
        return ""

    text = normalize_text_artifacts(text)

    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)
    # Remove email addresses
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b', ' ', text)
    # Remove standalone phone numbers
    text = re.sub(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', ' ', text)
    # Normalize excessive newlines and whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_sentences(text: str) -> list:
    """
    Extracts structured, distinct sentence and bullet statements from text.
    Preserves line breaks and bullet items so skill evidence snippets remain clean and concise.
    """
    if not text:
        return []

    normalized = normalize_text_artifacts(text)
    raw_lines = [line.strip() for line in normalized.split('\n') if line.strip()]

    extracted = []
    for line in raw_lines:
        # Strip leading bullet dashes or numbers e.g. "- ", "● ", "1. "
        clean_line = re.sub(r'^(?:[-*•●▪▫◦\uf0b7]\s*|\d+[.)]\s*)', '', line).strip()
        if not clean_line or len(clean_line) < 3:
            continue

        # If line contains multiple complete sentences with punctuation, split them
        if any(p in clean_line for p in ['. ', '? ', '! ']):
            try:
                sub_sentences = sent_tokenize(clean_line)
                for s in sub_sentences:
                    s_clean = s.strip()
                    if len(s_clean) >= 3:
                        extracted.append(s_clean)
            except Exception:
                parts = [p.strip() for p in re.split(r'(?<=[.!?])\s+', clean_line) if p.strip()]
                extracted.extend(parts)
        else:
            extracted.append(clean_line)

    return extracted

def tokenize_and_lemmatize(text: str) -> list:
    """
    Extracts tokens, applies lowercasing, removes stopwords,
    and applies morphological lemmatization.
    """
    if not text:
        return []

    # Preserve special technical terms before tokenizer splits them
    # e.g., C++, C#, .NET, Node.js
    tokens = []
    try:
        raw_tokens = word_tokenize(text.lower())
    except Exception:
        raw_tokens = re.findall(r'\b\w+(?:[+#.]\w+)*\b', text.lower())

    for tok in raw_tokens:
        # Strip punctuation edges
        tok_clean = tok.strip(string.punctuation)
        if not tok_clean or len(tok_clean) < 2:
            continue
        if tok_clean in STOP_WORDS:
            continue
        # Apply lemmatization
        if LEMMATIZER:
            try:
                lemma = LEMMATIZER.lemmatize(tok_clean)
            except Exception:
                lemma = tok_clean
        else:
            lemma = tok_clean
        tokens.append(lemma)

    return tokens

def preprocess_text(text: str) -> str:
    """
    Full NLP preprocessing pipeline: cleans, tokenizes, filters stopwords,
    lemmatizes, and joins back into normalized text representation for TF-IDF.
    """
    cleaned = clean_text(text)
    tokens = tokenize_and_lemmatize(cleaned)
    return " ".join(tokens)

