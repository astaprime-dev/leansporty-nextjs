import Image from 'next/image';

export default function LeanSportyLogo() {
  return (
    <Image
      src="/logo-1080-round-b.png"
      alt="Lean Sporty Logo"
      width={1080}
      height={1080}
      className="w-64 h-64"
    />
  );
}
