import { Play, RefreshCw } from "lucide-react";
import type { RunState } from "../types";

type Props = {
  runs: RunState[];
  loading: boolean;
  onRun: () => void;
  onRefresh: () => void;
};

export function Dashboard({ runs, loading, onRun, onRefresh }: Props) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Run History</h2>
        </div>
        <div className="button-row">
          <button className="icon-button" onClick={onRefresh} aria-label="Refresh">
            <RefreshCw size={18} />
          </button>
          <button className="primary-button" onClick={onRun} disabled={loading}>
            <Play size={18} />
            {loading ? "Starting" : "Run Pipeline"}
          </button>
        </div>
      </div>
      <div className="table">
        <div className="table-row table-head">
          <span>Run</span>
          <span>Stage</span>
          <span>Status</span>
          <span>Created</span>
        </div>
        {runs.map((run) => (
          <div className="table-row" key={run.id}>
            <span>{run.id.slice(0, 8)}</span>
            <span>{run.stage}</span>
            <span className={`status status-${run.status}`}>{run.status.replace("_", " ")}</span>
            <span>{new Date(run.created_at).toLocaleString()}</span>
          </div>
        ))}
        {runs.length === 0 ? <p className="quiet">No runs yet.</p> : null}
      </div>
    </section>
  );
}
