import { useMemo } from 'react';
import {
  ArrowLeft, RefreshCw, Printer, CheckCircle2, XCircle,
  AlertTriangle, TrendingUp, Users, Target, Award, Zap,
  BarChart3, FileText,
} from 'lucide-react';
import {
  calculateCompliance,
  calculateAccountCompliance,
  getComplianceColor,
  generateRecommendedActions,
  findPreviousWeek,
  calculateFrequencyBreakdown,
} from '../utils/compliance';

/* ─── Shared micro-components ─────────────────────────────────────── */

function Pill({ pct, size = 'md' }) {
  const c = getComplianceColor(pct);
  const pad = size === 'sm' ? '2px 9px' : '4px 13px';
  const fs = size === 'sm' ? '12px' : '13px';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: pad,
      borderRadius: '999px', fontSize: fs, fontWeight: '700',
      background: c.pill, color: c.text, whiteSpace: 'nowrap',
    }}>
      {pct}%
    </span>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontSize: '16px', fontWeight: '700', color: '#0c2340',
      borderLeft: '4px solid #1e4d8c', paddingLeft: '12px',
      marginBottom: '20px',
    }}>
      {children}
    </h2>
  );
}

function Card({ children, style }) {
  return (
    <div className="report-section" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '28px', marginBottom: '24px', ...style }}>
      {children}
    </div>
  );
}

