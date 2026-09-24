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
 * Concept 02 — Bold orange/black educational app.
 * Flat color blocks, thick black rules, zero soft shadows/gradients —
 * energy comes from contrast and scale, not decoration.
 */
export function Concept02BoldOrangeBlack() {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        background: '#0a0a0a',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          background: '#f5a623',
          color: '#0a0a0a',
          padding: '24px 20px 20px',
          borderBottom: '3px solid #0a0a0a',
        }}
      >
        <img src={c.logoSrc} alt="Zybrilka" style={{ height: 26, width: 'auto' }} />
        <p style={{ margin: '18px 0 0', fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>
          Привет, {c.userStats.name}!
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 600, maxWidth: 260 }}>
          {c.subtext}
        </p>
      </div>

      <div style={{ display: 'flex', borderBottom: '3px solid #0a0a0a' }}>
        <div style={{ flex: 1, padding: '16px 20px', borderRight: '3px solid #0a0a0a' }}>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#f5a623' }}>
            {c.userStats.xp}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: '#9aa6bf' }}>
            XP · УРОВЕНЬ {c.userStats.level}
          </p>
        </div>
        <div style={{ flex: 1, padding: '16px 20px' }}>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#f5a623' }}>
            {c.userStats.streakDays} 🔥
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: '#9aa6bf' }}>
            ДНЕЙ ПОДРЯД
          </p>
        </div>
      </div>

      <div style={{ padding: '20px', flex: 1 }}>
        <button
          type="button"
          style={{
            width: '100%',
            background: '#f5a623',
            color: '#0a0a0a',
            border: '3px solid #0a0a0a',
            borderRadius: 0,
            padding: '16px 0',
            fontSize: 16,
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          {c.cta}
        </button>

        <p
          style={{
            margin: '24px 0 10px',
            fontSize: 13,
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          Предметы
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {c.subjects.map((s) => (
            <div
              key={s.id}
              style={{
                border: '2px solid #262626',
                padding: '8px 12px',
                display: 'flex',
                gap: 8,
                alignItems: 'baseline',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700 }}>{s.shortName}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f5a623' }}>{s.mastery}%</span>
            </div>
          ))}
        </div>

        <p
          style={{
            margin: '24px 0 10px',
            fontSize: 13,
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          Недавняя активность
        </p>
        <div style={{ border: '2px solid #262626' }}>
          {c.recentActivity.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderTop: i === 0 ? 'none' : '2px solid #262626',
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: entry.correct ? '#34c77b' : '#ff5c5c',
                  color: '#0a0a0a',
                  fontSize: 12,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {entry.correct ? '✓' : '✕'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{entry.topic}</span>
              <span style={{ fontSize: 11, color: '#9aa6bf', fontWeight: 700 }}>{entry.date}</span>
            </div>
          ))}
        </div>

        <p
          style={{
            margin: '24px 0 10px',
            fontSize: 13,
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          Достижения
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          {c.achievements.map((a) => (
            <div
              key={a.id}
              style={{
                flex: 1,
                border: `2px solid ${a.unlocked ? '#f5a623' : '#262626'}`,
                padding: '10px 6px',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: 18 }}>{a.unlocked ? '🏆' : '🔒'}</span>
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: a.unlocked ? '#fff' : '#5b6478',
                }}
              >
                {a.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          background: '#0a0a0a',
          borderTop: '3px solid #f5a623',
          padding: '10px 0 16px',
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
              padding: '4px 10px',
              background: item.id === 'home' ? '#f5a623' : 'transparent',
              color: item.id === 'home' ? '#0a0a0a' : '#9aa6bf',
            }}
          >
            <Icon name={item.icon} size={18} />
            <span style={{ fontSize: 9, fontWeight: 800 }}>{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
