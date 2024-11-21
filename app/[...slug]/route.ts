import { NextRequest, NextResponse } from 'next/server';

type RouteParams = {
  params: {
    slug: string[];
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export const maxDuration = 300;

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const targetUrl = decodeURIComponent(params.slug.join('/'));
    const { searchParams } = new URL(request.url);
    const firecrawlApiKey = searchParams.get('FIRECRAWL_API_KEY') || request.headers.get('FIRECRAWL_API_KEY');



    // Prepare the request body for /api/map
    const mapRequestBody = {
      url: targetUrl,
      bringYourOwnFirecrawlApiKey: firecrawlApiKey,
    };

    // Send POST request to /api/map
    const mapResponse = await fetch(`${request.nextUrl.origin}/api/map`, {
      method: 'POST',
      body: JSON.stringify(mapRequestBody),
    });

    if (!mapResponse.ok) {
      const errorText = await mapResponse.text();
      return NextResponse.json(
        { error: `Error from /api/map: ${errorText}` },
        { status: mapResponse.status }
      );
    }

    const mapData = await mapResponse.json();

    // Prepare the request body for /api/service
    const serviceRequestBody = {
      urls: mapData.mapUrls,
      bringYourOwnFirecrawlApiKey: firecrawlApiKey,
    };

    // Send POST request to /api/service
    const serviceResponse = await fetch(`${request.nextUrl.origin}/api/service`, {
      method: 'POST',
      body: JSON.stringify(serviceRequestBody),
    });

    if (!serviceResponse.ok) {
      const errorText = await serviceResponse.text();
      return NextResponse.json(
        { error: `Error from /api/service: ${errorText}` },
        { status: serviceResponse.status }
      );
    }

    const serviceData = await serviceResponse.json();

    if (params.slug[params.slug.length - 1] === 'full') {
      const llmsFulltxt = serviceData.llmsfulltxt;
      if (!llmsFulltxt) {
        console.error('llmsfulltxt is undefined in the response');
        return NextResponse.json(
          { error: 'llmsfulltxt is undefined in the response' },
          { status: 500 }
        );
      }

      const prettyPrintedFullTxt = JSON.stringify({ llmsFulltxt }, null, 2)
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/^\{\s*"llmsfulltxt":\s*"/, '')
        .replace(/"\s*\}$/, '');

      return new Response(prettyPrintedFullTxt, {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      const llmstxt = serviceData.llmstxt;

      const prettyPrintedData = JSON.stringify({ llmstxt }, null, 2)
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/^\{\s*"llmstxt":\s*"/, '')
        .replace(/"\s*\}$/, '');

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
