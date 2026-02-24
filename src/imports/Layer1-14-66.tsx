import svgPaths from "./svg-kngtj4y1nh";
import { imgGroup } from "./svg-ephzf";

function Group() {
  return (
    <div className="absolute inset-0 mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[12px_12px] mask-size-[475px_475px]" data-name="Group" style={{ maskImage: `url('${imgGroup}')` }}>
      <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 500 500">
        <g id="Group">
          <path d="M500 0H0V500H500V0Z" fill="var(--fill-0, #FFC358)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ClipPathGroup() {
  return (
    <div className="absolute contents inset-[2.4%_2.6%_2.6%_2.4%]" data-name="Clip path group">
      <Group />
    </div>
  );
}

export default function Layer() {
  return (
    <div className="relative size-full" data-name="Layer_1">
      <div className="absolute inset-[2.4%_2.6%_2.6%_2.4%]" data-name="Vector">
        <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 475 475">
          <path d={svgPaths.p12700740} fill="var(--fill-0, #FFC358)" id="Vector" />
        </svg>
      </div>
      <ClipPathGroup />
    </div>
  );
}