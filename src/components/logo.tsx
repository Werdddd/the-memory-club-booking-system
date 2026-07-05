import Image from "next/image";

export function Logo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <>
      <Image
        src="/black-logo.png"
        alt="The Memory Club"
        width={size}
        height={size}
        priority
        className={`block dark:hidden ${className ?? ""}`}
      />
      <Image
        src="/white-logo.png"
        alt="The Memory Club"
        width={size}
        height={size}
        priority
        className={`hidden dark:block ${className ?? ""}`}
      />
    </>
  );
}
