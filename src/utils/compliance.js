function normalizeFreq(freq) {
  // Strip ALL non-alphabetic characters (handles hyphens, en-dashes, em-dashes,
  // non-breaking spaces, and any other special chars Excel may insert)
  return String(freq).toUpperCase().replace(/[^A-Z]/g, '');
}

export function getEligibleFrequencies(weekNumber) {
  switch (weekNumber) {
    case 1: return ['WEEKLY'];
    case 2: return ['WEEKLY', 'BIWEEKLY'];
    case 3: return ['WEEKLY'];
    case 4:
    case 5: return ['WEEKLY', 'BIWEEKLY', 'MONTHLY'];
    default: return ['WEEKLY'];
  }
}

export function isEligible(project, weekNumber) {
  if (String(project.status).toUpperCase() !== 'YES') return false;
  const eligibleFreqs = getEligibleFrequencies(weekNumber);
  return eligibleFreqs.includes(normalizeFreq(project.frequency));
}

export function getWeekValue(project, colIndex) {
  const wv = project.weekValues.find((w) => w.colIndex === colIndex);
  // Trim + uppercase here too in case any value slipped through without normalisation
  return wv ? String(wv.value).trim().toUpperCase() : '';
}

function isSubmitted(val) {
  // Accept O, D (and full words "ON TIME", "DELAYED" just in case)
  return val === 'O' || val === 'D' || val === 'ONTIME' || val === 'DELAYED';
}

export function calculateCompliance(projects, weekColumn) {
  const { weekNumber, colIndex } = weekColumn;

  const eligibleProjects = projects.filter((p) => isEligible(p, weekNumber));

  const submittedProjects = eligibleProjects.filter((p) => isSubmitted(getWeekValue(p, colIndex)));
  const notSubmittedProjects = eligibleProjects.filter((p) => !isSubmitted(getWeekValue(p, colIndex)));

  const eligible = eligibleProjects.length;
  const submitted = submittedProjects.length;
  const notSubmitted = notSubmittedProjects.length;
  const compliancePct = eligible > 0 ? Math.round((submitted / eligible) * 100) : 0;

  return {
    totalProjects: projects.length,
    eligible,
    submitted,
    notSubmitted,
    compliancePct,
    eligibleProjects,
    submittedProjects,
    notSubmittedProjects,
  };
}

export function getComplianceColor(pct) {
  if (pct >= 80) return { text: '#16a34a', bg: '#f0fdf4', pill: '#dcfce7', border: '#86efac', label: 'Good' };
  if (pct >= 65) return { text: '#d97706', bg: '#fffbeb', pill: '#fef3c7', border: '#fcd34d', label: 'Moderate' };
  return { text: '#dc2626', bg: '#fef2f2', pill: '#fee2e2', border: '#fca5a5', label: 'Critical' };
}

export function calculateAccountCompliance(projects, weekColumn) {
  const { weekNumber, colIndex } = weekColumn;
  const accounts = {};

  projects.forEach((p) => {
    if (!isEligible(p, weekNumber)) return;
    const acc = p.accountName || 'Unknown';
    if (!accounts[acc]) {
      accounts[acc] = {
        accountName: acc,
        eligible: 0,
        submitted: 0,
        notSubmitted: 0,
        notSubmittedProjects: [],
      };
    }
    accounts[acc].eligible++;
    const val = getWeekValue(p, colIndex);
    if (isSubmitted(val)) {
      accounts[acc].submitted++;
    } else {
      accounts[acc].notSubmitted++;
      accounts[acc].notSubmittedProjects.push(p);
    }
  });

  return Object.values(accounts)
    .map((acc) => ({
      ...acc,
      compliancePct: acc.eligible > 0 ? Math.round((acc.submitted / acc.eligible) * 100) : 0,
    }))
    .sort((a, b) => a.compliancePct - b.compliancePct);
}

// Breaks down eligible/submitted/not-submitted per frequency group for the selected week.
// Week 2 example: Weekly (149 eligible, 98 submitted) + Bi-Weekly (7 eligible, 6 submitted)
//                 → Total eligible 156, submitted 104, compliance 67%
export function calculateFrequencyBreakdown(projects, weekColumn) {
  const { weekNumber, colIndex } = weekColumn;
  const freqGroups = getEligibleFrequencies(weekNumber);

  const rows = freqGroups.map((freq) => {
    const eligible = projects.filter(
      (p) => String(p.status).toUpperCase() === 'YES' && normalizeFreq(p.frequency) === freq
    );
    const submitted = eligible.filter((p) => isSubmitted(getWeekValue(p, colIndex)));
    const notSubmitted = eligible.filter((p) => !isSubmitted(getWeekValue(p, colIndex)));

    const label = freq === 'WEEKLY' ? 'Weekly' : freq === 'BIWEEKLY' ? 'Bi-Weekly' : 'Monthly';
    return {
      frequency: label,
      eligible: eligible.length,
      submitted: submitted.length,
      notSubmitted: notSubmitted.length,
    };
  });

  const total = rows.reduce(
    (acc, r) => ({
      frequency: 'Total',
      eligible: acc.eligible + r.eligible,
      submitted: acc.submitted + r.submitted,
      notSubmitted: acc.notSubmitted + r.notSubmitted,
    }),
    { eligible: 0, submitted: 0, notSubmitted: 0 }
  );

  return { rows, total };
}

