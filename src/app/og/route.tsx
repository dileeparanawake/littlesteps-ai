import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'LittleSteps AI - Guidance for new parents';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 'bold',
              color: '#1a1a1a',
              letterSpacing: '-0.02em',
            }}
          >
            LittleSteps AI
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#666666',
              fontWeight: 400,
            }}
          >
            Guidance for new parents
          </div>
          <div
            style={{
              width: 120,
              height: 8,
              background: 'linear-gradient(90deg, #a855f7 0%, #9333ea 100%)',
              borderRadius: 4,
              marginTop: 20,
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
