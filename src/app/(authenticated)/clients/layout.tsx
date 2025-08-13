export const metadata = {
  title: 'Clients',
  description: 'Manage your clients',
};

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main>{children}</main>;
}
