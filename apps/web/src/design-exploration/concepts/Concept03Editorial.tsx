import { explorationContent as c } from '../content.js';

const navLabels = ['Главная', 'Тренировка', 'Битвы', 'Прогресс', 'Профиль'];

/**
 * Concept 03 — Editorial / typography-heavy.
 * No cards anywhere. The page reads like a magazine spread: a giant
 * headline, rule lines between sections, a table-of-contents-style
 * subject list, and a pull-quote XP figure. Color is rationed to a
 * couple of words.
 */
export function Concept03Editorial() {
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
      <div style={{ flex: 1, padding: '26px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={c.logoSrc} alt="Zybrilka" style={{ height: 20, width: 'auto' }} />
          <span style={{ fontSize: 11, letterSpacing: '0.1em', color: '#5b6478' }}>№ 042</span>
        </div>

        <h1
          style={{
            margin: '28px 0 0',
            fontSize: 42,
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
          }}
        >
          Привет,
          <br />
          {c.userStats.name}.
        </h1>
        <p style={{ margin: '14px 0 0', fontSize: 15, color: '#9aa6bf', lineHeight: 1.5 }}>
          {c.subtext}
        </p>

        <div style={{ marginTop: 28, borderTop: '2px solid #f5f7fa', paddingTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <span style={{ fontSize: 64, fontWeight: 900, lineHeight: 0.9, color: '#f5a623' }}>
              {c.userStats.xp}
            </span>
            <span style={{ fontSize: 14, color: '#9aa6bf', paddingBottom: 8 }}>
              из {c.userStats.xpToNextLevel} XP — уровень {c.userStats.level}
            </span>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 13, color: '#5b6478', fontStyle: 'italic' }}>
            «{c.userStats.streakDays} дней подряд — твоя лучшая серия в этом месяце.»
          </p>
        </div>

        <a
          style={{
            display: 'inline-block',
            marginTop: 24,
            fontSize: 18,
            fontWeight: 700,
            color: '#f5a623',
            textDecoration: 'underline',
            textUnderlineOffset: 4,
          }}
        >
          {c.cta} →
        </a>

        <div style={{ marginTop: 32, borderTop: '1px solid #263252', paddingTop: 16 }}>
          <p
            style={{ margin: '0 0 12px', fontSize: 12, letterSpacing: '0.08em', color: '#5b6478' }}
          >
            ПРЕДМЕТЫ
          </p>
          {c.subjects.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                fontSize: 15,
                padding: '6px 0',
              }}
            >
              <span>{s.shortName}</span>
              <span
                style={{
                  flex: 1,
                  borderBottom: '1px dotted #5b6478',
                  transform: 'translateY(-4px)',
                }}
              />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{s.mastery}%</span>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 24,
            borderTop: '1px solid #263252',
            paddingTop: 16,
            paddingBottom: 24,
          }}
        >
          <p
            style={{ margin: '0 0 12px', fontSize: 12, letterSpacing: '0.08em', color: '#5b6478' }}
          >
            НЕДАВНО
          </p>
          {c.recentActivity.map((entry) => (
            <p key={entry.id} style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.5 }}>
              <span style={{ color: entry.correct ? '#34c77b' : '#ff5c5c' }}>
                {entry.correct ? 'Решено' : 'Не решено'}
              </span>{' '}
              — {entry.topic}. <span style={{ color: '#5b6478' }}>{entry.date}.</span>
            </p>
          ))}
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>
            Достижения:{' '}
            {c.achievements
              .filter((a) => a.unlocked)
              .map((a) => a.label)
              .join(', ')}
            .
          </p>
        </div>
      </div>

      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '14px 22px 18px',
          borderTop: '2px solid #f5f7fa',
          fontSize: 11,
          letterSpacing: '0.04em',
        }}
      >
        {navLabels.map((label, i) => (
          <span
            key={label}
            style={{ color: i === 0 ? '#f5a623' : '#5b6478', fontWeight: i === 0 ? 700 : 400 }}
          >
            {label}
          </span>
        ))}
      </nav>
    </div>
  );
}
