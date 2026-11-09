'use client';

/**
 * Honeypot Anti-Bot Field
 * Rendered with absolute positioning and zero dimensions, invisible to human visitors.
 * Automated spam scripts filling every input field will populate this, exposing themselves to the backend trap.
 */
export default function HoneypotField({ value = '', onChange }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        opacity: 0,
        pointerEvents: 'none',
        zIndex: -9999,
        overflow: 'hidden'
      }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <label htmlFor="_hp_website_trap">Leave this field blank</label>
      <input
        type="text"
        id="_hp_website_trap"
        name="_hp_website"
        value={value}
        onChange={onChange}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
