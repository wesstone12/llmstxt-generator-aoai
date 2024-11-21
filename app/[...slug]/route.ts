import { NextRequest, NextResponse } from 'next/server';
export const maxDuration = 300; 

export async function GET(
  request: NextRequest,
  context: { params: { slug: string[] } }
) {
  try {
    // Await the params to ensure they are ready for use
    const params = await context.params;

    // Reconstruct the target URL from the slug
    const targetUrl = decodeURIComponent(params.slug.join('/'));

    // Get the optional Firecrawl token from query parameters or headers
    const { searchParams } = new URL(request.url);
    const firecrawlApiKey =
      searchParams.get('FIRECRAWL_API_KEY') ||
      request.headers.get('FIRECRAWL_API_KEY');




    // Prepare the request body for /map/route
    const mapRequestBody = {
      url: targetUrl,
      bringYourOwnFirecrawlApiKey: firecrawlApiKey,
    };

    // Send POST request to /map/route
    const mapResponse = await fetch(
      `${request.nextUrl.origin}/api/map`,
      {
        method: 'POST',
        body: JSON.stringify(mapRequestBody),
      }
    );

    if (!mapResponse.ok) {
      const errorText = await mapResponse.text();
      return NextResponse.json(
        { error: `Error from /api/map: ${errorText}` },
        { status: mapResponse.status }
      );
    }

    const mapData = await mapResponse.json();

    // Prepare the request body for /service/route
    const serviceRequestBody = {
      urls: mapData.mapUrls,
      bringYourOwnFirecrawlApiKey: firecrawlApiKey,
    };

    // Send POST request to /service/route
    const serviceResponse = await fetch(
      `${request.nextUrl.origin}/api/service`,
      {
        method: 'POST',
        body: JSON.stringify(serviceRequestBody),
      }
    );

    if (!serviceResponse.ok) {
      const errorText = await serviceResponse.text();
      return NextResponse.json(
        { error: `Error from /api/service: ${errorText}` },
        { status: serviceResponse.status }
      );
    }
    const serviceData = await serviceResponse.json();
    // Check if the URL ends with /full and return only "llmsfulltxt" if true
    if (params.slug[params.slug.length - 1] === 'full') {
      const llmsFulltxt = serviceData.llmsfulltxt; // Ensure correct casing
      if (!llmsFulltxt) {
        console.error("llmsfulltxt is undefined in the response");
        return NextResponse.json(
          { error: 'llmsfulltxt is undefined in the response' },
          { status: 500 }
        );
      }
 
  
      const prettyPrintedFullTxt = JSON.stringify({ llmsfulltxt: llmsFulltxt }, null, 2)
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/^\{\s*"llmsfulltxt":\s*"/, '') // Remove the opening part
        .replace(/"\s*\}$/, ''); // Remove the trailing part
      return new Response(prettyPrintedFullTxt, {
        headers: { 'Content-Type': 'application/json' },
      });
    }else{
    const llmstxt = serviceData.llmstxt;

    // Pretty print the JSON data
    const prettyPrintedData = JSON.stringify({ llmstxt: llmstxt }, null, 2)
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/^\{\s*"llmstxt"\s*:\s*"/, '') // Remove the opening part
      .replace(/"\s*\}$/, ''); // Remove the trailing part

    // Return the final data as JSON
    return new Response(prettyPrintedData, {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
