import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { ClientsTable } from './ClientsTable';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export default function Clients() {
  const sampleData = [
    {
      name: 'TechCorp Solutions',
      reports: 12,
      mediaPlan: { text: 'Uploaded', className: 'bg-green-100 text-green-700' },
      mediaResults: {
        text: 'Uploaded',
        className: 'bg-green-100 text-green-700',
      },
      slides: { text: 'Uploaded', className: 'bg-green-100 text-green-700' },
    },
    {
      name: 'Fashion Forward, Inc.',
      reports: 8,
      mediaPlan: { text: 'Uploaded', className: 'bg-green-100 text-green-700' },
      mediaResults: {
        text: 'Uploaded',
        className: 'bg-green-100 text-green-700',
      },
      slides: { text: 'Uploaded', className: 'bg-green-100 text-green-700' },
    },
    {
      name: 'Green Energy Co.',
      reports: 15,
      mediaPlan: { text: 'Pending', className: 'bg-gray-100 text-gray-700' },
      mediaResults: {
        text: 'Uploaded',
        className: 'bg-green-100 text-green-700',
      },
      slides: { text: 'Pending', className: 'bg-gray-100 text-gray-700' },
    },
    {
      name: 'Urban Lifestyle Brand',
      reports: 6,
      mediaPlan: { text: 'Uploaded', className: 'bg-green-100 text-green-700' },
      mediaResults: {
        text: 'Uploaded',
        className: 'bg-green-100 text-green-700',
      },
      slides: { text: 'Uploaded', className: 'bg-green-100 text-green-700' },
    },
    {
      name: 'Healthtech Innovations',
      reports: 20,
      mediaPlan: { text: 'Uploaded', className: 'bg-green-100 text-green-700' },
      mediaResults: {
        text: 'Uploaded',
        className: 'bg-green-100 text-green-700',
      },
      slides: { text: 'Uploaded', className: 'bg-green-100 text-green-700' },
    },
  ];

  return (
    <>
      <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mr-2 data-[orientation=vertical]:h-4'
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className='hidden md:block'>
              <BreadcrumbPage>Clients</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <main className='min-h-screen lg:max-w-7xl bg-white px-8 py-10'>
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h1 className='text-2xl font-bold mb-1'>Clients</h1>
            <p className='text-gray-500 text-base'>
              Manage your clients data and upload templates
            </p>
          </div>
          <Button className='bg-black text-white'>Add New Client</Button>
        </div>
        <div className='bg-white rounded-lg border p-0 overflow-x-auto'>
          <ClientsTable data={sampleData} />
        </div>
      </main>
    </>
  );
}
