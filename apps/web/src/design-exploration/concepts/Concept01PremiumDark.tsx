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
 * Concept 01 — Premium dark mobile app.
 * Contrast comes from restraint: generous space, thin hairlines, one
 * huge light-weight XP number, no fills except the CTA. Nothing
 * competes with typography and negative space.
 */
export function Concept01PremiumDark() {
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
      <div style={{ flex: 1, padding: '28px 24px 0', display: 'flex', flexDirection: 'column' }}>
        <img
          src={c.logoSrc}
          alt="Zybrilka"
          style={{ height: 22, width: 'auto', alignSelf: 'flex-start' }}
        />

        <div style={{ marginTop: 40 }}>
          <p style={{ margin: 0, fontSize: 34, fontWeight: 300, letterSpacing: '-0.01em' }}>
            Привет,
            <br />
            <span style={{ fontWeight: 700 }}>{c.userStats.name}.</span>
          </p>
          <p style={{ margin: '12px 0 0', fontSize: 14, color: '#9aa6bf', maxWidth: 260 }}>
            {c.subtext}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginTop: 36,
            paddingTop: 20,
            borderTop: '1px solid #263252',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 56, fontWeight: 200, letterSpacing: '-0.02em' }}>
              {c.userStats.xp}
            </p>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#5b6478',
              }}
            >
              XP из {c.userStats.xpToNextLevel} · Уровень {c.userStats.level}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#f5a623' }}>
              {c.userStats.streakDays} дней
            </p>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#5b6478',
              }}
            >
              подряд
            </p>
          </div>
        </div>
        <div
          style={{
            height: 1,
            background: '#263252',
            marginTop: 16,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: 1,
              width: `${(c.userStats.xp / c.userStats.xpToNextLevel) * 100}%`,
              background: '#f5a623',
            }}
          />
        </div>

        <button
          type="button"
          style={{
            marginTop: 28,
            width: '100%',
            border: '1px solid #f5a623',
            background: 'transparent',
            color: '#f5a623',
            borderRadius: 2,
            padding: '14px 0',
            fontSize: 13,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {c.cta}
        </button>

        <div style={{ marginTop: 32 }}>
          <p
            style={{
              margin: '0 0 10px',
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#5b6478',
            }}
          >
            Предметы
          </p>
          {c.subjects.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderTop: '1px solid #1a2338',
              }}
            >
              <span style={{ fontSize: 14, flex: 1 }}>{s.shortName}</span>
              <span style={{ fontSize: 13, color: '#9aa6bf', fontVariantNumeric: 'tabular-nums' }}>
                {s.mastery}%
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, marginBottom: 24 }}>
          <p
            style={{
              margin: '0 0 10px',
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#5b6478',
            }}
          >
            Недавняя активность
          </p>
          {c.recentActivity.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 0',
                borderTop: '1px solid #1a2338',
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: entry.correct ? '#34c77b' : '#ff5c5c',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, flex: 1 }}>{entry.topic}</span>
              <span style={{ fontSize: 12, color: '#5b6478' }}>{entry.date}</span>
            </div>
          ))}
        </div>
      </div>

      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '14px 0 18px',
          borderTop: '1px solid #1a2338',
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
