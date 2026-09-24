import { Icon } from '../../ui/Icon/Icon.js';
import type { IconName } from '../../ui/Icon/icons.js';
import { explorationContent as c } from '../content.js';

const navItems: { id: string; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Главная', icon: 'home' },
  { id: 'training', label: 'Тренировка', icon: 'training' },
  { id: 'battles', label: 'Битвы', icon: 'battles' },
  { id: 'progress', label: 'Прогресс', icon: 'progress' },
  { id: 'profile', label: 'Профиль', icon: 'profile' },
];

/**
 * Concept 06 — Futuristic education.
 * A dot-grid texture, thin glowing rule lines instead of fills, sliced
 * (clipped) corners instead of rounded ones, wide-tracked uppercase
 * labels — a HUD feeling, kept restrained rather than neon-heavy.
 */
export function Concept06Futuristic() {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        background:
          'radial-gradient(circle, rgba(154,166,191,0.08) 1px, transparent 1px) 0 0 / 16px 16px, #060a14',
        color: '#f5f7fa',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={c.logoSrc} alt="Zybrilka" style={{ height: 22, width: 'auto' }} />
          <span
            style={{
              fontSize: 10,
              letterSpacing: '0.16em',
              color: '#f5a623',
              border: '1px solid rgba(245,166,35,0.4)',
              padding: '3px 8px',
              clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)',
            }}
          >
            LVL {c.userStats.level}
          </span>
        </div>

        <p
          style={{
            margin: '28px 0 0',
            fontSize: 11,
            letterSpacing: '0.16em',
            color: '#5b6478',
            textTransform: 'uppercase',
          }}
        >
          Добро пожаловать
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700 }}>{c.userStats.name}</p>

        <div
          style={{
            marginTop: 22,
            padding: '18px',
            border: '1px solid rgba(245,166,35,0.35)',
            clipPath:
              'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
            background: 'rgba(245,166,35,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 40, fontWeight: 800, color: '#f5a623' }}>
              {c.userStats.xp}
            </span>
            <span style={{ fontSize: 11, letterSpacing: '0.1em', color: '#9aa6bf' }}>
              / {c.userStats.xpToNextLevel} XP
            </span>
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', marginTop: 10 }}>
            <div
              style={{
                width: `${(c.userStats.xp / c.userStats.xpToNextLevel) * 100}%`,
                height: '100%',
                background: '#f5a623',
                boxShadow: '0 0 8px rgba(245,166,35,0.8)',
              }}
            />
          </div>
          <p
            style={{ margin: '10px 0 0', fontSize: 11, letterSpacing: '0.08em', color: '#9aa6bf' }}
          >
            СЕРИЯ: {c.userStats.streakDays} ДНЕЙ
          </p>
        </div>

        <button
          type="button"
          style={{
            marginTop: 18,
            width: '100%',
            background: 'transparent',
            color: '#f5a623',
            border: '1px solid #f5a623',
            clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)',
            padding: '14px 0',
            fontSize: 13,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          ▸ {c.cta}
        </button>

        <p
          style={{
            margin: '24px 0 10px',
            fontSize: 11,
            letterSpacing: '0.14em',
            color: '#5b6478',
            textTransform: 'uppercase',
          }}
        >
          Модули
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {c.subjects.slice(0, 4).map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 12,
                letterSpacing: '0.04em',
              }}
            >
              <span style={{ width: 90, color: '#9aa6bf', textTransform: 'uppercase' }}>
                {s.shortName}
              </span>
              <span style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.08)' }}>
                <span
                  style={{
                    display: 'block',
                    width: `${s.mastery}%`,
                    height: '100%',
                    background: s.color,
                  }}
                />
              </span>
              <span style={{ color: '#f5f7fa', width: 32, textAlign: 'right' }}>{s.mastery}%</span>
            </div>
          ))}
        </div>

        <p
          style={{
            margin: '24px 0 10px',
            fontSize: 11,
            letterSpacing: '0.14em',
            color: '#5b6478',
            textTransform: 'uppercase',
          }}
        >
          Журнал
        </p>
        <div style={{ marginBottom: 24 }}>
          {c.recentActivity.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                gap: 8,
                fontSize: 12,
                padding: '6px 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span style={{ color: entry.correct ? '#34c77b' : '#ff5c5c' }}>
                {entry.correct ? '[OK]' : '[!!]'}
              </span>
              <span style={{ flex: 1 }}>{entry.topic}</span>
              <span style={{ color: '#5b6478' }}>{entry.date}</span>
            </div>
          ))}
        </div>
      </div>

      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          borderTop: '1px solid rgba(245,166,35,0.25)',
          padding: '12px 0 16px',
        }}
      >
        {navItems.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              color: item.id === 'home' ? '#f5a623' : '#5b6478',
            }}
          >
            <Icon name={item.icon} size={17} />
            <span style={{ fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {item.label}
            </span>
          </div>
        ))}
      </nav>
    </div>
  );
}
