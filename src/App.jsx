import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon, Users, Settings, Plus, Edit2, Trash2, X, Check,
  ChevronLeft, ChevronRight, ClipboardList, Search,
  BarChart3, FlaskConical, User as UserIcon, ListChecks,
  AlertCircle, Activity, UserCheck, CalendarClock,
  Repeat, Hospital, MessageSquare, ChevronDown, LayoutGrid, List,
  Download, Upload, Database, Move, Menu
} from 'lucide-react';
import { supabase } from './supabaseClient';

// ====== Utils ======
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const fmtD = (d) => {
  if (typeof d === 'string') return d;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const parseD = (s) => { const d = new Date(s + 'T00:00:00'); return d; };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return fmtD(d); };
const today = () => fmtD(new Date());
const HOURS = Array.from({length: 24}, (_, i) => `${String(i).padStart(2,'0')}:00`);
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const DEPARTMENTS = [
  '1내과', '2내과', '3내과', '6내과',
  '한방재활의학 1과', '한방재활의학 2과',
  '침구과', '부인소아과', '안이비인후피부과'
];
const EMPTY = { patients: [], doctors: [], nurses: [], examTypes: [], records: [] };

// ====== Small UI ======
function Btn({ children, variant = 'primary', size = 'md', icon: Icon, onClick, disabled, type = 'button', className = '', title }) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const v = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 bg-white',
  };
  const s = { xs: 'px-2 py-1 text-xs', sm: 'px-2.5 py-1 text-xs', md: 'px-3.5 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title}
      className={`${base} ${v[variant]} ${s[size]} ${className}`}>
      {Icon && <Icon className={size === 'xs' || size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {children}
    </button>
  );
}

function Field({ label, children, required, hint }) {
  return (
    <div className="block">
      <div className="text-xs font-medium text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </div>
      {children}
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  );
}

function Input(props) {
  return <input {...props} className={`w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 bg-white text-slate-900 ${props.className||''}`} />;
}

function Select({ options, value, onChange, placeholder = '선택', className = '', disabled = false }) {
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled}
      className={`px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 ${disabled ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white'} ${className}`}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Modal({ open, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const bodyRef = useRef(null);
  useEffect(() => {
    if (open && bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [open]);

  if (!open) return null;
  const sz = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' };

  return (
    <>
      <div className="sm:hidden fixed inset-0 z-50 bg-white flex flex-col" style={{ height: '100vh' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0 bg-white">
          <button onClick={onClose} className="flex items-center gap-1 text-blue-600 font-medium text-sm py-1 -ml-1">
            <ChevronLeft className="w-5 h-5" />뒤로
          </button>
          <h2 className="text-base font-semibold text-slate-900 truncate px-2 absolute left-1/2 -translate-x-1/2 max-w-[60%]">{title}</h2>
          <div className="w-12" />
        </div>
        <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 text-slate-900 bg-white" style={{ WebkitOverflowScrolling: 'touch' }}>
          {children}
          {footer && (
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap justify-end gap-2 sticky bottom-0 bg-white pb-2">
              {footer}
            </div>
          )}
        </div>
      </div>

      <div className="hidden sm:flex fixed inset-0 z-50 items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
        <div className={`bg-white rounded-2xl shadow-2xl w-full ${sz[size]} max-h-[calc(100vh-2rem)] flex flex-col`} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
            <h2 className="text-base font-semibold text-slate-900 truncate pr-2">{title}</h2>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-500 shrink-0" aria-label="닫기">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-5 text-slate-900">{children}</div>
          {footer && (
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex flex-wrap justify-end gap-2 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Empty({ icon: Icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        {Icon && <Icon className="w-6 h-6 text-slate-400" />}
      </div>
      <div className="text-sm font-medium text-slate-700">{title}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ====== Multi-select dropdown for departments ======
function MultiSelectDept({ value, onChange, allOptions, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handler);
      document.addEventListener('touchstart', handler);
    }
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const toggle = (opt) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt));
    else onChange([...value, opt]);
  };

  const label = value.length === 0 ? '진료과 (전체)'
    : value.length === 1 ? value[0]
    : value.length === allOptions.length ? `진료과 모두 (${value.length})`
    : `진료과 ${value.length}개 선택`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-left flex items-center justify-between gap-1 transition-colors ${
          value.length > 0 ? 'border-indigo-400 bg-indigo-50/50 text-indigo-900 font-semibold' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-40 max-h-[60vh] overflow-y-auto" style={{ minWidth: '220px' }}>
          <div className="sticky top-0 bg-white p-2 border-b border-slate-100 flex gap-2">
            <button onClick={() => onChange(allOptions)} className="flex-1 text-xs py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">모두 선택</button>
            <button onClick={() => onChange([])} className="flex-1 text-xs py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">필터 해제</button>
          </div>
          {allOptions.map(opt => {
            const checked = value.includes(opt);
            return (
              <button
                type="button"
                key={opt}
                onClick={() => toggle(opt)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                  checked ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                  checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                }`}>
                  {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ====== Searchable Select dropdown (with filtering & alphabetical sort) ======
function SearchableSelect({ options, value, onChange, placeholder = '선택', className = '', disabled = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handler);
      document.addEventListener('touchstart', handler);
    }
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const selectedOpt = options.find(o => o.value === value);
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-left flex items-center justify-between gap-1 transition-colors ${
          disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'border-slate-300 text-slate-800 hover:bg-slate-50'
        }`}
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 flex flex-col max-h-[260px]" style={{ minWidth: '220px' }}>
          <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="검색어 입력..."
                className="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-200 rounded bg-white text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-2 p-0.5 rounded-full hover:bg-slate-150 text-slate-400 hover:text-slate-650"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-400 text-center">검색 결과가 없습니다</div>
            ) : (
              filtered.map(o => {
                const isSelected = o.value === value;
                return (
                  <button
                    type="button"
                    key={o.value}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                      isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ====== Helpers for records ======
function deriveEntries(records, patients, examTypes) {
  const entries = [];
  for (const r of records) {
    const p = patients.find(x => x.id === r.patientId);
    const e = examTypes.find(x => x.id === r.examTypeId);
    if (!p || !e) continue;
    entries.push({
      key: `${r.id}-exam`, recordId: r.id, kind: 'exam',
      date: r.examDate, time: r.examTime, patient: p, examType: e, record: r,
      isAutoNext: !!r.parentRecordId, status: r.examStatus,
    });
    if (r.explanationDate) {
      entries.push({
        key: `${r.id}-expl`, recordId: r.id, kind: 'explanation',
        date: r.explanationDate, time: r.explanationTime, patient: p, examType: e, record: r,
        status: r.explanationStatus,
      });
    }
  }
  return entries;
}

function entryColor(entry) {
  if (entry.kind === 'explanation') {
    return entry.status === 'completed'
      ? { bg: 'bg-purple-100 text-purple-800 border-purple-300', text: 'text-purple-800', border: 'border-l-purple-500', dot: 'bg-purple-500' }
      : { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700', border: 'border-l-purple-400', dot: 'bg-purple-400' };
  }
  if (entry.isAutoNext) {
    return { bg: 'bg-amber-50 text-amber-800 border-amber-200', text: 'text-amber-800', border: 'border-l-amber-400', dot: 'bg-amber-400' };
  }
  if (entry.status === 'completed') {
    return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'text-emerald-800', border: 'border-l-emerald-500', dot: 'bg-emerald-500' };
  }
  return { bg: 'bg-blue-50 text-blue-800 border-blue-200', text: 'text-blue-800', border: 'border-l-blue-500', dot: 'bg-blue-500' };
}

// Helper getter functions
function getDoctor(data, id) { return data.doctors.find(d => d.id === id); }
function getStaff(data, sid) {
  if (!sid) return null;
  if (sid.startsWith('d:')) return data.doctors.find(x => x.id === sid.slice(2));
  if (sid.startsWith('n:')) return data.nurses.find(x => x.id === sid.slice(2));
  return data.doctors.find(x => x.id === sid);
}

// ====== Calendar (with Day & Month views) ======
function CalendarView({ data, onCreate, onEditEntry, onMoveEntry }) {
  const [viewMode, setViewMode] = useState('day');
  const [selectedDate, setSelectedDate] = useState(today());
  const [cur, setCur] = useState(() => { const d = parseD(today()); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [filterPatient, setFilterPatient] = useState('');
  const [deptFilter, setDeptFilter] = useState([]);
  const [moveTarget, setMoveTarget] = useState(null);

  const allEntries = useMemo(() => deriveEntries(data.records, data.patients, data.examTypes), [data]);
  const filteredEntries = useMemo(() => {
    let result = allEntries;
    if (deptFilter.length > 0) {
      result = result.filter(e => {
        const depts = e.patient.departments || (e.patient.department ? [e.patient.department] : []);
        return depts.some(d => deptFilter.includes(d));
      });
    }
    if (filterPatient) {
      result = result.filter(e => e.patient.id === filterPatient);
    }
    return result;
  }, [allEntries, deptFilter, filterPatient]);

  const patientFilterOptions = useMemo(() => {
    let pats = [...data.patients];
    pats.sort((a, b) => a.initials.localeCompare(b.initials, 'ko'));
    if (deptFilter.length > 0) {
      pats = pats.filter(p => {
        const depts = p.departments || (p.department ? [p.department] : []);
        return depts.some(d => deptFilter.includes(d));
      });
    }
    return pats.map(p => {
      const depts = p.departments || (p.department ? [p.department] : []);
      return { value: p.id, label: `${p.initials}${depts.length ? ` [${depts.join('/')}]` : ''} (${p.chartNumber || '-'})` };
    });
  }, [data.patients, deptFilter]);

  const handleDeptFilterChange = (newDepts) => {
    setDeptFilter(newDepts);
    if (filterPatient) {
      const p = data.patients.find(x => x.id === filterPatient);
      if (p && newDepts.length > 0) {
        const depts = p.departments || (p.department ? [p.department] : []);
        if (!depts.some(d => newDepts.includes(d))) {
          setFilterPatient('');
        }
      }
    }
  };

  useEffect(() => {
    if (viewMode === 'month') {
      const d = parseD(selectedDate);
      setCur({ y: d.getFullYear(), m: d.getMonth() });
    }
  }, [viewMode]); // eslint-disable-line

  const prevDay = () => setSelectedDate(d => addDays(d, -1));
  const nextDay = () => setSelectedDate(d => addDays(d, 1));
  const goPrevMonth = () => setCur(c => { const m = c.m - 1; return m < 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m }; });
  const goNextMonth = () => setCur(c => { const m = c.m + 1; return m > 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m }; });
  const goTodayDay = () => setSelectedDate(today());
  const goTodayMonth = () => { const d = new Date(); setCur({ y: d.getFullYear(), m: d.getMonth() }); };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {viewMode === 'day' ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <button onClick={prevDay} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={e => e.target.value && setSelectedDate(e.target.value)}
                className="flex-1 min-w-0 px-2 sm:px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={nextDay} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0">
                <ChevronRight className="w-5 h-5" />
              </button>
              <Btn variant="secondary" size="sm" onClick={goTodayDay}>오늘</Btn>
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <button onClick={goPrevMonth} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 text-center text-base sm:text-lg font-semibold text-slate-900">{cur.y}년 {cur.m+1}월</div>
              <button onClick={goNextMonth} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0">
                <ChevronRight className="w-5 h-5" />
              </button>
              <Btn variant="secondary" size="sm" onClick={goTodayMonth}>오늘</Btn>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button onClick={() => setViewMode('day')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                viewMode === 'day' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <List className="w-3.5 h-3.5" />일별
            </button>
            <button onClick={() => setViewMode('month')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                viewMode === 'month' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <LayoutGrid className="w-3.5 h-3.5" />월별
            </button>
          </div>
          <MultiSelectDept
            value={deptFilter}
            onChange={handleDeptFilterChange}
            allOptions={DEPARTMENTS}
            className="w-40"
          />
          <SearchableSelect
            placeholder="환자 (전체)"
            value={filterPatient}
            onChange={setFilterPatient}
            options={patientFilterOptions}
            className="flex-1 min-w-0"
          />
          <Btn icon={Plus} onClick={() => onCreate(viewMode === 'day' ? selectedDate : null)}>
            <span className="hidden sm:inline">새 오더</span>
            <span className="sm:hidden">오더</span>
          </Btn>
        </div>

        {(deptFilter.length > 0 || filterPatient) && (
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-500">필터:</span>
            {deptFilter.map(d => (
              <button key={d} onClick={() => handleDeptFilterChange(deptFilter.filter(x => x !== d))}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-medium hover:bg-indigo-200">
                {d} <X className="w-3 h-3" />
              </button>
            ))}
            {filterPatient && (() => {
              const p = data.patients.find(x => x.id === filterPatient);
              return p ? (
                <button onClick={() => setFilterPatient('')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium hover:bg-blue-200">
                  {p.initials} <X className="w-3 h-3" />
                </button>
              ) : null;
            })()}
            <button onClick={() => { handleDeptFilterChange([]); setFilterPatient(''); }}
              className="text-slate-500 hover:text-slate-700 underline ml-1">
              모두 해제
            </button>
            <span className="text-slate-400 ml-1">· {filteredEntries.length}건 표시</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] sm:text-xs text-slate-600 px-1">
        <Legend color="bg-blue-500" label="검사 예정" />
        <Legend color="bg-emerald-500" label="검사 완료" />
        <Legend color="bg-amber-400" label="자동 예약" />
        <Legend color="bg-purple-500" label="결과 설명" />
      </div>

      {viewMode === 'day' ? (
        <DayView
          date={selectedDate}
          entries={filteredEntries}
          data={data}
          onEditEntry={onEditEntry}
          onMoveEntry={onMoveEntry}
          onCreate={onCreate}
          onRequestMove={(entry) => setMoveTarget(entry)}
        />
      ) : (
        <MonthView
          cur={cur}
          entries={filteredEntries}
          onDayClick={(d) => { setSelectedDate(d); setViewMode('day'); }}
          onEditEntry={onEditEntry}
          onMoveEntry={onMoveEntry}
        />
      )}

      <MoveEntryModal
        entry={moveTarget}
        onClose={() => setMoveTarget(null)}
        onMove={(newDate, newTime) => {
          if (moveTarget) onMoveEntry(moveTarget.recordId, moveTarget.kind, newDate, newTime);
          setMoveTarget(null);
        }}
      />
    </div>
  );
}

function MoveEntryModal({ entry, onClose, onMove }) {
  const [d, setD] = useState('');
  const [t, setT] = useState('');
  useEffect(() => {
    if (entry) { setD(entry.date); setT(entry.time || ''); }
  }, [entry]);
  if (!entry) return null;
  return (
    <Modal open={!!entry} onClose={onClose} title="일정 이동" size="sm"
      footer={<><Btn variant="secondary" onClick={onClose}>취소</Btn><Btn icon={Check} onClick={() => onMove(d, t || null)} disabled={!d}>이동</Btn></>}>
      <div className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-lg text-xs">
          <div className="font-semibold text-slate-700">{entry.patient.initials} · {entry.examType.name}</div>
          <div className="text-slate-500 mt-0.5">{entry.kind === 'explanation' ? '결과 설명' : entry.isAutoNext ? '자동 예약 검사' : '검사'} 일정을 이동합니다</div>
        </div>
        <Field label="날짜" required>
          <Input type="date" value={d} onChange={e => setD(e.target.value)} />
        </Field>
        <Field label="시간" hint="비워두면 시간 미정">
          <Select
            placeholder="시간 미정"
            value={t}
            onChange={setT}
            options={HOURS.map(h => ({ value: h, label: h }))}
            className="w-full"
          />
        </Field>
      </div>
    </Modal>
  );
}

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm ${color}`}></span>{label}
    </span>
  );
}

// ====== Day View ======
function DayView({ date, entries, data, onEditEntry, onMoveEntry, onCreate, onRequestMove }) {
  const [dragOver, setDragOver] = useState(null);

  const dayEntries = useMemo(() => entries.filter(e => e.date === date), [entries, date]);

  const byTime = useMemo(() => {
    const map = { unspecified: [] };
    for (const h of HOURS) map[h] = [];
    for (const e of dayEntries) {
      const k = e.time || 'unspecified';
      if (!map[k]) map[k] = [];
      map[k].push(e);
    }
    Object.values(map).forEach(arr => arr.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'exam' ? -1 : 1;
      return a.patient.initials.localeCompare(b.patient.initials);
    }));
    return map;
  }, [dayEntries]);

  const displayHours = useMemo(() => {
    let minH = 7, maxH = 19;
    for (const e of dayEntries) {
      if (e.time) {
        const h = parseInt(e.time.split(':')[0]);
        if (h < minH) minH = h;
        if (h > maxH) maxH = h;
      }
    }
    const result = [];
    for (let h = minH; h <= maxH; h++) {
      result.push(`${String(h).padStart(2, '0')}:00`);
    }
    return result;
  }, [dayEntries]);

  const dt = parseD(date);
  const dayLabel = `${dt.getMonth()+1}월 ${dt.getDate()}일`;
  const fullLabel = `${dt.getFullYear()}년 ${dt.getMonth()+1}월 ${dt.getDate()}일`;
  const wd = WEEKDAYS[dt.getDay()];
  const isToday = date === today();

  const totalCount = dayEntries.length;
  const examCount = dayEntries.filter(e => e.kind === 'exam' && e.status !== 'completed').length;
  const completedCount = dayEntries.filter(e => e.kind === 'exam' && e.status === 'completed').length;
  const explanationCount = dayEntries.filter(e => e.kind === 'explanation').length;

  const onEntryDragStart = (e, entry) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      recordId: entry.recordId, kind: entry.kind, fromDate: entry.date, fromTime: entry.time,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };
  const onSlotDragOver = (e, slot) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(slot); };
  const onSlotDrop = (e, slot) => {
    e.preventDefault();
    setDragOver(null);
    try {
      const { recordId, kind, fromDate, fromTime } = JSON.parse(e.dataTransfer.getData('application/json'));
      const newTime = slot === 'unspecified' ? null : slot;
      if (fromDate === date && (fromTime || null) === newTime) return;
      onMoveEntry(recordId, kind, date, newTime);
    } catch {}
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50/50 to-white">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            <span className="sm:hidden">{dayLabel}</span>
            <span className="hidden sm:inline">{fullLabel}</span>
          </h2>
          <span className={`text-sm font-medium ${dt.getDay() === 0 ? 'text-red-500' : dt.getDay() === 6 ? 'text-blue-500' : 'text-slate-500'}`}>({wd})</span>
          {isToday && <span className="text-[10px] sm:text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">오늘</span>}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px] sm:text-xs text-slate-600 flex-wrap">
          <span><strong className="text-slate-900 text-sm">{totalCount}</strong>건</span>
          {examCount > 0 && <span>· 예정 <strong className="text-blue-700">{examCount}</strong></span>}
          {completedCount > 0 && <span>· 완료 <strong className="text-emerald-700">{completedCount}</strong></span>}
          {explanationCount > 0 && <span>· 결과설명 <strong className="text-purple-700">{explanationCount}</strong></span>}
        </div>
      </div>

      <div>
        {totalCount === 0 ? (
          <Empty icon={CalendarClock} title="이 날의 일정이 없습니다"
            hint="새 오더를 추가하거나 다른 날짜를 선택하세요"
            action={<Btn icon={Plus} onClick={() => onCreate(date, null)}>이 날짜에 오더 추가</Btn>} />
        ) : (
          <div className="divide-y divide-slate-100">
            {byTime.unspecified.length > 0 && (
              <TimeSlotRow
                label="시간 미정"
                isUnspecified
                entries={byTime.unspecified}
                data={data}
                isDragOver={dragOver === 'unspecified'}
                onDragOver={(e) => onSlotDragOver(e, 'unspecified')}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => onSlotDrop(e, 'unspecified')}
                onEntryDragStart={onEntryDragStart}
                onEditEntry={onEditEntry}
                onRequestMove={onRequestMove}
                onAdd={() => onCreate(date, null)}
              />
            )}
            {displayHours.map(h => (
              <TimeSlotRow
                key={h}
                label={h}
                entries={byTime[h] || []}
                data={data}
                isDragOver={dragOver === h}
                onDragOver={(e) => onSlotDragOver(e, h)}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => onSlotDrop(e, h)}
                onEntryDragStart={onEntryDragStart}
                onEditEntry={onEditEntry}
                onRequestMove={onRequestMove}
                onAdd={() => onCreate(date, h)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimeSlotRow({ label, isUnspecified, entries, data, isDragOver, onDragOver, onDragLeave, onDrop, onEntryDragStart, onEditEntry, onRequestMove, onAdd }) {
  const hasEntries = entries.length > 0;
  return (
    <div
      className={`flex items-stretch transition-colors group ${isDragOver ? 'bg-blue-50 ring-2 ring-blue-400 ring-inset' : ''} ${isUnspecified ? 'bg-amber-50/30' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={`w-14 sm:w-24 shrink-0 py-2.5 sm:py-3 px-2 sm:px-3 text-right border-r border-slate-100 ${isUnspecified ? 'bg-amber-100/40' : ''}`}>
        <div className={`font-mono font-semibold ${isUnspecified ? 'text-amber-700 text-[10px] sm:text-xs leading-tight' : 'text-slate-700 text-xs sm:text-sm'}`}>
          {isUnspecified ? <>시간<br/>미정</> : label}
        </div>
        {hasEntries && (
          <div className="text-[10px] text-slate-400 mt-0.5">{entries.length}건</div>
        )}
      </div>

      <div className="flex-1 py-2 px-2 sm:px-3 min-h-[60px] min-w-0">
        {entries.length === 0 ? (
          <button
            onClick={onAdd}
            className="w-full h-full min-h-[44px] text-xs text-slate-300 hover:text-blue-600 active:bg-blue-50 hover:bg-blue-50 rounded-lg transition-all border border-dashed border-transparent hover:border-blue-300"
          >
            + 추가
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            {entries.map(e => (
              <EventCard
                key={e.key}
                entry={e}
                data={data}
                onClick={() => onEditEntry(e)}
                onDragStart={(ev) => onEntryDragStart(ev, e)}
                onMoveClick={(ev) => { ev.stopPropagation(); onRequestMove(e); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ entry, data, onClick, onDragStart, onMoveClick }) {
  const c = entryColor(entry);
  const r = entry.record;
  const kindLabel = entry.kind === 'explanation' ? '결과 설명' : entry.isAutoNext ? '자동 예약' : '검사';
  const Icon = entry.kind === 'explanation' ? MessageSquare : entry.isAutoNext ? Repeat : ClipboardList;

  let docInfo = null;
  if (entry.kind === 'exam') {
    if (entry.status === 'completed') {
      const examDoc = getStaff(data, r.examDoctorId);
      docInfo = examDoc ? `검사: ${examDoc.name}` : null;
    } else {
      const orderDoc = getDoctor(data, r.orderDoctorId);
      docInfo = orderDoc ? `오더: ${orderDoc.name}` : null;
    }
  } else if (entry.kind === 'explanation') {
    const primary = getDoctor(data, r.primaryExplDoctorId);
    const secondary = getDoctor(data, r.secondaryExplDoctorId);
    if (primary || secondary) {
      docInfo = [primary && `정: ${primary.name}`, secondary && `부: ${secondary.name}`].filter(Boolean).join(' / ');
    }
  }

  const isCompletedExam = entry.kind === 'exam' && entry.status === 'completed';

  return (
    <div
      draggable={!isCompletedExam}
      onClick={onClick}
      onDragStart={(ev) => {
        if (isCompletedExam) {
          ev.preventDefault();
          return;
        }
        onDragStart(ev);
      }}
      className={`${c.bg} ${c.text} border-l-4 ${c.border} rounded-lg pl-3 pr-1 py-2 ${isCompletedExam ? 'cursor-default' : 'cursor-pointer active:brightness-90 hover:brightness-95 hover:shadow-sm'} transition w-full sm:min-w-[200px] sm:max-w-[280px] sm:flex-1 flex items-start gap-2`}
      title={`${entry.patient.initials} - ${entry.examType.name}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
          <span className="text-base font-bold tracking-wider leading-none">{entry.patient.initials}</span>
          <span className="text-[10px] opacity-60 font-mono truncate">{entry.patient.chartNumber}</span>
          {entry.status === 'completed' && (
            <span className="ml-auto text-[10px] inline-flex items-center gap-0.5 bg-white/60 px-1.5 py-0.5 rounded font-semibold shrink-0">
              <Check className="w-2.5 h-2.5" />완료
            </span>
          )}
        </div>
        <div className="text-xs font-semibold truncate">{entry.examType.name}</div>
        <div className="flex items-center gap-1.5 text-[10px] opacity-70 mt-0.5">
          <span className="font-medium">{kindLabel}</span>
          {docInfo && <><span>·</span><span className="truncate">{docInfo}</span></>}
        </div>
      </div>
      {!isCompletedExam && (
        <button
          onClick={onMoveClick}
          className="shrink-0 p-1.5 rounded hover:bg-white/40 active:bg-white/60 -my-0.5"
          title="다른 시간/날짜로 이동"
          aria-label="이동"
        >
          <Move className="w-3.5 h-3.5 opacity-70" />
        </button>
      )}
    </div>
  );
}

// ====== Month View ======
function MonthView({ cur, entries, onDayClick, onEditEntry, onMoveEntry }) {
  const [dragOver, setDragOver] = useState(null);

  const daysInGrid = useMemo(() => {
    const first = new Date(cur.y, cur.m, 1);
    const startWeekday = first.getDay();
    const start = new Date(first); start.setDate(start.getDate() - startWeekday);
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      days.push({ date: fmtD(d), dateObj: d, inMonth: d.getMonth() === cur.m });
    }
    return days;
  }, [cur]);

  const entriesByDate = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    Object.values(map).forEach(arr => arr.sort((a, b) => {
      const at = a.time || 'zz'; const bt = b.time || 'zz';
      if (at !== bt) return at < bt ? -1 : 1;
      return a.patient.initials.localeCompare(b.patient.initials);
    }));
    return map;
  }, [entries]);

  const todayStr = today();

  const onEntryDragStart = (e, entry) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      recordId: entry.recordId, kind: entry.kind, fromDate: entry.date, fromTime: entry.time,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDayDragOver = (e, date) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(date); };
  const onDayDrop = (e, date) => {
    e.preventDefault();
    setDragOver(null);
    try {
      const { recordId, kind, fromDate, fromTime } = JSON.parse(e.dataTransfer.getData('application/json'));
      if (fromDate === date) return;
      onMoveEntry(recordId, kind, date, fromTime || null);
    } catch {}
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`px-1 sm:px-2 py-2 text-[10px] sm:text-xs font-semibold text-center ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-600'}`}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 min-h-[420px] sm:min-h-[640px]">
        {daysInGrid.map(d => {
          const dayEntries = entriesByDate[d.date] || [];
          const isToday = d.date === todayStr;
          const isDragOver = dragOver === d.date;
          const dow = d.dateObj.getDay();
          return (
            <div
              key={d.date}
              onClick={() => onDayClick(d.date)}
              onDragOver={(e) => onDayDragOver(e, d.date)}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => onDayDrop(e, d.date)}
              className={`relative border-r border-b border-slate-100 p-1 sm:p-1.5 cursor-pointer transition-colors min-h-[60px] sm:min-h-[110px] ${
                d.inMonth ? 'bg-white' : 'bg-slate-50/50'
              } ${isDragOver ? 'bg-blue-50 ring-2 ring-blue-400 ring-inset' : 'active:bg-slate-100 hover:bg-slate-50'}`}
            >
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <div className={`text-[11px] sm:text-xs font-medium w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-blue-600 text-white shadow-sm' : !d.inMonth ? 'text-slate-400' : dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-slate-700'
                }`}>
                  {d.dateObj.getDate()}
                </div>
                {dayEntries.length > 0 && (
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold">{dayEntries.length}건</span>
                )}
              </div>
              <div className="sm:hidden flex flex-wrap gap-0.5">
                {dayEntries.slice(0, 6).map(e => {
                  const c = entryColor(e);
                  return <div key={e.key} className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />;
                })}
                {dayEntries.length > 6 && <span className="text-[9px] text-slate-500">+</span>}
              </div>
              <div className="hidden sm:block space-y-1">
                {dayEntries.slice(0, 4).map(e => {
                  const c = entryColor(e);
                  const isCompleted = e.kind === 'exam' && e.status === 'completed';
                  return (
                    <div
                      key={e.key}
                      draggable={!isCompleted}
                      onClick={(ev) => { ev.stopPropagation(); onEditEntry(e); }}
                      onDragStart={(ev) => {
                        if (isCompleted) {
                          ev.preventDefault();
                          return;
                        }
                        ev.stopPropagation();
                        onEntryDragStart(ev, e);
                      }}
                      className={`group ${c.bg} ${c.text} border-l-2 ${c.border} px-1.5 py-1 rounded text-[11px] leading-tight ${isCompleted ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} hover:brightness-95 transition`}
                      title={`${e.time || '시간 미정'} ${e.patient.initials} - ${e.examType.name}`}
                    >
                      <div className="flex items-center gap-1 font-bold">
                        {e.kind === 'explanation' && <MessageSquare className="w-2.5 h-2.5 shrink-0" />}
                        {e.isAutoNext && e.kind === 'exam' && <Repeat className="w-2.5 h-2.5 shrink-0" />}
                        {e.status === 'completed' && <Check className="w-2.5 h-2.5 shrink-0" />}
                        <span className="truncate">{e.time || ''} {e.patient.initials}</span>
                      </div>
                      <div className="text-[10px] opacity-80 truncate">{e.examType.name}</div>
                    </div>
                  );
                })}
                {dayEntries.length > 4 && (
                  <div className="text-[10px] text-slate-500 px-1 font-semibold">+{dayEntries.length - 4}건 더 (클릭)</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ====== Record Edit Modal ======
function RecordModal({ open, onClose, record, defaultDate, defaultTime, entryKind, data, onSave, onDelete }) {
  const [form, setForm] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [intervalInput, setIntervalInput] = useState('');

  useEffect(() => {
    if (!open) setConfirmDel(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({ ...record });
    } else {
      setForm({
        id: null,
        patientId: '',
        examTypeId: '',
        examDate: defaultDate || today(),
        examTime: defaultTime || '',
        examStatus: 'scheduled',
        orderDoctorId: '',
        examDoctorId: '',
        explanationDate: '',
        explanationTime: '',
        primaryExplDoctorId: '',
        secondaryExplDoctorId: '',
        explanationStatus: 'none',
        notes: '',
        parentRecordId: null,
        autoNextGenerated: false,
      });
    }
  }, [open, record, defaultDate, defaultTime]);

  useEffect(() => {
    if (form?.patientId && form?.examTypeId) {
      const patient = data.patients.find(p => p.id === form.patientId);
      const custom = patient?.assignedExams?.find(ae => ae.examTypeId === form.examTypeId);
      if (custom) {
        setIntervalInput(String(custom.intervalDays));
      } else {
        setIntervalInput('');
      }
    } else {
      setIntervalInput('');
    }
  }, [form?.patientId, form?.examTypeId, data.patients]);

  if (!open || !form) return null;

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const examType = data.examTypes.find(t => t.id === form.examTypeId);
  const isEdit = !!form.id;
  const isAutoNext = !!form.parentRecordId;
  const isExplanationEntry = entryKind === 'explanation';
  const examTypeLocked = isExplanationEntry || isAutoNext;
  const examPatient = data.patients.find(p => p.id === form.patientId);
  
  // Calculate interval to display as notice, dynamically taking the user's current input into account
  const activeInterval = intervalInput !== ''
    ? (parseInt(intervalInput, 10) || 0)
    : (examType?.intervalDays || 0);

  const canSave = form.patientId && form.examTypeId && form.examDate;

  const handleSave = () => {
    if (!canSave) return;
    onSave(form, intervalInput);
    onClose();
  };

  const docOpts = data.doctors.map(d => ({ value: d.id, label: d.name }));
  const allStaffOpts = [
    ...data.doctors.map(d => ({ value: `d:${d.id}`, label: `의사) ${d.name}` })),
    ...data.nurses.map(n => ({ value: `n:${n.id}`, label: `간호사) ${n.name}` })),
  ];

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? '검사 일정 편집' : '새 검사 오더'} size="lg"
      footer={
        confirmDel ? (
          <>
            <div className="flex items-center gap-2 text-xs text-red-700 font-medium mr-auto">
              <AlertCircle className="w-4 h-4" />이 검사 일정을 삭제하시겠습니까?
            </div>
            <Btn variant="secondary" onClick={() => setConfirmDel(false)}>취소</Btn>
            <Btn variant="danger" icon={Trash2} onClick={() => { onDelete(form.id); setConfirmDel(false); onClose(); }}>삭제 확정</Btn>
          </>
        ) : (
          <>
            {isEdit && <Btn variant="danger" icon={Trash2} onClick={() => setConfirmDel(true)}>삭제</Btn>}
            <div className="flex-1" />
            <Btn variant="secondary" onClick={onClose}>취소</Btn>
            <Btn icon={Check} onClick={handleSave} disabled={!canSave}>{isEdit ? '저장' : '오더 생성'}</Btn>
          </>
        )
      }>
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="환자" required>
            <SearchableSelect
              placeholder="환자 선택"
              value={form.patientId}
              onChange={v => set('patientId', v)}
              options={[...data.patients]
                .sort((a, b) => a.initials.localeCompare(b.initials, 'ko'))
                .map(p => {
                  const depts = p.departments || (p.department ? [p.department] : []);
                  return { value: p.id, label: `${p.initials}${depts.length ? ` [${depts.join('/')}]` : ''} · ${p.birth6 || ''} · ${p.chartNumber || ''}` };
                })}
              className="w-full"
            />
          </Field>
          <Field
            label="검사 종류"
            required={!examTypeLocked}
            hint={
              isExplanationEntry ? '검사 종류는 검사 일정에서만 변경할 수 있습니다.'
              : isAutoNext ? '자동 예약 검사는 원본 검사의 종류와 자동 동기화됩니다.'
              : undefined
            }
          >
            <Select
              placeholder="검사 선택"
              value={form.examTypeId}
              onChange={v => set('examTypeId', v)}
              options={data.examTypes.map(e => ({ value: e.id, label: `${e.name}` }))}
              className="w-full"
              disabled={examTypeLocked}
            />
          </Field>
        </div>

        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <div className="text-sm font-bold text-slate-800">검사 일정</div>
            {form.parentRecordId && (
              <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">자동 예약</span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="검사 날짜" required>
              <Input type="date" value={form.examDate} onChange={e => set('examDate', e.target.value)} />
            </Field>
            <Field label="검사 시간" hint="비워두면 '시간 미정'">
              <Select
                placeholder="시간 미정"
                value={form.examTime || ''}
                onChange={v => set('examTime', v)}
                options={HOURS.map(h => ({ value: h, label: h }))}
                className="w-full"
              />
            </Field>
            <Field label="오더 의사">
              <Select placeholder="선택" value={form.orderDoctorId} onChange={v => set('orderDoctorId', v)} options={docOpts} className="w-full" />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="검사 상태">
              <Select
                value={form.examStatus}
                onChange={v => set('examStatus', v)}
                options={[{ value: 'scheduled', label: '예정' }, { value: 'completed', label: '완료' }]}
                className="w-full"
              />
            </Field>
            {form.examStatus === 'completed' && (
              <Field label="검사 담당자 (의사/간호사)">
                <Select
                  placeholder="담당자 선택"
                  value={form.examDoctorId || ''}
                  onChange={v => set('examDoctorId', v)}
                  options={allStaffOpts}
                  className="w-full"
                />
              </Field>
            )}
          </div>
        </div>

      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Repeat className="w-4 h-4 text-amber-600" />
          <div className="text-sm font-bold text-slate-800">다음 검사 주기 설정</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="맞춤 검사 주기 (일)"
            hint={
              !form.patientId || !form.examTypeId
                ? '환자와 검사 종류를 선택하면 활성화됩니다.'
                : examType
                ? `기본 검사 주기: ${examType.intervalDays || 0}일`
                : undefined
            }
          >
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder={
                  !form.patientId || !form.examTypeId
                    ? '환자/검사 종류를 선택하세요'
                    : examType
                    ? String(examType.intervalDays || 0)
                    : '주기 입력'
                }
                value={intervalInput}
                onChange={e => setIntervalInput(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={!form.patientId || !form.examTypeId}
                className="w-full font-semibold disabled:bg-slate-50 disabled:text-slate-400"
              />
              <span className="text-sm font-semibold text-slate-600 shrink-0">일</span>
            </div>
          </Field>
          <div className="flex items-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
            {!form.patientId || !form.examTypeId ? (
              <div>환자와 검사 종류를 선택하시면 자동으로 다음 검사일이 계산됩니다.</div>
            ) : activeInterval > 0 ? (
              <div>
                검사 상태를 <strong>'완료'</strong>로 저장 시, <strong>{activeInterval}일 뒤</strong>인{' '}
                <strong className="text-blue-600">{addDays(form.examDate || today(), activeInterval)}</strong>에{' '}
                다음 검사(자동 예약)가 자동으로 캘린더에 표시됩니다.
              </div>
            ) : (
              <div>주기가 설정되지 않아 검사 완료 시에도 다음 예약 일정이 자동 생성되지 않습니다.</div>
            )}
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-purple-600" />
          <div className="text-sm font-bold text-slate-800">결과 설명</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="설명 날짜" hint="비워두면 미예약">
            <Input type="date" value={form.explanationDate || ''} onChange={e => set('explanationDate', e.target.value)} />
          </Field>
          <Field label="설명 시간">
            <Select
              placeholder="시간 미정"
              value={form.explanationTime || ''}
              onChange={v => set('explanationTime', v)}
              options={HOURS.map(h => ({ value: h, label: h }))}
              className="w-full"
            />
          </Field>
          <Field label="정(主) 설명 의사">
            <Select placeholder="선택" value={form.primaryExplDoctorId} onChange={v => set('primaryExplDoctorId', v)} options={docOpts} className="w-full" />
          </Field>
          <Field label="부(副) 설명 의사">
            <Select placeholder="선택" value={form.secondaryExplDoctorId} onChange={v => set('secondaryExplDoctorId', v)} options={docOpts} className="w-full" />
          </Field>
        </div>
        {form.explanationDate && (
          <div className="mt-4">
            <Field label="설명 상태">
              <Select
                value={form.explanationStatus}
                onChange={v => set('explanationStatus', v)}
                options={[{ value: 'none', label: '미예약' }, { value: 'scheduled', label: '예정' }, { value: 'completed', label: '완료' }]}
                className="w-full"
              />
            </Field>
          </div>
        )}
      </div>

      <Field label="메모">
        <textarea
          value={form.notes || ''}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white text-slate-900"
          placeholder="특이사항 등 자유 메모"
        />
      </Field>

      {isEdit && !examTypeLocked && record && record.examTypeId !== form.examTypeId && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
          <Repeat className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">검사 종류 변경 알림</div>
            <div className="mt-0.5">검사 종류를 변경하면 기존의 자동 예약 설정 및 검사 표준 간격이 다르게 계산될 수 있습니다.</div>
          </div>
        </div>
      )}
    </div>
  </Modal>
  );
}

// ====== Patients View ======
function PatientsView({ data, onSavePatient, onDeletePatient }) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  
  // patient form states
  const [initials, setInitials] = useState('');
  const [chartNumber, setChartNumber] = useState('');
  const [birth6, setBirth6] = useState('');
  const [depts, setDepts] = useState([]);
  const [assignedExams, setAssignedExams] = useState([]);
  const [confirmDel, setConfirmDel] = useState(null);

  const openAdd = () => {
    setEditingPatient(null);
    setInitials('');
    setChartNumber('');
    setBirth6('');
    setDepts([]);
    setAssignedExams([]);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditingPatient(p);
    setInitials(p.initials);
    setChartNumber(p.chartNumber || '');
    setBirth6(p.birth6 || '');
    setDepts(p.departments || (p.department ? [p.department] : []));
    setAssignedExams(p.assignedExams || []);
    setModalOpen(true);
  };

  const handleToggleExam = (examTypeId, defaultInterval) => {
    setAssignedExams(prev => {
      const exists = prev.some(ae => ae.examTypeId === examTypeId);
      if (exists) {
        return prev.filter(ae => ae.examTypeId !== examTypeId);
      } else {
        return [...prev, { examTypeId, intervalDays: defaultInterval || 365 }];
      }
    });
  };

  const handleUpdateInterval = (examTypeId, days) => {
    setAssignedExams(prev => 
      prev.map(ae => ae.examTypeId === examTypeId ? { ...ae, intervalDays: parseInt(days, 10) || 0 } : ae)
    );
  };

  const handleSave = () => {
    if (!initials) return;
    onSavePatient({
      id: editingPatient ? editingPatient.id : uid(),
      initials,
      chartNumber,
      birth6,
      departments: depts,
      assignedExams
    });
    setModalOpen(false);
  };

  const filtered = data.patients.filter(p => {
    const q = search.toLowerCase();
    const deptsList = p.departments || (p.department ? [p.department] : []);
    return p.initials.toLowerCase().includes(q) ||
      (p.chartNumber && p.chartNumber.toLowerCase().includes(q)) ||
      (p.birth6 && p.birth6.includes(q)) ||
      deptsList.some(d => d.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-between flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="환자 이름, 차트번호, 생년월일, 진료과 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Btn icon={Plus} onClick={openAdd}>환자 추가</Btn>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <Empty icon={Users} title="일치하는 환자가 없습니다" hint="이름을 확인하거나 새로운 환자를 등록해보세요." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-5 py-3.5">환자명</th>
                  <th className="px-5 py-3.5">차트번호</th>
                  <th className="px-5 py-3.5">생년월일(6자리)</th>
                  <th className="px-5 py-3.5">진료과</th>
                  <th className="px-5 py-3.5">맞춤 검사 주기</th>
                  <th className="px-5 py-3.5 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map(p => {
                  const pDepts = p.departments || (p.department ? [p.department] : []);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{p.initials}</td>
                      <td className="px-5 py-3.5 font-mono text-xs">{p.chartNumber || '-'}</td>
                      <td className="px-5 py-3.5 font-mono text-xs">{p.birth6 || '-'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {pDepts.length > 0 ? (
                            pDepts.map(d => (
                              <span key={d} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                                {d}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.assignedExams && p.assignedExams.length > 0 ? (
                            p.assignedExams.map(ae => {
                              const eType = data.examTypes.find(x => x.id === ae.examTypeId);
                              if (!eType) return null;
                              return (
                                <span key={ae.examTypeId} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 text-[10px] font-bold">
                                  {eType.name}: {ae.intervalDays}일
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex gap-1">
                          <Btn variant="ghost" size="xs" icon={Edit2} onClick={() => openEdit(p)} title="수정" />
                          {confirmDel === p.id ? (
                            <div className="inline-flex gap-1 items-center">
                              <span className="text-[10px] text-red-600 font-semibold">삭제?</span>
                              <Btn variant="success" size="xs" icon={Check} onClick={() => { onDeletePatient(p.id); setConfirmDel(null); }} />
                              <Btn variant="secondary" size="xs" icon={X} onClick={() => setConfirmDel(null)} />
                            </div>
                          ) : (
                            <Btn variant="ghost" size="xs" icon={Trash2} onClick={() => setConfirmDel(p.id)} className="text-red-500 hover:bg-red-50" title="삭제" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPatient ? '환자 정보 수정' : '신규 환자 등록'}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>취소</Btn>
            <Btn icon={Check} onClick={handleSave} disabled={!initials}>저장</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="환자명 (또는 이니셜)" required>
            <Input
              type="text"
              placeholder="예: 홍길동"
              value={initials}
              onChange={e => setInitials(e.target.value)}
            />
          </Field>
          <Field label="차트 번호">
            <Input
              type="text"
              placeholder="예: C12345"
              value={chartNumber}
              onChange={e => setChartNumber(e.target.value)}
            />
          </Field>
          <Field label="생년월일 (6자리)">
            <Input
              type="text"
              placeholder="예: 850312"
              maxLength={6}
              value={birth6}
              onChange={e => setBirth6(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </Field>
          <Field label="진료과">
            <MultiSelectDept
              value={depts}
              onChange={setDepts}
              allOptions={DEPARTMENTS}
              className="w-full"
            />
          </Field>
          
          <div className="border-t border-slate-200 pt-4 mt-2">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
              <span>관리 대상 검사 및 맞춤 주기 설정 (선택)</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {data.examTypes.map(t => {
                const assigned = assignedExams.find(ae => ae.examTypeId === t.id);
                const isChecked = !!assigned;
                const interval = assigned ? assigned.intervalDays : (t.intervalDays || 0);
                
                return (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleExam(t.id, t.intervalDays)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{t.name}</span>
                    </label>
                    {isChecked && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-500 font-medium">검사 주기:</span>
                        <input
                          type="number"
                          value={interval}
                          onChange={e => handleUpdateInterval(t.id, e.target.value)}
                          className="w-20 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-900 font-bold text-right"
                          placeholder="일수"
                          min="0"
                        />
                        <span className="text-[10px] text-slate-600 font-semibold">일</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {data.examTypes.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400">등록된 검사 종류가 없습니다. 먼저 검사 종류를 추가하세요.</div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ====== Staff View ======
function StaffView({ data, onSaveDoctor, onDeleteDoctor, onSaveNurse, onDeleteNurse }) {
  const [activeTab, setActiveTab] = useState('doctor'); // 'doctor' | 'nurse'
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  
  // staff form states
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  const openAdd = () => {
    setEditingStaff(null);
    setName('');
    setDept('');
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditingStaff(s);
    setName(s.name);
    setDept(s.department || '');
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!name) return;
    if (activeTab === 'doctor') {
      onSaveDoctor({
        id: editingStaff ? editingStaff.id : uid(),
        name,
        department: dept || DEPARTMENTS[0]
      });
    } else {
      onSaveNurse({
        id: editingStaff ? editingStaff.id : uid(),
        name
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => { setActiveTab('doctor'); setConfirmDel(null); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-md font-bold transition-all ${
              activeTab === 'doctor' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />의사 ({data.doctors.length})
          </button>
          <button
            onClick={() => { setActiveTab('nurse'); setConfirmDel(null); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-md font-bold transition-all ${
              activeTab === 'nurse' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />간호사 ({data.nurses.length})
          </button>
        </div>
        <Btn icon={Plus} onClick={openAdd}>{activeTab === 'doctor' ? '의사 추가' : '간호사 추가'}</Btn>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {activeTab === 'doctor' ? (
          data.doctors.length === 0 ? (
            <Empty icon={UserIcon} title="등록된 의사가 없습니다" hint="새로운 의사 프로필을 등록해보세요." />
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-5 py-3.5">의사명</th>
                  <th className="px-5 py-3.5">주요 진료과</th>
                  <th className="px-5 py-3.5 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.doctors.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{d.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
                        {d.department}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex gap-1">
                        <Btn variant="ghost" size="xs" icon={Edit2} onClick={() => openEdit(d)} title="수정" />
                        {confirmDel === d.id ? (
                          <div className="inline-flex gap-1 items-center">
                            <span className="text-[10px] text-red-600 font-semibold">삭제?</span>
                            <Btn variant="success" size="xs" icon={Check} onClick={() => { onDeleteDoctor(d.id); setConfirmDel(null); }} />
                            <Btn variant="secondary" size="xs" icon={X} onClick={() => setConfirmDel(null)} />
                          </div>
                        ) : (
                          <Btn variant="ghost" size="xs" icon={Trash2} onClick={() => setConfirmDel(d.id)} className="text-red-500 hover:bg-red-50" title="삭제" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          data.nurses.length === 0 ? (
            <Empty icon={UserCheck} title="등록된 간호사가 없습니다" hint="새로운 간호사 프로필을 등록해보세요." />
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-5 py-3.5">간호사명</th>
                  <th className="px-5 py-3.5 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.nurses.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{n.name}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex gap-1">
                        <Btn variant="ghost" size="xs" icon={Edit2} onClick={() => openEdit(n)} title="수정" />
                        {confirmDel === n.id ? (
                          <div className="inline-flex gap-1 items-center">
                            <span className="text-[10px] text-red-600 font-semibold">삭제?</span>
                            <Btn variant="success" size="xs" icon={Check} onClick={() => { onDeleteNurse(n.id); setConfirmDel(null); }} />
                            <Btn variant="secondary" size="xs" icon={X} onClick={() => setConfirmDel(null)} />
                          </div>
                        ) : (
                          <Btn variant="ghost" size="xs" icon={Trash2} onClick={() => setConfirmDel(n.id)} className="text-red-500 hover:bg-red-50" title="삭제" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStaff ? `${activeTab === 'doctor' ? '의사' : '간호사'} 정보 수정` : `${activeTab === 'doctor' ? '의사' : '간호사'} 등록`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>취소</Btn>
            <Btn icon={Check} onClick={handleSave} disabled={!name}>저장</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="이름" required>
            <Input
              type="text"
              placeholder="예: 김민준"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </Field>
          {activeTab === 'doctor' && (
            <Field label="진료과" required>
              <Select
                placeholder="진료과 선택"
                value={dept}
                onChange={setDept}
                options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
                className="w-full"
              />
            </Field>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ====== Exam Types View ======
function ExamTypesView({ data, onSaveExamType, onDeleteExamType }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  
  // exam type form states
  const [name, setName] = useState('');
  const [intervalDays, setIntervalDays] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  const openAdd = () => {
    setEditingType(null);
    setName('');
    setIntervalDays('');
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditingType(t);
    setName(t.name);
    setIntervalDays(t.intervalDays !== undefined && t.intervalDays !== null ? String(t.intervalDays) : '');
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!name) return;
    onSaveExamType({
      id: editingType ? editingType.id : uid(),
      name,
      intervalDays: intervalDays ? parseInt(intervalDays, 10) : 0
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm font-bold text-slate-800">
          검사 종류 항목 ({data.examTypes.length})
        </div>
        <Btn icon={Plus} onClick={openAdd}>검사 종류 추가</Btn>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {data.examTypes.length === 0 ? (
          <Empty icon={FlaskConical} title="등록된 검사 종류가 없습니다" hint="예: 위내시경, 대장내시경, 복부초음파 등을 등록해보세요." />
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-5 py-3.5">검사명</th>
                <th className="px-5 py-3.5">표준 기본 권장 간격 (일)</th>
                <th className="px-5 py-3.5 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.examTypes.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{t.name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs">
                    {t.intervalDays && t.intervalDays > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold">
                        <Repeat className="w-3.5 h-3.5 text-amber-600" /> {t.intervalDays}일 간격
                      </span>
                    ) : (
                      <span className="text-slate-400">간격 없음 (일회성)</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex gap-1">
                      <Btn variant="ghost" size="xs" icon={Edit2} onClick={() => openEdit(t)} title="수정" />
                      {confirmDel === t.id ? (
                        <div className="inline-flex gap-1 items-center">
                          <span className="text-[10px] text-red-600 font-semibold">삭제?</span>
                          <Btn variant="success" size="xs" icon={Check} onClick={() => { onDeleteExamType(t.id); setConfirmDel(null); }} />
                          <Btn variant="secondary" size="xs" icon={X} onClick={() => setConfirmDel(null)} />
                        </div>
                      ) : (
                        <Btn variant="ghost" size="xs" icon={Trash2} onClick={() => setConfirmDel(t.id)} className="text-red-500 hover:bg-red-50" title="삭제" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingType ? '검사 종류 수정' : '검사 종류 등록'}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>취소</Btn>
            <Btn icon={Check} onClick={handleSave} disabled={!name}>저장</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="검사 종류명" required>
            <Input
              type="text"
              placeholder="예: 위내시경, 대장내시경"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </Field>
          <Field label="기본 권장 재검사 간격 (일)" hint="개별 환자 설정에 맞춤 주기가 지정되지 않았을 때 적용되는 기본 권장 주기입니다.">
            <Input
              type="number"
              placeholder="예: 365"
              value={intervalDays}
              onChange={e => setIntervalDays(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

// ====== Stats View ======
function StatsView({ data }) {
  const allEntries = useMemo(() => deriveEntries(data.records, data.patients, data.examTypes), [data]);

  const stats = useMemo(() => {
    const exams = allEntries.filter(e => e.kind === 'exam');
    const completedExams = exams.filter(e => e.status === 'completed');
    const scheduledExams = exams.filter(e => e.status === 'scheduled');
    const explanations = allEntries.filter(e => e.kind === 'explanation');
    const completedExpls = explanations.filter(e => e.status === 'completed');
    
    // Exam types stats
    const byType = {};
    for (const e of exams) {
      const name = e.examType.name;
      byType[name] = (byType[name] || 0) + 1;
    }
    const typeList = Object.entries(byType)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Department stats
    const byDept = {};
    for (const e of exams) {
      const depts = e.patient.departments || (e.patient.department ? [e.patient.department] : []);
      for (const d of depts) {
        byDept[d] = (byDept[d] || 0) + 1;
      }
    }
    const deptList = Object.entries(byDept)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      examCount: exams.length,
      completedExamCount: completedExams.length,
      scheduledExamCount: scheduledExams.length,
      explCount: explanations.length,
      completedExplCount: completedExpls.length,
      typeList,
      deptList
    };
  }, [allEntries]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-700 uppercase">총 검사 일정</span>
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-900">{stats.examCount}</span>
            <span className="text-xs text-blue-600 font-medium">건</span>
          </div>
          <div className="mt-2 text-xs text-blue-600 flex justify-between">
            <span>완료: {stats.completedExamCount}건</span>
            <span>대기: {stats.scheduledExamCount}건</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-purple-700 uppercase">결과 설명 일정</span>
            <MessageSquare className="h-5 w-5 text-purple-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-purple-900">{stats.explCount}</span>
            <span className="text-xs text-purple-600 font-medium">건</span>
          </div>
          <div className="mt-2 text-xs text-purple-600 flex justify-between">
            <span>완료: {stats.completedExplCount}건</span>
            <span>대기: {stats.explCount - stats.completedExplCount}건</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-700 uppercase">검사 완료율</span>
            <ListChecks className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-900">
              {stats.examCount > 0 ? Math.round((stats.completedExamCount / stats.examCount) * 100) : 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium">%</span>
          </div>
          <div className="mt-3.5 bg-emerald-200/50 w-full h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.examCount > 0 ? (stats.completedExamCount / stats.examCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-blue-600" /> 검사 유형별 분포
          </h3>
          {stats.typeList.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">데이터가 없습니다</div>
          ) : (
            <div className="space-y-3.5">
              {stats.typeList.map(({ name, count }) => {
                const percentage = stats.examCount > 0 ? (count / stats.examCount) * 100 : 0;
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{name}</span>
                      <span>{count}건 ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="bg-slate-100 w-full h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Hospital className="w-4 h-4 text-indigo-600" /> 진료과별 검사수
          </h3>
          {stats.deptList.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">데이터가 없습니다</div>
          ) : (
            <div className="space-y-3.5">
              {stats.deptList.map(({ name, count }) => {
                const percentage = stats.examCount > 0 ? (count / stats.examCount) * 100 : 0;
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{name}</span>
                      <span>{count}건 ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="bg-slate-100 w-full h-2.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ====== Settings View ======
function SettingsView({ data, onImportData, onClearData, onLoadSampleData }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `medical_exam_backup_${today()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.patients && parsed.doctors && parsed.nurses && parsed.examTypes && parsed.records) {
          onImportData(parsed);
          alert('데이터 백업 복원이 완료되었습니다.');
        } else {
          alert('올바르지 않은 백업 파일 형식입니다.');
        }
      } catch (err) {
        alert('백업 파일 로드 중 오류가 발생했습니다: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset file input
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-blue-600" /> 데이터 내보내기 및 가져오기
        </h3>
        <p className="text-xs text-slate-500">
          현재 등록되어 있는 환자 정보, 의료진, 검사 정보 및 예약 히스토리 전체 데이터를 파일로 백업하거나 가져와서 복구할 수 있습니다.
        </p>
        <div className="mt-4 flex gap-2">
          <Btn icon={Download} variant="outline" onClick={handleExport}>백업 데이터 다운로드</Btn>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
          <Btn icon={Upload} variant="outline" onClick={handleImportClick}>백업 파일 가져오기</Btn>
        </div>
      </div>

      <hr className="border-slate-100" />

      <div>
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-indigo-600" /> 데모 샘플 데이터 로드
        </h3>
        <p className="text-xs text-slate-500 font-normal">
          시스템 검토를 위해 테스트 환자, 가상의 의료진, 예약 스케줄 등을 포함한 풍부한 데모용 데이터를 자동 입력합니다. 기존 데이터는 완전히 지워집니다.
        </p>
        <div className="mt-4">
          <Btn icon={Plus} variant="secondary" onClick={() => {
            if (confirm('샘플 데이터를 적용하시겠습니까? 기존의 데이터는 모두 지워집니다.')) {
              onLoadSampleData();
            }
          }}>데모 데이터 불러오기</Btn>
        </div>
      </div>

      <hr className="border-slate-100" />

      <div>
        <h3 className="text-base font-bold text-red-700 flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-600" /> 초기화 구역
        </h3>
        <p className="text-xs text-slate-500">
          이 작업을 실행하면 브라우저 저장소에 저장된 모든 데이터(스케줄, 환자 정보 포함)가 완전히 영구적으로 지워집니다.
        </p>
        <div className="mt-4">
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-700 font-bold mr-2">정말 모든 데이터를 삭제하겠습니까?</span>
              <Btn variant="danger" icon={Trash2} onClick={() => { onClearData(); setConfirmClear(false); }}>영구 삭제 확정</Btn>
              <Btn variant="secondary" onClick={() => setConfirmClear(false)}>취소</Btn>
            </div>
          ) : (
            <Btn variant="danger" icon={Trash2} onClick={() => setConfirmClear(true)}>데이터베이스 전체 삭제</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ====== Sample Data Creator ======
function getSampleData() {
  const docs = [
    { id: 'doc1', name: '김민준', department: '1내과' },
    { id: 'doc2', name: '이서연', department: '2내과' },
    { id: 'doc3', name: '박우진', department: '한방재활의학 1과' },
    { id: 'doc4', name: '최윤아', department: '침구과' },
  ];
  const nurs = [
    { id: 'nur1', name: '정현우' },
    { id: 'nur2', name: '이지은' },
  ];
  const eTypes = [
    { id: 'et1', name: '위내시경 (정기검진)', intervalDays: 365 },
    { id: 'et2', name: '대장내시경 (정기검진)', intervalDays: 730 },
    { id: 'et3', name: '복부초음파', intervalDays: 180 },
    { id: 'et4', name: '심전도검사', intervalDays: 90 },
  ];
  const pats = [
    { id: 'pat1', initials: '김태형', chartNumber: 'C001', birth6: '880315', departments: ['1내과', '침구과'], assignedExams: [{ examTypeId: 'et1', intervalDays: 180 }] },
    { id: 'pat2', initials: '이지혜', chartNumber: 'C002', birth6: '941205', departments: ['2내과'], assignedExams: [] },
    { id: 'pat3', initials: '박성호', chartNumber: 'C003', birth6: '720610', departments: ['한방재활의학 1과'], assignedExams: [{ examTypeId: 'et3', intervalDays: 90 }] },
    { id: 'pat4', initials: '최정순', chartNumber: 'C004', birth6: '580922', departments: ['1내과', '침구과', '부인소아과'], assignedExams: [] },
  ];

  const tDate = today();
  const yDate = addDays(tDate, -1);
  const nDate1 = addDays(tDate, 1);
  const nDate2 = addDays(tDate, 2);

  const recs = [
    {
      id: 'rec1',
      patientId: 'pat1',
      examTypeId: 'et1',
      examDate: yDate,
      examTime: '09:00',
      examStatus: 'completed',
      orderDoctorId: 'doc1',
      examDoctorId: 'd:doc1',
      explanationDate: yDate,
      explanationTime: '14:00',
      primaryExplDoctorId: 'doc1',
      secondaryExplDoctorId: 'doc2',
      explanationStatus: 'completed',
      notes: '위염 소견 있으나 약 처방 후 경과 관찰.',
      parentRecordId: null,
      autoNextGenerated: true,
    },
    {
      id: 'rec2',
      patientId: 'pat1',
      examTypeId: 'et1',
      examDate: addDays(yDate, 180), // Custom interval applied: 180 days!
      examTime: '09:00',
      examStatus: 'scheduled',
      orderDoctorId: 'doc1',
      examDoctorId: '',
      explanationDate: '',
      explanationTime: '',
      primaryExplDoctorId: '',
      secondaryExplDoctorId: '',
      explanationStatus: 'none',
      notes: '이전 검사 완료에 따라 맞춤 주기(180일) 이후 자동 생성된 일정입니다.',
      parentRecordId: 'rec1',
      autoNextGenerated: false,
    },
    {
      id: 'rec3',
      patientId: 'pat2',
      examTypeId: 'et3',
      examDate: tDate,
      examTime: '10:00',
      examStatus: 'completed',
      orderDoctorId: 'doc2',
      examDoctorId: 'n:nur1',
      explanationDate: tDate,
      explanationTime: '15:00',
      primaryExplDoctorId: 'doc2',
      secondaryExplDoctorId: '',
      explanationStatus: 'scheduled',
      notes: '복부 팽만감 호소로 초음파 검사 실시.',
      parentRecordId: null,
      autoNextGenerated: false,
    },
    {
      id: 'rec4',
      patientId: 'pat3',
      examTypeId: 'et4',
      examDate: nDate1,
      examTime: '11:00',
      examStatus: 'scheduled',
      orderDoctorId: 'doc3',
      examDoctorId: '',
      explanationDate: nDate1,
      explanationTime: '16:00',
      primaryExplDoctorId: 'doc3',
      secondaryExplDoctorId: '',
      explanationStatus: 'scheduled',
      notes: '침구 치료 병행 전 심폐 기능 체크.',
      parentRecordId: null,
      autoNextGenerated: false,
    },
    {
      id: 'rec5',
      patientId: 'pat4',
      examTypeId: 'et2',
      examDate: nDate2,
      examTime: '14:00',
      examStatus: 'scheduled',
      orderDoctorId: 'doc4',
      examDoctorId: '',
      explanationDate: '',
      explanationTime: '',
      primaryExplDoctorId: '',
      secondaryExplDoctorId: '',
      explanationStatus: 'none',
      notes: '대장 용종 제거 후 2년 정기 추적 검사.',
      parentRecordId: null,
      autoNextGenerated: false,
    },
  ];

  return {
    patients: pats,
    doctors: docs,
    nurses: nurs,
    examTypes: eTypes,
    records: recs
  };
}

// ====== Main App ======
export default function App() {
  const [data, setData] = useState(EMPTY);
  const [navTab, setNavTab] = useState('calendar'); // 'calendar' | 'patient' | 'staff' | 'examType' | 'stats' | 'settings'
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals state
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [defaultDate, setDefaultDate] = useState('');
  const [defaultTime, setDefaultTime] = useState('');
  const [selectedEntryKind, setSelectedEntryKind] = useState('exam');

  // Load all data from Supabase (only active, non-deleted records)
  const loadAllFromSupabase = async () => {
    const fetchTable = async (table) => {
      const { data, error } = await supabase.from(table).select('*').eq('is_deleted', false);
      if (error) {
        // If is_deleted column doesn't exist yet, fallback to selecting all rows
        const fallback = await supabase.from(table).select('*');
        if (fallback.error) throw fallback.error;
        return fallback.data || [];
      }
      return data || [];
    };

    try {
      const [pats, docs, nurs, etypes, recs] = await Promise.all([
        fetchTable('patients'),
        fetchTable('doctors'),
        fetchTable('nurses'),
        fetchTable('exam_types'),
        fetchTable('records')
      ]);
      
      return {
        patients: pats,
        doctors: docs,
        nurses: nurs,
        examTypes: etypes,
        records: recs
      };
    } catch (err) {
      console.error("Error loading data from Supabase:", err);
      throw err;
    }
  };

  const refetchAllData = async () => {
    try {
      const d = await loadAllFromSupabase();
      setData(d);
    } catch (err) {
      console.error("Background refetch failed:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const d = await loadAllFromSupabase();
        setData(d);
      } catch (err) {
        console.error("Initialization failed, check your Supabase credentials.", err);
      } finally {
        setLoading(false);
      }
    };
    
    init();

    // Subscribe to realtime database changes
    const channel = supabase
      .channel('public-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        refetchAllData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Process auto scheduling for recursively recurring exams using custom patient interval if available
  const processAutoNext = (record, currentData) => {
    if (record.examStatus !== 'completed') return null;
    if (record.autoNextGenerated) return null;
    
    const patient = currentData.patients.find(p => p.id === record.patientId);
    const customExam = patient?.assignedExams?.find(ae => ae.examTypeId === record.examTypeId);
    
    let interval = 0;
    if (customExam && customExam.intervalDays > 0) {
      interval = customExam.intervalDays;
    } else {
      const examType = currentData.examTypes.find(t => t.id === record.examTypeId);
      if (examType && examType.intervalDays > 0) {
        interval = examType.intervalDays;
      }
    }

    if (interval <= 0) return null;

    const nextDate = addDays(record.examDate, interval);
    const newRecordId = uid();
    
    return {
      id: newRecordId,
      patientId: record.patientId,
      examTypeId: record.examTypeId,
      examDate: nextDate,
      examTime: record.examTime || '',
      examStatus: 'scheduled',
      orderDoctorId: record.orderDoctorId || '',
      examDoctorId: '',
      explanationDate: '',
      explanationTime: '',
      primaryExplDoctorId: '',
      secondaryExplDoctorId: '',
      explanationStatus: 'none',
      notes: `이전 검사 완료에 따라 맞춤 주기(${interval}일) 이후 자동 생성된 일정입니다.`,
      parentRecordId: record.id,
      autoNextGenerated: false,
    };
  };

  // Record operations
  const handleSaveRecord = async (r, nextIntervalDays) => {
    let recordToSave = { ...r };
    let newAutoRecord = null;

    if (!recordToSave.id) {
      recordToSave.id = uid();
    }

    // Update patient custom exam interval if provided
    let updatedPatients = data.patients;
    if (nextIntervalDays !== undefined && nextIntervalDays !== null && recordToSave.patientId && recordToSave.examTypeId) {
      const patient = data.patients.find(p => p.id === recordToSave.patientId);
      if (patient) {
        let assigned = [...(patient.assignedExams || [])];
        const idx = assigned.findIndex(ae => ae.examTypeId === recordToSave.examTypeId);
        const daysVal = nextIntervalDays === '' ? 0 : parseInt(nextIntervalDays, 10);
        
        let changed = false;
        if (daysVal > 0) {
          if (idx >= 0) {
            if (assigned[idx].intervalDays !== daysVal) {
              assigned[idx] = { ...assigned[idx], intervalDays: daysVal };
              changed = true;
            }
          } else {
            assigned.push({ examTypeId: recordToSave.examTypeId, intervalDays: daysVal });
            changed = true;
          }
        } else {
          // If empty/0, delete custom interval to fall back to default
          if (idx >= 0) {
            assigned.splice(idx, 1);
            changed = true;
          }
        }

        if (changed) {
          try {
            const updatedPatient = { ...patient, assignedExams: assigned };
            const { error: patientErr } = await supabase.from('patients').upsert(updatedPatient);
            if (patientErr) throw patientErr;
            updatedPatients = data.patients.map(p => p.id === patient.id ? updatedPatient : p);
          } catch (err) {
            console.error("Error updating patient custom interval:", err);
          }
        }
      }
    }

    const isEdit = !!r.id;
    if (isEdit) {
      const oldRecord = data.records.find(x => x.id === r.id);
      const autoGenNeeded = r.examStatus === 'completed' && (!oldRecord || oldRecord.examStatus !== 'completed');
      
      if (autoGenNeeded) {
        newAutoRecord = processAutoNext(recordToSave, { ...data, patients: updatedPatients });
        if (newAutoRecord) recordToSave.autoNextGenerated = true;
      }
    } else {
      if (recordToSave.examStatus === 'completed') {
        newAutoRecord = processAutoNext(recordToSave, { ...data, patients: updatedPatients });
        if (newAutoRecord) recordToSave.autoNextGenerated = true;
      }
    }

    try {
      const { error } = await supabase.from('records').upsert(recordToSave);
      if (error) throw error;

      if (newAutoRecord) {
        const { error: autoError } = await supabase.from('records').insert(newAutoRecord);
        if (autoError) throw autoError;
      }

      refetchAllData();
    } catch (err) {
      console.error("Error saving record:", err);
      alert("일정을 저장하는 중 오류가 발생했습니다: " + err.message);
    }
  };

  // Admin password check helper for deletion
  const verifyAdminPassword = () => {
    const entered = prompt("데이터를 삭제하시려면 관리자 비밀번호를 입력해 주세요:");
    if (entered === null) return false; // User cancelled
    const adminPassword = import.meta.env.VITE_ADMIN_DELETE_PASSWORD || "admin1234";
    if (entered !== adminPassword) {
      alert("비밀번호가 일치하지 않습니다. 삭제가 취소되었습니다.");
      return false;
    }
    return true;
  };

  const handleDeleteRecord = async (id) => {
    if (!verifyAdminPassword()) return;
    try {
      // Find children and disconnect them
      const childRecords = data.records.filter(r => r.parentRecordId === id);
      for (const child of childRecords) {
        await supabase.from('records').update({ parentRecordId: null }).eq('id', child.id);
      }

      // Soft delete: update is_deleted to true instead of deleting the row
      const { error } = await supabase.from('records').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;

      refetchAllData();
    } catch (err) {
      console.error("Error deleting record:", err);
      alert("일정을 삭제하는 중 오류가 발생했습니다: " + err.message);
    }
  };

  const handleMoveRecord = async (recordId, kind, newDate, newTime) => {
    // Prevent moving completed exam date
    const record = data.records.find(r => r.id === recordId);
    if (record && record.examStatus === 'completed' && kind === 'exam') {
      alert("이미 완료된 검사의 일정은 변경할 수 없습니다.");
      return;
    }

    try {
      const updateFields = kind === 'explanation' 
        ? { explanationDate: newDate, explanationTime: newTime }
        : { examDate: newDate, examTime: newTime };

      const { error } = await supabase.from('records').update(updateFields).eq('id', recordId);
      if (error) throw error;

      refetchAllData();
    } catch (err) {
      console.error("Error moving record:", err);
      alert("일정을 이동하는 중 오류가 발생했습니다: " + err.message);
    }
  };

  // Patient operations
  const handleSavePatient = async (p) => {
    try {
      const { error } = await supabase.from('patients').upsert(p);
      if (error) throw error;
      refetchAllData();
    } catch (err) {
      console.error("Error saving patient:", err);
      alert("환자 정보를 저장하는 중 오류가 발생했습니다: " + err.message);
    }
  };

  const handleDeletePatient = async (id) => {
    if (!verifyAdminPassword()) return;
    try {
      // Soft-delete associated records first
      const { error: recError } = await supabase.from('records').update({ is_deleted: true }).eq('patientId', id);
      if (recError) throw recError;

      // Soft delete patient
      const { error } = await supabase.from('patients').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      refetchAllData();
    } catch (err) {
      console.error("Error deleting patient:", err);
      alert("환자를 삭제하는 중 오류가 발생했습니다: " + err.message);
    }
  };

  // Staff operations
  const handleSaveDoctor = async (doc) => {
    try {
      const { error } = await supabase.from('doctors').upsert(doc);
      if (error) throw error;
      refetchAllData();
    } catch (err) {
      console.error("Error saving doctor:", err);
      alert("의사 정보를 저장하는 중 오류가 발생했습니다: " + err.message);
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!verifyAdminPassword()) return;
    try {
      // Clear references in records
      const orderRecords = data.records.filter(r => r.orderDoctorId === id);
      for (const r of orderRecords) {
        await supabase.from('records').update({ orderDoctorId: '' }).eq('id', r.id);
      }
      const examRecords = data.records.filter(r => r.examDoctorId === `d:${id}` || r.examDoctorId === id);
      for (const r of examRecords) {
        await supabase.from('records').update({ examDoctorId: '' }).eq('id', r.id);
      }
      const expl1Records = data.records.filter(r => r.primaryExplDoctorId === id);
      for (const r of expl1Records) {
        await supabase.from('records').update({ primaryExplDoctorId: '' }).eq('id', r.id);
      }
      const expl2Records = data.records.filter(r => r.secondaryExplDoctorId === id);
      for (const r of expl2Records) {
        await supabase.from('records').update({ secondaryExplDoctorId: '' }).eq('id', r.id);
      }

      // Soft delete doctor
      const { error } = await supabase.from('doctors').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      refetchAllData();
    } catch (err) {
      console.error("Error deleting doctor:", err);
      alert("의사 정보를 삭제하는 중 오류가 발생했습니다: " + err.message);
    }
  };

  const handleSaveNurse = async (nur) => {
    try {
      const { error } = await supabase.from('nurses').upsert(nur);
      if (error) throw error;
      refetchAllData();
    } catch (err) {
      console.error("Error saving nurse:", err);
      alert("간호사 정보를 저장하는 중 오류가 발생했습니다: " + err.message);
    }
  };

  const handleDeleteNurse = async (id) => {
    if (!verifyAdminPassword()) return;
    try {
      const examRecords = data.records.filter(r => r.examDoctorId === `n:${id}`);
      for (const r of examRecords) {
        await supabase.from('records').update({ examDoctorId: '' }).eq('id', r.id);
      }

      // Soft delete nurse
      const { error } = await supabase.from('nurses').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      refetchAllData();
    } catch (err) {
      console.error("Error deleting nurse:", err);
      alert("간호사 정보를 삭제하는 중 오류가 발생했습니다: " + err.message);
    }
  };

  // Exam type operations
  const handleSaveExamType = async (t) => {
    try {
      const { error } = await supabase.from('exam_types').upsert(t);
      if (error) throw error;
      refetchAllData();
    } catch (err) {
      console.error("Error saving exam type:", err);
      alert("검사 종류를 저장하는 중 오류가 발생했습니다: " + err.message);
    }
  };

  const handleDeleteExamType = async (id) => {
    if (!verifyAdminPassword()) return;
    try {
      // Soft-delete associated records first
      const { error: recError } = await supabase.from('records').update({ is_deleted: true }).eq('examTypeId', id);
      if (recError) throw recError;

      // Soft delete exam type
      const { error } = await supabase.from('exam_types').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      refetchAllData();
    } catch (err) {
      console.error("Error deleting exam type:", err);
      alert("검사 종류를 삭제하는 중 오류가 발생했습니다: " + err.message);
    }
  };

  // Setting actions
  const handleImportData = async (newData) => {
    try {
      // Clear current data first
      await Promise.all([
        supabase.from('records').delete().neq('id', 'placeholder'),
        supabase.from('patients').delete().neq('id', 'placeholder'),
        supabase.from('doctors').delete().neq('id', 'placeholder'),
        supabase.from('nurses').delete().neq('id', 'placeholder'),
        supabase.from('exam_types').delete().neq('id', 'placeholder')
      ]);
      
      // Load imports
      if (newData.doctors.length > 0) await supabase.from('doctors').insert(newData.doctors);
      if (newData.nurses.length > 0) await supabase.from('nurses').insert(newData.nurses);
      if (newData.examTypes.length > 0) await supabase.from('exam_types').insert(newData.examTypes);
      if (newData.patients.length > 0) await supabase.from('patients').insert(newData.patients);
      if (newData.records.length > 0) await supabase.from('records').insert(newData.records);

      refetchAllData();
      alert('백업 데이터 복원이 성공적으로 완료되었습니다.');
    } catch (err) {
      console.error("Error importing backup:", err);
      alert("백업 복원 중 오류가 발생했습니다: " + err.message);
    }
  };

  const handleClearData = async () => {
    if (!verifyAdminPassword()) return;
    try {
      await Promise.all([
        supabase.from('records').delete().neq('id', 'placeholder'),
        supabase.from('patients').delete().neq('id', 'placeholder'),
        supabase.from('doctors').delete().neq('id', 'placeholder'),
        supabase.from('nurses').delete().neq('id', 'placeholder'),
        supabase.from('exam_types').delete().neq('id', 'placeholder')
      ]);
      refetchAllData();
      alert('모든 데이터베이스 내용이 삭제되었습니다.');
    } catch (err) {
      console.error("Error clearing database:", err);
      alert("데이터베이스 초기화 중 오류가 발생했습니다: " + err.message);
    }
  };

  const handleLoadSampleData = async () => {
    if (!verifyAdminPassword()) return;
    try {
      const sample = getSampleData();
      
      // Clear database first
      await Promise.all([
        supabase.from('records').delete().neq('id', 'placeholder'),
        supabase.from('patients').delete().neq('id', 'placeholder'),
        supabase.from('doctors').delete().neq('id', 'placeholder'),
        supabase.from('nurses').delete().neq('id', 'placeholder'),
        supabase.from('exam_types').delete().neq('id', 'placeholder')
      ]);
      
      // Load samples
      const [docsRes, nursRes, etRes, patsRes] = await Promise.all([
        supabase.from('doctors').insert(sample.doctors),
        supabase.from('nurses').insert(sample.nurses),
        supabase.from('exam_types').insert(sample.examTypes),
        supabase.from('patients').insert(sample.patients)
      ]);

      if (docsRes.error || nursRes.error || etRes.error || patsRes.error) {
        throw docsRes.error || nursRes.error || etRes.error || patsRes.error;
      }

      const { error: recError } = await supabase.from('records').insert(sample.records);
      if (recError) throw recError;

      refetchAllData();
      alert('샘플 데모 데이터를 성공적으로 로드했습니다.');
    } catch (err) {
      console.error("Error loading sample data:", err);
      alert("샘플 데이터 로딩 중 오류가 발생했습니다: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-semibold text-sm">
        <div className="flex flex-col items-center gap-2">
          <Activity className="w-8 h-8 text-blue-600 animate-pulse" />
          데이터베이스 조회 중...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col sm:flex-row text-slate-800">
      {/* Mobile Top Bar */}
      <header className="sm:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <Hospital className="w-6 h-6 text-blue-600" />
          <span className="font-extrabold text-slate-800 text-base">검사 일정 관리 시스템</span>
        </div>
        <button onClick={() => setSidebarOpen(o => !o)} className="p-1 rounded hover:bg-slate-100 text-slate-600" aria-label="메뉴 열기">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`fixed sm:static inset-0 bg-slate-900 text-slate-300 w-64 p-5 flex flex-col z-40 transition-transform duration-300 transform sm:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } shrink-0`}>
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-2">
            <Hospital className="w-6 h-6 text-blue-400" />
            <span className="font-extrabold text-white text-base">검사 일정 관리</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="sm:hidden p-1 rounded hover:bg-slate-800 text-slate-400" aria-label="메뉴 닫기">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const Active = navTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setNavTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  Active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <item.icon className={`w-4 h-4 ${Active ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-800 mt-auto text-[11px] text-slate-500 shrink-0">
          Medical Exam Scheduler v2.6 (Custom Interval)
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="sm:hidden fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm" />
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {navItems.find(x => x.id === navTab)?.label}
            </h1>
            <div className="text-xs text-slate-500 hidden sm:block font-medium">
              오늘: {today()}
            </div>
          </div>

          {/* Navigated View */}
          {navTab === 'calendar' && (
            <CalendarView
              data={data}
              onCreate={(date, time) => {
                setSelectedRecord(null);
                setDefaultDate(date || today());
                setDefaultTime(time || '');
                setSelectedEntryKind('exam');
                setRecordModalOpen(true);
              }}
              onEditEntry={(entry) => {
                setSelectedRecord(entry.record);
                setSelectedEntryKind(entry.kind);
                setRecordModalOpen(true);
              }}
              onMoveEntry={handleMoveRecord}
            />
          )}

          {navTab === 'patient' && (
            <PatientsView
              data={data}
              onSavePatient={handleSavePatient}
              onDeletePatient={handleDeletePatient}
            />
          )}

          {navTab === 'staff' && (
            <StaffView
              data={data}
              onSaveDoctor={handleSaveDoctor}
              onDeleteDoctor={handleDeleteDoctor}
              onSaveNurse={handleSaveNurse}
              onDeleteNurse={handleDeleteNurse}
            />
          )}

          {navTab === 'examType' && (
            <ExamTypesView
              data={data}
              onSaveExamType={handleSaveExamType}
              onDeleteExamType={handleDeleteExamType}
            />
          )}

          {navTab === 'stats' && (
            <StatsView data={data} />
          )}

          {navTab === 'settings' && (
            <SettingsView
              data={data}
              onImportData={handleImportData}
              onClearData={handleClearData}
              onLoadSampleData={handleLoadSampleData}
            />
          )}
        </div>
      </main>

      {/* Record Creation/Editing Modal */}
      <RecordModal
        open={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        record={selectedRecord}
        defaultDate={defaultDate}
        defaultTime={defaultTime}
        entryKind={selectedEntryKind}
        data={data}
        onSave={handleSaveRecord}
        onDelete={handleDeleteRecord}
      />
    </div>
  );
}

const navItems = [
  { id: 'calendar', label: '캘린더 일정', icon: CalendarIcon },
  { id: 'patient', label: '환자 관리', icon: Users },
  { id: 'staff', label: '의료진 관리', icon: UserCheck },
  { id: 'examType', label: '검사 종류', icon: FlaskConical },
  { id: 'stats', label: '종합 통계', icon: BarChart3 },
  { id: 'settings', label: '데이터 설정', icon: Settings },
];
