"use client";

import { useState } from "react";
import { BioIcon } from "@/components/bio-icon";

export type ShowcasePoint = {
  title: string;
  desc: string;
};

export type ShowcaseItem = {
  label: string;
  badge?: string;
  title: string;
  subtitle?: string;
  body: string;
  points?: ShowcasePoint[];
  image: string;
  alt: string;
};

export function HomeShowcase({ items }: { items: ShowcaseItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex];

  return (
    <div className="showcase-panel">
      <div className="showcase-body">
        <figure className="showcase-image">
          <img src={active.image} alt={active.alt} loading="lazy" />
        </figure>
        <div className="showcase-copy">
          <div className="showcase-controls" role="tablist" aria-label="Klario workspace views">
            {items.map((item, index) => (
              <button
                key={item.label}
                className={`segmented-button${index === activeIndex ? " is-active" : ""}`}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <h3>{active.title}</h3>
          <p className="showcase-lead">{active.body}</p>
          {active.points && active.points.length > 0 && (
            <ul className="showcase-points">
              {active.points.map((pt) => (
                <li key={pt.title} className="showcase-point">
                  <span className="showcase-point-icon" aria-hidden="true">
                    <BioIcon name="icon_action_confirm_safe" size={16} />
                  </span>
                  <div>
                    <strong>{pt.title}</strong>
                    <span>{pt.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
