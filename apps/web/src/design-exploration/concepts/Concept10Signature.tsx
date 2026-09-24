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
 * Concept 10 — Original Zybrilka signature.
 * The synthesis: a restrained gradient hero (01/10) carrying
 * editorial-scale typography (03), a CTA that overlaps its edge, and
 * a curated bento row for subjects/achievements (07) — meant to read
 * as "the brand's own look", not a mash-up of the other nine.
 */
export function Concept10Signature() {
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
      <div style={{ flex: 1, padding: '20px 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={c.logoSrc} alt="Zybrilka" style={{ height: 24, width: 'auto' }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color: '#f5a623',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <Icon name="flame" size={16} />
            {c.userStats.streakDays}
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            borderRadius: 24,
            padding: '24px 22px 26px',
            background:
              'radial-gradient(130% 110% at 100% 0%, rgba(245,166,35,0.18), transparent 62%), #131c2e',
            boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: '#9aa6bf' }}>Привет, {c.userStats.name}</p>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            {c.userStats.xp}{' '}
            <span style={{ fontSize: 18, fontWeight: 600, color: '#9aa6bf' }}>XP</span>
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#5b6478' }}>
            {c.userStats.xpToNextLevel - c.userStats.xp} XP до уровня {c.userStats.level + 1}
          </p>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.08)',
              marginTop: 12,
            }}
          >
            <div
              style={{
                width: `${(c.userStats.xp / c.userStats.xpToNextLevel) * 100}%`,
                height: '100%',
                borderRadius: 2,
                background: '#f5a623',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, overflowX: 'auto' }}>
            {c.subjects.map((s) => (
              <span
                key={s.id}
                style={{
                  flexShrink: 0,
                  fontSize: 12,
                  color: '#f5f7fa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                {s.shortName} <span style={{ color: '#5b6478' }}>{s.mastery}%</span>
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          style={{
            margin: '-18px 8px 0',
            display: 'block',
            width: 'calc(100% - 16px)',
            background: '#f5a623',
            color: '#0b1220',
            border: 'none',
            borderRadius: 16,
            padding: '16px 0',
            fontSize: 15,
            fontWeight: 800,
            boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
            position: 'relative',
          }}
        >
          {c.cta}
        </button>

        <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
          <div style={{ background: '#131c2e', borderRadius: 18, padding: 14 }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#9aa6bf' }}>Недавняя активность</p>
            {c.recentActivity.slice(0, 2).map((entry) => (
              <div
                key={entry.id}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}
              >
                <Icon name={entry.correct ? 'success' : 'errorCircle'} size={15} />
                <span style={{ fontSize: 12, flex: 1 }}>{entry.topic}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              background: '#131c2e',
              borderRadius: 18,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{c.userStats.accuracy}%</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9aa6bf' }}>точность</p>
          </div>
        </div>

        <p style={{ margin: '22px 0 10px', fontSize: 13, fontWeight: 700 }}>Достижения</p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {c.achievements.map((a) => (
            <div key={a.id} style={{ flex: 1, textAlign: 'center' }}>
              <span
                style={{
                  display: 'flex',
                  width: 44,
                  height: 44,
                  margin: '0 auto',
                  borderRadius: '50%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: a.unlocked ? '#1c2740' : '#131c2e',
                  color: a.unlocked ? '#f5a623' : '#5b6478',
                  boxShadow: a.unlocked ? '0 0 20px rgba(245,166,35,0.28)' : 'none',
                }}
              >
                <Icon name={a.unlocked ? 'achievements' : 'lock'} size={19} />
              </span>
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
