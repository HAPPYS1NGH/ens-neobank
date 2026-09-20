'use client'

/**
 * Add & Manage — `reference/screens/IMG_4300.PNG`.
 *
 * Two white card rows: Add chain writes a network onto the name, Organize
 * tokens turns those writable networks on or off. The sheet chrome itself
 * (32pt corners, centred 15/600 title, white circular X, black 0.71 scrim) is
 * the shared primitive in components/Shell.tsx; this file is the two rows.
 *
 * Measured off the shot, device px ÷ 3: rows 68pt tall with a 12pt gap, a 46pt
 * tinted chip, 16/600 title over a 12pt subtitle, chevron at the right.
 *
 * Both rows are whole-sheet swaps rather than stacked modals.
 */

import { Sheet } from '../components/Shell'
import { Plus, Sliders, ChevronRight } from '../components/Icons'
import { useWallet } from '../store'

export interface AddManageSheetProps {
  /** Defaults to the store's own `closeSheet`. */
  onClose?: () => void
}

export function AddManageSheet({ onClose }: AddManageSheetProps) {
  const w = useWallet()
  const close = onClose ?? w.closeSheet

  return (
    <Sheet title="Add & Manage" onClose={close}>
      <style>{CSS}</style>

      <div className="am-list">
        <button className="am-row" onClick={() => w.openSheet({ kind: 'addNetwork' })}>
          <span className="am-chip">
            <Plus size={22} />
          </span>
          <span className="am-stack">
            <span className="am-title">Add chain</span>
            <span className="am-sub">Write a network onto your name</span>
          </span>
          <ChevronRight size={20} className="am-chevron" />
        </button>

        <button className="am-row" onClick={() => w.openSheet({ kind: 'manageTokens' })}>
          <span className="am-chip">
            <Sliders size={22} />
          </span>
          <span className="am-stack">
            <span className="am-title">Organize tokens</span>
            <span className="am-sub">Turn networks on or off</span>
          </span>
          <ChevronRight size={20} className="am-chevron" />
        </button>
      </div>
    </Sheet>
  )
}

/* --------------------------------------------------------------------- css */
/* Prefixed `am-`. */

const CSS = `
.am-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 4px 20px;
}

.am-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  height: 68px;
  padding: 0 16px;
  border-radius: var(--r-card);
  background: var(--bg-card);
  text-align: left;
}
.am-row:active { opacity: .7; }

.am-chip {
  flex: none;
  width: 46px;
  height: 46px;
  border-radius: var(--r-icon);
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
}

.am-stack {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.am-title {
  font-size: 16px;
  font-weight: var(--fw-semibold);
  color: var(--text-1);
}

.am-sub {
  font-size: var(--fs-sub);
  color: var(--text-3);
}

.am-chevron { flex: none; color: var(--text-3); }
`
