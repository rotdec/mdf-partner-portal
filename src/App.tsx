import React, { useState, useMemo } from 'react';

// ============================================================
// SUPABASE
// ============================================================
const SB_URL = 'https://phpzvynjccegalkezlnb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBocHp2eW5qY2NlZ2Fsa2V6bG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mjk2MTAsImV4cCI6MjA5NTEwNTYxMH0.fHZOlPnPa-oEyx5KUDsiV_cpVVsriWZqB6R2H50HFoE';
const _sh = {
  apikey: SB_KEY,
  Authorization: 'Bearer ' + SB_KEY,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};
const _su = function (t, q) {
  return SB_URL + '/rest/v1/' + t + (q ? '?' + q : '');
};
const dbSelect = async function (table, q) {
  const r = await fetch(_su(table, q), { headers: _sh });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};
const dbUpsert = async function (table, data) {
  const r = await fetch(_su(table), {
    method: 'POST',
    headers: Object.assign({}, _sh, {
      Prefer: 'resolution=merge-duplicates,return=representation',
    }),
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};
const dbPatch = async function (table, col, val, data) {
  const r = await fetch(_su(table, col + '=eq.' + encodeURIComponent(val)), {
    method: 'PATCH',
    headers: _sh,
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

const _dbToReq = function (r, items) {
  return {
    id: r.id,
    partner: r.partner_name,
    submitted: r.submitted,
    status: r.status,
    assignedTo: r.assigned_to || '',
    poNumber: r.po_number || '',
    note: r.note || '',
    partnerNotified: r.partner_notified || false,
    bpGeneratedAt: r.bp_generated_at || '',
    items: (items || []).map(function (it) {
      return {
        id: it.id,
        fyHalf: it.fy_half,
        fyQuarter: it.fy_quarter,
        month: it.month,
        period: it.period,
        productGroup: it.product_group,
        tactic: it.tactic,
        title: it.title,
        where: it.where_field,
        targetAudience: it.target_audience,
        targetSolutions:
          typeof it.target_solutions === 'string'
            ? JSON.parse(it.target_solutions)
            : it.target_solutions || [],
        objective: it.objective,
        amount: Number(it.amount || 0),
        mdfRequest: Number(it.mdf_request || 0),
        localCurrency: it.local_currency || 'EUR',
        itemStatus: it.item_status || 'request_submitted',
        assignedTo: it.assigned_to || '',
        allocadiaId: it.allocadia_id || '',
        cancelReason: it.cancel_reason || null,
        postponedTo: it.postponed_to || null,
        acknowledged: it.acknowledged || false,
      };
    }),
  };
};

const _dbToClaim = function (r) {
  return {
    id: r.id,
    reqId: r.req_id,
    itemId: r.item_id,
    partner: r.partner,
    activity: r.activity,
    claimAmount: Number(r.claim_amount || 0),
    vatPct: Number(r.vat_pct || 0),
    totalValue: Number(r.total_value || 0),
    currency: r.currency || 'EUR',
    submitted: r.submitted,
    status: r.status,
    files: typeof r.files === 'string' ? JSON.parse(r.files) : r.files || {},
    notes: r.notes || '',
    fyHalf: r.fy_half,
    fyQuarter: r.fy_quarter,
    month: r.month,
    reviewNotesMarketing: r.review_notes_marketing || '',
    reviewNotesFinance: r.review_notes_finance || '',
    statusHistory:
      typeof r.status_history === 'string'
        ? JSON.parse(r.status_history)
        : r.status_history || [],
  };
};

const _reqToDB = function (req) {
  return {
    id: req.id,
    partner_name: req.partner,
    submitted: req.submitted,
    status: req.status || 'request_submitted',
    assigned_to: req.assignedTo || '',
    po_number: req.poNumber || '',
    note: req.note || '',
    partner_notified: req.partnerNotified || false,
    updated_at: new Date().toISOString(),
  };
};

const _itemToDB = function (it, reqId) {
  return {
    id: it.id,
    request_id: reqId,
    tactic: it.tactic || '',
    title: it.title || it.objective || '',
    product_group: it.productGroup || '',
    target_solutions: JSON.stringify(
      Array.isArray(it.targetSolutions)
        ? it.targetSolutions
        : [it.targetSolutions || '']
    ),
    amount: Number(it.amount || 0),
    mdf_request: Number(it.mdfRequest || Math.round((it.amount || 0) * 0.5)),
    local_currency: it.localCurrency || 'EUR',
    campaign_id: it.campaignId || '',
    allocadia_id: it.allocadiaId || '',
    fy_half: it.fyHalf || '',
    fy_quarter: it.fyQuarter || '',
    month: it.month || '',
    period: it.period || '',
    where_field: it.where || '',
    target_audience: it.targetAudience || '',
    objective: it.objective || '',
    item_status: it.itemStatus || 'request_submitted',
    assigned_to: it.assignedTo || '',
    allocadia_id: it.allocadiaId || '',
    cancel_reason: it.cancelReason || null,
    postponed_to: it.postponedTo || null,
    acknowledged: it.acknowledged || false,
  };
};

const _claimToDB = function (c) {
  var now = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return {
    id: c.id,
    req_id: c.reqId,
    item_id: c.itemId || '',
    partner: c.partner,
    activity: c.activity,
    claim_amount: Number(c.claimAmount || 0),
    vat_pct: Number(c.vatPct || 0),
    total_value: Number(c.totalValue || 0),
    currency: c.currency || 'EUR',
    submitted: c.submitted || new Date().toISOString().slice(0, 10),
    status: c.status || 'submitted',
    files: JSON.stringify(c.files || {}),
    notes: c.notes || '',
    fy_half: c.fyHalf || '',
    fy_quarter: c.fyQuarter || '',
    month: c.month || '',
    review_notes_marketing: c.reviewNotesMarketing || '',
    review_notes_finance: c.reviewNotesFinance || '',
    status_history: JSON.stringify(
      c.statusHistory || [
        {
          status: 'submitted',
          by: c.partner,
          at: now,
          note: 'Claim submitted via partner portal',
        },
      ]
    ),
  };
};

// --- THEME --------------------------------------------------------------------
const C = {
  bg: '#f0f4ff',
  surface: '#ffffff',
  card: '#ffffff',
  border: '#c8d4f0',
  accent: '#1a6aff',
  accentGlow: 'rgba(26,106,255,0.10)',
  cyan: '#0055bb',
  success: '#007a3d',
  warning: '#b85c00',
  danger: '#cc0000',
  purple: '#5533cc',
  teal: '#006688',
  text: '#0a0a1a',
  muted: '#4455aa',
  faint: '#eef1fb',
  navBg: '#00008b',
  navText: '#ffffff',
};

// --- CONSTANTS ----------------------------------------------------------------
const PRODUCT_GROUPS = [
  'Content (ECS)',
  'Experience (DX)',
  'Experience / Content',
  'OSM',
  'Portfolio',
  'CyberSecurity',
  'Cross BU',
];
const TACTICS = [
  'Customer Assessment',
  'Digital Advertising',
  'Digital Marketing / Content Syndication',
  'Direct Mail',
  'Email Campaign',
  'In-Person Event',
  'Online Advertising',
  'Partner Enablement',
  'Print Advertising',
  'SPIFF',
  'Telemarketing',
  'Trade Show / Exhibition',
  'Virtual Event / Webinar',
  'Workshop / Seminar',
  'Other',
];
const PARTNER_TYPES = ['Reseller', 'Distributor', 'GSI', 'ISVP'];
const FY_HALVES = ['FY26 H1', 'FY26 H2', 'FY27 H1', 'FY27 H2'];
const QUARTERS_BY_HALF = { H1: ['Q1', 'Q2'], H2: ['Q3', 'Q4'] };
const MONTHS_BY_QUARTER = {
  Q1: ['July', 'August', 'September'],
  Q2: ['October', 'November', 'December'],
  Q3: ['January', 'February', 'March'],
  Q4: ['April', 'May', 'June'],
};
const CURRENCY_SYMBOLS = {
  USD: 'USD ',
  EUR: '\u20ac',
  GBP: '\u00a3',
  CHF: 'CHF ',
  SEK: 'kr ',
  NOK: 'kr ',
  DKK: 'kr ',
  PLN: 'z\u0142 ',
  SGD: 'S$ ',
  AUD: 'A$ ',
};
const fmtLC = (n, cur) =>
  (CURRENCY_SYMBOLS[cur] || cur + ' ') + Number(n || 0).toLocaleString('en-US');

// --- SAMPLE DATA (in production this comes from Supabase) --------------------
const SAMPLE_PARTNERS = [
  {
    id: 'p1',
    name: 'TechVision Ltd',
    region: 'Europe',
    subregion: 'UK&I',
    country: 'UK',
    type: 'Reseller',
    tier: 'Platinum',
    allocated: 50000,
    spent: 32000,
    pending: 8000,
    status: 'Active',
    contactName: 'John Smith',
    contactEmail: 'j.smith@techvision.com',
    accountManager: 'Sarah Jones',
  },
  {
    id: 'p2',
    name: 'CloudSys GmbH',
    region: 'Europe',
    subregion: 'DACH',
    country: 'Germany',
    type: 'Reseller',
    tier: 'Gold',
    allocated: 30000,
    spent: 18000,
    pending: 5000,
    status: 'Active',
    contactName: 'Hans Mueller',
    contactEmail: 'h.mueller@cloudsys.de',
    accountManager: 'Sarah Jones',
  },
  {
    id: 'p3',
    name: 'Nordic IT AB',
    region: 'Europe',
    subregion: 'Nordics',
    country: 'Sweden',
    type: 'Distributor',
    tier: 'Silver',
    allocated: 15000,
    spent: 9000,
    pending: 0,
    status: 'Active',
    contactName: 'Anna Svensson',
    contactEmail: 'a.svensson@nordicit.se',
    accountManager: 'Mike Brown',
  },
  {
    id: 'p4',
    name: 'France Digitale',
    region: 'Europe',
    subregion: 'France',
    country: 'France',
    type: 'Reseller',
    tier: 'Platinum',
    allocated: 45000,
    spent: 28000,
    pending: 10000,
    status: 'Active',
    contactName: 'Marie Dupont',
    contactEmail: 'm.dupont@france-dig.fr',
    accountManager: 'Sarah Jones',
  },
  {
    id: 'p5',
    name: 'Italia Cloud SpA',
    region: 'Europe',
    subregion: 'Italy',
    country: 'Italy',
    type: 'Reseller',
    tier: 'Gold',
    allocated: 20000,
    spent: 12000,
    pending: 4000,
    status: 'Active',
    contactName: 'Marco Rossi',
    contactEmail: 'm.rossi@italiacloud.it',
    accountManager: 'Mike Brown',
  },
  {
    id: 'p6',
    name: 'American Tech Corp',
    region: 'US',
    subregion: 'US',
    country: 'USA',
    type: 'Reseller',
    tier: 'Platinum',
    allocated: 80000,
    spent: 55000,
    pending: 15000,
    status: 'Active',
    contactName: 'Bob Johnson',
    contactEmail: 'b.johnson@amtech.com',
    accountManager: 'Tom Davis',
  },
  {
    id: 'p7',
    name: 'Canada Cloud Inc',
    region: 'US',
    subregion: 'Canada',
    country: 'Canada',
    type: 'Reseller',
    tier: 'Gold',
    allocated: 35000,
    spent: 20000,
    pending: 5000,
    status: 'Active',
    contactName: 'Lisa Chen',
    contactEmail: 'l.chen@canadacloud.ca',
    accountManager: 'Tom Davis',
  },
  {
    id: 'p8',
    name: 'Gulf Tech LLC',
    region: 'International',
    subregion: 'META',
    country: 'UAE',
    type: 'Reseller',
    tier: 'Gold',
    allocated: 28000,
    spent: 15000,
    pending: 6000,
    status: 'Active',
    contactName: 'Ahmed Al-Rashid',
    contactEmail: 'a.rashid@gulftech.ae',
    accountManager: 'Mike Brown',
  },
  {
    id: 'p9',
    name: 'AsiaPac Solutions',
    region: 'International',
    subregion: 'APAC',
    country: 'Singapore',
    type: 'GSI',
    tier: 'Platinum',
    allocated: 40000,
    spent: 25000,
    pending: 8000,
    status: 'Active',
    contactName: 'Wei Zhang',
    contactEmail: 'w.zhang@asiapac.sg',
    accountManager: 'Tom Davis',
  },
];

const SAMPLE_REQUESTS = [
  {
    id: 'REQ-001',
    partner: 'TechVision Ltd',
    submitted: '2026-01-15',
    status: 'request_submitted',
    poNumber: '',
    note: '',
    items: [
      {
        id: 'REQ-001-A',
        fyHalf: 'FY26 H1',
        fyQuarter: 'Q1',
        month: 'July',
        productGroup: 'CyberSecurity',
        tactic: 'Virtual Event / Webinar',
        title: 'Cloud Security Webinar Q1',
        where: 'Online',
        targetAudience: 'IT Decision Makers',
        targetSolutions: 'Cloud, Security',
        objective: 'Lead generation',
        amount: 4000,
        mdfRequest: 2000,
        localCurrency: 'EUR',
        allocadiaId: '',
        itemStatus: 'request_submitted',
      },
      {
        id: 'REQ-001-B',
        fyHalf: 'FY26 H1',
        fyQuarter: 'Q1',
        month: 'August',
        productGroup: 'Content (ECS)',
        tactic: 'Digital Advertising',
        title: 'LinkedIn Campaign Q1',
        where: 'Online',
        targetAudience: 'C-Suite',
        targetSolutions: 'Content Management',
        objective: 'Brand awareness',
        amount: 2500,
        mdfRequest: 1250,
        localCurrency: 'EUR',
        allocadiaId: '',
        itemStatus: 'request_submitted',
      },
    ],
  },
  {
    id: 'REQ-002',
    partner: 'TechVision Ltd',
    submitted: '2026-02-10',
    status: 'sent_for_signature',
    poNumber: 'PO-2026-001',
    note: '',
    items: [
      {
        id: 'REQ-002-A',
        fyHalf: 'FY26 H1',
        fyQuarter: 'Q2',
        month: 'October',
        productGroup: 'Portfolio',
        tactic: 'Trade Show / Exhibition',
        title: 'London Tech Expo 2026',
        where: 'London, UK',
        targetAudience: 'Enterprise Buyers',
        targetSolutions: 'Full Portfolio',
        objective: 'Pipeline',
        amount: 8000,
        mdfRequest: 4000,
        localCurrency: 'GBP',
        allocadiaId: 'ALO-2026-001',
        itemStatus: 'approved_and_signed',
      },
    ],
  },
];

const SAMPLE_CLAIMS = [];

// --- CLAIM DEADLINES ---------------------------------------------------------
const CLAIM_DEADLINES = {
  Q1: { deadline: 'October 31', month: 'Oct 31' },
  Q2: { deadline: 'January 31', month: 'Jan 31' },
  Q3: { deadline: 'April 30', month: 'Apr 30' },
  Q4: { deadline: 'July 31', month: 'Jul 31' },
};
const getClaimDeadline = (fyQuarter) => CLAIM_DEADLINES[fyQuarter] || null;

// --- WORKFLOW STEPS ----------------------------------------------------------
const WORKFLOW_STEPS = [
  {
    id: 'request_submitted',
    label: 'Submitted',
    desc: 'Your request has been received and is under review',
  },
  {
    id: 'approved',
    label: 'Approved',
    desc: 'Activities approved - Business Plan being prepared',
  },
  {
    id: 'sent_for_signature',
    label: 'Sent for Signature',
    desc: 'Business Plan sent - please sign and return',
  },
  {
    id: 'signed',
    label: 'Signed',
    desc: 'Document signed by both parties - PO being raised',
  },
  {
    id: 'po_raised',
    label: 'PO Raised',
    desc: 'PO confirmed - you can now execute and claim',
  },
  {
    id: 'rejected',
    label: 'Rejected',
    desc: 'Request was not approved - contact your partner manager',
  },
];
const MAIN_STEPS = WORKFLOW_STEPS.filter((s) => s.id !== 'rejected');

// Status Timeline Component
const StatusTimeline = ({ status, compact = false }) => {
  const isRejected = status === 'rejected';
  const currentIdx = MAIN_STEPS.findIndex((s) => s.id === status);
  const stepColors = ['#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#3b82f6'];

  if (isRejected)
    return (
      <div
        style={{
          background: '#ef444415',
          border: '1px solid #ef444430',
          borderRadius: 10,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          x
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#ef4444' }}>
            Request Rejected
          </div>
          <div style={{ fontSize: 11, color: '#4b6080', marginTop: 2 }}>
            Please contact your OT Partner Manager for next steps
          </div>
        </div>
      </div>
    );

  if (compact)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flexWrap: 'wrap',
        }}
      >
        {MAIN_STEPS.map((step, i) => {
          const done = currentIdx > i;
          const active = currentIdx === i;
          const col = stepColors[i];
          return (
            <React.Fragment key={step.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: done || active ? col : C.faint,
                    border: `2px solid ${done || active ? col : C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {done ? (
                    <span
                      style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}
                    >
                      v
                    </span>
                  ) : (
                    <span
                      style={{
                        color: active ? '#fff' : C.muted,
                        fontSize: 8,
                        fontWeight: 800,
                      }}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 700 : 500,
                    color: active ? col : done ? C.muted : C.muted,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.label}
                </span>
              </div>
              {i < MAIN_STEPS.length - 1 && (
                <div
                  style={{
                    width: 16,
                    height: 1,
                    background: done ? col : C.border,
                    flexShrink: 0,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );

  return (
    <div style={{ background: C.faint, borderRadius: 14, padding: 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.muted,
          marginBottom: 16,
          letterSpacing: '0.06em',
        }}
      >
        REQUEST PROGRESS
      </div>
      <div style={{ position: 'relative' }}>
        {/* Connecting line */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            right: 14,
            height: 2,
            background: C.border,
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            height: 2,
            background: stepColors[Math.max(0, currentIdx)],
            zIndex: 0,
            width:
              currentIdx <= 0
                ? '0%'
                : `${(currentIdx / (MAIN_STEPS.length - 1)) * 100}%`,
            transition: 'width 0.4s ease',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {MAIN_STEPS.map((step, i) => {
            const done = currentIdx > i;
            const active = currentIdx === i;
            const col = stepColors[i];
            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  maxWidth: 100,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: done || active ? col : C.card,
                    border: `2px solid ${done || active ? col : C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: active ? `0 0 0 4px ${col}30` : 'none',
                    transition: 'all 0.3s',
                    marginBottom: 8,
                  }}
                >
                  {done ? (
                    <span
                      style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}
                    >
                      v
                    </span>
                  ) : (
                    <span
                      style={{
                        color: active ? '#fff' : C.muted,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 800 : 500,
                    color: active ? col : done ? C.text : C.muted,
                    textAlign: 'center',
                    lineHeight: 1.3,
                    marginBottom: active ? 4 : 0,
                  }}
                >
                  {step.label}
                </div>
                {active && (
                  <div
                    style={{
                      fontSize: 9,
                      color: C.muted,
                      textAlign: 'center',
                      lineHeight: 1.3,
                      maxWidth: 90,
                      marginTop: 4,
                    }}
                  >
                    {step.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- STATUS HELPERS ----------------------------------------------------------
const STATUS_COLOR = {
  request_submitted: C.warning,
  sent_for_signature: C.purple,
  approved_and_signed: C.success,
  rejected: C.danger,
  submitted: C.warning,
  marketing_review: C.cyan,
  finance_review: C.purple,
  approved: C.success,
  paid: C.teal,
};
const STATUS_LABEL = {
  request_submitted: 'Submitted',
  sent_for_signature: 'Sent for Signature',
  approved_and_signed: 'Approved',
  rejected: 'Rejected',
  submitted: 'Submitted',
  marketing_review: 'In Review',
  finance_review: 'Finance Review',
  approved: 'Approved',
  paid: 'Paid',
};
const StatusPill = ({ status }) => {
  const col = STATUS_COLOR[status] || C.muted;
  const lbl = STATUS_LABEL[status] || status;
  return (
    <span
      style={{
        background: col + '18',
        color: col,
        border: `1px solid ${col}30`,
        borderRadius: 20,
        padding: '3px 12px',
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        color: col,
      }}
    >
      {lbl}
    </span>
  );
};

// --- FORM HELPERS -------------------------------------------------------------
const F = ({ label, req, children }) => (
  <div>
    <label
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: C.muted,
        display: 'block',
        marginBottom: 4,
        letterSpacing: '0.06em',
      }}
    >
      {label.toUpperCase()}
      {req && <span style={{ color: C.danger }}> *</span>}
    </label>
    {children}
  </div>
);
const inp = (err) => ({
  width: '100%',
  background: C.card,
  color: C.text,
  fontFamily: 'inherit',
  border: `1px solid ${err ? C.danger : C.border}`,
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
});

// --- LOGIN SCREEN -------------------------------------------------------------
const LoginScreen = ({ partners, onLogin }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  const filtered = useMemo(
    () =>
      partners
        .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 6),
    [partners, search]
  );

  const handleLogin = () => {
    if (!selected) {
      setError('Please select your company');
      return;
    }
    // In production: verify access code against DB
    // For demo: any code works, or last 4 of partner name
    onLogin(selected);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              fontFamily: "'Syne',sans-serif",
              marginBottom: 8,
            }}
          >
            <span style={{ color: '#60aaff' }}>OT</span>{' '}
            <span style={{ color: '#ffffff' }}>Partner Portal</span>
          </div>
          <div style={{ color: C.muted, fontSize: 14 }}>
            Market Development Fund Management
          </div>
        </div>

        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: 32,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            Sign in to your account
          </div>

          {/* Partner search */}
          <div style={{ marginBottom: 16 }}>
            <F label="Your Company Name" req>
              <div style={{ position: 'relative' }}>
                <input
                  value={selected ? selected.name : search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelected(null);
                    setError('');
                  }}
                  onFocus={() => setSelected(null)}
                  placeholder="Type your company name..."
                  style={inp(error && !selected)}
                />
                {!selected && search.length > 0 && filtered.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      zIndex: 10,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      marginTop: 4,
                      overflow: 'hidden',
                    }}
                  >
                    {filtered.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelected(p);
                          setSearch('');
                        }}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: `1px solid ${C.border}20`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>
                            {p.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: C.muted,
                              marginTop: 2,
                            }}
                          >
                            {p.country} . {p.type}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            background: C.faint,
                            borderRadius: 6,
                            padding: '2px 8px',
                            color: C.muted,
                          }}
                        >
                          {p.tier}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </F>
          </div>

          {/* Access code */}
          <div style={{ marginBottom: 24 }}>
            <F label="Access Code" req>
              <input
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  setError('');
                }}
                type="password"
                placeholder="Enter your access code"
                style={inp(error && !accessCode)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </F>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
              Demo: select any partner and enter any code
            </div>
          </div>

          {error && (
            <div
              style={{
                background: C.danger + '18',
                border: `1px solid ${C.danger}30`,
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12,
                color: C.danger,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              background: C.accent,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: 14,
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Access Partner Portal
          </button>
        </div>

        <div
          style={{
            textAlign: 'center',
            marginTop: 20,
            fontSize: 12,
            color: C.muted,
          }}
        >
          Need access? Contact your OT Partner Manager
        </div>
      </div>
    </div>
  );
};

// --- NEW REQUEST MODAL -------------------------------------------------------
const NewRequestModal = ({ partner, onAdd, onClose, prefillItem = null }) => {
  const emptyItem = () => ({
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fyHalf: '',
    fyQuarter: '',
    month: '',
    productGroup: '',
    tactic: '',
    where: '',
    targetAudience: '',
    targetSolutions: '',
    objective: '',
    totalCost: '',
    currency: 'EUR',
    mdfRequest: '',
  });
  const prefilled = prefillItem
    ? {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fyHalf: '',
        fyQuarter: '',
        month: '', // clear timing - partner must choose new quarter
        productGroup: prefillItem.productGroup || '',
        tactic: prefillItem.tactic || '',
        where: prefillItem.where || '',
        targetAudience: prefillItem.targetAudience || '',
        targetSolutions: prefillItem.targetSolutions || '',
        objective: prefillItem.objective || '',
        totalCost: String(prefillItem.amount || ''),
        currency: prefillItem.localCurrency || 'EUR',
        mdfRequest: String(prefillItem.mdfRequest || ''),
      }
    : null;
  const [items, setItems] = useState([prefilled || emptyItem()]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false); // BREAK-001: prevent double submit

  const setItem = (idx, k, v) =>
    setItems((p) =>
      p.map((it, i) => {
        if (i !== idx) return it;
        const u = { ...it, [k]: v };
        if (k === 'fyHalf') {
          u.fyQuarter = '';
          u.month = '';
        }
        if (k === 'fyQuarter') {
          u.month = '';
        }
        if (k === 'totalCost') {
          const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
          if (n > 0) u.mdfRequest = String(Math.round(n * 0.5));
        }
        return u;
      })
    );

  const getHK = (h) => (h?.includes('H1') ? 'H1' : 'H2');
  const getQs = (h) => QUARTERS_BY_HALF[getHK(h)] || [];
  const getMs = (q) => MONTHS_BY_QUARTER[q] || [];

  const validate = () => {
    const e = {};
    items.forEach((it, i) => {
      [
        'fyHalf',
        'fyQuarter',
        'month',
        'productGroup',
        'tactic',
        'where',
        'targetAudience',
        'targetSolutions',
        'objective',
        'totalCost',
        'mdfRequest',
      ].forEach((f) => {
        if (!it[f] || !String(it[f]).trim()) e[`${f}_${i}`] = 'Required';
      });
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (submitting) return; // BREAK-001: block double submit
    if (!validate()) return;
    const reqId =
      'REQ-' +
      Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).slice(2, 5).toUpperCase();
    onAdd({
      id: reqId,
      partner: partner.name,
      submitted: new Date().toISOString().slice(0, 10),
      status: 'request_submitted',
      poNumber: '',
      note: '',
      partnerContact: partner.contactName,
      partnerEmail: partner.contactEmail,
      partnerType: partner.type,
      partnerTier: partner.tier,
      partnerManager: partner.accountManager,
      items: items.map((it, i) => ({
        id: `${reqId}-${String.fromCharCode(65 + i)}`,
        fyHalf: it.fyHalf,
        fyQuarter: it.fyQuarter,
        month: it.month,
        period: `${it.month} (${it.fyQuarter})`,
        productGroup: it.productGroup,
        tactic: it.tactic,
        where: it.where,
        targetAudience: it.targetAudience,
        targetSolutions: it.targetSolutions,
        objective: it.objective,
        amount: parseFloat(String(it.totalCost).replace(/[^0-9.]/g, '')),
        mdfRequest: parseFloat(String(it.mdfRequest).replace(/[^0-9.]/g, '')),
        localCurrency: it.currency,
        allocadiaId: '',
        itemStatus: 'request_submitted',
        title: it.objective.slice(0, 50),
      })),
    });
    onClose();
  };

  const inpStyle = (hasErr) => ({
    width: '100%',
    background: C.card,
    color: C.text,
    fontFamily: 'inherit',
    border: `1px solid ${hasErr ? C.danger : C.border}`,
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  });

  const Label = ({ text, req }) => (
    <div
      style={{
        fontSize: 10,
        color: C.muted,
        fontWeight: 700,
        letterSpacing: '0.08em',
        marginBottom: 6,
        textTransform: 'uppercase',
      }}
    >
      {text}
      {req && <span style={{ color: C.danger }}> *</span>}
    </div>
  );

  const ErrDot = ({ k }) =>
    errors[k] ? (
      <div style={{ fontSize: 10, color: C.danger, marginTop: 3 }}>
        Required
      </div>
    ) : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: 32,
          width: 680,
          maxHeight: '92vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: prefillItem ? 12 : 24,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 800,
                fontSize: 26,
                marginBottom: 4,
              }}
            >
              New MDF Request
            </div>
            <div style={{ color: C.muted, fontSize: 13 }}>
              {partner.name} . All fields required
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: C.muted,
              fontSize: 20,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 4,
            }}
          >
            X
          </button>
        </div>
        {prefillItem && (
          <div
            style={{
              background: C.warning + '15',
              border: `1px solid ${C.warning}30`,
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.warning,
                marginBottom: 4,
              }}
            >
              Moving activity to a new quarter
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              All details copied from your original activity. Select the new FY
              Half, Quarter and Month - edit any other fields as needed.
            </div>
          </div>
        )}

        {/* Activities */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: C.accent,
            letterSpacing: '0.12em',
            marginBottom: 12,
          }}
        >
          ACTIVITIES ({items.length})
        </div>

        {items.map((item, idx) => (
          <div
            key={item.id}
            style={{
              background: C.faint,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: '18px 20px',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: C.accent,
                }}
              >
                Activity {idx + 1}
              </div>
              {items.length > 1 && (
                <button
                  onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: C.muted,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            {/* FY Half / Quarter / Month */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div>
                <Label text="FY Half" req />
                <select
                  value={item.fyHalf}
                  onChange={(e) => setItem(idx, 'fyHalf', e.target.value)}
                  style={{
                    ...inpStyle(errors[`fyHalf_${idx}`]),
                    appearance: 'auto',
                  }}
                >
                  <option value="">Select...</option>
                  {FY_HALVES.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <ErrDot k={`fyHalf_${idx}`} />
              </div>
              <div>
                <Label text="FY Quarter" req />
                <select
                  value={item.fyQuarter}
                  onChange={(e) => setItem(idx, 'fyQuarter', e.target.value)}
                  disabled={!item.fyHalf}
                  style={{
                    ...inpStyle(errors[`fyQuarter_${idx}`]),
                    appearance: 'auto',
                  }}
                >
                  <option value="">Select...</option>
                  {getQs(item.fyHalf).map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
                <ErrDot k={`fyQuarter_${idx}`} />
              </div>
              <div>
                <Label text="Month" req />
                <select
                  value={item.month}
                  onChange={(e) => setItem(idx, 'month', e.target.value)}
                  disabled={!item.fyQuarter}
                  style={{
                    ...inpStyle(errors[`month_${idx}`]),
                    appearance: 'auto',
                  }}
                >
                  <option value="">Select...</option>
                  {getMs(item.fyQuarter).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ErrDot k={`month_${idx}`} />
              </div>
            </div>

            {/* Product Group / Tactic */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div>
                <Label text="Product Group (BU Focus)" req />
                <select
                  value={item.productGroup}
                  onChange={(e) => setItem(idx, 'productGroup', e.target.value)}
                  style={{
                    ...inpStyle(errors[`productGroup_${idx}`]),
                    appearance: 'auto',
                  }}
                >
                  <option value="">Select...</option>
                  {PRODUCT_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <ErrDot k={`productGroup_${idx}`} />
              </div>
              <div>
                <Label text="Marketing Tactic" req />
                <select
                  value={item.tactic}
                  onChange={(e) => setItem(idx, 'tactic', e.target.value)}
                  style={{
                    ...inpStyle(errors[`tactic_${idx}`]),
                    appearance: 'auto',
                  }}
                >
                  <option value="">Select...</option>
                  {TACTICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ErrDot k={`tactic_${idx}`} />
              </div>
            </div>

            {/* Location / Target Audience */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div>
                <Label text="Location" req />
                <input
                  value={item.where}
                  onChange={(e) => setItem(idx, 'where', e.target.value)}
                  placeholder="e.g. Milan, Online"
                  style={inpStyle(errors[`where_${idx}`])}
                />
                <ErrDot k={`where_${idx}`} />
              </div>
              <div>
                <Label text="Target Audience" req />
                <input
                  value={item.targetAudience}
                  onChange={(e) =>
                    setItem(idx, 'targetAudience', e.target.value)
                  }
                  placeholder="e.g. IT Decision Makers"
                  style={inpStyle(errors[`targetAudience_${idx}`])}
                />
                <ErrDot k={`targetAudience_${idx}`} />
              </div>
            </div>

            {/* Target Solutions / Objective */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div>
                <Label text="Target Solutions" req />
                <input
                  value={item.targetSolutions}
                  onChange={(e) =>
                    setItem(idx, 'targetSolutions', e.target.value)
                  }
                  placeholder="e.g. Cloud, Security"
                  style={inpStyle(errors[`targetSolutions_${idx}`])}
                />
                <ErrDot k={`targetSolutions_${idx}`} />
              </div>
              <div>
                <Label text="Objective" req />
                <input
                  value={item.objective}
                  onChange={(e) => setItem(idx, 'objective', e.target.value)}
                  placeholder="e.g. Lead generation"
                  style={inpStyle(errors[`objective_${idx}`])}
                />
                <ErrDot k={`objective_${idx}`} />
              </div>
            </div>

            {/* Total Cost / Currency / MDF Request */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 2fr',
                gap: 14,
              }}
            >
              <div>
                <Label text="Total Cost" req />
                <input
                  value={item.totalCost}
                  onChange={(e) => setItem(idx, 'totalCost', e.target.value)}
                  placeholder="0"
                  style={inpStyle(errors[`totalCost_${idx}`])}
                />
                <ErrDot k={`totalCost_${idx}`} />
              </div>
              <div>
                <Label text="Currency" />
                <select
                  value={item.currency}
                  onChange={(e) => setItem(idx, 'currency', e.target.value)}
                  style={{ ...inpStyle(false), appearance: 'auto' }}
                >
                  {[
                    'EUR',
                    'USD',
                    'GBP',
                    'CHF',
                    'SEK',
                    'NOK',
                    'DKK',
                    'PLN',
                    'SGD',
                    'AUD',
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label text="MDF Request (50%)" req />
                <input
                  value={item.mdfRequest}
                  onChange={(e) => setItem(idx, 'mdfRequest', e.target.value)}
                  placeholder="0"
                  style={inpStyle(errors[`mdfRequest_${idx}`])}
                />
                <ErrDot k={`mdfRequest_${idx}`} />
              </div>
            </div>

            {/* MDF % hint */}
            {item.totalCost &&
              item.mdfRequest &&
              Number(item.totalCost) > 0 && (
                <div
                  style={{
                    fontSize: 11,
                    color: C.muted,
                    marginTop: 8,
                    fontFamily: 'monospace',
                  }}
                >
                  MDF ={' '}
                  {Math.round(
                    (parseFloat(item.mdfRequest) / parseFloat(item.totalCost)) *
                      100
                  )}
                  % of total cost
                </div>
              )}
          </div>
        ))}

        {/* Add activity */}
        <button
          onClick={() => setItems((p) => [...p, emptyItem()])}
          style={{
            width: '100%',
            background: 'transparent',
            border: `2px dashed ${C.border}`,
            color: C.accent,
            borderRadius: 12,
            padding: 12,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            marginBottom: 20,
          }}
        >
          + Add Another Activity
        </button>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'transparent',
              color: C.muted,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: 13,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            style={{
              flex: 2,
              background: submitting ? C.muted : C.accent,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: 13,
              fontWeight: 800,
              fontSize: 14,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Saving...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- CANCEL / POSTPONE MODAL ------------------------------------------------
const ActivityUpdateModal = ({
  request,
  item,
  onUpdate,
  onSubmitNew,
  onClose,
  initialMode = null,
}) => {
  const [mode, setMode] = useState(initialMode); // "cancel" | "postpone" | "modify"
  const [reason, setReason] = useState('');
  // Modify fields - pre-filled with current values
  const [modTitle, setModTitle] = useState(item.title || '');
  const [modWhere, setModWhere] = useState(item.where || '');
  const [modAudience, setModAudience] = useState(item.targetAudience || '');
  const [modObjective, setModObjective] = useState(item.objective || '');
  const [modTactic, setModTactic] = useState(item.tactic || '');
  const [modAmount, setModAmount] = useState(String(item.amount || ''));
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!reason.trim()) e.reason = 'Please provide a reason';
    if (mode === 'modify' && !modTitle.trim()) e.modTitle = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    if (mode === 'cancel' || mode === 'cancel_resubmit') {
      onUpdate({
        reqId: request.id,
        itemId: item.id,
        mode: 'cancel',
        reason,
        submittedAt: new Date().toISOString().slice(0, 10),
      });
      if (mode === 'cancel_resubmit') onSubmitNew(item);
    } else if (mode === 'modify') {
      onUpdate({
        reqId: request.id,
        itemId: item.id,
        mode: 'modify',
        reason,
        changes: {
          title: modTitle,
          where: modWhere,
          targetAudience: modAudience,
          objective: modObjective,
          tactic: modTactic,
          amount: parseFloat(modAmount) || item.amount,
        },
        submittedAt: new Date().toISOString().slice(0, 10),
      });
    }
    onClose();
  };

  const inpS = (err) => ({
    width: '100%',
    background: C.card,
    color: C.text,
    fontFamily: 'inherit',
    border: `1px solid ${err ? C.danger : C.border}`,
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  });
  const Lbl = ({ t, req }) => (
    <label
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: C.muted,
        display: 'block',
        marginBottom: 4,
        letterSpacing: '0.06em',
      }}
    >
      {t}
      {req && <span style={{ color: C.danger }}> *</span>}
    </label>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          width: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${C.border}`,
            position: 'sticky',
            top: 0,
            background: C.surface,
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 800,
              fontSize: 20,
              marginBottom: 4,
            }}
          >
            Activity Update
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>{item.title}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {item.fyHalf} . {item.fyQuarter} . {item.month} .{' '}
            {item.localCurrency} {Number(item.amount || 0).toLocaleString()}
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Mode selector */}
          {!mode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>
                What would you like to do?
              </div>

              {/* SUBMITTED status: Cancel or Postpone */}
              {item.itemStatus === 'request_submitted' && (
                <>
                  <button
                    onClick={() => {
                      onSubmitNew(item);
                      onClose();
                    }}
                    style={{
                      background: C.faint,
                      border: `1px solid ${C.warning}30`,
                      color: C.text,
                      borderRadius: 12,
                      padding: '14px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        marginBottom: 3,
                        color: C.warning,
                      }}
                    >
                      Move to next quarter
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      All activity details copied to a new request - just pick
                      the new quarter. Current activity cancelled automatically.
                    </div>
                  </button>
                  <button
                    onClick={() => setMode('cancel')}
                    style={{
                      background: C.faint,
                      border: `1px solid ${C.danger}30`,
                      color: C.text,
                      borderRadius: 12,
                      padding: '14px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        marginBottom: 3,
                        color: C.danger,
                      }}
                    >
                      Cancel activity
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      Activity will not run. Budget flagged for review.
                    </div>
                  </button>
                </>
              )}

              {/* APPROVED status: Cancel only, or Cancel and re-submit */}
              {(item.itemStatus === 'approved' ||
                item.itemStatus === 'approved_and_signed') && (
                <>
                  <button
                    onClick={() => setMode('cancel')}
                    style={{
                      background: C.faint,
                      border: `1px solid ${C.danger}30`,
                      color: C.text,
                      borderRadius: 12,
                      padding: '14px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        marginBottom: 3,
                        color: C.danger,
                      }}
                    >
                      Cancel activity
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      Activity will not run. Budget flagged for manual review by
                      your partner manager.
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onSubmitNew(item);
                      onClose();
                    }}
                    style={{
                      background: C.faint,
                      border: `1px solid ${C.warning}30`,
                      color: C.text,
                      borderRadius: 12,
                      padding: '14px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        marginBottom: 3,
                        color: C.warning,
                      }}
                    >
                      Move to next quarter
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      All activity details copied - just pick the new quarter.
                      This activity cancelled automatically.
                    </div>
                  </button>
                </>
              )}

              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  color: C.muted,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 4,
                }}
              >
                Close
              </button>
            </div>
          )}

          {/* Modify form */}
          {mode === 'modify' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  background: C.accent + '10',
                  border: `1px solid ${C.accent}30`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 12,
                  color: C.accent,
                }}
              >
                Modifying an approved activity requires re-review by your
                partner manager. Budget and quarter remain unchanged.
              </div>
              <div>
                <Lbl t="Activity Description" req />
                <input
                  value={modTitle}
                  onChange={(e) => setModTitle(e.target.value)}
                  style={inpS(errors.modTitle)}
                />
                {errors.modTitle && (
                  <div style={{ fontSize: 10, color: C.danger, marginTop: 3 }}>
                    {errors.modTitle}
                  </div>
                )}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div>
                  <Lbl t="Marketing Tactic" />
                  <select
                    value={modTactic}
                    onChange={(e) => setModTactic(e.target.value)}
                    style={{ ...inpS(false), appearance: 'auto' }}
                  >
                    {TACTICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Lbl t="Location" />
                  <input
                    value={modWhere}
                    onChange={(e) => setModWhere(e.target.value)}
                    style={inpS(false)}
                  />
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div>
                  <Lbl t="Target Audience" />
                  <input
                    value={modAudience}
                    onChange={(e) => setModAudience(e.target.value)}
                    style={inpS(false)}
                  />
                </div>
                <div>
                  <Lbl t="Objective" />
                  <input
                    value={modObjective}
                    onChange={(e) => setModObjective(e.target.value)}
                    style={inpS(false)}
                  />
                </div>
              </div>
              <div>
                <Lbl t="Reason for Change" req />
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Venue changed, format updated from in-person to virtual..."
                  style={{ ...inpS(errors.reason), resize: 'vertical' }}
                />
                {errors.reason && (
                  <div style={{ fontSize: 10, color: C.danger, marginTop: 3 }}>
                    {errors.reason}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setMode(null)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: C.muted,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  onClick={submit}
                  style={{
                    flex: 2,
                    background: C.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: 11,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Submit for Re-review
                </button>
              </div>
            </div>
          )}

          {/* Cancel form */}
          {mode === 'cancel' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  background: C.danger + '10',
                  border: `1px solid ${C.danger}20`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 12,
                  color: C.danger,
                }}
              >
                The budget for this activity will be flagged for manual review.
                Your partner manager will follow up with you.
              </div>
              <div>
                <Lbl t="Reason for Cancellation" req />
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Campaign strategy changed, event cancelled, budget reallocated..."
                  style={{ ...inpS(errors.reason), resize: 'vertical' }}
                />
                {errors.reason && (
                  <div style={{ fontSize: 10, color: C.danger, marginTop: 3 }}>
                    {errors.reason}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setMode(null)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: C.muted,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  onClick={submit}
                  style={{
                    flex: 2,
                    background: C.danger,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: 11,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- REQUEST DETAIL MODAL ---------------------------------------------------
const RequestDetailModal = ({
  request,
  onClose,
  onClaim,
  onUpdate,
  claimedItemIds,
}) => {
  const [showUpdateItem, setShowUpdateItem] = useState(null); // item to update

  const STATUS_COLOR_MAP = {
    request_submitted: '#f59e0b',
    approved: '#10b981',
    sent_for_signature: '#8b5cf6',
    signed: '#06b6d4',
    po_raised: '#3b82f6',
    rejected: '#ef4444',
    cancelled_by_partner: '#ef4444',
    postponed: '#f59e0b',
  };
  const STATUS_LABEL_MAP = {
    request_submitted: 'Submitted',
    approved: 'Approved',
    sent_for_signature: 'Sent for Signature',
    signed: 'Signed',
    po_raised: 'PO Raised',
    rejected: 'Rejected',
    cancelled_by_partner: 'Cancelled',
    postponed: 'Postponed',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          width: 660,
          maxHeight: '92vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${C.border}`,
            position: 'sticky',
            top: 0,
            background: C.surface,
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 800,
                fontSize: 20,
                marginBottom: 4,
              }}
            >
              Request Details
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: C.accent,
                }}
              >
                {request.id}
              </span>
              <span
                style={{
                  background: STATUS_COLOR_MAP[request.status] + '20',
                  color: STATUS_COLOR_MAP[request.status] || C.muted,
                  border: `1px solid ${
                    STATUS_COLOR_MAP[request.status] || C.muted
                  }30`,
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {STATUS_LABEL_MAP[request.status] || request.status}
              </span>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Submitted {request.submitted} . {(request.items || []).length}{' '}
              {(request.items || []).length === 1 ? 'activity' : 'activities'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: C.muted,
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            x
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Activities */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: C.accent,
              letterSpacing: '0.1em',
              marginBottom: 12,
            }}
          >
            ACTIVITIES
          </div>
          {(request.items || []).map((item, i) => {
            const iStatus = item.itemStatus || request.status;
            const sColor = STATUS_COLOR_MAP[iStatus] || C.muted;
            const sLabel = STATUS_LABEL_MAP[iStatus] || iStatus;
            const canClaim =
              (iStatus === 'approved' || iStatus === 'approved_and_signed') &&
              !claimedItemIds.has(item.id);
            const canModify =
              iStatus === 'request_submitted' ||
              iStatus === 'approved' ||
              iStatus === 'approved_and_signed';
            const canCancel =
              iStatus !== 'cancelled_by_partner' &&
              iStatus !== 'postponed' &&
              iStatus !== 'rejected';

            return (
              <div
                key={item.id}
                style={{
                  background: C.faint,
                  border: `1px solid ${sColor}30`,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                {/* Activity header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 10,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}
                    >
                      {item.title || item.objective}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          background: sColor + '18',
                          color: sColor,
                          border: `1px solid ${sColor}30`,
                          borderRadius: 20,
                          padding: '2px 10px',
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {sLabel}
                      </span>
                      {(iStatus === 'approved' ||
                        iStatus === 'approved_and_signed') &&
                        getClaimDeadline(item.fyQuarter) && (
                          <span
                            style={{
                              background: C.warning + '18',
                              color: C.warning,
                              border: `1px solid ${C.warning}30`,
                              borderRadius: 20,
                              padding: '2px 10px',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            Claim by {getClaimDeadline(item.fyQuarter).deadline}
                          </span>
                        )}
                    </div>
                    {item.itemStatus === 'cancelled_by_partner' &&
                      item.cancelReason && (
                        <div
                          style={{
                            fontSize: 11,
                            color: C.danger,
                            marginTop: 6,
                            fontStyle: 'italic',
                          }}
                        >
                          Cancellation reason: "{item.cancelReason}"
                        </div>
                      )}
                    {item.itemStatus === 'postponed' && (
                      <div
                        style={{ fontSize: 11, color: C.warning, marginTop: 6 }}
                      >
                        Postponed - new request required for new quarter
                      </div>
                    )}
                    {item.modifyReason &&
                      item.itemStatus === 'request_submitted' && (
                        <div
                          style={{
                            fontSize: 11,
                            color: C.accent,
                            marginTop: 6,
                          }}
                        >
                          Modification pending review: "{item.modifyReason}"
                        </div>
                      )}
                  </div>
                </div>
                {/* Activity details grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  {[
                    ['FY Half', item.fyHalf],
                    ['Quarter', item.fyQuarter],
                    ['Month', item.month],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        background: C.card,
                        borderRadius: 8,
                        padding: '8px 10px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: C.muted,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          marginBottom: 2,
                        }}
                      >
                        {k.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {v || '-'}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  {[
                    ['Product Group', item.productGroup],
                    ['Marketing Tactic', item.tactic],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        background: C.card,
                        borderRadius: 8,
                        padding: '8px 10px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: C.muted,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          marginBottom: 2,
                        }}
                      >
                        {k.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {v || '-'}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  {[
                    ['Location', item.where],
                    ['Target Audience', item.targetAudience],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        background: C.card,
                        borderRadius: 8,
                        padding: '8px 10px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: C.muted,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          marginBottom: 2,
                        }}
                      >
                        {k.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {v || '-'}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  {[
                    [
                      'Total Cost',
                      `${item.localCurrency || 'EUR'} ${Number(
                        item.amount || 0
                      ).toLocaleString()}`,
                    ],
                    [
                      'MDF Request',
                      `${item.localCurrency || 'EUR'} ${Number(
                        item.mdfRequest || 0
                      ).toLocaleString()}`,
                    ],
                    ['Objective', item.objective],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        background: C.card,
                        borderRadius: 8,
                        padding: '8px 10px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: C.muted,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          marginBottom: 2,
                        }}
                      >
                        {k.toUpperCase()}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: k === 'MDF Request' ? C.accent : C.text,
                        }}
                      >
                        {v || '-'}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {canClaim && (
                    <button
                      onClick={() => {
                        onClaim(request, item);
                        onClose();
                      }}
                      style={{
                        background: C.success,
                        color: '#000',
                        border: 'none',
                        borderRadius: 8,
                        padding: '7px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Submit Claim
                    </button>
                  )}
                  {/* Submitted: Cancel or Postpone */}
                  {iStatus === 'request_submitted' && canCancel && (
                    <button
                      onClick={() => {
                        onUpdate(request, item, 'cancel_postpone');
                        onClose();
                      }}
                      style={{
                        background: 'transparent',
                        color: C.warning,
                        border: `1px solid ${C.warning}`,
                        borderRadius: 8,
                        padding: '7px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel / Postpone
                    </button>
                  )}
                  {/* Approved: Cancel only, or Cancel & re-submit */}
                  {(iStatus === 'approved' ||
                    iStatus === 'approved_and_signed') &&
                    canCancel && (
                      <button
                        onClick={() => {
                          onUpdate(request, item, 'cancel_resubmit');
                          onClose();
                        }}
                        style={{
                          background: 'transparent',
                          color: C.danger,
                          border: `1px solid ${C.danger}`,
                          borderRadius: 8,
                          padding: '7px 14px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel Activity
                      </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- CLAIM MODAL ------------------------------------------------------------
const ClaimModal = ({ request, item, partner, onAdd, onClose }) => {
  const [claimAmt, setClaimAmt] = useState(String(item.mdfRequest || ''));
  const [currency, setCurrency] = useState(item.localCurrency || 'EUR');
  const [vat, setVat] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState({
    partnerInvoice: null,
    thirdParty: null,
    inHouse: null,
    merchandise: null,
    additional: [],
  });

  const vatAmt =
    claimAmt && vat
      ? Math.round((parseFloat(claimAmt || 0) * parseFloat(vat || 0)) / 100)
      : 0;

  const calcTotal = (amt, v) => {
    const a = parseFloat(amt || 0),
      pct = parseFloat(v || 0);
    if (a > 0) setTotalValue(String(Math.round(a + (a * pct) / 100)));
  };

  const handleFile = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setFiles((p) => ({
        ...p,
        [field]: {
          name: file.name,
          size: file.size,
          dataUrl: ev.target.result,
        },
      }));
    reader.readAsDataURL(file);
  };

  const handleAdditional = (e) => {
    Array.from(e.target.files || []).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setFiles((p) => ({
          ...p,
          additional: [...p.additional, { name: file.name, size: file.size }],
        }));
      reader.readAsDataURL(file);
    });
  };

  const fmtSize = (bytes) =>
    bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
      : `${(bytes / 1024).toFixed(0)}KB`;

  const validate = () => {
    const e = {};
    if (!claimAmt || parseFloat(claimAmt) <= 0) e.claimAmt = 'Required';
    if (!totalValue || parseFloat(totalValue) <= 0) e.totalValue = 'Required';
    if (!files.partnerInvoice) e.partnerInvoice = 'Partner invoice is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onAdd({
      id:
        'CLM-' +
        Date.now().toString(36).toUpperCase() +
        Math.random().toString(36).slice(2, 5).toUpperCase(),
      reqId: request.id,
      itemId: item.id,
      partner: partner.name,
      activity: item.title,
      submitted: new Date().toISOString().slice(0, 10),
      status: 'submitted',
      claimAmount: parseFloat(claimAmt),
      vatPct: parseFloat(vat || 0),
      totalValue: parseFloat(totalValue || claimAmt),
      currency,
      notes,
      files: {
        partnerInvoice: files.partnerInvoice?.name || null,
        thirdParty: files.thirdParty?.name || null,
        inHouse: files.inHouse?.name || null,
        merchandise: files.merchandise?.name || null,
        additional: files.additional.map((f) => f.name),
      },
    });
    onClose();
  };

  const inpStyle = (hasErr) => ({
    width: '100%',
    background: C.card,
    color: C.text,
    fontFamily: 'inherit',
    border: `1px solid ${hasErr ? C.danger : C.border}`,
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  });

  const Label = ({ text, req, sub }) => (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          fontSize: 10,
          color: C.muted,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {text}
        {req && <span style={{ color: C.danger }}> *</span>}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{sub}</div>
      )}
    </div>
  );

  const FileUpload = ({ field, label, required, sub }) => {
    const f = files[field];
    const inputId = 'file-upload-' + field;
    return (
      <div style={{ marginBottom: 14 }}>
        <Label text={label} req={required} sub={sub} />
        <input
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          onChange={(e) => handleFile(field, e)}
          style={{
            position: 'absolute',
            opacity: 0,
            width: 1,
            height: 1,
            overflow: 'hidden',
          }}
        />
        {f ? (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.success}40`,
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: C.success + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 700,
                  color: C.success,
                  flexShrink: 0,
                }}
              >
                ✓
              </div>
              <div>
                <div
                  style={{ fontSize: 12, fontWeight: 600, color: C.success }}
                >
                  {f.name}
                </div>
                <div style={{ fontSize: 10, color: C.muted }}>
                  {fmtSize(f.size)}
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                setFiles((p) => ({ ...p, [field]: null }));
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: C.muted,
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
        ) : (
          <div
            onClick={() =>
              document.getElementById(inputId) &&
              document.getElementById(inputId).click()
            }
            style={{
              background: C.card,
              border: `2px dashed ${errors[field] ? C.danger : C.border}`,
              borderRadius: 10,
              padding: '14px 16px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>📎</div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
              Click to upload
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
              PDF, JPG, PNG, Word, Excel
            </div>
          </div>
        )}
        {errors[field] && (
          <div style={{ fontSize: 10, color: C.danger, marginTop: 3 }}>
            {errors[field]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          width: 680,
          maxHeight: '93vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div
          style={{
            padding: '22px 28px 16px',
            borderBottom: `1px solid ${C.border}`,
            position: 'sticky',
            top: 0,
            background: C.surface,
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 800,
                  fontSize: 24,
                  marginBottom: 4,
                }}
              >
                Submit MDF Claim
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>{item.title}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                {item.fyHalf} . {item.fyQuarter} . {item.month} . {item.tactic}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: C.muted,
                fontSize: 20,
                cursor: 'pointer',
                padding: 4,
              }}
            >
              X
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 20,
              marginTop: 12,
              padding: '10px 14px',
              background: C.faint,
              borderRadius: 10,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 9,
                  color: C.muted,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                }}
              >
                APPROVED MDF
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 14,
                  fontWeight: 800,
                  color: C.success,
                  marginTop: 2,
                }}
              >
                {item.localCurrency || 'EUR'}{' '}
                {Number(item.mdfRequest || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 9,
                  color: C.muted,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                }}
              >
                ACTIVITY
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  marginTop: 2,
                  maxWidth: 300,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.title}
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '20px 28px' }}>
          {/* Financials */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: C.accent,
              letterSpacing: '0.12em',
              marginBottom: 12,
            }}
          >
            CLAIM FINANCIALS
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: 14,
              marginBottom: 14,
            }}
          >
            <div>
              <Label
                text="MDF Claim Amount"
                req
                sub="Net amount you are claiming"
              />
              <input
                value={claimAmt}
                onChange={(e) => {
                  setClaimAmt(e.target.value);
                  calcTotal(e.target.value, vat);
                }}
                placeholder={String(item.mdfRequest || '')}
                style={inpStyle(errors.claimAmt)}
              />
              {errors.claimAmt && (
                <div style={{ fontSize: 10, color: C.danger, marginTop: 3 }}>
                  {errors.claimAmt}
                </div>
              )}
            </div>
            <div>
              <Label text="Currency" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{ ...inpStyle(false), appearance: 'auto' }}
              >
                {[
                  'EUR',
                  'USD',
                  'GBP',
                  'CHF',
                  'SEK',
                  'NOK',
                  'DKK',
                  'PLN',
                  'SGD',
                  'AUD',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div>
              <Label text="VAT %" sub="Enter 0 if not applicable" />
              <input
                value={vat}
                onChange={(e) => {
                  setVat(e.target.value);
                  calcTotal(claimAmt, e.target.value);
                }}
                placeholder="0"
                type="number"
                min="0"
                max="100"
                style={inpStyle(false)}
              />
              {vat && claimAmt && (
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: C.muted,
                    marginTop: 4,
                  }}
                >
                  VAT: {currency} {vatAmt.toLocaleString()}
                </div>
              )}
            </div>
            <div>
              <Label
                text="Total Claim Value (incl. VAT)"
                req
                sub="Gross amount including VAT"
              />
              <input
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                placeholder="0"
                style={inpStyle(errors.totalValue)}
              />
              {errors.totalValue && (
                <div style={{ fontSize: 10, color: C.danger, marginTop: 3 }}>
                  {errors.totalValue}
                </div>
              )}
            </div>
          </div>
          {/* Invoices */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: C.accent,
              letterSpacing: '0.12em',
              marginBottom: 12,
            }}
          >
            INVOICES AND RECEIPTS
          </div>
          <div
            style={{
              background: C.faint,
              borderRadius: 14,
              padding: '16px 18px',
              marginBottom: 14,
            }}
          >
            <FileUpload
              field="partnerInvoice"
              label="Partner Invoice"
              required
              sub="Main invoice from your company to OT"
            />
            <FileUpload
              field="thirdParty"
              label="Third Party Supplier Invoice"
              sub="Invoice from external vendor if applicable"
            />
            <FileUpload
              field="inHouse"
              label="Partner In-House Activity"
              sub="Internal cost breakdown"
            />
            <FileUpload
              field="merchandise"
              label="Merchandise Receipt"
              sub="Branded materials, giveaways"
            />
          </div>
          {/* Additional */}
          <div style={{ marginBottom: 20 }}>
            <Label
              text="Additional Attachments"
              sub="Event reports, photos, screenshots"
            />
            <div style={{ marginBottom: 8 }}>
              <input
                id="additional-upload"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                onChange={handleAdditional}
                style={{ display: 'none' }}
              />
              <div
                onClick={() =>
                  document.getElementById('additional-upload').click()
                }
                style={{
                  background: C.card,
                  border: `2px dashed ${C.border}`,
                  borderRadius: 10,
                  padding: '12px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 12, color: C.muted }}>
                  + Click to add more files
                </div>
              </div>
            </div>
            {files.additional.length > 0 &&
              files.additional.map((f, i) => (
                <div
                  key={i}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{f.name}</div>
                  <button
                    onClick={() =>
                      setFiles((p) => ({
                        ...p,
                        additional: p.additional.filter((_, j) => j !== i),
                      }))
                    }
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: C.muted,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    x
                  </button>
                </div>
              ))}
          </div>
          {/* Notes */}
          <div style={{ marginBottom: 24 }}>
            <Label
              text="Supporting Notes"
              sub="Activity outcome, results, attendees, ROI"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe the activity, results achieved, leads generated..."
              style={{ ...inpStyle(false), resize: 'vertical' }}
            />
          </div>
          {/* Summary */}
          {claimAmt && totalValue && (
            <div
              style={{
                background: C.faint,
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 20,
                display: 'flex',
                gap: 24,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 9,
                    color: C.muted,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                  }}
                >
                  NET CLAIM
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: 16,
                    color: C.accent,
                    marginTop: 2,
                  }}
                >
                  {currency}{' '}
                  {Number(parseFloat(claimAmt) || 0).toLocaleString()}
                </div>
              </div>
              {vat && (
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      color: C.muted,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                    }}
                  >
                    VAT ({vat}%)
                  </div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: 16,
                      color: C.muted,
                      marginTop: 2,
                    }}
                  >
                    {currency} {vatAmt.toLocaleString()}
                  </div>
                </div>
              )}
              <div>
                <div
                  style={{
                    fontSize: 9,
                    color: C.muted,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                  }}
                >
                  TOTAL
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: 16,
                    color: C.success,
                    marginTop: 2,
                  }}
                >
                  {currency}{' '}
                  {Number(parseFloat(totalValue) || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 9,
                    color: C.muted,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                  }}
                >
                  DOCS
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 16,
                    color: C.purple,
                    marginTop: 2,
                  }}
                >
                  {[
                    files.partnerInvoice,
                    files.thirdParty,
                    files.inHouse,
                    files.merchandise,
                  ].filter(Boolean).length + files.additional.length}
                </div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                background: 'transparent',
                color: C.muted,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: 13,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              style={{
                flex: 2,
                background: C.success,
                color: '#000',
                border: 'none',
                borderRadius: 10,
                padding: 13,
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Submit Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- CLAIM DETAIL MODAL -----------------------------------------------------
const ClaimDetailModal = ({ claim, onClose }) => {
  const STATUS_COLOR = {
    submitted: '#f59e0b',
    marketing_review: '#06b6d4',
    finance_review: '#8b5cf6',
    approved: '#10b981',
    paid: '#14b8a6',
  };
  const STATUS_LABEL = {
    submitted: 'Submitted',
    marketing_review: 'Marketing Review',
    finance_review: 'Finance Review',
    approved: 'Approved',
    paid: 'Paid',
  };
  const col = STATUS_COLOR[claim.status] || '#4b6080';
  const lbl = STATUS_LABEL[claim.status] || claim.status;

  const Row = ({ label, value, mono, highlight }) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '8px 0',
        borderBottom: `1px solid ${C.border}20`,
      }}
    >
      <span
        style={{ fontSize: 11, color: C.muted, fontWeight: 600, minWidth: 140 }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: highlight ? 700 : 500,
          color: highlight ? C.success : C.text,
          fontFamily: mono ? 'monospace' : 'inherit',
          textAlign: 'right',
          flex: 1,
        }}
      >
        {value || '-'}
      </span>
    </div>
  );

  const totalDocs =
    [
      claim.files?.partnerInvoice,
      claim.files?.thirdParty,
      claim.files?.inHouse,
      claim.files?.merchandise,
    ].filter(Boolean).length + (claim.files?.additional?.length || 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          width: 520,
          maxHeight: '88vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 800,
                fontSize: 20,
                marginBottom: 6,
              }}
            >
              Claim Details
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: C.accent,
                }}
              >
                {claim.id}
              </span>
              <span
                style={{
                  background: col + '20',
                  color: col,
                  border: `1px solid ${col}30`,
                  borderRadius: 20,
                  padding: '3px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {lbl}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: C.muted,
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            x
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Activity info */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: C.accent,
              letterSpacing: '0.1em',
              marginBottom: 10,
            }}
          >
            ACTIVITY
          </div>
          <div
            style={{
              background: C.faint,
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 20,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
              {claim.activity}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              Request ID: {claim.reqId}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              Submitted: {claim.submitted}
            </div>
          </div>

          {/* Financials */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: C.accent,
              letterSpacing: '0.1em',
              marginBottom: 10,
            }}
          >
            FINANCIALS
          </div>
          <div
            style={{
              background: C.faint,
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 20,
            }}
          >
            <Row
              label="Claim Amount (Net)"
              value={`${claim.currency || 'EUR'} ${Number(
                claim.claimAmount || 0
              ).toLocaleString()}`}
              mono
              highlight
            />
            {claim.vatPct > 0 && (
              <Row
                label={`VAT (${claim.vatPct}%)`}
                value={`${claim.currency || 'EUR'} ${Math.round(
                  ((claim.claimAmount || 0) * claim.vatPct) / 100
                ).toLocaleString()}`}
                mono
              />
            )}
            <Row
              label="Total Claim (incl. VAT)"
              value={`${claim.currency || 'EUR'} ${Number(
                claim.totalValue || claim.claimAmount || 0
              ).toLocaleString()}`}
              mono
              highlight
            />
            <Row label="Currency" value={claim.currency || 'EUR'} />
          </div>

          {/* Documents */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: C.accent,
              letterSpacing: '0.1em',
              marginBottom: 10,
            }}
          >
            DOCUMENTS SUBMITTED ({totalDocs})
          </div>
          <div
            style={{
              background: C.faint,
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: totalDocs > 0 ? 20 : 0,
            }}
          >
            {totalDocs === 0 && (
              <div style={{ fontSize: 12, color: C.muted }}>
                No documents attached
              </div>
            )}
            {[
              ['Partner Invoice', claim.files?.partnerInvoice, true],
              ['Third Party Supplier', claim.files?.thirdParty, false],
              ['Partner In-House', claim.files?.inHouse, false],
              ['Merchandise Receipt', claim.files?.merchandise, false],
            ]
              .filter(([, v]) => v)
              .map(([label, name, req]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 0',
                    borderBottom: `1px solid ${C.border}20`,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: C.success + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      fontWeight: 700,
                      color: C.success,
                      flexShrink: 0,
                    }}
                  >
                    PDF
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 11, fontWeight: 600, color: C.text }}
                    >
                      {name}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted }}>
                      {label}
                      {req ? ' (required)' : ''}
                    </div>
                  </div>
                </div>
              ))}
            {(claim.files?.additional || []).map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 0',
                  borderBottom: `1px solid ${C.border}20`,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: C.faint,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 700,
                    color: C.muted,
                    flexShrink: 0,
                  }}
                >
                  DOC
                </div>
                <div style={{ fontSize: 11, color: C.text }}>{f}</div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {claim.notes && (
            <>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: C.accent,
                  letterSpacing: '0.1em',
                  marginBottom: 10,
                  marginTop: 20,
                }}
              >
                SUPPORTING NOTES
              </div>
              <div
                style={{
                  background: C.faint,
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 12,
                  color: C.muted,
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                }}
              >
                "{claim.notes}"
              </div>
            </>
          )}

          {/* Status timeline */}
          <div
            style={{
              marginTop: 20,
              padding: '12px 14px',
              background: C.faint,
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.muted,
                marginBottom: 10,
                letterSpacing: '0.06em',
              }}
            >
              CLAIM PROGRESS
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {[
                'submitted',
                'marketing_review',
                'finance_review',
                'approved',
                'paid',
              ].map((s, i) => {
                const steps = [
                  'submitted',
                  'marketing_review',
                  'finance_review',
                  'approved',
                  'paid',
                ];
                const currentIdx = steps.indexOf(claim.status);
                const done = i < currentIdx;
                const active = i === currentIdx;
                const colors = [
                  '#f59e0b',
                  '#06b6d4',
                  '#8b5cf6',
                  '#10b981',
                  '#14b8a6',
                ];
                const labels = [
                  'Submitted',
                  'Mktg Review',
                  'Finance',
                  'Approved',
                  'Paid',
                ];
                const c = colors[i];
                return (
                  <div
                    key={s}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: done || active ? c : C.card,
                        border: `2px solid ${done || active ? c : C.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 6,
                        boxShadow: active ? `0 0 0 3px ${c}30` : 'none',
                      }}
                    >
                      {done && (
                        <span
                          style={{
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 900,
                          }}
                        >
                          v
                        </span>
                      )}
                      {!done && (
                        <span
                          style={{
                            color: active ? '#fff' : C.muted,
                            fontSize: 9,
                            fontWeight: 700,
                          }}
                        >
                          {i + 1}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        color: active ? c : C.muted,
                        fontWeight: active ? 700 : 400,
                        textAlign: 'center',
                      }}
                    >
                      {labels[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              background: 'transparent',
              border: `1px solid ${C.border}`,
              color: C.muted,
              borderRadius: 10,
              padding: 12,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              marginTop: 20,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PARTNER PORTAL ------------------------------------------------
export default function App() {
  const [partner, setPartner] = useState(null);
  const [allPartners, setAllPartners] = useState(SAMPLE_PARTNERS);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [pipelineData, setPipelineData] = React.useState({});
  const [tab, setTab] = useState('overview');
  const [requests, setRequests] = useState([]);
  const [claims, setClaims] = useState([]);
  const [showNewReq, setShowNewReq] = useState(false);
  const [newReqKey, setNewReqKey] = useState(0); // BUG-010 FIX: increment to force modal remount
  const [showClaim, setShowClaim] = useState(null);
  const [showCancelPostpone, setShowCancelPostpone] = useState(null);
  const [showRequestDetail, setShowRequestDetail] = useState(null);
  const [showClaimDetail, setShowClaimDetail] = useState(null);
  const [prefillItem, setPrefillItem] = useState(null);
  const [notif, setNotif] = useState(null);

  const toast = (msg, color = C.success) => {
    setNotif({ msg, color });
    setTimeout(() => setNotif(null), 3500);
  };

  // Load partner list for login screen
  React.useEffect(function () {
    dbSelect('partners', 'order=name.asc')
      .then(function (rows) {
        if (rows.length > 0)
          setAllPartners(
            rows.map(function (r) {
              return {
                id: r.id,
                name: r.name,
                region: r.region,
                subregion: r.subregion,
                country: r.country,
                type: r.type,
                tier: r.tier,
                allocated: Number(r.allocated || 0),
                spent: Number(r.spent || 0),
                pending: Number(r.pending || 0),
                status: r.status,
                contactName: r.contact_name,
                contactEmail: r.contact_email,
                accountManager: r.account_manager,
              };
            })
          );
      })
      .catch(function () {});
  }, []);

  // Load & poll data when partner logs in
  var _savingRef = React.useRef(false);
  React.useEffect(
    function () {
      if (!partner) return;
      var load = async function () {
        if (_savingRef.current) return; // skip poll while saving
        try {
          var rRows = await dbSelect(
            'requests',
            'partner_name=eq.' +
              encodeURIComponent(partner.name) +
              '&order=created_at.desc'
          );
          var iRows =
            rRows.length > 0
              ? await dbSelect(
                  'request_items',
                  'request_id=in.(' +
                    rRows
                      .map(function (r) {
                        return r.id;
                      })
                      .join(',') +
                    ')'
                )
              : [];
          setRequests(
            rRows.map(function (r) {
              return _dbToReq(
                r,
                iRows.filter(function (it) {
                  return it.request_id === r.id;
                })
              );
            })
          );
          var cRows = await dbSelect(
            'claims',
            'partner=eq.' +
              encodeURIComponent(partner.name) +
              '&order=created_at.desc'
          );
          setClaims(cRows.map(_dbToClaim));
          // BREAK-004 FIX: reload partner record so allocation changes from CMM are visible
          try {
            var pRows2 = await dbSelect(
              'partners',
              'name=eq.' + encodeURIComponent(partner.name)
            );
            if (pRows2.length > 0) {
              var updated = _dbToPartner(pRows2[0]);
              setPartner(function (prev) {
                return JSON.stringify(prev) !== JSON.stringify(updated)
                  ? updated
                  : prev;
              });
            }
          } catch (e) {
            /* partner reload optional */
          }
          // Load pipeline data (all campaigns)
          try {
            var pipeRows = await dbSelect('pipeline', '');
            var pd = {};
            pipeRows.forEach(function (r) {
              pd[r.campaign_id] = r.pipeline_amount;
            });
            console.log(
              '[Portal] Pipeline loaded:',
              Object.keys(pd).length,
              'records',
              pd
            );
            setPipelineData(pd);
          } catch (e) {
            console.warn('[Portal] Pipeline load error:', e.message);
          }
          setDbLoaded(true);
        } catch (e) {
          console.warn('[Portal] Load error:', e.message);
          setDbLoaded(true);
        }
      };
      load();
      var iv = setInterval(load, 5000);
      return function () {
        clearInterval(iv);
      };
    },
    [partner]
  );

  if (!partner)
    return (
      <LoginScreen partners={allPartners} onLogin={(p) => setPartner(p)} />
    );

  const myRequests = requests.filter((r) => r.partner === partner.name);
  const myClaims = claims.filter((c) => c.partner === partner.name);
  const myItems = myRequests.flatMap((r) =>
    (r.items || []).map((it) => ({ ...it, reqId: r.id, reqStatus: r.status }))
  );

  const availableBudget = partner.allocated - partner.spent - partner.pending;
  const utilPct = Math.round(
    ((partner.spent + partner.pending) / (partner.allocated || 1)) * 100
  );
  const approvedItems = myItems.filter(
    (it) =>
      (it.itemStatus || it.reqStatus) === 'approved' ||
      it.itemStatus === 'approved_and_signed'
  );
  const claimedItemIds = new Set(myClaims.map((c) => c.itemId));

  const navItems = [
    { id: 'overview', label: 'Overview', badge: 0 },
    {
      id: 'requests',
      label: 'My Requests',
      badge:
        myItems.filter(
          (it) => (it.itemStatus || it.reqStatus) === 'request_submitted'
        ).length || 0,
    },
    {
      id: 'claims',
      label: 'My Claims',
      badge: myClaims.filter((c) => c.status === 'submitted').length || 0,
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        fontFamily: 'system-ui,sans-serif',
        fontSize: 14,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input,select,textarea{font-family:inherit;color:#0a0a1a;background:#eef1fb}
        button{font-family:inherit;cursor:pointer}
        @keyframes slideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        select option{background:#ffffff;color:#0a0a1a}
      `}</style>

      {notif && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 999,
            background: notif.color,
            color: '#000',
            borderRadius: 12,
            padding: '12px 20px',
            fontWeight: 700,
            fontSize: 13,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.3s ease',
          }}
        >
          {notif.msg}
        </div>
      )}

      {/* Top nav */}
      <div
        style={{
          background: C.navBg,
          borderBottom: `1px solid #00006a`,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            <span style={{ color: '#60aaff' }}>OT</span>{' '}
            <span style={{ color: '#ffffff' }}>Partner Portal</span>
          </div>
          <div style={{ width: 1, height: 20, background: C.border }} />
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: tab === n.id ? '#ffffff' : 'rgba(255,255,255,0.65)',
                fontWeight: tab === n.id ? 700 : 500,
                fontSize: 13,
                padding: '0 4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 56,
                borderBottom:
                  tab === n.id ? '2px solid #60aaff' : '2px solid transparent',
              }}
            >
              {n.label}
              {n.badge > 0 && (
                <span
                  style={{
                    background: C.warning,
                    color: '#000',
                    borderRadius: 20,
                    padding: '1px 7px',
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {n.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
              {partner.contactName}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
              {partner.name}
            </div>
          </div>
          <button
            onClick={() => {
              setPartner(null);
              setTab('overview');
            }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'rgba(255,255,255,0.8)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 28 }}>
        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div style={{ animation: 'slideIn 0.3s ease' }}>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 26,
                  fontWeight: 800,
                  marginBottom: 4,
                }}
              >
                Welcome, {partner.contactName}
              </div>
              <div style={{ color: C.muted, fontSize: 14 }}>
                {partner.name} . {partner.tier} Partner . {partner.type} .{' '}
                {partner.country}
              </div>
            </div>
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: 20,
                marginBottom: 20,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: 16,
              }}
            >
              {[
                ['Contact Name', partner.contactName],
                ['Contact Email', partner.contactEmail],
                ['Partner Type', partner.type],
                ['OT Partner Mgr', partner.accountManager],
              ].map(([k, v]) => (
                <div key={k}>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.muted,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      marginBottom: 4,
                    }}
                  >
                    {k.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      wordBreak: 'break-all',
                    }}
                  >
                    {v || '-'}
                  </div>
                </div>
              ))}
            </div>

            {/* ── KPI Row 1: Available / Allocated / Spent – mirrors MDF Manager dashboard ── */}
            {(() => {
              const ROI_TARGET = 30;
              const myAllItems = myRequests.flatMap((r) =>
                (r.items || []).map((it) => ({ ...it }))
              );
              const totalPipeline = myAllItems.reduce(
                (s, it) =>
                  s + (pipelineData[it.campaignId] || pipelineData[it.id] || 0),
                0
              );
              const mdfAllocated = myRequests
                .filter((r) => ['signed', 'po_raised'].includes(r.status))
                .flatMap((r) => r.items || [])
                .reduce((s, it) => s + Number(it.mdfRequest || 0), 0);
              const mdfSpent = myClaims
                .filter((c) => ['approved', 'paid'].includes(c.status))
                .reduce((s, c) => s + Number(c.claimAmount || 0), 0);
              const mdfBase =
                mdfAllocated > 0 ? mdfAllocated : partner.allocated;
              const targetPipeline = mdfBase * ROI_TARGET;
              const actualRatio =
                mdfBase > 0 && totalPipeline > 0 ? totalPipeline / mdfBase : 0;
              const roiColor =
                actualRatio >= ROI_TARGET
                  ? C.success
                  : actualRatio >= ROI_TARGET * 0.7
                  ? '#f59e0b'
                  : C.danger;

              const kpiStyle = (color) => ({
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '16px 18px',
              });
              const kpiLabel = (txt) => (
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                  }}
                >
                  {txt}
                </div>
              );
              const kpiVal = (txt, color) => (
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 18,
                    fontWeight: 800,
                    color,
                    marginBottom: 4,
                  }}
                >
                  {txt}
                </div>
              );
              const kpiSub = (txt, color) => (
                <div style={{ fontSize: 11, color: color || C.muted }}>
                  {txt}
                </div>
              );

              return (
                <>
                  {/* Row 1: Available / Allocated / Spent */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3,1fr)',
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div style={kpiStyle()}>
                      {kpiLabel('Available')}
                      {kpiVal(
                        `EUR ${partner.allocated.toLocaleString()}`,
                        C.accent
                      )}
                      {kpiSub('Total budget · your allocation')}
                    </div>
                    <div style={kpiStyle()}>
                      {kpiLabel('Allocated')}
                      {kpiVal(
                        mdfAllocated > 0
                          ? `EUR ${mdfAllocated.toLocaleString()}`
                          : '—',
                        C.purple
                      )}
                      {kpiSub(
                        mdfAllocated > 0
                          ? 'PO raised · MDF committed'
                          : 'No PO raised yet'
                      )}
                    </div>
                    <div style={kpiStyle()}>
                      {kpiLabel('Spent / Used')}
                      {kpiVal(
                        mdfSpent > 0 ? `EUR ${mdfSpent.toLocaleString()}` : '—',
                        C.success
                      )}
                      {kpiSub(
                        mdfSpent > 0
                          ? `${Math.round(
                              (mdfSpent / partner.allocated) * 100
                            )}% of budget`
                          : 'No approved claims yet'
                      )}
                    </div>
                  </div>

                  {/* Row 2: Pipeline Target / Pipeline Generated / ROI Ratio */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3,1fr)',
                      gap: 12,
                      marginBottom: 20,
                    }}
                  >
                    <div style={kpiStyle()}>
                      {kpiLabel('Pipeline Target (1:30)')}
                      {kpiVal(
                        `USD ${Math.round(targetPipeline).toLocaleString()}`,
                        C.accent
                      )}
                      {kpiSub(
                        mdfAllocated > 0
                          ? 'Based on signed MDF'
                          : 'Based on total budget'
                      )}
                    </div>
                    <div style={kpiStyle()}>
                      {kpiLabel('Pipeline Generated')}
                      {kpiVal(
                        totalPipeline > 0
                          ? `USD ${Math.round(totalPipeline).toLocaleString()}`
                          : '— No data yet',
                        totalPipeline > 0 ? roiColor : C.muted
                      )}
                      {kpiSub(
                        totalPipeline > 0
                          ? 'Reported by your CMM'
                          : 'Your CMM imports pipeline data',
                        totalPipeline > 0 ? roiColor : C.muted
                      )}
                    </div>
                    <div
                      style={{
                        ...kpiStyle(),
                        border: `2px solid ${
                          totalPipeline > 0 ? roiColor + '40' : C.border
                        }`,
                      }}
                    >
                      {kpiLabel('ROI Ratio')}
                      {kpiVal(
                        totalPipeline > 0
                          ? `1 : ${Math.round(actualRatio)}`
                          : '—',
                        roiColor
                      )}
                      {kpiSub(
                        totalPipeline > 0
                          ? actualRatio >= ROI_TARGET
                            ? '✓ Above 1:30 target'
                            : `${Math.round(
                                (actualRatio / ROI_TARGET) * 100
                              )}% of 1:30 target`
                          : 'Target: 1:30',
                        totalPipeline > 0 ? roiColor : C.muted
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  Recent Requests
                </div>
                <button
                  onClick={() => {
                    setShowNewReq(true);
                    setNewReqKey((k) => k + 1);
                  }}
                  style={{
                    background: C.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 16px',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  + New Request
                </button>
              </div>
              {myRequests.slice(0, 2).map((req) => (
                <div
                  key={req.id}
                  style={{
                    marginBottom: 16,
                    paddingBottom: 16,
                    borderBottom: `1px solid ${C.border}20`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: C.accent,
                      }}
                    >
                      {req.id}
                    </span>
                    <StatusPill status={req.status} />
                  </div>
                  <StatusTimeline status={req.status} compact={false} />
                </div>
              ))}
              {myItems.length === 0 && (
                <div
                  style={{
                    color: C.muted,
                    fontSize: 13,
                    textAlign: 'center',
                    padding: '20px 0',
                  }}
                >
                  No requests yet. Submit your first MDF request.
                </div>
              )}
            </div>
            {approvedItems.filter((it) => !claimedItemIds.has(it.id)).length >
              0 && (
              <div
                style={{
                  background: C.success + '10',
                  border: `1px solid ${C.success}30`,
                  borderRadius: 14,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: C.success,
                    marginBottom: 12,
                  }}
                >
                  Ready to Claim (
                  {
                    approvedItems.filter((it) => !claimedItemIds.has(it.id))
                      .length
                  }{' '}
                  activities)
                </div>
                {approvedItems
                  .filter((it) => !claimedItemIds.has(it.id))
                  .map((it) => {
                    const req = myRequests.find((r) => r.id === it.reqId);
                    return (
                      <div
                        key={it.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 0',
                          borderBottom: `1px solid ${C.success}20`,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {it.title}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: C.muted,
                              marginTop: 2,
                            }}
                          >
                            {it.fyHalf} . {it.month}
                          </div>
                          {getClaimDeadline(it.fyQuarter) && (
                            <div
                              style={{
                                fontSize: 11,
                                color: C.warning,
                                fontWeight: 700,
                                marginTop: 2,
                              }}
                            >
                              Claim by {getClaimDeadline(it.fyQuarter).deadline}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 12,
                              fontWeight: 700,
                              color: C.success,
                            }}
                          >
                            {it.localCurrency || 'EUR'}{' '}
                            {Number(it.mdfRequest || 0).toLocaleString()}
                          </span>
                          {it.campaignId && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: C.accent,
                                background: C.accent + '18',
                                borderRadius: 4,
                                padding: '2px 7px',
                                fontFamily: 'monospace',
                                letterSpacing: '0.04em',
                              }}
                              title="Campaign ID"
                            >
                              {it.campaignId}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              // BREAK-002: check if claim already exists for this item
                              const alreadyClaimed = myClaims.some(
                                (c) =>
                                  c.itemId === it.id &&
                                  !['rejected', 'cancelled'].includes(c.status)
                              );
                              if (alreadyClaimed) {
                                toast(
                                  'A claim already exists for this activity. Check My Claims tab.',
                                  '#ef4444'
                                );
                                return;
                              }
                              setShowClaim({ request: req, item: it });
                            }}
                            style={{
                              background: C.success,
                              color: '#000',
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 14px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Claim
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* REQUESTS */}
        {tab === 'requests' && (
          <div style={{ animation: 'slideIn 0.3s ease' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 24,
                    fontWeight: 800,
                    marginBottom: 4,
                  }}
                >
                  My MDF Requests
                </div>
                <div style={{ color: C.muted, fontSize: 13 }}>
                  {myItems.length} activities across {myRequests.length}{' '}
                  requests
                </div>
              </div>
              <button
                onClick={() => {
                  setShowNewReq(true);
                  setNewReqKey((k) => k + 1);
                }}
                style={{
                  background: C.accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 20px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                + New Request
              </button>
            </div>
            {myItems.length === 0 && (
              <div
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: 60,
                  textAlign: 'center',
                  color: C.muted,
                }}
              >
                No requests yet.
              </div>
            )}
            {myRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: 20,
                  marginBottom: 14,
                  cursor: 'pointer',
                  transition: 'border 0.15s',
                }}
                onClick={() => setShowRequestDetail(req)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.border = `1px solid ${C.accent}50`)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.border = `1px solid ${C.border}`)
                }
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: C.accent,
                      }}
                    >
                      {req.id}
                    </span>
                    <span
                      style={{ fontSize: 12, color: C.muted, marginLeft: 12 }}
                    >
                      Submitted {req.submitted}
                    </span>
                    <span
                      style={{ fontSize: 10, color: C.muted, marginLeft: 8 }}
                    >
                      . Click to review
                    </span>
                  </div>
                  <StatusPill status={req.status} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <StatusTimeline status={req.status} compact={true} />
                </div>
                {(req.items || []).map((item) => {
                  const iStatus = item.itemStatus || req.status;
                  const canClaim =
                    (iStatus === 'approved' ||
                      iStatus === 'approved_and_signed') &&
                    !claimedItemIds.has(item.id);
                  const canUpdate =
                    iStatus === 'approved' || iStatus === 'approved_and_signed';
                  const deadline = getClaimDeadline(item.fyQuarter);
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: C.faint,
                        borderRadius: 10,
                        padding: '12px 14px',
                        marginBottom: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            marginBottom: 3,
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: C.muted,
                            display: 'flex',
                            gap: 12,
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>
                            {item.fyHalf} . {item.fyQuarter} . {item.month}
                          </span>
                          <span>{item.productGroup}</span>
                          <span>{item.tactic}</span>
                        </div>
                        {(iStatus === 'approved' ||
                          iStatus === 'approved_and_signed') &&
                          deadline && (
                            <div
                              style={{
                                fontSize: 11,
                                color: C.warning,
                                fontWeight: 700,
                                marginTop: 4,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              Claim by {deadline.deadline}
                            </div>
                          )}
                        {item.allocadiaId && (
                          <div
                            style={{
                              fontSize: 10,
                              fontFamily: 'monospace',
                              color: C.muted,
                              marginTop: 4,
                            }}
                          >
                            Allocadia: {item.allocadiaId}
                          </div>
                        )}
                        {item.itemStatus === 'cancelled_by_partner' && (
                          <div
                            style={{
                              fontSize: 11,
                              color: C.danger,
                              marginTop: 4,
                              fontWeight: 600,
                            }}
                          >
                            Cancelled
                            {item.cancelReason ? ` - ${item.cancelReason}` : ''}
                          </div>
                        )}
                        {item.itemStatus === 'postponed' && (
                          <div
                            style={{
                              fontSize: 11,
                              color: C.warning,
                              marginTop: 4,
                              fontWeight: 600,
                            }}
                          >
                            Postponed - new request submitted
                          </div>
                        )}
                        {item.itemStatus === 'request_submitted' &&
                          item.modifyReason && (
                            <div
                              style={{
                                fontSize: 11,
                                color: C.accent,
                                marginTop: 4,
                              }}
                            >
                              Modification pending review
                            </div>
                          )}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexShrink: 0,
                        }}
                      >
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 12,
                              fontWeight: 700,
                              color: C.accent,
                            }}
                          >
                            {item.localCurrency || 'EUR'}{' '}
                            {Number(item.mdfRequest || 0).toLocaleString()}
                          </div>
                          <div style={{ fontSize: 10, color: C.muted }}>
                            MDF Request
                          </div>
                        </div>
                        <StatusPill status={iStatus} />
                        {canClaim && (
                          <button
                            onClick={() => setShowClaim({ request: req, item })}
                            style={{
                              background: C.success,
                              color: '#000',
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 12px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Claim
                          </button>
                        )}
                        {canUpdate && (
                          <button
                            onClick={() =>
                              setShowCancelPostpone({ request: req, item })
                            }
                            style={{
                              background: 'transparent',
                              color: C.muted,
                              border: `1px solid ${C.border}`,
                              borderRadius: 8,
                              padding: '6px 10px',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* CLAIMS */}
        {tab === 'claims' && (
          <div style={{ animation: 'slideIn 0.3s ease' }}>
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 24,
                  fontWeight: 800,
                  marginBottom: 4,
                }}
              >
                My Claims
              </div>
              <div style={{ color: C.muted, fontSize: 13 }}>
                {myClaims.length} claims submitted
              </div>
            </div>
            {approvedItems.filter((it) => !claimedItemIds.has(it.id)).length >
              0 && (
              <div
                style={{
                  background: C.success + '10',
                  border: `1px solid ${C.success}30`,
                  borderRadius: 14,
                  padding: 20,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: C.success,
                    marginBottom: 12,
                  }}
                >
                  Activities Ready to Claim
                </div>
                {approvedItems
                  .filter((it) => !claimedItemIds.has(it.id))
                  .map((it) => {
                    const req = myRequests.find((r) => r.id === it.reqId);
                    return (
                      <div
                        key={it.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 0',
                          borderBottom: `1px solid ${C.success}20`,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {it.title}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: C.muted,
                              marginTop: 2,
                            }}
                          >
                            {it.fyHalf} . {it.month}
                          </div>
                          {it.fyQuarter && getClaimDeadline(it.fyQuarter) && (
                            <div
                              style={{
                                fontSize: 11,
                                color: C.warning,
                                fontWeight: 700,
                                marginTop: 2,
                              }}
                            >
                              Claim by {getClaimDeadline(it.fyQuarter).deadline}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 12,
                              fontWeight: 700,
                              color: C.success,
                            }}
                          >
                            {it.localCurrency || 'EUR'}{' '}
                            {Number(it.mdfRequest || 0).toLocaleString()}
                          </span>
                          <button
                            onClick={() =>
                              setShowClaim({ request: req, item: it })
                            }
                            style={{
                              background: C.success,
                              color: '#000',
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 14px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Submit Claim
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
            {myClaims.length === 0 &&
              approvedItems.filter((it) => !claimedItemIds.has(it.id))
                .length === 0 && (
                <div
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    padding: 60,
                    textAlign: 'center',
                    color: C.muted,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 12 }}>v</div>
                  <div
                    style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}
                  >
                    No Claims Yet
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Once your activities are approved, you can submit claims
                    here.
                  </div>
                </div>
              )}
            {myClaims.map((c) => (
              <div
                key={c.id}
                onClick={() => setShowClaimDetail(c)}
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: 20,
                  marginBottom: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'border 0.15s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.border = `1px solid ${C.accent}50`)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.border = `1px solid ${C.border}`)
                }
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: C.accent,
                      marginBottom: 4,
                    }}
                  >
                    {c.id}
                  </div>
                  <div
                    style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}
                  >
                    {c.activity}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    Submitted {c.submitted} .{' '}
                    <span style={{ color: C.accent }}>
                      Click to view details
                    </span>
                  </div>
                  {c.fyQuarter &&
                    getClaimDeadline(c.fyQuarter) &&
                    (c.status === 'submitted' ||
                      c.status === 'marketing_review' ||
                      c.status === 'finance_review') && (
                      <div
                        style={{
                          fontSize: 11,
                          color: C.warning,
                          fontWeight: 700,
                          marginTop: 3,
                        }}
                      >
                        Claim deadline: {getClaimDeadline(c.fyQuarter).deadline}
                      </div>
                    )}
                </div>
                <div
                  style={{
                    textAlign: 'right',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 16,
                      fontWeight: 800,
                      color: C.success,
                    }}
                  >
                    {c.currency} {Number(c.claimAmount || 0).toLocaleString()}
                  </span>
                  <StatusPill status={c.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNewReq && (
        <NewRequestModal
          key={newReqKey}
          partner={partner}
          prefillItem={prefillItem}
          onAdd={async function (req) {
            _savingRef.current = true;
            toast('Saving request...', '#f59e0b');
            try {
              await dbUpsert('requests', _reqToDB(req));
              await Promise.all(
                (req.items || []).map(function (it) {
                  return dbUpsert('request_items', _itemToDB(it, req.id));
                })
              );
              setRequests(function (p) {
                return [req, ...p];
              });
              toast('Request submitted successfully!');
            } catch (e) {
              console.error('[Portal] Save failed:', e.message);
              toast('Save failed: ' + e.message, '#ef4444');
            } finally {
              _savingRef.current = false;
            }
          }}
          onClose={() => {
            setShowNewReq(false);
            setPrefillItem(null);
          }}
        />
      )}
      {showClaim && (
        <ClaimModal
          request={showClaim.request}
          item={showClaim.item}
          partner={partner}
          onAdd={(c) => {
            (async function () {
              toast('Saving claim...', '#f59e0b');
              try {
                await dbUpsert('claims', _claimToDB(c));
                setClaims(function (p) {
                  return [c, ...p];
                });
                toast('Claim submitted!');
              } catch (e) {
                console.error('[Portal] Claim save failed:', e.message);
                toast('Save failed: ' + e.message, '#ef4444');
              }
            })();
          }}
          onClose={() => setShowClaim(null)}
        />
      )}
      {showRequestDetail && (
        <RequestDetailModal
          request={showRequestDetail}
          claimedItemIds={claimedItemIds}
          onClose={() => setShowRequestDetail(null)}
          onClaim={(req, item) => setShowClaim({ request: req, item })}
          onUpdate={(req, item, mode) =>
            setShowCancelPostpone({ request: req, item, mode })
          }
        />
      )}
      {showClaimDetail && (
        <ClaimDetailModal
          claim={showClaimDetail}
          onClose={() => setShowClaimDetail(null)}
        />
      )}
      {showCancelPostpone && (
        <ActivityUpdateModal
          request={showCancelPostpone.request}
          item={showCancelPostpone.item}
          initialMode={showCancelPostpone.mode === 'modify' ? 'modify' : null}
          onUpdate={({ reqId, itemId, mode, reason, changes, submittedAt }) => {
            setRequests(function (prev) {
              return prev.map(function (r) {
                if (r.id !== reqId) return r;
                var updItems = (r.items || []).map(function (it) {
                  if (it.id !== itemId) return it;
                  if (mode === 'cancel')
                    return {
                      ...it,
                      itemStatus: 'cancelled_by_partner',
                      cancelReason: reason,
                      updatedAt: submittedAt,
                    };
                  if (mode === 'postpone')
                    return {
                      ...it,
                      itemStatus: 'postponed',
                      cancelReason: reason,
                      postponedTo: postponeDate,
                      updatedAt: submittedAt,
                    };
                  if (mode === 'modify')
                    return {
                      ...it,
                      ...changes,
                      modifyReason: reason,
                      updatedAt: submittedAt,
                    };
                  return it;
                });
                // Save updated item to DB
                var updItem = updItems.find(function (it) {
                  return it.id === itemId;
                });
                if (updItem)
                  dbUpsert('request_items', _itemToDB(updItem, reqId)).catch(
                    function () {}
                  );
                return { ...r, items: updItems };
              });
            });
            if (mode === 'cancel')
              toast(
                'Activity cancelled. Your partner manager has been notified.'
              );
            if (mode === 'modify')
              toast('Activity updated and sent back for review.');
          }}
          onSubmitNew={(item) => {
            // Mark original as postponed
            setRequests((prev) =>
              prev.map((r) => ({
                ...r,
                items: (r.items || []).map((it) =>
                  it.id === item.id
                    ? {
                        ...it,
                        itemStatus: 'postponed',
                        cancelReason: 'Moved to next quarter by partner',
                        postponedFrom: item.id,
                      }
                    : it
                ),
              }))
            );
            // Pre-fill new request with ALL original data, clear timing only
            setPrefillItem({
              ...item,
              // Clear timing - partner must choose
              fyHalf: '',
              fyQuarter: '',
              month: '',
              // Keep everything else: tactic, location, audience, solutions, objective, amount, currency, mdfRequest
              // Clear IDs - new activity needs new ones
              allocadiaId: '',
              campaignId: '',
              postponedFromId: item.id,
            });
            setShowCancelPostpone(null);
            setShowNewReq(true);
            setNewReqKey((k) => k + 1);
            toast(
              'Activity moved. All details copied - select the new quarter and submit.'
            );
          }}
          onClose={() => setShowCancelPostpone(null)}
        />
      )}
    </div>
  );
}
