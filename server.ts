import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  const extractGapWithGemini = async (abstract: string) => {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract the limitations, future work, and research gaps from this text in 1-2 short sentences. If there are none explicitly mentioned, infer potential gaps or state "No explicit gaps mentioned.":\n\n${abstract}`,
      });
      return response.text || "No explicit gaps mentioned.";
    } catch (error: any) {
      console.error('Gemini API Error:', error.message || error);
      return null;
    }
  };

  const summarizePaperWithGemini = async (abstract: string) => {
    if (!process.env.GEMINI_API_KEY) {
      return "AI summarization unavailable: Missing API Key.";
    }
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide a concise, easy-to-understand summary of this research paper abstract in 2-3 sentences:\n\n${abstract}`,
      });
      return response.text || "Summary unavailable.";
    } catch (error: any) {
      console.error('Gemini API Error:', error.message || error);
      return "Could not generate summary at this time.";
    }
  };

  // API Route: Search Gaps
  app.post('/api/search-gaps', async (req, res) => {
    try {
      const { searchQuery } = req.body;
      if (!searchQuery) {
        return res.status(400).json({ error: 'searchQuery is required' });
      }

      // Step A: Fetch top 5 papers from Semantic Scholar API
      const scholarUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
        searchQuery
      )}&limit=5&fields=title,abstract,year,authors,citationCount,openAccessPdf`;
      
      const scholarResponse = await fetch(scholarUrl);
      if (!scholarResponse.ok) {
        let errorText = await scholarResponse.text().catch(() => '');
        try {
          const errJson = JSON.parse(errorText);
          if (errJson.message) errorText = errJson.message;
          else if (errJson.error) errorText = errJson.error;
        } catch (e) {}
        
        if (scholarResponse.status === 429) {
          throw new Error("Semantic Scholar API rate limit exceeded. Please try again in a few minutes.");
        }
        
        throw new Error(`Semantic Scholar API error (${scholarResponse.status}): ${errorText || scholarResponse.statusText}`);
      }
      
      const scholarText = await scholarResponse.text();
      let scholarData;
      try {
        scholarData = JSON.parse(scholarText);
      } catch (e) {
        throw new Error("Invalid JSON from Semantic Scholar API");
      }
      const papers = scholarData.data || [];

      // Step B & C: Map through papers and extract gaps
      const results = await Promise.all(
        papers.map(async (paper: any) => {
          let researchGap = null;
          
          if (paper.abstract) {
            researchGap = await extractGapWithGemini(paper.abstract);
          }

          return {
            ...paper,
            researchGap,
          };
        })
      );

      res.json(results);
    } catch (error: any) {
      console.error('Error in /api/search-gaps:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // API Route: Expand Paper (Get Citations)
  app.post('/api/expand-paper', async (req, res) => {
    try {
      const { paperId } = req.body;
      if (!paperId) {
        return res.status(400).json({ error: 'paperId is required' });
      }

      const scholarUrl = `https://api.semanticscholar.org/graph/v1/paper/${paperId}/citations?fields=title,abstract,year,authors,citationCount,openAccessPdf&limit=3`;
      
      const scholarResponse = await fetch(scholarUrl);
      if (!scholarResponse.ok) {
        let errorText = await scholarResponse.text().catch(() => '');
        try {
          const errJson = JSON.parse(errorText);
          if (errJson.message) errorText = errJson.message;
          else if (errJson.error) errorText = errJson.error;
        } catch (e) {}
        
        if (scholarResponse.status === 429) {
          throw new Error("Semantic Scholar API rate limit exceeded. Please try again in a few minutes.");
        }
        
        throw new Error(`Semantic Scholar API error (${scholarResponse.status}): ${errorText || scholarResponse.statusText}`);
      }
      
      const scholarText = await scholarResponse.text();
      let scholarData;
      try {
        scholarData = JSON.parse(scholarText);
      } catch (e) {
        throw new Error("Invalid JSON from Semantic Scholar API");
      }
      const citations = (scholarData.data || []).map((item: any) => item.citingPaper).filter((p: any) => p && p.paperId);

      const results = await Promise.all(
        citations.map(async (paper: any) => {
          let researchGap = null;
          if (paper.abstract) {
            researchGap = await extractGapWithGemini(paper.abstract);
          }
          return {
            ...paper,
            researchGap,
          };
        })
      );

      res.json(results);
    } catch (error: any) {
      console.error('Error in /api/expand-paper:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // API Route: Summarize Paper
  app.post('/api/summarize-paper', async (req, res) => {
    try {
      const { abstract } = req.body;
      if (!abstract) {
        return res.status(400).json({ error: 'abstract is required' });
      }
      
      const summary = await summarizePaperWithGemini(abstract);
      res.json({ summary });
    } catch (error: any) {
      console.error('Error in /api/summarize-paper:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
