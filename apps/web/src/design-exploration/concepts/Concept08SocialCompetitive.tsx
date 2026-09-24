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
 * Concept 08 — Social / competitive.
 * Leans on rank, social proof and a feed-like activity list. The
 * Battles tab gets extra visual weight in the nav, reflecting the
 * competitive framing.
 */
export function Concept08SocialCompetitive() {
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
      <div style={{ flex: 1, padding: '22px 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={c.logoSrc} alt="Zybrilka" style={{ height: 20, width: 'auto' }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#1c2740',
              borderRadius: 999,
              padding: '5px 10px 5px 5px',
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#f5a623',
                color: '#0b1220',
                fontSize: 11,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {c.userStats.level}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{c.userStats.name}</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            borderRadius: 16,
            background: 'linear-gradient(90deg, rgba(245,166,35,0.16), transparent)',
            border: '1px solid rgba(245,166,35,0.3)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Icon name="achievements" size={20} />
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
            Ты в топ 15% активных учеников недели
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <div
            style={{
              flex: 1,
              background: '#131c2e',
              borderRadius: 16,
              padding: 14,
              textAlign: 'center',
            }}
          >
            <Icon name="flame" size={18} />
            <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800 }}>
              {c.userStats.streakDays}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#9aa6bf' }}>дней подряд</p>
          </div>
          <div
            style={{
              flex: 1,
              background: '#131c2e',
              borderRadius: 16,
              padding: 14,
              textAlign: 'center',
            }}
          >
            <Icon name="xp" size={18} />
            <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800 }}>{c.userStats.xp}</p>
            <p style={{ margin: 0, fontSize: 11, color: '#9aa6bf' }}>очков опыта</p>
          </div>
        </div>

        <button
          type="button"
          style={{
            marginTop: 14,
            width: '100%',
            background: '#f5a623',
            color: '#0b1220',
            border: 'none',
            borderRadius: 14,
            padding: '15px 0',
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          Обгони соперников — {c.cta.toLowerCase()}
        </button>

        <p style={{ margin: '22px 0 10px', fontSize: 13, fontWeight: 700 }}>Твои предметы</p>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {c.subjects.map((s) => (
            <div
              key={s.id}
              style={{
                flexShrink: 0,
                background: '#131c2e',
                borderRadius: 999,
                padding: '8px 14px',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
              {s.shortName} {s.mastery}%
            </div>
          ))}
        </div>

        <p style={{ margin: '22px 0 10px', fontSize: 13, fontWeight: 700 }}>Лента</p>
        <div style={{ marginBottom: 20 }}>
          {c.recentActivity.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#131c2e',
                borderRadius: 14,
                padding: '10px 12px',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: entry.correct ? 'rgba(52,199,123,0.16)' : 'rgba(255,92,92,0.16)',
                  color: entry.correct ? '#34c77b' : '#ff5c5c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={entry.correct ? 'success' : 'errorCircle'} size={15} />
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13 }}>
                  {entry.correct ? 'Решил задание' : 'Ошибся в задании'} · {entry.topic}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#5b6478' }}>{entry.date}</p>
              </div>
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
        {navItems.map((item) => {
          const isBattles = item.id === 'battles';
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                color: item.id === 'home' ? '#f5a623' : isBattles ? '#f5f7fa' : '#5b6478',
                position: 'relative',
              }}
            >
              <Icon name={item.icon} size={isBattles ? 20 : 18} />
              <span style={{ fontSize: 9 }}>{item.label}</span>
              {isBattles && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -6,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#f5a623',
                  }}
                />
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
