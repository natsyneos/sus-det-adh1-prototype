import { useState } from 'react';
import { FogConfig, DEFAULT_FOG_CONFIG } from './FogOverlay';

interface FogDebugConsoleProps {
  config:      FogConfig;
  autoDensity: number;
  onChange:    (config: FogConfig) => void;
}

type ParamDef = {
  key:   keyof FogConfig;
  label: string;
  min:   number;
  max:   number;
  step:  number;
  hint:  string;
};

const PARAMS: ParamDef[] = [
  { key: 'speed',        label: 'Drift Speed',    min: 0.002, max: 0.15,  step: 0.001, hint: 'How fast the fog moves'             },
  { key: 'maxAlpha',     label: 'Max Opacity',    min: 0.0,   max: 1.0,   step: 0.01,  hint: 'Peak fog density'                   },
  { key: 'fogScale',     label: 'Fog Scale',      min: 0.3,   max: 4.0,   step: 0.05,  hint: 'Zoom — higher = smaller clouds'     },
  { key: 'warpStrength', label: 'Warp Strength',  min: 0.0,   max: 5.0,   step: 0.1,   hint: 'How organic/swirly vs linear'       },
  { key: 'fogLo',        label: 'Contrast Lo',    min: 0.0,   max: 0.59,  step: 0.01,  hint: 'Smoothstep low threshold'           },
  { key: 'fogHi',        label: 'Contrast Hi',    min: 0.41,  max: 1.0,   step: 0.01,  hint: 'Smoothstep high threshold'          },
  { key: 'touchRadius',  label: 'Touch Radius',   min: 0.02,  max: 0.5,   step: 0.01,  hint: 'Clearing circle size'               },
  { key: 'touchDecay',   label: 'Fog Return',     min: 0.1,   max: 8.0,   step: 0.1,   hint: 'How fast fog fills back in (1/τ)'   },
];

function fmt(val: number, step: number) {
  const decimals = step < 0.01 ? 3 : step < 0.1 ? 2 : 1;
  return val.toFixed(decimals);
}

export function FogDebugConsole({ config, autoDensity, onChange }: FogDebugConsoleProps) {
  const [open, setOpen] = useState(true);
  const [tooltip, setTooltip] = useState('');

  const reset = () => onChange({ ...DEFAULT_FOG_CONFIG });

  return (
    // Fixed to viewport — sits in the black letterbox area outside the canvas
    <div
      style={{
        position:   'fixed',
        top:        12,
        left:       12,
        zIndex:     9999,
        width:      264,
        fontFamily: '"SF Mono", "Fira Code", monospace',
        fontSize:   11,
        color:      '#d0d0d0',
        userSelect: 'none',
      }}
    >
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          background:   '#111',
          border:       '1px solid #333',
          borderRadius: open ? '8px 8px 0 0' : 8,
          padding:      '7px 10px',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          cursor:       'pointer',
        }}
      >
        <span style={{ color: '#FFC358', fontWeight: 700, letterSpacing: 1 }}>
          ◈ FOG DEBUG
        </span>
        <span style={{ color: '#555', fontSize: 10 }}>{open ? '▲ hide' : '▼ show'}</span>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            background:      '#0e0e0e',
            border:          '1px solid #333',
            borderTop:       'none',
            borderRadius:    '0 0 8px 8px',
            padding:         '10px 12px 12px',
          }}
        >
          {/* Auto density readout */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #222' }}>
            <span style={{ color: '#666' }}>auto density</span>
            <span style={{ color: '#FFC358' }}>{autoDensity.toFixed(2)}</span>
          </div>

          {/* Sliders */}
          {PARAMS.map(p => (
            <div
              key={p.key}
              style={{ marginBottom: 8 }}
              onMouseEnter={() => setTooltip(p.hint)}
              onMouseLeave={() => setTooltip('')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ color: '#aaa' }}>{p.label}</span>
                <span style={{ color: '#FFC358' }}>{fmt(config[p.key], p.step)}</span>
              </div>
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={config[p.key]}
                onChange={e => onChange({ ...config, [p.key]: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#FFC358', cursor: 'pointer' }}
              />
            </div>
          ))}

          {/* Tooltip hint */}
          <div style={{ height: 14, color: '#555', marginTop: 4, marginBottom: 6 }}>
            {tooltip}
          </div>

          {/* Reset */}
          <button
            onClick={reset}
            style={{
              width:        '100%',
              background:   '#1a1a1a',
              border:       '1px solid #333',
              borderRadius: 4,
              color:        '#888',
              padding:      '5px 0',
              cursor:       'pointer',
              fontSize:     11,
              fontFamily:   'inherit',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FFC358')}
            onMouseLeave={e => (e.currentTarget.style.color = '#888')}
          >
            ↺ reset defaults
          </button>
        </div>
      )}
    </div>
  );
}
