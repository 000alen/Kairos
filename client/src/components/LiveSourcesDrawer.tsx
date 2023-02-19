import React, { useContext, useState } from 'react'
import { Button, Card, Drawer, Input, Space, Typography } from 'antd'
import { NotebookContext } from '../routes/notebook'

const { Text } = Typography;

interface LiveSourcesDrawerProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export const LiveSourcesDrawer: React.FC<LiveSourcesDrawerProps> = ({ open, setOpen }) => {
  const { notebook, liveSourceSummary, startLiveSource, stopLiveSource } = useContext(NotebookContext)!;

  const [selectedOrigin, setSelectedOrigin] = useState('');

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

          <Space>
            <Button onClick={() => startLiveSource(origin)}>Start</Button>
            <Button onClick={() => stopLiveSource(origin)}>Stop</Button>
          </Space>
        </Space>

        {notebook.live_sources.map((source) => (
          <Card
            key={source.origin}
            title={source.type}
            extra={<Button type='link' onClick={() => liveSourceSummary(source.id)}>Summary</Button>}
          >
            <Text>{source.origin}</Text>
          </Card>
        ))}
      </Space>
    </Drawer>
  )
}

