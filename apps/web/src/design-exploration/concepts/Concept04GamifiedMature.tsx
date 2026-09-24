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

const XP_SEGMENTS = 20;

/**
 * Concept 04 — Gamified but mature.
 * Game-language (level badge, segmented XP meter, medal shelf) kept
 * deliberately restrained: metallic-adjacent tones instead of primary
 * candy colors, no confetti, no cartoon mascots.
 */
export function Concept04GamifiedMature() {
  const filledSegments = Math.round((c.userStats.xp / c.userStats.xpToNextLevel) * XP_SEGMENTS);

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
      <div style={{ flex: 1, padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={c.logoSrc} alt="Zybrilka" style={{ height: 22, width: 'auto' }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 999,
              background: '#1c2740',
              color: '#f5a623',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Icon name="flame" size={14} />
            {c.userStats.streakDays}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f5a623, #c77d16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 900,
              color: '#0b1220',
              flexShrink: 0,
              boxShadow: '0 0 0 3px #1c2740',
            }}
          >
            {c.userStats.level}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Привет, {c.userStats.name}!</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9aa6bf' }}>
              Уровень {c.userStats.level} · {c.userStats.xp} XP
            </p>
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', gap: 3 }}>
          {Array.from({ length: XP_SEGMENTS }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 2,
                background: i < filledSegments ? '#f5a623' : '#1c2740',
              }}
            />
          ))}
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 11, color: '#5b6478', textAlign: 'right' }}>
          {c.userStats.xpToNextLevel - c.userStats.xp} XP до уровня {c.userStats.level + 1}
        </p>

        <button
          type="button"
          style={{
            marginTop: 22,
            width: '100%',
            background: '#f5a623',
            color: '#0b1220',
            border: 'none',
            borderRadius: 14,
            padding: '15px 0',
            fontSize: 15,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 6px 16px rgba(245,166,35,0.25)',
          }}
        >
          <Icon name="target" size={18} />
          Начать квест дня
        </button>

        <p style={{ margin: '24px 0 10px', fontSize: 13, fontWeight: 700 }}>Прокачка предметов</p>
        {c.subjects.slice(0, 4).map((s) => (
          <div key={s.id} style={{ marginBottom: 10 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              <span>{s.shortName}</span>
              <span style={{ color: '#9aa6bf' }}>{s.mastery}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: '#1c2740', overflow: 'hidden' }}>
              <div style={{ width: `${s.mastery}%`, height: '100%', background: s.color }} />
            </div>
          </div>
        ))}

        <p style={{ margin: '20px 0 10px', fontSize: 13, fontWeight: 700 }}>Медали</p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {c.achievements.map((a) => (
            <div key={a.id} style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  margin: '0 auto',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: a.unlocked ? 'linear-gradient(135deg, #ffd77a, #c77d16)' : '#1c2740',
                  color: a.unlocked ? '#0b1220' : '#5b6478',
                  fontSize: 18,
                }}
              >
                <Icon name={a.unlocked ? 'achievements' : 'lock'} size={20} />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 9, color: '#9aa6bf', lineHeight: 1.3 }}>
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
          background: '#131c2e',
          borderTop: '1px solid #263252',
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
              color: item.id === 'home' ? '#f5a623' : '#5b6478',
            }}
          >
            <Icon name={item.icon} size={18} />
            <span style={{ fontSize: 10 }}>{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
