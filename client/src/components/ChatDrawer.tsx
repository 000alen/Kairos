import React from 'react'
import { Drawer } from 'antd'

interface ChatDrawerProps {
    open: boolean
    setOpen: (open: boolean) => void
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, setOpen }) => {
    return (
        <Drawer title="Chat" width={520} closable={false} onClose={() => setOpen(false)} open={open}>
            {/* <Button onClick={showChildrenDrawer}>
            Two-level drawer
          </Button>
          <Drawer
            title="Two-level Drawer"
            width={320}
            closable={false}
            onClose={onChildrenDrawerClose}
            open={childrenDrawer}
          >
            This is two-level drawer
          </Drawer> */}
        </Drawer>
    )
}
