import { explorationContent as c } from '../content.js';

const navLabels = ['ГЛАВНАЯ', 'ТРЕНИРОВКА', 'БИТВЫ', 'ПРОГРЕСС', 'ПРОФИЛЬ'];

/**
 * Concept 09 — Bold graphic / high contrast.
 * Swiss-poster grid: pure black, white and orange only, thick rules,
 * huge block numerals, no gradients, no soft shadows, no rounded
 * corners.
 */
export function Concept09BoldGraphic() {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        background: '#000',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '22px 20px', borderBottom: '4px solid #fff' }}>
          <img
            src={c.logoSrc}
            alt="Zybrilka"
            style={{ height: 24, width: 'auto', filter: 'grayscale(1) contrast(1.4)' }}
          />
        </div>

        <div style={{ padding: '22px 20px', borderBottom: '4px solid #fff' }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: '0.04em' }}>
            ПРИВЕТ, {c.userStats.name.toUpperCase()}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#b3b3b3' }}>{c.subtext}</p>
        </div>

        <div style={{ display: 'flex', borderBottom: '4px solid #fff' }}>
          <div style={{ flex: 2, padding: '18px 20px', borderRight: '4px solid #fff' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}>XP</p>
            <p
              style={{ margin: 0, fontSize: 56, fontWeight: 900, lineHeight: 1, color: '#f5a623' }}
            >
              {c.userStats.xp}
            </p>
          </div>
          <div style={{ flex: 1, padding: '18px 14px' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}>
              СЕРИЯ
            </p>
            <p style={{ margin: 0, fontSize: 40, fontWeight: 900, lineHeight: 1 }}>
              {c.userStats.streakDays}
            </p>
          </div>
        </div>

        <button
          type="button"
          style={{
            margin: '20px',
            background: '#f5a623',
            color: '#000',
            border: 'none',
            borderRadius: 0,
            padding: '18px 0',
            fontSize: 15,
            fontWeight: 900,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {c.cta}
        </button>

        <div style={{ padding: '0 20px' }}>
          <p
            style={{ margin: '4px 0 10px', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}
          >
            ПРЕДМЕТЫ
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 0,
              border: '3px solid #fff',
            }}
          >
            {c.subjects.slice(0, 4).map((s, i) => (
              <div
                key={s.id}
                style={{
                  padding: '12px',
                  borderRight: i % 2 === 0 ? '3px solid #fff' : 'none',
                  borderBottom: i < 2 ? '3px solid #fff' : 'none',
                }}
              >
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>
                  {s.shortName.toUpperCase()}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 24, fontWeight: 900, color: '#f5a623' }}>
                  {s.mastery}%
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px', marginBottom: 4 }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}>
            АКТИВНОСТЬ
          </p>
          {c.recentActivity.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                borderTop: '2px solid #333',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  padding: '2px 6px',
                  background: entry.correct ? '#f5a623' : '#fff',
                  color: '#000',
                }}
              >
                {entry.correct ? 'OK' : 'X'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{entry.topic}</span>
              <span style={{ fontSize: 11, color: '#b3b3b3' }}>{entry.date}</span>
            </div>
          ))}
        </div>
      </div>

      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          borderTop: '4px solid #fff',
          padding: '14px 0 18px',
        }}
      >
        {navLabels.map((label, i) => (
          <span
            key={label}
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: i === 0 ? '#f5a623' : '#fff',
            }}
          >
            {label}
          </span>
        ))}
      </nav>
    </div>
  );
}
