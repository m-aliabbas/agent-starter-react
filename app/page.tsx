import { headers } from 'next/headers';
import { App } from '@/components/app/app';
import { getAppConfig } from '@/lib/utils';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const hdrs = await headers();
  const appConfig = await getAppConfig(hdrs);
  const params = await searchParams;

  // Log URL parameters to console
  console.log('=== Page URL Parameters ===');
  console.log(params);
  console.log('===========================');

  // Example: http://localhost:3000?agent_name=ali (don't use quotes in URL);

  return <App appConfig={appConfig} urlParams={params} />;
}