// Finds the correct previous comparable week for week-on-week comparison.
// Week 1 → compare with most recent Week 4 (previous month uses Weekly+Biweekly+Monthly)
// Week 2 → compare with Week 1  (Weekly only)
// Week 3 → compare with Week 2  (Weekly+Biweekly)
// Week 4 → compare with Week 3  (Weekly only)
// Week 5 → compare with Week 4  (Weekly+Biweekly+Monthly)
export function findPreviousWeek(weekColumns, selectedWeek) {
  const currentIdx = weekColumns.findIndex((wc) => wc.colIndex === selectedWeek.colIndex);
  if (currentIdx <= 0) return null;

  const targetWeekNum = selectedWeek.weekNumber === 1 ? 4 : selectedWeek.weekNumber - 1;

  for (let i = currentIdx - 1; i >= 0; i--) {
    if (weekColumns[i].weekNumber === targetWeekNum) return weekColumns[i];
  }
  // If target was week 4 and not found, try week 5 (some months have 5 weeks)
  if (targetWeekNum === 4) {
    for (let i = currentIdx - 1; i >= 0; i--) {
      if (weekColumns[i].weekNumber === 5) return weekColumns[i];
    }
  }
  return null;
}

export function generateRecommendedActions(metrics, accountData, selectedWeek) {
  const { compliancePct, notSubmitted, eligible, submitted, notSubmittedProjects } = metrics;
  const actions = [];

  // Action 1: Overall compliance
  if (compliancePct >= 80) {
    actions.push({
      type: 'Award',
      color: '#16a34a',
      bgColor: '#f0fdf4',
      title: 'Maintain Compliance Standards',
      description: `Outstanding performance at ${compliancePct}% compliance, exceeding the 80% target. Send acknowledgment to all contributing DAs and teams, and maintain current reporting cadence for ${selectedWeek.displayLabel}.`,
    });
  } else if (compliancePct >= 65) {
    actions.push({
      type: 'Target',
      color: '#d97706',
      bgColor: '#fffbeb',
      title: 'Targeted Follow-Up Required',
      description: `Compliance stands at ${compliancePct}%, below the 80% target. Send immediate reminders to all ${notSubmitted} non-compliant project team(s) and escalate to DA managers. Aim to close outstanding submissions within 24 hours.`,
    });
  } else {
    actions.push({
      type: 'AlertTriangle',
      color: '#dc2626',
      bgColor: '#fef2f2',
      title: 'Critical Escalation Required',
      description: `Compliance is critically low at ${compliancePct}% — well below the minimum 65% threshold. Immediate escalation to GDL leadership is required. ${notSubmitted} of ${eligible} eligible projects are non-compliant and need urgent attention.`,
    });
  }

  // Action 2: Top offender account
  const worstAccount = accountData.find((a) => a.notSubmitted > 0);
  if (worstAccount) {
    actions.push({
      type: 'Users',
      color: '#7c3aed',
      bgColor: '#faf5ff',
      title: `Priority Account: ${worstAccount.accountName}`,
      description: `${worstAccount.accountName} has ${worstAccount.notSubmitted} non-submitted project(s) with only ${worstAccount.compliancePct}% compliance (${worstAccount.submitted}/${worstAccount.eligible} submitted). Assign a dedicated follow-up owner and schedule a compliance review call within 24 hours.`,
    });
  } else {
    actions.push({
      type: 'Users',
      color: '#16a34a',
      bgColor: '#f0fdf4',
      title: 'All Accounts On Track',
      description: `All accounts have submitted their WSR reports for ${selectedWeek.displayLabel}. Recognise the effort across all account teams and share this achievement in the next leadership update.`,
    });
  }

  // Action 3: DA accountability
  const daNames = [...new Set(notSubmittedProjects.map((p) => p.daName).filter(Boolean))];
  if (daNames.length > 0) {
    const listed = daNames.slice(0, 3).join(', ') + (daNames.length > 3 ? ` and ${daNames.length - 3} more` : '');
    actions.push({
      type: 'Zap',
      color: '#2563eb',
      bgColor: '#eff6ff',
      title: 'DA Accountability Check',
      description: `${daNames.length} Delivery Analyst(s) have pending WSR submissions: ${listed}. Send a direct communication with a firm 48-hour deadline and flag repeat offenders for performance tracking.`,
    });
  } else {
    actions.push({
      type: 'Zap',
      color: '#2563eb',
      bgColor: '#eff6ff',
      title: 'DA Performance Acknowledged',
      description: `All Delivery Analysts have fulfilled their WSR submission responsibilities for this week. Document this positive trend and use it as a benchmark for upcoming weeks.`,
    });
  }

  // Action 4: Recovery plan or sustain
  const neededForTarget = Math.max(0, Math.ceil(0.8 * eligible) - submitted);
  if (neededForTarget > 0) {
    actions.push({
      type: 'TrendingUp',
      color: '#0891b2',
      bgColor: '#ecfeff',
      title: 'Recovery Plan – Close the Gap',
      description: `To reach the 80% compliance target, ${neededForTarget} additional submission(s) are needed. Schedule a WSR compliance review meeting within 2 business days and establish daily check-ins until the target is achieved. Track progress on a shared dashboard.`,
    });
  } else {
    actions.push({
      type: 'TrendingUp',
      color: '#16a34a',
      bgColor: '#f0fdf4',
      title: 'Sustain & Push for 100%',
      description: `The 80% target is met. Now focus on converting any delayed submissions to on-time, and work towards eliminating the ${notSubmitted > 0 ? notSubmitted + ' remaining non-submission(s)' : 'any future non-submissions'}. Aim for 100% compliance in the next reporting cycle.`,
    });
  }

  return actions;
}
