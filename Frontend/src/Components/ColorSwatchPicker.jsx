import { useEffect, useRef } from 'react';
import { ColorPicker } from 'primereact/colorpicker';

const normalizeHex = (value) => `#${String(value ?? '').replace('#', '')}`;

// Reusable swatch + popup color picker. Pass `presets` to render a row of
// preset swatches alongside a custom-color swatch; omit it for a single
// editable swatch. The picker is controlled via `open`/`onOpenChange` so the
// parent can ensure only one swatch popup is open at a time.
function ColorSwatchPicker({
  label,
  value,
  onChange,
  presets,
  open,
  onOpenChange,
}) {
  const swatchRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(e) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        swatchRef.current &&
        !swatchRef.current.contains(e.target)
      ) {
        onOpenChange(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onOpenChange]);

  const hasPresets = Array.isArray(presets) && presets.length > 0;
  const customSelected = hasPresets ? !presets.includes(value) : true;

  return (
    <div className="field">
      <label>{label}</label>
      <div className="fov-swatches">
        {hasPresets && presets.map((color) => (
          <div
            key={color}
            className={`fov-swatch ${color === value ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => {
              onOpenChange(false);
              onChange(color);
            }}
          />
        ))}

        <div
          ref={swatchRef}
          className={`fov-swatch custom ${customSelected ? 'selected' : ''}`}
          style={{ backgroundColor: value }}
          onClick={(e) => {
            e.stopPropagation();
            onOpenChange(!open);
          }}
        >
          <span className="edit-indicator">✎</span>
        </div>
      </div>

      {open && (
        <div ref={pickerRef} className="picker-inline">
          <ColorPicker
            value={value}
            format="hex"
            inline
            onChange={(e) => onChange(normalizeHex(e.value))}
          />
        </div>
      )}
    </div>
  );
}

export default ColorSwatchPicker;
