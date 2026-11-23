import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Check, CircleHelp, Clock3, X } from 'lucide-react';
import { es } from '../i18n/es';
import type { Level } from '../data/types';

export function StatusBadge({ status, small = false }: { status: Level; small?: boolean }) {
  const Icon = status === 'fluid' ? Check : status === 'growing' ? Clock3 : AlertTriangle;
  return (
    <span className={`status-badge ${status} ${small ? 'small' : ''}`}>
      <Icon size={12} aria-hidden="true" />
      {es.statuses[status]}
    </span>
  );
}
export function Occupancy({ value, label = true }: { value: number; label?: boolean }) {
  const text = es.occupancyLabels[value < 30 ? 0 : value < 70 ? 1 : value <= 90 ? 2 : 3];
  return (
    <div className="occupancy">
      <div
        className="occupancy-track"
        role="meter"
        aria-label={es.occupancy}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${value} %, ${text}`}
      >
        <span
          className={value > 90 ? 'high' : value > 70 ? 'medium' : ''}
          style={{ width: `${value}%` }}
        />
      </div>
      {label && (
        <span>
          {value}% <span className="muted">· {text}</span>
        </span>
      )}
    </div>
  );
}
export function Dialog({
  title,
  children,
  onClose,
  className = '',
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-top">
        <h2 id={titleId}>{title}</h2>
        <button className="icon-button" aria-label={es.close} onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Help({ onClose, onTour }: { onClose: () => void; onTour: () => void }) {
  return (
    <Dialog title={es.helpTitle} onClose={onClose}>
      <p className="muted help-intro">{es.helpDescription}</p>
      <div className="help-pieces">
        {es.helpPieces.map((piece, i) => (
          <div key={piece.title}>
            <span className="step-number">{i + 1}</span>
            <div>
              <h3>{piece.title}</h3>
              <p>{piece.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="help-callout">
        <CircleHelp size={18} />
        <p>{es.shortcuts}</p>
      </div>
      <p className="caption">{es.helpFoot}</p>
      <button className="button secondary full-width help-tour-button" onClick={onTour}>
        {es.tourAgain}
      </button>
      <button className="button primary full-width" onClick={onClose}>
        {es.start}
      </button>
    </Dialog>
  );
}
