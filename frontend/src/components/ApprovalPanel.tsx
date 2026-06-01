import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Checkpoint } from "../types";
import { ItemCard } from "./ItemCard";

type Props = {
  checkpoint: Checkpoint | null;
  approving: boolean;
  onApprove: (selectedItemIds?: string[]) => void;
};

export function ApprovalPanel({ checkpoint, approving, onApprove }: Props) {
  const selectableItems = useMemo(() => checkpoint?.payload.items ?? [], [checkpoint]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedIds(new Set(selectableItems.map((item) => item.id)));
  }, [selectableItems]);

  if (!checkpoint) {
    return (
      <section className="panel empty-panel">
        <CheckCircle2 size={22} />
        <div>
          <h2>No Approval Waiting</h2>
          <p>Start a run or check the latest digest history.</p>
        </div>
      </section>
    );
  }

  const selectedCount = selectedIds.size;

  function toggleItem(itemId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(selectableItems.map((item) => item.id)));
  }

  function clearAll() {
    setSelectedIds(new Set());
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{checkpoint.name.replace("_", " ")}</p>
          <h2>{checkpoint.title}</h2>
          <p>{checkpoint.description}</p>
        </div>
        <button
          className="primary-button"
          onClick={() => onApprove(Array.from(selectedIds))}
          disabled={approving || selectedCount === 0}
        >
          <CheckCircle2 size={18} />
          {approving ? "Publishing..." : `Approve & Publish (${selectedCount} Stories)`}
        </button>
      </div>

      {checkpoint.payload.digest && (
        <div className="digest-draft-header" style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid var(--border-glass)" }}>
          <p className="eyebrow">Draft Preview</p>
          <h3 style={{ fontSize: "1.3rem", marginBottom: "8px" }}>{checkpoint.payload.digest.title}</h3>
          <p style={{ color: "var(--text-secondary)" }}>{checkpoint.payload.digest.intro}</p>
        </div>
      )}

      <div className="selection-toolbar">
        <span className="quiet">
          {selectedCount} of {selectableItems.length} articles selected
        </span>
        <div className="button-row">
          <button className="secondary-button" onClick={selectAll} type="button">
            Select all
          </button>
          <button className="secondary-button" onClick={clearAll} type="button">
            Clear
          </button>
        </div>
      </div>
      
      <div className="item-grid" style={{ marginBottom: "30px" }}>
        {selectableItems.map((item) => (
          <label className={`approval-card ${selectedIds.has(item.id) ? "selected" : ""}`} key={item.id}>
            <input
              checked={selectedIds.has(item.id)}
              onChange={() => toggleItem(item.id)}
              type="checkbox"
            />
            <ItemCard item={item} compact={true} />
          </label>
        ))}
      </div>

      {checkpoint.payload.digest && (
        <div className="digest-preview">
          <p className="eyebrow" style={{ marginBottom: "10px" }}>Draft Markdown Text</p>
          <pre>{checkpoint.payload.digest.markdown}</pre>
        </div>
      )}
    </section>
  );
}
