import { ExternalLink } from "lucide-react";
import type { Item } from "../types";
import { ScoreBadge } from "./ScoreBadge";

type Props = {
  item: Item;
  compact?: boolean;
};

export function ItemCard({ item, compact = false }: Props) {
  return (
    <article className="item-card">
      <div className="item-card-header">
        <div>
          <p className="eyebrow">{item.source}</p>
          <h3>{item.title}</h3>
        </div>
        <a className="icon-link" href={item.url} target="_blank" rel="noreferrer" aria-label="Open item">
          <ExternalLink size={18} />
        </a>
      </div>
      {!compact && item.summary ? <p className="summary">{item.summary}</p> : null}
      <div className="meta-row">
        {item.category ? <span className="pill">{item.category}</span> : null}
        {item.stack_tags.map((tag) => (
          <span className="pill muted" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <div className="score-row">
        <ScoreBadge label="Rel" value={item.relevance_score} />
        <ScoreBadge label="Nov" value={item.novelty_score} />
      </div>
    </article>
  );
}
