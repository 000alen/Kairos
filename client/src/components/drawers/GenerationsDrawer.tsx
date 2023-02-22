import React, { useContext } from 'react'
import { Button, Card, Drawer, Space, Typography } from 'antd'
import { NotebookContext } from '../../routes/notebook'

const { Text } = Typography;

interface GenerationsDrawerProps {
    open: boolean
    setOpen: (open: boolean) => void
}

export const GenerationsDrawer: React.FC<GenerationsDrawerProps> = ({ open, setOpen }) => {
    const { generations, insert } = useContext(NotebookContext)!;

    return (
        <Drawer title="Sources" closable={false} onClose={() => setOpen(false)} open={open}>
            <Space
                direction="vertical"
            >
                {generations.map((generation) => (
                    <Card
                        key={generation.id}
                        title={generation.type}
                        extra={<Button onClick={() => insert(generation.output)}>Insert</Button>}
                    >
                        <Text>{generation.output}</Text>
                    </Card>
                ))}
            </Space>
        </Drawer >
    )


}
