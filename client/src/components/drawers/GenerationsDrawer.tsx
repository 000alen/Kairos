import React, { useContext, useState } from 'react'
import { Button, Card, Drawer, Space, Steps, Typography } from 'antd'
import { NotebookContext } from '../../routes/notebook'

const { Text } = Typography;

interface GenerationsDrawerProps {
    open: boolean
    setOpen: (open: boolean) => void
}

export const GenerationsDrawer: React.FC<GenerationsDrawerProps> = ({ open, setOpen }) => {
    const { generations, insert } = useContext(NotebookContext)!;

    const [intermediateStepsDrawerOpen, setIntermediateStepsDrawerOpen] = useState(false);
    const [selectedGeneration, setSelectedGeneration] = useState(0);

    return (
        <Drawer title="Generations" closable={false} onClose={() => setOpen(false)} open={open}>
            <Space
                direction="vertical"
            >
                {generations.map((generation, i) => (
                    <Card
                        key={generation.id}
                        title={generation.type}
                        extra={<Button onClick={() => insert(generation.output)}>Insert</Button>}
                    >
                        <Text>{generation.output}</Text>
                        <Button onClick={() => { setSelectedGeneration(i); setIntermediateStepsDrawerOpen(true) }}>Intermediate steps</Button>
                    </Card>
                ))}
            </Space>

            <Drawer title="Intermediate steps" closable={false}
                onClose={() => setIntermediateStepsDrawerOpen(false)}
                open={intermediateStepsDrawerOpen}
            >
                {
                    generations && generations[selectedGeneration] && <Steps
                        progressDot
                        direction="vertical"
                        size="small"
                        current={generations[selectedGeneration].intermediate_steps.length - 1}
                        status='finish'
                        items={
                            generations[selectedGeneration].intermediate_steps.map((step) => ({ title: step.action.tool, subTitle: step.action.tool_input, description: step.result }))

                        }
                    />

                }
            </Drawer>
        </Drawer >
    )
}
