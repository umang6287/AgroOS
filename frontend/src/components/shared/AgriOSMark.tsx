import type { SVGProps } from "react";

type AgriOSMarkProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

export function AgriOSMark({ className = "h-8 w-8", title, ...props }: AgriOSMarkProps) {
  const accessibilityProps = title ? { role: "img", "aria-label": title } : { "aria-hidden": true };

  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" {...accessibilityProps} {...props}>
      <path
        d="M9.8 44.9C20.5 39.5 31.5 38.8 44.2 43.1C49.5 44.9 53.1 47.2 56 49.7"
        className="stroke-lime-200/65"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M8.8 54.1C22.2 48.8 39.5 49 55.2 54.2"
        className="stroke-emerald-300/65"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M33.9 9.8C24.8 14.3 18.5 23.9 18.5 34.2C18.5 44.1 25.4 50.9 34.6 50.9C43.7 50.9 50.8 43.7 50.8 34.5C50.8 24.6 44.1 15.2 33.9 9.8Z"
        className="fill-emerald-300"
      />
      <path
        d="M34 9.8C38.5 22.7 37.3 38.6 28 49"
        className="stroke-[#06261f]"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M33.6 31.6C39 30.4 43.4 27.5 47 23.2"
        className="stroke-[#06261f]"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M30.2 38.7C26.1 36.2 23.1 32.6 21.7 27.9"
        className="stroke-[#06261f]"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M13.6 38.7C23.2 22.5 40.7 12.6 54.4 18.9"
        className="stroke-sky-200"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="1 6"
      />
      <circle cx="48.8" cy="18.1" r="5.4" className="fill-sky-300" />
      <path
        d="M52.9 11.2C56.5 13.5 58.7 17.6 58.7 22"
        className="stroke-sky-100/70"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M45.3 7.7C48.1 7 51.2 7.3 54 8.8"
        className="stroke-sky-100/45"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="21.1" cy="43" r="2.5" className="fill-lime-100" />
      <circle cx="41.3" cy="45" r="2.5" className="fill-emerald-50" />
    </svg>
  );
}
