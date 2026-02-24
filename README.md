# GapGraph API Engine ⚙️

GapGraph API is a robust, RESTful backend service designed to aggregate academic research data and extract methodology gaps using Natural Language Processing. It serves as the core data layer for the GapGraph ecosystem, bridging scholarly databases with AI-driven text analysis. View your app in AI Studio: [link](https://ais-dev-c2xlan5fs5dxszx4oh4zqu-61769961147.asia-east1.run.app/)

## 🏗 System Architecture
* **External Integration:** Communicates with the Semantic Scholar Graph API for metadata retrieval.
* **AI Processing Layer:** Routes abstracts to Hugging Face Inference APIs (BART models) for zero-shot text extraction.
* **Caching & Traffic Control:** Utilizes a distributed rate-limiting engine to prevent upstream API exhaustion and caches frequent queries to reduce latency.

## 🛠 Tech Stack
* **Core:** RESTful API design patterns
* **Data Processing:** JSON parsing, Asynchronous HTTP clients
* **Infrastructure:** Docker, Docker Compose

## 🚀 Quick Start

### Prerequisites
* Free API key from Hugging Face.
* Docker and Docker Compose installed.

### Environment Setup
Create a `.env` file in the root directory:
```env
PORT=5000
HF_API_KEY=your_hugging_face_token_here
RATE_LIMIT_WINDOW_MS=60000
MAX_REQUESTS_PER_WINDOW=100
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the app:
   `npm run dev`
