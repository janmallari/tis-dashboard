import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export default function Clients() {
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
          <table className='min-w-full text-sm'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-4 text-left font-semibold text-gray-500'>
                  Client
                </th>
                <th className='px-6 py-4 text-left font-semibold text-gray-500'>
                  Reports Generated
                </th>
                <th className='px-6 py-4 text-left font-semibold text-gray-500'>
                  Media Plan Template
                </th>
                <th className='px-6 py-4 text-left font-semibold text-gray-500'>
                  Media Results Template
                </th>
                <th className='px-6 py-4 text-left font-semibold text-gray-500'>
                  Slides Template
                </th>
                <th className='px-6 py-4'></th>
              </tr>
            </thead>
            <tbody>
              {/* Example rows, replace with dynamic data as needed */}
              <tr className='border-t'>
                <td className='px-6 py-4'>TechCorp Solutions</td>
                <td className='px-6 py-4'>12</td>
                <td className='px-6 py-4'>
                  <Badge
                    variant='default'
                    className='bg-green-100 text-green-700'
                  >
                    Uploaded
                  </Badge>
                </td>
                <td className='px-6 py-4'>
                  <Badge
                    variant='default'
                    className='bg-green-100 text-green-700'
                  >
                    Uploaded
                  </Badge>
                </td>
                <td className='px-6 py-4'>
                  <Badge
                    variant='default'
                    className='bg-green-100 text-green-700'
                  >
                    Uploaded
                  </Badge>
                </td>
                <td className='px-6 py-4 text-right'>•••</td>
              </tr>
              <tr className='border-t'>
                <td className='px-6 py-4'>Fashion Forward, Inc.</td>
                <td className='px-6 py-4'>8</td>
                <td className='px-6 py-4'>
                  <Badge
                    variant='default'
                    className='bg-green-100 text-green-700'
                  >
                    Uploaded
                  </Badge>
                </td>
                <td className='px-6 py-4'>
                  <Badge
                    variant='default'
                    className='bg-gray-100 text-gray-700'
                  >
                    Pending
                  </Badge>
                </td>
                <td className='px-6 py-4'>
                  <Badge
                    variant='default'
                    className='bg-green-100 text-green-700'
                  >
                    Uploaded
                  </Badge>
                </td>
                <td className='px-6 py-4 text-right'>•••</td>
              </tr>
              <tr className='border-t'>
                <td className='px-6 py-4'>Green Energy Co.</td>
                <td className='px-6 py-4'>15</td>
                <td className='px-6 py-4'>
                  <Badge
                    variant='default'
                    className='bg-gray-100 text-gray-700'
                  >
                    Pending
                  </Badge>
                </td>
                <td className='px-6 py-4'>
                  <Badge
                    variant='default'
                    className='bg-green-100 text-green-700'
                  >
                    Uploaded
                  </Badge>
                </td>
                <td className='px-6 py-4'>
                  <Badge
                    variant='default'
                    className='bg-gray-100 text-gray-700'
                  >
                    Pending
                  </Badge>
                </td>
                <td className='px-6 py-4 text-right'>•••</td>
              </tr>
              <tr className='border-t'>
                <td className='px-6 py-4'>Urban Lifestyle Brand</td>
                <td className='px-6 py-4'>6</td>
                <td className='px-6 py-4'>
                  <Badge
                    variant='default'
                    className='bg-green-100 text-green-700'
                  >
                    Uploaded
                  </Badge>
                </td>
                <td className='px-6 py-4'>
                  <Badge
                    variant='default'
                    className='bg-green-100 text-green-700'
                  >
                    Uploaded
                  </Badge>
                </td>
                <td className='px-6 py-4'>
                  <Badge
                    variant='default'
                    className='bg-green-100 text-green-700'
                  >
                    Uploaded
                  </Badge>
                </td>
                <td className='px-6 py-4 text-right'>•••</td>
              </tr>
              <tr className='border-t'>
                <td className='px-6 py-4'>Healthtech Innovations</td>
                <td className='px-6 py-4'>20</td>
                <td className='px-6 py-4'>
                  <Badge
                    variant='default'
                    className='bg-green-100 text-green-700'
                  >
                    Uploaded
                  </Badge>
                </td>
                <td className='px-6 py-4'>
                  <Badge
                    variant='default'
                    className='bg-green-100 text-green-700'
                  >
                    Uploaded
                  </Badge>
                </td>
                <td className='px-6 py-4'>
                  <Badge
                    variant='default'
                    className='bg-green-100 text-green-700'
                  >
                    Uploaded
                  </Badge>
                </td>
                <td className='px-6 py-4 text-right'>•••</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
