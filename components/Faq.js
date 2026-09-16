import { useState } from 'react';

export default function Faq({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div>
      {items.map((item, i) => (
        <div key={item.q} className={`faq-item${openIndex === i ? ' open' : ''}`}>
          <button className="faq-q" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            {item.q}
            <span className="chevron">▾</span>
          </button>
          <div className="faq-a">
            <p>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
