import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const SymptomDropdown = ({ symptoms, selected, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query
    ? symptoms.filter(
        (s) =>
          s.label.toLowerCase().includes(query.toLowerCase()) ||
          s.id.toLowerCase().includes(query.toLowerCase())
      )
    : symptoms;

  const toggle = (symptom) => {
    if (selected.find((s) => s.id === symptom.id)) {
      onChange(selected.filter((s) => s.id !== symptom.id));
    } else {
      onChange([...selected, symptom]);
    }
  };

  const remove = (symptom) => {
    onChange(selected.filter((s) => s.id !== symptom.id));
  };

  return (
    <div ref={wrapperRef} className="relative">
      <AnimatePresence mode="popLayout">
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap gap-2 mb-3 overflow-hidden"
          >
            {selected.map((s) => (
              <motion.span
                key={s.id}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                className="symptom-tag"
              >
                {s.label}
                <button
                  type="button"
                  onClick={() => remove(s)}
                  aria-label={`Remove ${s.label}`}
                  className="symptom-tag-remove"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="symptom-search-wrap">
        <MagnifyingGlassIcon
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-cyan-400/80 pointer-events-none flex-shrink-0 z-10"
          aria-hidden
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search symptoms..."
          aria-expanded={open}
          aria-haspopup="listbox"
          className="symptom-search-input"
          style={{ paddingLeft: '2.75rem', paddingRight: '2.5rem' }}
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close symptom list' : 'Open symptom list'}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-500 dark:text-cyan-400/80 hover:bg-slate-100 dark:hover:bg-cyan-400/10 transition-colors cursor-pointer"
        >
          <ChevronUpDownIcon className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="symptom-dropdown-list"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                No symptoms found
              </li>
            ) : (
              filtered.map((s) => {
                const isSelected = selected.some((sel) => sel.id === s.id);
                return (
                  <li
                    key={s.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggle(s)}
                    className={`symptom-dropdown-item ${isSelected ? 'symptom-dropdown-item--selected' : ''}`}
                  >
                    <span>{s.label}</span>
                    {isSelected && (
                      <CheckCircleIcon className="h-4 w-4 text-[#22a84a] dark:text-green-400 flex-shrink-0" />
                    )}
                  </li>
                );
              })
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SymptomDropdown;
