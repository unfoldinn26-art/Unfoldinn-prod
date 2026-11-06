import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const alt = 'Unfoldinn | Young Minds. New Perspectives. Wider Possibilities.';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  let photoDataUri = '';
  try {
    const photoPath = path.join(process.cwd(), 'public', 'deepaksogani.jpeg');
    const photoBuffer = fs.readFileSync(photoPath);
    photoDataUri = `data:image/jpeg;base64,${photoBuffer.toString('base64')}`;
  } catch (e) {
    console.warn('Could not read deepaksogani.jpeg for OG image:', e.message);
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#FAF6EE',
          padding: '48px 56px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Editorial double hairline frame */}
        <div
          style={{
            position: 'absolute',
            inset: '20px',
            border: '1px solid rgba(91, 70, 50, 0.18)',
            borderRadius: '20px',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '26px',
            border: '1px solid rgba(200, 121, 44, 0.22)',
            borderRadius: '14px',
            pointerEvents: 'none',
          }}
        />

        {/* Top bar: Brand Wordmark + Tagline + Location Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Ensō brush mark symbol */}
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke="#23180F"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="95 20"
              />
              <circle cx="34" cy="14" r="3.5" fill="#C8792C" />
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#23180F',
                  lineHeight: 1,
                  fontFamily: 'serif',
                }}
              >
                Unfoldinn
              </span>
              <span
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.14em',
                  color: '#786653',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginTop: '5px',
                  fontFamily: 'sans-serif',
                }}
              >
                Young Minds • New Perspectives • Wider Possibilities
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 18px',
              borderRadius: '999px',
              backgroundColor: '#FAF0E1',
              border: '1px solid rgba(200, 121, 44, 0.35)',
              color: '#9B5113',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: 'sans-serif',
            }}
          >
            Jaipur, India • Ages 16 to 25
          </div>
        </div>

        {/* Center: Main Headline with Burnt Amber Emphasis */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '1060px',
            gap: '16px',
            marginTop: '12px',
            marginBottom: '12px',
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontSize: '13px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#C8792C',
              fontWeight: 700,
              fontFamily: 'sans-serif',
            }}
          >
            Human-Led Youth Mentorship
          </span>

          <h1
            style={{
              fontSize: '52px',
              fontWeight: 400,
              lineHeight: 1.15,
              color: '#23180F',
              letterSpacing: '-0.02em',
              margin: 0,
              fontFamily: 'serif',
            }}
          >
            Somewhere between ‘I don’t know’ and ‘What comes next?’{' '}
            <span style={{ color: '#C8792C', fontStyle: 'italic' }}>
              there is a conversation.
            </span>
          </h1>

          <p
            style={{
              fontSize: '20px',
              lineHeight: 1.45,
              color: '#5B4632',
              margin: 0,
              maxWidth: '960px',
              fontFamily: 'sans-serif',
            }}
          >
            A space for young people to talk openly, understand themselves better,
            explore possibilities, and find their own way forward.
          </p>
        </div>

        {/* Bottom bar: Deepak Sir's Photo + Credentials + 5 Pillars */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '1px solid rgba(91, 70, 50, 0.15)',
            paddingTop: '20px',
            zIndex: 10,
          }}
        >
          {/* Founder Identity Card with Actual Photo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {photoDataUri ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoDataUri}
                alt="Deepak Sogani"
                width="60"
                height="60"
                style={{
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #C8792C',
                  boxShadow: '0 2px 8px rgba(35, 24, 15, 0.1)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#FAF0E1',
                  border: '2px solid #C8792C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9B5113',
                  fontWeight: 700,
                  fontSize: '20px',
                  fontFamily: 'sans-serif',
                }}
              >
                DS
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#23180F',
                  fontFamily: 'serif',
                }}
              >
                Deepak Sogani
              </span>
              <span
                style={{
                  fontSize: '13px',
                  color: '#786653',
                  fontFamily: 'sans-serif',
                }}
              >
                Founder & Lead Mentor • Former Head of Student Affairs, JKLU • 35+ Yrs
              </span>
            </div>
          </div>

          {/* 5 Growth Pillars Capsule */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 22px',
              borderRadius: '999px',
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(91, 70, 50, 0.16)',
              boxShadow: '0 2px 6px rgba(35, 24, 15, 0.04)',
            }}
          >
            {['Clarity', 'Confidence', 'Exposure', 'Action', 'Ownership'].map(
              (pillar, index) => (
                <div
                  key={pillar}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#23180F',
                      fontFamily: 'sans-serif',
                    }}
                  >
                    {pillar}
                  </span>
                  {index < 4 && (
                    <span style={{ color: '#C8792C', fontSize: '10px' }}>•</span>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
