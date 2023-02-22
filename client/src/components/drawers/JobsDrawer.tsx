import React, { useContext } from 'react'
import { Card, Drawer, Space, Typography } from 'antd'
import { NotebookContext } from '../../routes/notebook'

const { Text } = Typography;

interface GenerationsDrawerProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export const JobsDrawer: React.FC<GenerationsDrawerProps> = ({ open, setOpen }) => {
  const { jobs } = useContext(NotebookContext)!;

  return (
    <Drawer title="Jobs" closable={false} onClose={() => setOpen(false)} open={open}>
      <Space
        direction="vertical"
      >
        {jobs.map((job) => (
          <Card
            key={job.id}
            title={job.status}
          >
            <Text>{job.output}</Text>
          </Card>
        ))}
      </Space>
    </Drawer >
  )


}
