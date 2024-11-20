import { NextResponse } from 'next/server';
import FirecrawlApp, { ScrapeResponse } from '@mendable/firecrawl-js';
import 'dotenv/config'





export async function POST(request: Request) {
  const { urls, bringYourOwnFirecrawlApiKey } = await request.json();
  let firecrawlApiKey: string | undefined;
  let limit: number = 5000;

  if (bringYourOwnFirecrawlApiKey) {
    firecrawlApiKey = bringYourOwnFirecrawlApiKey;
    console.log("Using provided Firecrawl API key. Limit set to 5000");
    
  } else {
    firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    limit = 10;
    console.log("Using default limit of 10");
  }


  if (!firecrawlApiKey) {
    throw new Error('FIRECRAWL_API_KEY is not set');
  }

  const app = new FirecrawlApp({ apiKey: firecrawlApiKey });


  let urlsToScrape = urls;

  //make sure url length is less than or equal to limit
  if (urlsToScrape && urlsToScrape.length > limit) {
    urlsToScrape = urlsToScrape.slice(0, limit);
  }
  const sampleUrl = urlsToScrape[0];
  let urlObj;
  if (!sampleUrl.startsWith('http://') && !sampleUrl.startsWith('https://')) {
    urlObj = new URL(`http://${sampleUrl}`);
  } else {
    urlObj = new URL(sampleUrl);
  }
  const stemUrl = `${urlObj.hostname}`;

  let llmstxt = `# ${stemUrl} llms.txt\n\n`;
  let llmsFulltxt = `# ${stemUrl} llms-full.txt\n\n`;

  // Batch scrape the website

  // Define schema to extract contents into
const schema = {
  type: "object",
  properties: {
    description: { type: "string" },
    description_header: { type: "string" }
  },
  required: ["description", "description_header"]
};


  if (!urls) {
    throw new Error('URLs are not defined');
  }

  // Scrape multiple websites (synchronous):
  const batchScrapeResult = await app.batchScrapeUrls(urls, {
    formats: ['extract', 'markdown'],
    onlyMainContent: true,
    extract: {
      prompt: "Generate a 8-10 word description of the entire page based on what the content one will generally find on the page. Be consise yet inclusive of ALL content on the page like this example - Description: Retrieve a list of domains for the authenticated user. Based on the description generate a header that is based on ALL of the content on the page, description, and url. Short and concise like this example - Description Header: Retrieve Domain Endpoint",
      schema: schema
    }
  });

  if (!batchScrapeResult.success) {
    throw new Error(`Failed to scrape: ${batchScrapeResult.error}`);
  }
  // create llms.txt
  batchScrapeResult.data.forEach((result) => {
    const { extract, metadata } = result as unknown as { extract?: { description: string, description_header: string }, metadata: { url: string, title: string } };
    if (extract) {
      llmstxt += `- [${extract.description_header}](${metadata.url}): ${extract.description}\n`;
    }
    llmsFulltxt += result.markdown;
  });

  return NextResponse.json({ llmstxt: llmstxt, llmsFulltxt: llmsFulltxt });
}
