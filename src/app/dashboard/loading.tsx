import { Loader } from '@/components/ui/Loader';

/**
 * Next.js route-level loading boundary for the entire /dashboard segment.
 * Rendered automatically by Next.js while the page or its data is loading.
 */
export default function DashboardLoading() {
    return <Loader />;
}
