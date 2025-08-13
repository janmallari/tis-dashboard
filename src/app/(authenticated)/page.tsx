import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ReportsTable, Report } from '@/components/reports-table';

const sampleReports: Report[] = [
  {
    id: '1',
    name: 'DM Pro - Monthly Performance Report Aug',
    client: 'TechCorp Solutions',
    generatedBy: 'Sarah Johnson',
    status: 'ready',
    reportUrl: 'https://example.com/report/1',
  },
  {
    id: '2',
    name: 'Monthly Performance Report',
    client: 'Fashion Forward, Inc.',
    generatedBy: 'Sarah Johnson',
    status: 'in_process',
    reportUrl: '',
  },
  {
    id: '3',
    name: 'DM Pro - Monthly Performance Report Aug',
    client: 'Green Energy Co.',
    generatedBy: 'Sarah Johnson',
    status: 'failed',
    reportUrl: '',
  },
];

export default function Home() {
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
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <main className='min-h-screen lg:max-w-7xl bg-white px-8 py-10'>
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h1 className='text-2xl font-bold mb-1'>Dashboard</h1>
            <p className='text-gray-500 text-base'>Recent generated reports</p>
          </div>
          <Button className='bg-black text-white'>Generate New Report</Button>
        </div>
        <div className='bg-white rounded-lg border p-0 overflow-x-auto'>
          <ReportsTable data={sampleReports} />
        </div>
      </main>
    </>
  );
}
