import type { CSSProperties } from 'react';
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

const tile: CSSProperties = {
  borderRadius: 18,
  background: '#131c2e',
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
};

/**
 * Concept 07 — Modern bento.
 * A curated widget board instead of a vertical list of equal cards:
 * one wide hero tile, then varying-size tiles for streak, subjects,
 * activity and achievements, tightly packed on a grid.
 */
export function Concept07Bento() {
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
      <div style={{ flex: 1, padding: '20px 16px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <img src={c.logoSrc} alt="Zybrilka" style={{ height: 20, width: 'auto' }} />
          <span style={{ fontSize: 13, color: '#9aa6bf' }}>Привет, {c.userStats.name}!</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div
            style={{
              ...tile,
              gridColumn: '1 / -1',
              background:
                'radial-gradient(120% 140% at 100% 0%, rgba(245,166,35,0.16), transparent 60%), #131c2e',
              padding: 18,
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 13, color: '#9aa6bf' }}>Опыт</p>
                <p style={{ margin: '4px 0 0', fontSize: 34, fontWeight: 800 }}>{c.userStats.xp}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#5b6478' }}>
                  из {c.userStats.xpToNextLevel} · Уровень {c.userStats.level}
                </p>
              </div>
              <button
                type="button"
                style={{
                  background: '#f5a623',
                  color: '#0b1220',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {c.cta}
              </button>
            </div>
          </div>

          <div style={{ ...tile, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Icon name="flame" size={22} />
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{c.userStats.streakDays}</p>
            <p style={{ margin: 0, fontSize: 11, color: '#9aa6bf' }}>дней подряд</p>
          </div>

          <div style={{ ...tile, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Icon name="progress" size={22} />
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{c.userStats.accuracy}%</p>
            <p style={{ margin: 0, fontSize: 11, color: '#9aa6bf' }}>точность</p>
          </div>

          <div style={{ ...tile, gridColumn: '1 / -1' }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: '#9aa6bf' }}>Предметы</p>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
              {c.subjects.map((s) => (
                <div
                  key={s.id}
                  style={{
                    flexShrink: 0,
                    background: '#1c2740',
                    borderRadius: 12,
                    padding: '8px 12px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: s.color }}>
                    {s.mastery}%
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: '#9aa6bf' }}>{s.shortName}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...tile, gridColumn: '1 / -1' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#9aa6bf' }}>Недавняя активность</p>
            {c.recentActivity.slice(0, 2).map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 0',
                  fontSize: 13,
                }}
              >
                <Icon name={entry.correct ? 'success' : 'errorCircle'} size={15} />
                <span style={{ flex: 1 }}>{entry.topic}</span>
                <span style={{ fontSize: 11, color: '#5b6478' }}>{entry.date}</span>
              </div>
            ))}
          </div>

          {c.achievements.slice(0, 2).map((a) => (
            <div key={a.id} style={{ ...tile, alignItems: 'center', gap: 6, paddingBottom: 16 }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: a.unlocked ? 'rgba(245,166,35,0.18)' : '#1c2740',
                  color: a.unlocked ? '#f5a623' : '#5b6478',
                }}
              >
                <Icon name={a.unlocked ? 'achievements' : 'lock'} size={17} />
              </span>
              <p style={{ margin: 0, fontSize: 10, textAlign: 'center', color: '#9aa6bf' }}>
                {a.label}
              </p>
            </div>
          ))}
        </div>

        <div style={{ height: 20 }} />
      </div>

      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          background: '#131c2e',
          margin: '0 12px 12px',
          borderRadius: 20,
          padding: '10px 0',
        }}
      >
        {navItems.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              color: item.id === 'home' ? '#f5a623' : '#5b6478',
            }}
          >
            <Icon name={item.icon} size={18} />
            <span style={{ fontSize: 9 }}>{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
