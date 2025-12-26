import Image from 'next/image';

export default function LeanSportyLogo() {
  return (
    <Image
      src="/logo1024.png"
      alt="Lean Sporty Logo"
      width={160}
      height={160}
      className="rounded-[22%]"
    />
  );
}
