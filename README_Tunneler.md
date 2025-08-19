
# Tunneler – Open Source Text Mining Application

## Overview

**Tunneler** is a free and open-source web application for unstructured text analysis. It provides an intuitive interface for performing Natural Language Processing (NLP) tasks without requiring technical knowledge.

This platform enables users to upload text or files, preprocess data, extract keywords, analyze sentiment, identify topics, and summarize large texts—all in one web interface.

## Features

- **Preprocessing Options**
  - Lowercasing
  - Punctuation Removal
  - Stopword Removal
  - Lemmatization
  
- **Text Analysis**
  - **Sentiment Analysis** using TextBlob  
  - **Topic Modeling** with LDA (via Gensim) and Named Entity Recognition (spaCy)  
  - **Keyword Extraction** with TF-IDF and YAKE (adaptive selection based on text length)  
  - **Summarization** using TextRank (Sumy)  

- **User Interface**
  - Upload `.txt` or `.csv` files
  - Inline text editing
  - Real-time results with clear visual feedback
  - Downloadable processed text

## Technologies Used

| Component | Technology |
|-----------|------------|
| Backend   | Python, Flask |
| NLP       | spaCy, Gensim, TextBlob, YAKE, Sumy |
| Frontend  | HTML, CSS (Bootstrap), JavaScript |
| Deployment | Localhost (default), can be deployed to cloud services |

## Installation

### Prerequisites

- Python 3.8+
- pip
- Virtualenv (recommended)

### Setup

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/tunneler.git
cd tunneler
```

2. **Create and activate virtual environment:**

```bash
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**

```bash
pip install -r requirements.txt
```

4. **Download spaCy model:**

```bash
python -m spacy download en_core_web_sm
```

## Running the Application

```bash
python app.py
```

By default, the application will run on:

```
http://127.0.0.1:5000/
```

Open this link in your browser to access the interface.

## Usage

1. Enter text manually or upload a `.txt` or `.csv` file.
2. Select preprocessing options.
3. Click **Analyze** to:
   - Get sentiment polarity
   - Extract topics and keywords
4. Use **Summarize** to get a concise summary of the text.
5. Download the processed text if needed.

## File Structure

| File | Purpose |
|------|---------|
| `app.py` | Flask backend with NLP logic |
| `templates/index.html` | Main web interface |
| `static/script.js` | Frontend JavaScript logic |
| `static/styles.css` | Frontend styling |
| `uploads/` | Temporary storage for uploaded files |

## Limitations

- Only English language is supported.
- For short texts, YAKE is used for keyword extraction; for longer texts, TF-IDF is preferred.
- Summarization is extractive (no abstractive models implemented).
- No authentication or data persistence—this is an open demo application.

## Future Work

- Add support for additional languages.
- Integrate transformer-based models (BERT, GPT-based summarization).
- Deploy via Docker for easier portability.
- Add user management and cloud storage integration.

## License

This project is open-source and free to use under the MIT License.

## Author

Developed by [Your Name or Team Name].