/* ─── Action icon resolver ─────────────────────────────────────────── */
function ActionIcon({ type, color }) {
  const props = { size: 22, color };
  switch (type) {
    case 'Award': return <Award {...props} />;
    case 'Target': return <Target {...props} />;
    case 'AlertTriangle': return <AlertTriangle {...props} />;
    case 'Users': return <Users {...props} />;
    case 'Zap': return <Zap {...props} />;
    case 'TrendingUp': return <TrendingUp {...props} />;
    default: return <Target {...props} />;
  }
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function ReportScreen({ projects, weekColumns, selectedWeek, onBack, onStartOver }) {
  const metrics = useMemo(() => calculateCompliance(projects, selectedWeek), [projects, selectedWeek]);
  const accountData = useMemo(() => calculateAccountCompliance(projects, selectedWeek), [projects, selectedWeek]);

  const allWeeksData = useMemo(() =>
    weekColumns.map((wc) => ({ ...wc, ...calculateCompliance(projects, wc) })),
    [projects, weekColumns]
  );

  // Previous comparable week — Week 1→Week 4, Week 2→Week 1, Week 3→Week 2, Week 4→Week 3
  const previousWeekCol = useMemo(() => findPreviousWeek(weekColumns, selectedWeek), [weekColumns, selectedWeek]);
  const previousMetrics = useMemo(
    () => previousWeekCol ? calculateCompliance(projects, previousWeekCol) : null,
    [projects, previousWeekCol]
  );
  const wowChange = previousMetrics !== null ? metrics.compliancePct - previousMetrics.compliancePct : null;

  const freqBreakdown = useMemo(() => calculateFrequencyBreakdown(projects, selectedWeek), [projects, selectedWeek]);

  const actions = useMemo(() =>
    generateRecommendedActions(metrics, accountData, selectedWeek),
    [metrics, accountData, selectedWeek]
  );

  const now = new Date();
  const reportDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const reportTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const mainColor = getComplianceColor(metrics.compliancePct);

  // Group non-submitted projects by account
  const nonSubmittedByAccount = useMemo(() => {
    const groups = {};
    metrics.notSubmittedProjects.forEach((p) => {
      const acc = p.accountName || 'Unknown';
      if (!groups[acc]) groups[acc] = [];
      groups[acc].push(p);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [metrics.notSubmittedProjects]);

  // Top offender accounts (lowest compliance, only those with non-submissions)
  const offenderAccounts = accountData.filter((a) => a.notSubmitted > 0).slice(0, 6);

  const handlePrint = () => window.print();

  /* ── Exec summary paragraph ───────────────────────────────────── */
  const wowSentence = wowChange !== null
    ? ` Compared to ${previousWeekCol.displayLabel} (${previousMetrics.compliancePct}%), this is a ${Math.abs(wowChange)}-point ${wowChange >= 0 ? 'improvement' : 'drop'}.`
    : '';
  const summaryText = `This report covers WSR compliance for ${selectedWeek.displayLabel}. ` +
    `Out of ${metrics.eligible} eligible project${metrics.eligible !== 1 ? 's' : ''}, ` +
    `${metrics.submitted} ${metrics.submitted !== 1 ? 'have' : 'has'} submitted their weekly status reports, ` +
    `resulting in a compliance rate of ${metrics.compliancePct}%.${wowSentence} ` +
    (metrics.notSubmitted > 0
      ? `${metrics.notSubmitted} project${metrics.notSubmitted !== 1 ? 's remain' : ' remains'} non-compliant and require immediate follow-up.`
      : 'All eligible projects have fulfilled their reporting obligations this week.');

  /* ── Status banner text ───────────────────────────────────────── */
  const statusBanner = metrics.compliancePct >= 80
    ? { icon: <CheckCircle2 size={17} color="#16a34a" />, text: 'Compliance target met (≥ 80%)', bg: '#f0fdf4', border: '#86efac', textColor: '#166534' }
    : metrics.compliancePct >= 65
    ? { icon: <AlertTriangle size={17} color="#d97706" />, text: 'Below target — intervention needed (65–79%)', bg: '#fffbeb', border: '#fcd34d', textColor: '#92400e' }
    : { icon: <XCircle size={17} color="#dc2626" />, text: 'Critical — well below minimum threshold (< 65%)', bg: '#fef2f2', border: '#fca5a5', textColor: '#991b1b' };

  return (
    <div style={s.page}>
      {/* ── Top toolbar (no-print) ──────────────────────────────── */}
      <div className="no-print" style={s.toolbar}>
        <div style={s.toolbarInner}>
          <div style={s.toolbarLeft}>
            <button style={s.toolBtn} onClick={onBack}>
              <ArrowLeft size={15} /> Back
            </button>
            <button style={{ ...s.toolBtn, ...s.toolBtnGhost }} onClick={onStartOver}>
              <RefreshCw size={15} /> New Report
            </button>
          </div>
          <div style={s.toolbarCenter}>
            <span style={s.toolbarTitle}>WSR Compliance Report</span>
            <span style={s.toolbarWeek}>{selectedWeek.displayLabel}</span>
          </div>
          <div style={s.toolbarRight}>
            <button style={s.printBtn} onClick={handlePrint}>
              <Printer size={15} /> Print / Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Printable report body ──────────────────────────────── */}
      <div style={s.reportBody}>

        {/* ════════════════════════════════════════════════════════
            SECTION 1 — Report header with KPI boxes
        ═══════════════════════════════════════════════════════════ */}
        <div className="report-section" style={s.reportHeader}>
          <div style={s.headerTop}>
            <div>
              <div style={s.headerBadge}>WSR COMPLIANCE REPORT</div>
              <h1 style={s.headerTitle}>Weekly Status Report Analysis</h1>
              <p style={s.headerSub}>{selectedWeek.displayLabel} &nbsp;•&nbsp; Generated {reportDate} at {reportTime}</p>
            </div>
            <div style={s.headerLogo}>
              <BarChart3 size={40} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
            </div>
          </div>

          {/* KPI boxes */}
          <div style={s.kpiGrid}>
            <KpiBox
              label="Total Projects"
              value={metrics.totalProjects}
              icon={<FileText size={20} color="#fff" />}
              color="#2563eb"
              bg="rgba(37,99,235,0.15)"
            />
            <KpiBox
              label="Eligible This Week"
              value={metrics.eligible}
              icon={<Users size={20} color="#fff" />}
              color="#7c3aed"
              bg="rgba(124,58,237,0.15)"
            />
            <KpiBox
              label="Not Submitted"
              value={metrics.notSubmitted}
              icon={<XCircle size={20} color="#fff" />}
              color="#dc2626"
              bg="rgba(220,38,38,0.15)"
            />
            <KpiBox
              label="Compliance Rate"
              value={`${metrics.compliancePct}%`}
              icon={<TrendingUp size={20} color="#fff" />}
              color={mainColor.text}
              bg="rgba(255,255,255,0.15)"
              highlight
              sub={mainColor.label}
            />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            SECTION 2 — Executive Summary
        ═══════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Executive Summary</SectionTitle>

          {/* Status banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '9px',
            background: statusBanner.bg, border: `1px solid ${statusBanner.border}`,
            borderRadius: '8px', padding: '10px 14px', marginBottom: '20px',
          }}>
            {statusBanner.icon}
            <span style={{ fontSize: '13px', fontWeight: '600', color: statusBanner.textColor }}>
              {statusBanner.text}
            </span>
          </div>

          {/* Summary paragraph */}
          <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.8', marginBottom: '24px' }}>
            {summaryText}
          </p>

          {/* 3 callout cards */}
          <div style={s.calloutGrid}>
            <CalloutCard
              label="Compliance Rate"
              value={`${metrics.compliancePct}%`}
              sub={`Target: 80%`}
              color={mainColor}
              icon={<TrendingUp size={20} color={mainColor.text} />}
            />
            <CalloutCard
              label="Projects Not Submitted"
              value={metrics.notSubmitted}
              sub={`of ${metrics.eligible} eligible`}
              color={getComplianceColor(metrics.notSubmitted === 0 ? 100 : metrics.notSubmitted <= 2 ? 70 : 50)}
              icon={<XCircle size={20} color={metrics.notSubmitted === 0 ? '#16a34a' : '#dc2626'} />}
            />
            {wowChange !== null ? (
              <CalloutCard
                label={`vs ${previousWeekCol.displayLabel}`}
                value={`${wowChange >= 0 ? '+' : ''}${wowChange}pts`}
                sub={`Prev: ${previousMetrics.compliancePct}% (${previousMetrics.submitted}/${previousMetrics.eligible} submitted)`}
                color={getComplianceColor(wowChange >= 0 ? 100 : wowChange >= -10 ? 70 : 40)}
                icon={<TrendingUp size={20} color={wowChange >= 0 ? '#16a34a' : '#dc2626'} />}
              />
            ) : (
              <CalloutCard
                label="Accounts Affected"
                value={offenderAccounts.length}
                sub={offenderAccounts.length === 0 ? 'All accounts compliant' : `account${offenderAccounts.length !== 1 ? 's' : ''} with gaps`}
                color={getComplianceColor(offenderAccounts.length === 0 ? 100 : offenderAccounts.length <= 2 ? 70 : 50)}
                icon={<Users size={20} color={offenderAccounts.length === 0 ? '#16a34a' : '#d97706'} />}
              />
            )}
          </div>

          {/* Frequency breakdown table */}
          <div style={{ marginTop: '24px' }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              Compliance Calculation Breakdown — {selectedWeek.displayLabel}
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Frequency', 'Eligible Projects', 'Submitted (O / D)', 'Not Submitted', 'Compliance %'].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {freqBreakdown.rows.map((row, i) => {
                    const pct = row.eligible > 0 ? Math.round((row.submitted / row.eligible) * 100) : 0;
                    return (
                      <tr key={row.frequency} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ ...s.td, fontWeight: '600', color: '#1e293b' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: row.frequency === 'Weekly' ? '#2563eb' : row.frequency === 'Bi-Weekly' ? '#7c3aed' : '#d97706', flexShrink: 0 }} />
                            {row.frequency}
                          </span>
                        </td>
                        <td style={{ ...s.td, textAlign: 'center', fontWeight: '600' }}>{row.eligible}</td>
                        <td style={{ ...s.td, textAlign: 'center', color: '#16a34a', fontWeight: '700' }}>{row.submitted}</td>
                        <td style={{ ...s.td, textAlign: 'center', color: row.notSubmitted > 0 ? '#dc2626' : '#16a34a', fontWeight: '700' }}>{row.notSubmitted}</td>
                        <td style={{ ...s.td, textAlign: 'center' }}><Pill pct={pct} size="sm" /></td>
                      </tr>
                    );
                  })}
                  {/* Total row */}
                  <tr style={{ background: '#f0f7ff', borderTop: '2px solid #1e4d8c' }}>
                    <td style={{ ...s.td, fontWeight: '800', color: '#0c2340' }}>TOTAL</td>
                    <td style={{ ...s.td, textAlign: 'center', fontWeight: '800', color: '#0c2340' }}>{freqBreakdown.total.eligible}</td>
                    <td style={{ ...s.td, textAlign: 'center', fontWeight: '800', color: '#16a34a' }}>{freqBreakdown.total.submitted}</td>
                    <td style={{ ...s.td, textAlign: 'center', fontWeight: '800', color: freqBreakdown.total.notSubmitted > 0 ? '#dc2626' : '#16a34a' }}>{freqBreakdown.total.notSubmitted}</td>
                    <td style={{ ...s.td, textAlign: 'center' }}><Pill pct={metrics.compliancePct} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
              Compliance = Total Submitted ÷ Total Eligible × 100 &nbsp;•&nbsp;
              Submitted = O (On Time) + D (Delayed) &nbsp;•&nbsp;
              Not Submitted = all other statuses (N, ND, NA, blank)
            </p>
          </div>
        </Card>

        {/* ════════════════════════════════════════════════════════
            SECTION 3 — Week-on-Week Summary Table
        ═══════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Week-on-Week Compliance Summary</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Month', 'Week', 'Total Projects', 'Eligible', 'Submitted', 'Not Submitted', 'Compliance'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allWeeksData.map((wd, i) => {
                  const isSelected = wd.colIndex === selectedWeek.colIndex;
                  const c = getComplianceColor(wd.compliancePct);
                  return (
                    <tr key={wd.colIndex} style={{
                      background: isSelected ? '#f0f7ff' : i % 2 === 0 ? '#fff' : '#fafafa',
                    }}>
                      <td style={{ ...s.td, fontWeight: isSelected ? '600' : '400', color: isSelected ? '#0c2340' : '#64748b' }}>
                        {wd.month}
                      </td>
                      <td style={{ ...s.td, fontWeight: '600', color: isSelected ? '#1e4d8c' : '#1e293b' }}>
                        {wd.weekLabel}
                        {isSelected && (
                          <span style={{ marginLeft: '8px', fontSize: '10px', background: '#1e4d8c', color: '#fff', borderRadius: '4px', padding: '1px 6px', fontWeight: '600' }}>
                            SELECTED
                          </span>
                        )}
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' }}>{wd.totalProjects}</td>
                      <td style={{ ...s.td, textAlign: 'center' }}>{wd.eligible}</td>
                      <td style={{ ...s.td, textAlign: 'center', color: '#16a34a', fontWeight: '600' }}>{wd.submitted}</td>
                      <td style={{ ...s.td, textAlign: 'center', color: wd.notSubmitted > 0 ? '#dc2626' : '#16a34a', fontWeight: '600' }}>{wd.notSubmitted}</td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <Pill pct={wd.compliancePct} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ════════════════════════════════════════════════════════
            SECTION 4 — Account-wise Compliance (Top Offenders)
        ═══════════════════════════════════════════════════════════ */}
        {offenderAccounts.length > 0 && (
          <Card>
            <SectionTitle>Account-wise Compliance — Top Offenders</SectionTitle>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              Accounts ranked by compliance rate (lowest first) for {selectedWeek.displayLabel}.
              Only accounts with non-submissions are shown.
            </p>
            <div style={s.accountGrid}>
              {offenderAccounts.map((acc) => {
                const c = getComplianceColor(acc.compliancePct);
                const barPct = Math.max(4, acc.compliancePct);
                return (
                  <div key={acc.accountName} style={{ ...s.accountCard, borderTop: `4px solid ${c.text}` }}>
                    <div style={s.accountCardHeader}>
                      <div style={s.accountName} title={acc.accountName}>{acc.accountName || 'Unknown'}</div>
                      <Pill pct={acc.compliancePct} size="sm" />
                    </div>
                    <div style={s.accountStats}>
                      <span style={s.accountStatItem}>
                        <span style={{ color: '#16a34a', fontWeight: '700' }}>{acc.submitted}</span>
                        <span style={{ color: '#94a3b8' }}> submitted</span>
                      </span>
                      <span style={s.accountStatSep}>•</span>
                      <span style={s.accountStatItem}>
                        <span style={{ color: '#dc2626', fontWeight: '700' }}>{acc.notSubmitted}</span>
                        <span style={{ color: '#94a3b8' }}> missing</span>
                      </span>
                      <span style={s.accountStatSep}>•</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{acc.eligible} eligible</span>
                    </div>
                    {/* Progress bar */}
                    <div style={s.progressTrack}>
                      <div style={{ ...s.progressFill, width: `${barPct}%`, background: c.text }} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', textAlign: 'right' }}>
                      {acc.notSubmitted} project{acc.notSubmitted !== 1 ? 's' : ''} pending
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════
            SECTION 5 — Non-Submitted Projects Detail
        ═══════════════════════════════════════════════════════════ */}
        {metrics.notSubmittedProjects.length > 0 && (
          <Card>
            <SectionTitle>Non-Submitted Projects — Detailed View</SectionTitle>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              {metrics.notSubmitted} project{metrics.notSubmitted !== 1 ? 's' : ''} did not submit WSR for {selectedWeek.displayLabel}. Grouped by account.
            </p>
            {nonSubmittedByAccount.map(([accountName, projectList]) => (
              <div key={accountName} style={s.nsAccountBlock}>
                <div style={s.nsAccountHeader}>
                  <div style={s.nsAccountTitle}>{accountName}</div>
                  <div style={s.nsAccountCount}>{projectList.length} project{projectList.length !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ ...s.table, marginBottom: 0 }}>
                    <thead>
                      <tr>
                        {['Project Name', 'DA Name', 'GDL', 'Frequency', 'Status'].map((h) => (
                          <th key={h} style={{ ...s.th, background: '#f8fafc' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {projectList.map((p, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ ...s.td, fontWeight: '500', color: '#1e293b' }}>{p.projectName}</td>
                          <td style={s.td}>{p.daName || '—'}</td>
                          <td style={s.td}>{p.gdlName || '—'}</td>
                          <td style={s.td}>
                            <span style={{ fontSize: '12px', background: '#f1f5f9', borderRadius: '4px', padding: '2px 8px', color: '#475569', fontWeight: '500' }}>
                              {p.frequency || '—'}
                            </span>
                          </td>
                          <td style={s.td}>
                            <span style={{ fontSize: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '4px', padding: '2px 8px', fontWeight: '700' }}>
                              Not Submitted
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </Card>
        )}

        {metrics.notSubmittedProjects.length === 0 && (
          <Card>
            <SectionTitle>Non-Submitted Projects — Detailed View</SectionTitle>
            <div style={{ textAlign: 'center', padding: '32px', color: '#16a34a' }}>
              <CheckCircle2 size={40} color="#16a34a" strokeWidth={1.5} style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>All eligible projects submitted!</p>
              <p style={{ fontSize: '13px', color: '#64748b' }}>No non-submissions for {selectedWeek.displayLabel}.</p>
            </div>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════
            SECTION 6 — Recommended Actions
        ═══════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Recommended Actions</SectionTitle>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            Dynamic action points generated based on {selectedWeek.displayLabel} compliance data.
          </p>
          <div style={s.actionsGrid}>
            {actions.map((action, i) => (
              <div key={i} style={{ ...s.actionCard, background: action.bgColor, borderLeft: `4px solid ${action.color}` }}>
                <div style={s.actionHeader}>
                  <div style={{ ...s.actionIconBox, background: action.color + '20' }}>
                    <ActionIcon type={action.type} color={action.color} />
                  </div>
                  <div style={{ ...s.actionNum, color: action.color }}>Action {i + 1}</div>
                </div>
                <h3 style={{ ...s.actionTitle, color: action.color }}>{action.title}</h3>
                <p style={s.actionDesc}>{action.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* ════════════════════════════════════════════════════════
            SECTION 7 — Footer
        ═══════════════════════════════════════════════════════════ */}
        <div className="report-section" style={s.footer}>
          <div style={s.footerTop}>
            <div>
              <div style={s.footerTitle}>WSR Compliance Analyser</div>
              <div style={s.footerSub}>Automated compliance reporting for Weekly Status Reports</div>
            </div>
            <div style={s.footerRight}>
              <div style={s.footerBadge}>CONFIDENTIAL</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>For Internal Use Only</div>
            </div>
          </div>
          <div style={s.footerDivider} />
          <div style={s.footerMeta}>
            <span>Reporting Period: <strong>{selectedWeek.displayLabel}</strong></span>
            <span>•</span>
            <span>Generated: <strong>{reportDate} at {reportTime}</strong></span>
            <span>•</span>
            <span>Total Projects Analysed: <strong>{metrics.totalProjects}</strong></span>
            <span>•</span>
            <span>Compliance: <strong>{metrics.compliancePct}%</strong></span>
          </div>
        </div>

      </div>{/* end reportBody */}
    </div>
  );
}

/* ─── KPI Box sub-component ─────────────────────────────────────── */
function KpiBox({ label, value, icon, color, bg, highlight, sub }) {
  return (
    <div style={{
      background: highlight ? 'rgba(255,255,255,0.12)' : bg,
      borderRadius: '12px',
      padding: '20px 22px',
      border: highlight ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{ width: '36px', height: '36px', background: highlight ? 'rgba(255,255,255,0.15)' : color, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: '500', lineHeight: '1.3' }}>{label}</span>
      </div>
      <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff', lineHeight: '1', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '6px', fontWeight: '500' }}>{sub}</div>}
    </div>
  );
}

/* ─── Callout card sub-component ───────────────────────────────── */
function CalloutCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: color.bg,
      border: `1px solid ${color.border}`,
      borderRadius: '10px',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        {icon}
      </div>
      <div style={{ fontSize: '30px', fontWeight: '800', color: color.text, lineHeight: '1', letterSpacing: '-0.5px', marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#64748b' }}>{sub}</div>
    </div>
  );
}

/* ─── Styles ────────────────────────────────────────────────────── */
const s = {
  page: {
    background: '#f0f4f8',
    minHeight: '100vh',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  toolbar: {
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 8px rgba(12,35,64,0.06)',
  },
  toolbarInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  toolbarLeft: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },
  toolbarCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    flex: 1,
    minWidth: 0,
  },
  toolbarTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0c2340',
    whiteSpace: 'nowrap',
  },
  toolbarWeek: {
    fontSize: '12px',
    color: '#64748b',
    whiteSpace: 'nowrap',
  },
  toolbarRight: {
    flexShrink: 0,
  },
  toolBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '13px',
    color: '#475569',
    cursor: 'pointer',
    fontWeight: '500',
  },
  toolBtnGhost: {
    color: '#64748b',
  },
  printBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    background: 'linear-gradient(135deg, #0c2340 0%, #1e4d8c 100%)',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 18px',
    fontSize: '13px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(12,35,64,0.25)',
  },
  reportBody: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px 48px',
    animation: 'fadeIn 0.4s ease',
  },
  /* Report header */
  reportHeader: {
    background: 'linear-gradient(135deg, #0c2340 0%, #1a3a6e 50%, #1e4d8c 100%)',
    borderRadius: '16px',
    padding: '36px 36px 32px',
    marginBottom: '24px',
    boxShadow: '0 8px 32px rgba(12,35,64,0.25)',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '32px',
    gap: '16px',
  },
  headerBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: '0.12em',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '4px',
    padding: '3px 9px',
    marginBottom: '10px',
  },
  headerTitle: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '8px',
    letterSpacing: '-0.3px',
  },
  headerSub: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '400',
  },
  headerLogo: {
    opacity: 0.6,
    flexShrink: 0,
    paddingTop: '8px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '14px',
  },
  /* Callout cards */
  calloutGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  /* Tables */
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    background: '#f1f5f9',
    color: '#475569',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: '10px 14px',
    textAlign: 'left',
    borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '11px 14px',
    color: '#475569',
    fontSize: '13px',
    borderBottom: '1px solid #f1f5f9',
  },
  /* Account offender cards */
  accountGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  accountCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '18px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  accountCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '10px',
  },
  accountName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  accountStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    marginBottom: '12px',
  },
  accountStatItem: {
    fontSize: '12px',
  },
  accountStatSep: {
    color: '#cbd5e1',
    fontSize: '10px',
  },
  progressTrack: {
    height: '7px',
    background: '#f1f5f9',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '99px',
    transition: 'width 0.4s ease',
  },
  /* Non-submitted grouped table */
  nsAccountBlock: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '16px',
  },
  nsAccountHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#1e293b',
    padding: '10px 16px',
  },
  nsAccountTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#fff',
  },
  nsAccountCount: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '4px',
    padding: '2px 8px',
  },
  /* Recommended Actions */
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  actionCard: {
    borderRadius: '10px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  actionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  actionIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionNum: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    opacity: 0.8,
  },
  actionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '8px',
    lineHeight: '1.4',
  },
  actionDesc: {
    fontSize: '13px',
    color: '#475569',
    lineHeight: '1.7',
  },
  /* Footer */
  footer: {
    background: 'linear-gradient(135deg, #0c2340 0%, #1a3a6e 100%)',
    borderRadius: '14px',
    padding: '28px 32px',
    marginTop: '8px',
  },
  footerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '20px',
  },
  footerTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '4px',
  },
  footerSub: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.55)',
  },
  footerRight: {
    textAlign: 'right',
    flexShrink: 0,
  },
  footerBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    background: 'rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.8)',
    borderRadius: '4px',
    padding: '3px 10px',
  },
  footerDivider: {
    height: '1px',
    background: 'rgba(255,255,255,0.1)',
    marginBottom: '16px',
  },
  footerMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
  },
};
