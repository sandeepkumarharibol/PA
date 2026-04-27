import { useState } from 'react';
import { Calendar, ChevronRight, ArrowLeft, BarChart3 } from 'lucide-react';

export default function ConfigScreen({ weekColumns, onWeekSelected, onBack }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const monthGroups = weekColumns.reduce((acc, wc, idx) => {
    const key = wc.month || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push({ ...wc, _idx: idx });
    return acc;
  }, {});

  return (
    <div style={s.page}>
      <div style={s.card}>
        <button style={s.backBtn} onClick={onBack}>
          <ArrowLeft size={15} />
          Back to Upload
        </button>

        <div style={s.header}>
          <div style={s.iconBox}>
            <Calendar size={30} color="#fff" />
          </div>
          <h1 style={s.title}>Select Week to Analyse</h1>
          <p style={s.subtitle}>
            Choose the reporting week for which you want to generate the compliance report
          </p>
        </div>

        <div style={s.monthsWrap}>
          {Object.entries(monthGroups).map(([month, weeks]) => (
            <div key={month} style={s.monthBlock}>
              <div style={s.monthLabel}>{month}</div>
              <div style={s.weeksList}>
                {weeks.map((wc) => {
                  const isHovered = hoveredIdx === wc._idx;
                  return (
                    <button
                      key={wc.colIndex}
                      style={{ ...s.weekBtn, ...(isHovered ? s.weekBtnHover : {}) }}
                      onMouseEnter={() => setHoveredIdx(wc._idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => onWeekSelected(wc)}
                    >
                      <div style={s.weekBtnLeft}>
                        <div style={{ ...s.weekIcon, ...(isHovered ? s.weekIconHover : {}) }}>
                          <BarChart3 size={16} color={isHovered ? '#fff' : '#1e4d8c'} />
                        </div>
                        <div>
                          <div style={s.weekName}>{wc.weekLabel}</div>
                          <div style={s.weekMonth}>{month} reporting period</div>
                        </div>
                      </div>
                      <ChevronRight size={17} color={isHovered ? '#1e4d8c' : '#cbd5e1'} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p style={s.hint}>
          {weekColumns.length} week{weekColumns.length !== 1 ? 's' : ''} found in the uploaded file
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(150deg, #e8eef5 0%, #dde6f0 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 8px 40px rgba(12,35,64,0.13)',
    padding: '40px 44px',
    width: '100%',
    maxWidth: '540px',
    animation: 'fadeIn 0.35s ease',
  },
  backBtn: {
    background: 'none',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '28px',
    transition: 'border-color 0.15s',
  },
  header: {
    textAlign: 'center',
    marginBottom: '36px',
  },
  iconBox: {
    width: '62px',
    height: '62px',
    background: 'linear-gradient(135deg, #0c2340 0%, #1e4d8c 100%)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 18px',
    boxShadow: '0 4px 16px rgba(12,35,64,0.25)',
  },
  title: {
    fontSize: '21px',
    fontWeight: '700',
    color: '#0c2340',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.6',
  },
  monthsWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },
  monthBlock: {},
  monthLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '10px',
    paddingLeft: '2px',
  },
  weeksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  weekBtn: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'all 0.15s ease',
    width: '100%',
    textAlign: 'left',
  },
  weekBtnHover: {
    background: '#eff6ff',
    borderColor: '#1e4d8c',
    boxShadow: '0 3px 12px rgba(30,77,140,0.15)',
    transform: 'translateX(2px)',
  },
  weekBtnLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  weekIcon: {
    width: '34px',
    height: '34px',
    background: '#eff6ff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
    flexShrink: 0,
  },
  weekIconHover: {
    background: '#1e4d8c',
  },
  weekName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '2px',
  },
  weekMonth: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  hint: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '28px',
  },
};
