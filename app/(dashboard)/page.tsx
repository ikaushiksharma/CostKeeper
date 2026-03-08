import { DataCharts } from '@/components/data-charts'
import { DataGrid } from '@/components/data-grid'
import { QuickTransactionEntry } from '@/components/quick-transaction-entry'

export default function Home() {
    return (
        <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-6">
            <div className="mb-4">
                <QuickTransactionEntry />
            </div>
            <DataGrid />
            <DataCharts />
        </div>
    )
}
