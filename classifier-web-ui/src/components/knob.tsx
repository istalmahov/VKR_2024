import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const MIN_ANGLE = 0;
const MAX_ANGLE = 180;

const changeRange = (
  value: number,
  min: number,
  max: number,
  newMin: number,
  newMax: number
) => ((value - min) / (max - min)) * (newMax - newMin) + newMin;

const getRotation = (value: number, min: number, max: number) =>
  changeRange(value, min, max, MIN_ANGLE, MAX_ANGLE);

const getValue = (angle: number, min: number, max: number) =>
  changeRange(angle, MIN_ANGLE, MAX_ANGLE, min, max);

export interface KnobProps {
  onChange: (value: number) => void;
  value: number;
  size?: number;
  min?: number;
  max?: number;
}

const Knob = ({ onChange, value, size = 25, min = 0, max = 1 }: KnobProps) => {
  const [rotation, setRotation] = useState(getRotation(value, min, max));
  const [isDragging, setIsDragging] = useState(false);

  const knobRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      let newRotation = rotation - e.movementY;

      if (newRotation < MIN_ANGLE) newRotation = MIN_ANGLE;
      if (newRotation > MAX_ANGLE) newRotation = MAX_ANGLE;

      setRotation(newRotation);
      onChange(getValue(newRotation, min, max));
    },
    [rotation, min, max, onChange]
  );

  const onMouseUp = useCallback<EventListener>(() => {
    document.exitPointerLock();
    setIsDragging(false);
  }, []);

  const onClick = useCallback<MouseEventHandler>(() => {
    knobRef.current && knobRef.current.requestPointerLock();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [isDragging, onMouseMove, onMouseUp, rotation]);

  return (
    <>
      <span
        ref={knobRef}
        style={{ display: "inline-block", cursor: "ns-resize" }}
        onMouseDown={onClick}
      >
        <div
          style={{
            transform: `rotate(${rotation}deg)`,
            display: "block",
            position: "relative",
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            backgroundColor: "#333",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              top: "50%",
              position: "absolute",
              display: "block",
              transform: "translate(0, -50%)",
              width: `${size / 2}px`,
              height: "2px",
              backgroundColor: "#d4d4d4",
            }}
          ></span>
        </div>
      </span>
    </>
  );
};

export default Knob;
