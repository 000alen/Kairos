import React, { useCallback, useContext, useState } from 'react'
import { Button, Card, Drawer, Input, Select, Space, Typography } from 'antd'
import { NotebookContext } from '../routes/notebook'

const { Text } = Typography;

interface SourcesDrawerProps {
    open: boolean
    setOpen: (open: boolean) => void
}

const sourceTypeOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'youtube', label: 'Youtube' },
    { value: 'web', label: 'Web' },
]

export const SourcesDrawer: React.FC<SourcesDrawerProps> = ({ open, setOpen }) => {
    const { notebook, sourceSummary, addPdf, addYoutube, addWeb } = useContext(NotebookContext)!;

    const [addSourceDrawerOpen, setAddSourceDrawerOpen] = useState(false)
    const [selectedSourceType, setSelectedSourceType] = useState('pdf')
    const [selectedSourceOrigin, setSelectedSourceOrigin] = useState('')

    const add = useCallback(
        async () => {
            switch (selectedSourceType) {
                case 'pdf':
                    return await addPdf(selectedSourceOrigin)
                case 'youtube':
                    return await addYoutube(selectedSourceOrigin)
                case 'web':
                    return await addWeb(selectedSourceOrigin)
            }
        },
        [
            selectedSourceType,
            selectedSourceOrigin,
            addPdf,
            addYoutube,
            addWeb,
        ]
    )

    return (
        <Drawer title="Sources" width={520} closable={false} onClose={() => setOpen(false)} open={open}>
            <Space
                direction="vertical"
            >
                <Button onClick={() => setAddSourceDrawerOpen(true)}>
                    Add
                </Button>

                {notebook.sources.map((source) => (
                    <Card
                        key={source.origin}
                        title={source.type}
                        extra={<Button type='link' onClick={() => sourceSummary(source.id)}>Summary</Button>}
                    >
                        <Text>{source.origin}</Text>
                    </Card>
                ))}
            </Space>

            <Drawer title="Add source" width={320} closable={false}
                onClose={() => setAddSourceDrawerOpen(false)}
                open={addSourceDrawerOpen}
            >
                <Space direction='vertical'
                    style={{ width: '100%' }}
                >
                    <Select
                        value={selectedSourceType}
                        onChange={(type) => setSelectedSourceType(type)}
                        options={sourceTypeOptions}
                        style={{ width: '100%' }}
                    />

                    <Input
                        placeholder='Origin'
                        value={selectedSourceOrigin}
                        onChange={(e) => setSelectedSourceOrigin(e.target.value)}
                    />

                    <Button onClick={add}>
                        Add
                    </Button>
                </Space>
            </Drawer>
        </Drawer>
    )


}
