import React, { useContext, useState } from 'react'
import { Button, Card, Drawer, Input, Space, Typography } from 'antd'
import { NotebookContext } from '../../routes/notebook'

const { Text } = Typography;

interface LiveSourcesDrawerProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export const LiveSourcesDrawer: React.FC<LiveSourcesDrawerProps> = ({ open, setOpen }) => {
  const { liveSources, runningLiveSources, liveSourceSummary, startLiveSource, stopLiveSource } = useContext(NotebookContext)!;

  const [selectedOrigin, setSelectedOrigin] = useState('');

  return (
    <Drawer title="Live sources" closable={false} onClose={() => setOpen(false)} open={open}>

      <Space
        direction="vertical"
      >
        <Space>
          <Input placeholder='Origin'
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
          />

          <Button onClick={() => startLiveSource(origin)}>Start</Button>
        </Space>

        {liveSources.map((source) => (
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

