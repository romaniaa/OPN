import type { SVGProps } from "react";

// The site's line icons, all drawn on a 16 x 16 grid in currentColor.

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Icon({ className = "h-3.5 w-3.5", children, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

// Out to another site.
export const ExternalArrow = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3h7v7M13 3 3 13" />
  </Icon>
);

// Onward within the site.
export const NextArrow = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </Icon>
);

export const Cross = (p: IconProps) => (
  <Icon {...p}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Icon>
);

export const Plus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 3v10M3 8h10" />
  </Icon>
);

export const Check = (p: IconProps) => (
  <Icon strokeWidth={2.25} {...p}>
    <path d="M3 8.5 6.5 12 13 4.5" />
  </Icon>
);

export const Pencil = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 13h3l7-7-3-3-7 7v3Z" />
  </Icon>
);
