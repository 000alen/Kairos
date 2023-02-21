import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Button, Card, Drawer, Input, Space, Typography } from 'antd'
import { NotebookContext } from '../routes/notebook'
import { getRunningLiveSources } from '../api';

const { Text } = Typography;

interface LiveSourcesDrawerProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export const LiveSourcesDrawer: React.FC<LiveSourcesDrawerProps> = ({ open, setOpen }) => {
  const { id, notebook, liveSourceSummary, startLiveSource, stopLiveSource } = useContext(NotebookContext)!;

  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [runningLiveSources, setRunningLiveSources] = useState<string[]>([]);

  const initialization = useCallback(async () => {
    const runningLiveSources = await getRunningLiveSources(id)
    setRunningLiveSources(runningLiveSources)
  }, [id]);

  useEffect(() => { initialization() }, [initialization])

  return (
    <Drawer title="Live sources" width={520} closable={false} onClose={() => setOpen(false)} open={open}>

      <Space
        direction="vertical"
      >

        <Space direction='vertical'>
          <Input placeholder='Origin'
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
          />

          <Button onClick={() => startLiveSource(origin)}>Start</Button>
        </Space>

        {notebook.live_sources.map((source) => (
          <Card
            key={source.origin}
            title={source.type}
            extra={<Button type='link' onClick={() => liveSourceSummary(source.id)}>Summary</Button>}
          >
            <Text>{source.origin}</Text>

            {runningLiveSources.includes(source.id) && <Button onClick={() => stopLiveSource(source.id)}>Stop</Button>}
          </Card>
        ))}
      </Space>
    </Drawer>
  )
}

