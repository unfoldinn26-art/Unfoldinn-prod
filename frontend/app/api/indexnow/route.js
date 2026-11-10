import { NextResponse } from 'next/server';

const INDEXNOW_KEY = 'unfoldinn99281a94bc72418e9d';
const HOST = 'www.unfoldinn.com';

const DEFAULT_URLS = [
  'https://www.unfoldinn.com/',
  'https://www.unfoldinn.com/for-students',
  'https://www.unfoldinn.com/for-parents',
  'https://www.unfoldinn.com/for-institutions',
  'https://www.unfoldinn.com/how-it-works',
  'https://www.unfoldinn.com/about',
  'https://www.unfoldinn.com/book',
  'https://www.unfoldinn.com/opportunities',
  'https://www.unfoldinn.com/resources',
  'https://www.unfoldinn.com/contact',
];

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const urlsToSubmit = body.urls && Array.isArray(body.urls) && body.urls.length > 0
      ? body.urls
      : DEFAULT_URLS;

    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
      urlList: urlsToSubmit,
    };

    // Submit to Microsoft Bing IndexNow endpoint
    const bingResponse = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({
      success: true,
      submittedUrls: urlsToSubmit.length,
      bingStatus: bingResponse.status,
      message: 'URLs submitted to Bing & IndexNow search engines successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'IndexNow is active for Microsoft Bing and Yandex.',
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    defaultUrlsCount: DEFAULT_URLS.length,
  });
}
