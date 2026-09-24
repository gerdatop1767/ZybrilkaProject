import { explorationContent as c } from '../content.js';

const navLabels = ['Главная', 'Тренировка', 'Битвы', 'Прогресс', 'Профиль'];

/**
 * Concept 05 — Extremely clean premium.
 * As few elements as possible on the first screen: greeting, one
 * number, one action. Everything else is reachable by scrolling, kept
 * quiet below a single hairline. No shadows, no fills but the CTA.
 */
export function Concept05CleanPremium() {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        background: '#0b1220',
        color: '#f5f7fa',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, padding: '40px 28px 0', display: 'flex', flexDirection: 'column' }}>
        <img
          src={c.logoSrc}
          alt="Zybrilka"
          style={{ height: 20, width: 'auto', alignSelf: 'flex-start' }}
        />

        <div style={{ marginTop: 72 }}>
          <p style={{ margin: 0, fontSize: 15, color: '#9aa6bf' }}>Привет, {c.userStats.name}</p>
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 72,
              fontWeight: 200,
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {c.userStats.xp}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#5b6478' }}>
            опыта из {c.userStats.xpToNextLevel} · {c.userStats.streakDays} дней подряд
          </p>
        </div>

        <button
          type="button"
          style={{
            marginTop: 48,
            width: '100%',
            background: '#f5f7fa',
            color: '#0b1220',
            border: 'none',
            borderRadius: 16,
            padding: '18px 0',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {c.cta}
        </button>

        <div style={{ marginTop: 64, flex: 1 }}>
          <div style={{ height: 1, background: '#1a2338' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0' }}>
            {c.subjects.slice(0, 3).map((s) => (
              <div key={s.id} style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 300 }}>{s.mastery}%</p>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#5b6478' }}>{s.shortName}</p>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: '#1a2338' }} />

          <div style={{ padding: '20px 0' }}>
            {c.recentActivity.slice(0, 2).map((entry) => (
              <p key={entry.id} style={{ margin: '0 0 10px', fontSize: 13, color: '#9aa6bf' }}>
                {entry.topic} <span style={{ color: '#5b6478' }}>· {entry.date}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '18px 0 22px',
        }}
      >
        {navLabels.map((label, i) => (
          <span
            key={label}
            style={{
              fontSize: 11,
              color: i === 0 ? '#f5f7fa' : '#5b6478',
              fontWeight: i === 0 ? 600 : 400,
            }}
          >
            {label}
          </span>
        ))}
      </nav>
    </div>
  );
}
