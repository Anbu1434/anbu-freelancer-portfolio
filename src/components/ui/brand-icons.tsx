import { siFiverr, siGithub, siUpwork } from "simple-icons";

type IconProps = { className?: string };

function Mark({ path, className }: { path: string } & IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d={path} />
    </svg>
  );
}

export function GithubIcon(props: IconProps) {
  return <Mark path={siGithub.path} {...props} />;
}

export function FiverrIcon(props: IconProps) {
  return <Mark path={siFiverr.path} {...props} />;
}

export function UpworkIcon(props: IconProps) {
  return <Mark path={siUpwork.path} {...props} />;
}
