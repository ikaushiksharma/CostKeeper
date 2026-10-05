import { DataCharts } from '@/components/data-charts'
import { DataGrid } from '@/components/data-grid'
import { QuickTransactionEntry } from '@/components/quick-transaction-entry'

export default function Home() {
    return (
        <div className="space-y-4 lg:space-y-6">
            <QuickTransactionEntry />
            <DataGrid />
            <DataCharts />
        </div>
    )
}
