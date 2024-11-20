import { NextResponse } from 'next/server';
import FirecrawlApp, { ScrapeResponse } from '@mendable/firecrawl-js';
import 'dotenv/config'

const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

if (!firecrawlApiKey) {
  throw new Error('FIRECRAWL_API_KEY is not set');
}

const app = new FirecrawlApp({ apiKey: firecrawlApiKey });

export async function POST(request: Request) {
  const { text } = await request.json();

  // Map a website
  const mapResult = await app.mapUrl(text, {
    limit: 5000,
  });

  if (!mapResult.success) {
    throw new Error(`Failed to map: ${mapResult.error}`);
  }

  const urls = mapResult.success ? mapResult.links : [];

  console.log(urls);

  // Batch scrape the website

  // Define schema to extract contents into
const schema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" }
  },
  required: ["title", "description"]
};


  if (!urls) {
    throw new Error('URLs are not defined');
  }

  // Scrape multiple websites (synchronous):
  const batchScrapeResult = await app.batchScrapeUrls(urls, {
    formats: ['extract'],
    extract: {
      prompt: "Extract the title and description from the page.",
      schema: schema
    }
  });

  console.log(batchScrapeResult);


  return NextResponse.json({ message: mapResult });
}