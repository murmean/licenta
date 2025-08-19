import os
import traceback
import csv

import gensim
import pandas as pd
import spacy
import yake
from flask import Flask, request, jsonify, render_template
from gensim import corpora
from sklearn.feature_extraction.text import TfidfVectorizer
from textblob import TextBlob
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.text_rank import TextRankSummarizer

# Load spaCy model
nlp = spacy.load("en_core_web_sm")
nlp.max_length = 2_000_000
# Timing decorator
import time


def timed(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        elapsed = (end - start) * 1000  # convert to ms
        print(f"[⏱️] {func.__name__} took {elapsed:.2f} ms")
        return result

    return wrapper


app = Flask(__name__, template_folder="templates", static_folder="static")
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


class TextMiner:
    def __init__(self):
        self.documents = []
        self.processed_docs = []
        self.model_trained = False
        self.model = None

    def load_data(self, text):
        self.documents = [text] if isinstance(text, str) else text
        return {"message": f"Loaded {len(self.documents)} documents."}

    def preprocess(self, lowercase, remove_punct, remove_stopwords, lemmatize):
        if not self.documents:
            return {"error": "No documents available. Load data first!"}
        self.processed_docs = []
        for doc in self.documents:
            tokens = [token for token in nlp(doc)]
            tokens = [token.text.lower() if lowercase else token.text for token in tokens]
            if remove_punct:
                tokens = [token for token in tokens if token.isalnum()]
            if remove_stopwords:
                tokens = [token for token in tokens if not nlp.vocab[token].is_stop]
            if lemmatize:
                tokens = [nlp(token)[0].lemma_ for token in tokens]
            self.processed_docs.append(tokens)
        return {"message": "Text preprocessing completed."}

    def train_model(self):
        if not self.processed_docs:
            return {"error": "No data available for training."}
        dictionary = corpora.Dictionary(self.processed_docs)
        corpus = [dictionary.doc2bow(doc) for doc in self.processed_docs]
        self.model = gensim.models.LdaModel(corpus, num_topics=5, id2word=dictionary, passes=10)
        self.model_trained = True
        return {"message": "Model training completed."}

    def sentiment_analysis(self):
        sentiments = [TextBlob(" ".join(doc)).sentiment.polarity for doc in self.processed_docs]
        return {"sentiments": sentiments}

    def extract_keywords_tfidf(self, top_n=10):
        vectorizer = TfidfVectorizer(stop_words="english", max_features=1000)
        tfidf_matrix = vectorizer.fit_transform([" ".join(doc) for doc in self.processed_docs])
        feature_names = vectorizer.get_feature_names_out()
        keywords = []
        for doc_vector in tfidf_matrix:
            scores = zip(feature_names, doc_vector.toarray().flatten())
            sorted_scores = sorted(scores, key=lambda x: x[1], reverse=True)
            keywords.append([word for word, score in sorted_scores[:top_n]])
        return {"keywords": keywords}

    def extract_keywords_yake(self, text, top_n=10):
        kw_extractor = yake.KeywordExtractor(n=1, dedupLim=0.9, top=top_n)
        keywords = kw_extractor.extract_keywords(text)
        return {"keywords": [word for word, score in keywords]}

    def topic_modeling(self, num_topics=5, num_words=5):
        if not self.model_trained:
            return {"error": "Train the model first!"}
        raw_topics = self.model.print_topics(num_topics=num_topics, num_words=num_words)
        lda_topics = []
        stopwords = set(nlp.Defaults.stop_words)
        for topic in raw_topics:
            topic_words = topic[1]
            words = [word.split('*')[1].replace('"', '').strip() for word in topic_words.split('+')]
            filtered_words = [word for word in words if word not in stopwords and len(word) > 2 and word.isalpha()]
            if filtered_words:
                lda_topics.append(", ".join(filtered_words))
        return {"topics": lda_topics}

    def summarize_text(self, text, num_sentences=3):
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        summarizer = TextRankSummarizer()
        summary = summarizer(parser.document, num_sentences)
        return {"summary": " ".join(str(sentence) for sentence in summary)}


def get_sentiment_label(score):
    if score <= -0.5:
        return "😡 Very Negative"
    elif score < 0:
        return "🙁 Negative"
    elif score == 0:
        return "😐 Neutral"
    elif score < 0.5:
        return "🙂 Positive"
    else:
        return "😃 Very Positive"


def save_to_csv(filename, data, headers):
    with open(filename, mode="w", newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(data)

# Wrap methods with timing
TextMiner.load_data = timed(TextMiner.load_data)
TextMiner.preprocess = timed(TextMiner.preprocess)
TextMiner.train_model = timed(TextMiner.train_model)
TextMiner.sentiment_analysis = timed(TextMiner.sentiment_analysis)
TextMiner.extract_keywords_tfidf = timed(TextMiner.extract_keywords_tfidf)
TextMiner.extract_keywords_yake = timed(TextMiner.extract_keywords_yake)
TextMiner.topic_modeling = timed(TextMiner.topic_modeling)
TextMiner.summarize_text = timed(TextMiner.summarize_text)

miner = TextMiner()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        text = request.form.get("text", "").strip()
        file = request.files.get("file")

        if file:
            filename = file.filename
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(filepath)
            if filename.endswith(".txt"):
                with open(filepath, "r", encoding="utf-8") as f:
                    text = f.read()
            elif filename.endswith(".csv"):
                df = pd.read_csv(filepath)
                if 'text' in df.columns:
                    text = " ".join(df['text'].dropna().tolist())
                else:
                    return jsonify({"error": "CSV must contain a 'text' column"})

        if not text:
            return jsonify({"error": "No text provided"})

        lowercase = request.form.get("lowercase", "false") == "true"
        remove_punct = request.form.get("remove_punct", "false") == "true"
        remove_stopwords = request.form.get("remove_stopwords", "false") == "true"
        lemmatize = request.form.get("lemmatize", "false") == "true"

        miner.load_data(text)
        miner.preprocess(lowercase, remove_punct, remove_stopwords, lemmatize)
        miner.train_model()

        sentiment = miner.sentiment_analysis()
        sentiment_scores = sentiment.get("sentiments", [])
        sentiment_score = sentiment_scores[0] if sentiment_scores else 0.0
        sentiment_label = get_sentiment_label(sentiment_score)

        topics = miner.topic_modeling()

        if isinstance(text, str) and len(text.split()) < 100:
            keywords = miner.extract_keywords_yake(text, top_n=5)
        else:
            keywords = miner.extract_keywords_tfidf(top_n=5)

        # Console logging for evaluation
        print("\n--- Evaluation Output ---")
        print("Sentiment Scores:", sentiment_scores)
        print("Sentiment Label:", sentiment_label)
        print("Topics Found:")
        for topic in topics.get("topics", []):
            print("-", topic)
        print("Keywords Extracted:", keywords.get("keywords", []))
        print("-------------------------\n")

        # Optional CSV export
        # Optional CSV export
        os.makedirs("output", exist_ok=True)
        save_to_csv("output/sentiment_scores.csv", [[i + 1, s] for i, s in enumerate(sentiment_scores)],
                    ["Index", "Score"])

        return jsonify({
            "sentiment": sentiment_label,
            "sentiment_score": sentiment_score,
            "topics": topics.get("topics", []),
            "processed_text": " ".join(miner.processed_docs[0]),
            "keywords": keywords.get("keywords", [])
        })

    except Exception as e:
        print("ERROR:", traceback.format_exc())
        return jsonify({"error": "An error occurred while processing the text."})


@app.route("/summarize", methods=["POST"])
def summarize():
    text = request.form.get("text", "").strip()
    if not text:
        return jsonify({"error": "No text provided for summarization."})
    summary = miner.summarize_text(text, num_sentences=3)

    # Log for evaluation
    print("\n--- Summarization ---")
    print("Input Text:", text[:300] + "..." if len(text) > 300 else text)
    print("Generated Summary:", summary.get("summary", ""))
    print("----------------------\n")

    return jsonify({
        "summary": summary.get("summary", "")
    })


if __name__ == "__main__":
    os.makedirs("output", exist_ok=True)
    app.run(debug=True)
