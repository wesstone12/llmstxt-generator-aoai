import { NextResponse } from 'next/server';
import FirecrawlApp, { ScrapeResponse } from '@mendable/firecrawl-js';
import { config } from 'dotenv';
config();

export const maxDuration = 300; 

export async function POST(request: Request) {
  const { url, bringYourOwnFirecrawlApiKey } = await request.json();
  let firecrawlApiKey: string | undefined;
  let limit: number = 100;
  console.log("url", url);

  if (bringYourOwnFirecrawlApiKey) {
    firecrawlApiKey = bringYourOwnFirecrawlApiKey;
    console.log("Using provided Firecrawl API key. Limit set to 100");
    
  } else {
    firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    limit = 10;
    console.log("Using default limit of 10");
  }


  if (!firecrawlApiKey) {
    throw new Error('FIRECRAWL_API_KEY is not set');
  }

  const app = new FirecrawlApp({ apiKey: firecrawlApiKey });


  let urlObj;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    urlObj = new URL(url);
    
  } else if (url.startsWith('http:/') || url.startsWith('https:/')) {
    urlObj = new URL(url);
 
  } else {
    urlObj = new URL(`http://${url}`);
  
  }
  
  const stemUrl = `${urlObj.hostname}`;

 
  let llmstxt = `# ${urlObj.hostname} llms.txt\n\n`;
  let llmsFulltxt = `# ${urlObj.hostname} llms-full.txt\n\n`;

  // Map a website
  const mapResult = await app.mapUrl(stemUrl, {
    limit: limit,
  });

  if (!mapResult.success) {
    throw new Error(`Failed to map: ${mapResult.error}`);
  }

  let urls = mapResult.success ? mapResult.links : [];

  return NextResponse.json({ mapUrls: urls });
}
