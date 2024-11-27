import React from "react";

interface layoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: layoutProps) => {
  return <main className="h-full w-full">{children}</main>;
};
export default DashboardLayout;
