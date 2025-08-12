import React from 'react';

export const metadata = {
  title: 'Login to Your Account',
  description: 'Access your dashboard and manage your reports securely.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main>{children}</main>
    </>
  );
}
