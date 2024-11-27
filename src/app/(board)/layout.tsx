"use client";

interface LayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: LayoutProps) => {
  return <main className="h-full w-full">{children}</main>;
};

export default DashboardLayout;
