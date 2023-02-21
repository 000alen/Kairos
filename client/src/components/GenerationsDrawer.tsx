import React, { useCallback, useContext, useState } from 'react'
import { Button, Card, Drawer, Input, Select, Space, Typography } from 'antd'
import { NotebookContext } from '../routes/notebook'
import { joinJob, openFile } from '../api';

const { Text } = Typography;

interface GenerationsDrawerProps {
    open: boolean
    setOpen: (open: boolean) => void
}

const sourceTypeOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'youtube', label: 'Youtube' },
    { value: 'web', label: 'Web' },
]

export const GenerationsDrawer: React.FC<GenerationsDrawerProps> = ({ open, setOpen }) => {
    const { sources, sourceSummary, addPdf, addYoutube, addWeb } = useContext(NotebookContext)!;

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

    const pick = useCallback(
        async () => {
            const path = await joinJob(await openFile("file"), () => { });
            setSelectedSourceOrigin(path);
        }, [
        setSelectedSourceOrigin,
    ]);

    return (
        <Drawer title="Sources" closable={false} onClose={() => setOpen(false)} open={open}>
            <Space
                direction="vertical"
            >
                <Button onClick={() => setAddSourceDrawerOpen(true)}>
                    Add
                </Button>

                {sources.map((source) => (
                    <Card
                        key={source.origin}
                        title={source.type}
                        extra={<Button type='link' onClick={() => sourceSummary(source.id)}>Summary</Button>}
                    >
                        <Text>{source.origin}</Text>
                    </Card>
                ))}
            </Space>

            <Drawer title="Add source" closable={false}
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

                    {
                        selectedSourceType === 'pdf' ? (
                            <Button
                                style={{ width: '100%' }}
                                onClick={pick}
                            >
                                Pick a file
                            </Button>

                        ) : (
                            <Input
                                placeholder='Origin'
                                value={selectedSourceOrigin}
                                onChange={(e) => setSelectedSourceOrigin(e.target.value)}
                            />
                        )
                    }

                    <Button onClick={add}>
                        Add
                    </Button>
                </Space>
            </Drawer>
        </Drawer >
    )


}
