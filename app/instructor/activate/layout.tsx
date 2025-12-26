import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activate Instructor Status - Lean Sporty",
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

export default function InstructorActivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
