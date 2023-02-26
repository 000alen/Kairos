import React, { useCallback, useContext, useState } from 'react'
import { Editor, EditorContent, FloatingMenu, BubbleMenu } from '@tiptap/react'
import { Avatar, Button, Card, Input, Popconfirm, Skeleton, Space, Tooltip } from 'antd'
import { NotebookContext } from '../routes/notebook'
import { BoldOutlined, BulbOutlined, EditOutlined, EllipsisOutlined, ItalicOutlined, SettingOutlined } from '@ant-design/icons'
import { PopupMenu } from '../popup-menu/PopupMenu'

export interface WithEditorProps {
    editor: Editor
}

export const FMenu: React.FC<WithEditorProps> = ({ editor }) => {
    const { generate, ideas } = useContext(NotebookContext)!;

    const [command, setCommand] = useState<string>('');

    const onGenerate = useCallback(async (prompt: string) => {
        await generate(prompt)
    }, [generate, setCommand])

    return <FloatingMenu editor={editor}>
        <Space style={{
            opacity: 0.5,
            "zIndex": 1000,
        }}>
            <Button
                icon={<BulbOutlined />}
                onClick={ideas}
            >
                Ideas
            </Button>

            <Space>
                <Input
                    placeholder='Command'
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                />
                <Button shape="circle" disabled={!command} icon={<BulbOutlined />}
                    onClick={() => {
                        onGenerate(command)
                    }}
                />
            </Space>
        </Space>
    </FloatingMenu>
};

export const BMenu: React.FC<WithEditorProps> = ({ editor }) => {
    const { run } = useContext(NotebookContext)!;

    const onRun = useCallback(async (prompt: string) => {
        await run(prompt)
    }, [run])

    return <BubbleMenu editor={editor}>
        <Space.Compact block>
            <Button
                icon={<BulbOutlined />}
                onClick={() => {
                    const { view, state } = editor
                    const { from, to } = view.state.selection
                    const text = state.doc.textBetween(from, to, '')
                    onRun(text)
                }}
            >
                Run
            </Button>

            <Tooltip title="Bold">
                <Button
                    icon={<BoldOutlined />}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={
                        !editor.can()
                            .chain()
                            .focus()
                            .toggleBold()
                            .run()
                    }
                />
            </Tooltip>

            <Tooltip title="Italic">
                <Button
                    icon={<ItalicOutlined />}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={
                        !editor.can()
                            .chain()
                            .focus()
                            .toggleItalic()
                            .run()
                    }
                />
            </Tooltip>

            <Button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
                Bullet
            </Button>

            <Button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
                Ordered
            </Button>

            <Button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
                Code
            </Button>

            <Button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
                Quote
            </Button>
        </Space.Compact>
    </BubbleMenu>

};

export const Tiptap: React.FC<WithEditorProps> = ({ editor }) => {
    return (
        <div className='h-full mt-6'>
            <FMenu editor={editor} />

            <BMenu editor={editor} />

            <PopupMenu editor={editor} />

            <EditorContent editor={editor} />
        </div>
    )
}
