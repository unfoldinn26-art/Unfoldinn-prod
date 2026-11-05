import { NextResponse } from 'next/server';

const INDEXNOW_KEY = 'secondinnings99281a94bc72418e9d';
const HOST = 'unfoldinn.com';

const DEFAULT_URLS = [
  'https://unfoldinn.com/',
  'https://unfoldinn.com/for-students',
  'https://unfoldinn.com/for-parents',
  'https://unfoldinn.com/for-institutions',
  'https://unfoldinn.com/how-it-works',
  'https://unfoldinn.com/about',
  'https://unfoldinn.com/book',
  'https://unfoldinn.com/opportunities',
  'https://unfoldinn.com/resources',
  'https://unfoldinn.com/contact',
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
