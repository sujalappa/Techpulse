import { ArrowLeft, BookOpen, ExternalLink, Eye } from "lucide-react";
import { useState } from "react";
import type { Digest as DigestType, Item } from "../types";
import { ScoreBadge } from "../components/ScoreBadge";

type Props = {
  digests: DigestType[];
};

export function Digest({ digests }: Props) {
  const [selectedDigest, setSelectedDigest] = useState<DigestType | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  if (selectedDigest) {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Digest Detail</p>
            <h2>{selectedDigest.title}</h2>
            <p>{selectedDigest.intro}</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => {
              setSelectedDigest(null);
              setSelectedItem(null);
            }}
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </div>

        <div className="meta-row">
          <span className="pill">{selectedDigest.items.length} items</span>
          <span className="pill muted">{new Date(selectedDigest.created_at).toLocaleString()}</span>
          {selectedDigest.published_targets.map((target) => (
            <span className="pill muted" key={target}>
              {target}
            </span>
          ))}
        </div>

        {selectedItem ? (
          <article className="article-reader">
            <div className="article-reader-heading">
              <div>
                <p className="eyebrow">{selectedItem.source}</p>
                <h3>{selectedItem.title}</h3>
              </div>
              <button className="secondary-button" onClick={() => setSelectedItem(null)}>
                <ArrowLeft size={18} />
                Digest
              </button>
            </div>
            <p className="article-lede">{selectedItem.summary}</p>
            <div className="article-body">
              <p>
                This item was selected because it scored {selectedItem.relevance_score.toFixed(2)} for relevance and{" "}
                {selectedItem.novelty_score.toFixed(2)} for novelty inside this run. The signal came from{" "}
                {selectedItem.source}, and TechPulse classified it as {selectedItem.category ?? "Uncategorised"}.
              </p>
              <p>
                In production, this view can be extended into a full reader mode by fetching source content through the
                backend, extracting the article text, and storing a clean reading copy with citations.
              </p>
            </div>
            <div className="meta-row">
              {selectedItem.category ? <span className="pill">{selectedItem.category}</span> : null}
              {selectedItem.stack_tags.map((tag) => (
                <span className="pill muted" key={tag}>
                  {tag}
                </span>
              ))}
              <ScoreBadge label="Relevance" value={selectedItem.relevance_score} />
              <ScoreBadge label="Novelty" value={selectedItem.novelty_score} />
            </div>
            <a className="source-button" href={selectedItem.url} target="_blank" rel="noreferrer">
              <ExternalLink size={18} />
              Open original source
            </a>
          </article>
        ) : (
          <div className="reader">
          <div className="reader-intro">
            <p>{selectedDigest.intro}</p>
          </div>

          <div className="reader-items">
            {selectedDigest.items.map((item, index) => (
              <article className="reader-item" key={item.id}>
                <div className="reader-index">{index + 1}</div>
                <div className="reader-copy">
                  <div className="reader-item-heading">
                    <div>
                      <p className="eyebrow">{item.source}</p>
                      <h3>{item.title}</h3>
                    </div>
                    <div className="button-row">
                      <button className="secondary-button" onClick={() => setSelectedItem(item)}>
                        <BookOpen size={17} />
                        Read
                      </button>
                      <a className="source-link" href={item.url} target="_blank" rel="noreferrer">
                        <ExternalLink size={16} />
                        Source
                      </a>
                    </div>
                  </div>
                  <p>{item.summary}</p>
                  <div className="meta-row">
                    {item.category ? <span className="pill">{item.category}</span> : null}
                    {item.stack_tags.map((tag) => (
                      <span className="pill muted" key={tag}>
                        {tag}
                      </span>
                    ))}
                    <ScoreBadge label="Relevance" value={item.relevance_score} />
                    <ScoreBadge label="Novelty" value={item.novelty_score} />
                  </div>
                </div>
              </article>
            ))}
          </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Archive</p>
          <h2>Published Digests</h2>
        </div>
      </div>
      <div className="digest-list">
        {digests.map((digest) => (
          <button
            className="digest-row digest-button"
            key={digest.id}
            onClick={() => {
              setSelectedDigest(digest);
              setSelectedItem(null);
            }}
          >
            <div>
              <h3>{digest.title}</h3>
              <p>{digest.intro}</p>
              <p className="quiet">{new Date(digest.created_at).toLocaleString()}</p>
            </div>
            <span className="pill">
              <Eye size={15} />
              View
            </span>
          </button>
        ))}
        {digests.length === 0 ? <p className="quiet">No digests published yet.</p> : null}
      </div>
    </section>
  );
}
