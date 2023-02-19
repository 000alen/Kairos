import React, { useCallback, useContext, useState } from 'react'
import { Button, Drawer, Input, Space } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { NotebookContext } from '../routes/notebook'

interface ChatDrawerProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, setOpen }) => {
  const { chat, notebook } = useContext(NotebookContext)!;

  const [prompt, setPrompt] = useState<string>('')

  const onChat = useCallback(async () => {
    const response = await chat(prompt);
    console.log(response)
  }, [chat, prompt])

  return (
    <Drawer title="Chat" width={520} closable={false} onClose={() => setOpen(false)} open={open}>
      <Space>
        <Input placeholder='Prompt' value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <Button shape="circle" disabled={!prompt} icon={<SendOutlined />} onClick={onChat} />
      </Space>
      <div className='flex flex-col-reverse'>
        {notebook.conversation.map(({ sender, text }, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: sender === "Human" ? "flex-end" : "flex-start" }}>
            <div style={{ fontSize: 12, color: "gray" }}>{sender}</div>
            <div style={{ fontSize: 16, color: "white", backgroundColor: sender === "Human" ? "blue" : "green", padding: 8, borderRadius: 8 }}>{text}</div>
          </div>
        ))}
      </div>
    </Drawer>
  )
}
