import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instructor Login - Lean Sporty",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function InstructorLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
