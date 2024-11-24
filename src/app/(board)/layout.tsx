import React from "react";

interface layoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: layoutProps) => {
  return (
    <main className="h-full">
      <div className="h-full w-full">{children}</div>
    </main>
  );
};
export default DashboardLayout;
