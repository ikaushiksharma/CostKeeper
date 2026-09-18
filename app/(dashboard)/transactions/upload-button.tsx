import { Upload } from 'lucide-react'
import type { ParseResult } from 'papaparse'
import { useCSVReader } from 'react-papaparse'

import { Button } from '@/components/ui/button'

type UploadButtonProps = {
    onUpload: (results: ParseResult<string[]>) => void
}

export const UploadButton = ({ onUpload }: UploadButtonProps) => {
    const { CSVReader } = useCSVReader()

    return (
        <CSVReader onUploadAccepted={onUpload}>
            {({
                getRootProps,
            }: {
                getRootProps: () => Record<string, unknown>
            }) => (
                <Button
                    size="sm"
                    className="w-full lg:w-auto"
                    {...getRootProps()}
                >
                    <Upload className="size-4 mr-2" />
                    Import
                </Button>
            )}
        </CSVReader>
    )
}
