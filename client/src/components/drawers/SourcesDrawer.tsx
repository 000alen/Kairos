import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Button, Card, Drawer, Input, Select, Space, Typography } from 'antd'
import { NotebookContext } from '../../routes/notebook'
import { getSourceContent, joinJob, openFile } from '../../api';

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
    const { id, sources, sourceSummary, addSource } = useContext(NotebookContext)!;

    const [addSourceDrawerOpen, setAddSourceDrawerOpen] = useState(false)
    const [selectedSourceType, setSelectedSourceType] = useState('pdf')
    const [selectedSourceOrigin, setSelectedSourceOrigin] = useState('')

    const [sourceContentDrawerOpen, setSourceContentDrawerOpen] = useState(false)
    const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
    const [selectedSourceContent, setSelectedSourceContent] = useState<string | null>(null)

    const add = useCallback(
        async () => {
            addSource(selectedSourceType, selectedSourceOrigin)
        },
        [
            selectedSourceType,
            selectedSourceOrigin,
            addSource,
        ]
    )

    const pick = useCallback(
        async () => {
            const { error, output } = await joinJob<string>(id, await openFile(id, "file"), () => { });
            setSelectedSourceOrigin(output!);
        }, [
        setSelectedSourceOrigin, id
    ]);

    useEffect(() => {
        if (!selectedSourceId) return;
        (async () => {
            const content = await getSourceContent(id, selectedSourceId);
            setSelectedSourceContent(content);
        })();
    }, [id, selectedSourceId, setSelectedSourceContent])

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
                        <Button onClick={() => {
                            setSelectedSourceId(source.id)
                            setSourceContentDrawerOpen(true)
                        }}>Content</Button>
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

            <Drawer title="Content" closable={false}
                onClose={() => setSourceContentDrawerOpen(false)}
                open={sourceContentDrawerOpen}
            >
                {selectedSourceContent && <Text>{selectedSourceContent}</Text>}
            </Drawer>
        </Drawer >
    )


}
