import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Unfoldinn | Young Minds. New Perspectives. Wider Possibilities.';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#111720',
          padding: '80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle warm glow background */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            right: '-150px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            backgroundColor: '#D97724',
            opacity: 0.15,
            filter: 'blur(100px)',
          }}
        />

        {/* Top bar: Brand emblem + Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '4px solid #D97724',
              borderRightColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#D97724',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 900,
                letterSpacing: '0.15em',
                color: '#FAF7F0',
                textTransform: 'uppercase',
              }}
            >
              UNFOLDINN
            </span>
            <span
              style={{
                fontSize: '15px',
                letterSpacing: '0.12em',
                color: '#D97724',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginTop: '2px',
              }}
            >
              Young Minds. New Perspectives. Wider Possibilities.
            </span>
          </div>
        </div>

        {/* Center: Main Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '980px', gap: '20px' }}>
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Navigating what comes next with clarity, not confusion.
          </h1>
          <p
            style={{
              fontSize: '24px',
              lineHeight: 1.45,
              color: '#94A3B8',
              margin: 0,
            }}
          >
            A human-led perspective mentoring platform for students, parents, and educational institutions.
          </p>
        </div>

        {/* Bottom bar: Founder credentials & Location */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            paddingTop: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(217, 119, 36, 0.2)',
                border: '1px solid #D97724',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FAF7F0',
                fontWeight: 800,
                fontSize: '18px',
              }}
            >
              DS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#FAF7F0' }}>
                Deepak Sogani
              </span>
              <span style={{ fontSize: '14px', color: '#94A3B8' }}>
                Founder & Lead Mentor • Former Head of Student Affairs, JKLU
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 20px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FAF7F0',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            <span>unfoldinn.com</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
