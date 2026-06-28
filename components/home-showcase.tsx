"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { BioIcon } from "@/components/bio-icon";

type ShowcaseItem = {
  label: string;
  title: string;
  body: string;
  image: StaticImageData;
  alt: string;
};

export function HomeShowcase({ items }: { items: ShowcaseItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex];

  return (
    <div className="interactive-panel showcase-panel">
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
      <div className="showcase-body">
        <div className="showcase-copy">
          <p className="section-label">Workspace</p>
          <h3>{active.title}</h3>
          <p>{active.body}</p>
          <span className="inline-action">
            Switch view
            <BioIcon name="icon_action_continue" size={16} />
          </span>
        </div>
        <figure className="screenshot-card showcase-image">
          <Image src={active.image} alt={active.alt} sizes="(max-width: 900px) 100vw, 520px" priority={activeIndex === 0} />
          <figcaption className="caption">{active.label}</figcaption>
        </figure>
      </div>
    </div>
  );
}
