import React, { useCallback, useContext, useState } from 'react'
import { Editor, EditorContent, FloatingMenu, BubbleMenu } from '@tiptap/react'
import { Button, Input, Space } from 'antd'
import { NotebookContext } from '../routes/notebook'
import { BulbOutlined } from '@ant-design/icons'

export interface WithEditorProps {
    editor: Editor
}


const MenuBar: React.FC<WithEditorProps> = ({ editor }) => {
    if (!editor) return null

    return (
        <Space
            wrap
        >
            <Button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={
                    !editor.can()
                        .chain()
                        .focus()
                        .toggleBold()
                        .run()
                }
                className={editor.isActive('bold') ? 'is-active' : ''}
            >
                bold
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={
                    !editor.can()
                        .chain()
                        .focus()
                        .toggleItalic()
                        .run()
                }
                className={editor.isActive('italic') ? 'is-active' : ''}
            >
                italic
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={
                    !editor.can()
                        .chain()
                        .focus()
                        .toggleStrike()
                        .run()
                }
                className={editor.isActive('strike') ? 'is-active' : ''}
            >
                strike
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleCode().run()}
                disabled={
                    !editor.can()
                        .chain()
                        .focus()
                        .toggleCode()
                        .run()
                }
                className={editor.isActive('code') ? 'is-active' : ''}
            >
                code
            </Button>
            <Button onClick={() => editor.chain().focus().unsetAllMarks().run()}>
                clear marks
            </Button>
            <Button onClick={() => editor.chain().focus().clearNodes().run()}>
                clear nodes
            </Button>
            <Button
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={editor.isActive('paragraph') ? 'is-active' : ''}
            >
                paragraph
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
            >
                h1
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
            >
                h2
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
            >
                h3
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                className={editor.isActive('heading', { level: 4 }) ? 'is-active' : ''}
            >
                h4
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
                className={editor.isActive('heading', { level: 5 }) ? 'is-active' : ''}
            >
                h5
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
                className={editor.isActive('heading', { level: 6 }) ? 'is-active' : ''}
            >
                h6
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'is-active' : ''}
            >
                bullet list
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'is-active' : ''}
            >
                ordered list
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={editor.isActive('codeBlock') ? 'is-active' : ''}
            >
                code block
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? 'is-active' : ''}
            >
                blockquote
            </Button>
            <Button onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                horizontal rule
            </Button>
            <Button onClick={() => editor.chain().focus().setHardBreak().run()}>
                hard break
            </Button>
            <Button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={
                    !editor.can()
                        .chain()
                        .focus()
                        .undo()
                        .run()
                }
            >
                undo
            </Button>
            <Button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={
                    !editor.can()
                        .chain()
                        .focus()
                        .redo()
                        .run()
                }
            >
                redo
            </Button>
        </Space>
    )
}

export const Tiptap: React.FC<WithEditorProps> = ({ editor }) => {
    const { run, generate, edit } = useContext(NotebookContext)!;

    const [command, setCommand] = useState<string>('');

    const onRun = useCallback(async (prompt: string) => {
        await run(prompt)
    }, [run])

    const onGenerate = useCallback(async (prompt: string) => {
        await generate(prompt)
    }, [generate, setCommand])

    const onEdit = useCallback(async (text: string, prompt: string) => {
        console.log('edit', prompt)
        setCommand("")
    }, [
        edit, setCommand
    ])

    return (
        <div>
            <MenuBar editor={editor} />

            <BubbleMenu editor={editor} >
                <Space
                    style={{
                        opacity: 0.5,
                        "zIndex": 1000,
                    }}
                >
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
                    <Space>
                        <Input
                            placeholder='Command'
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                        />
                        <Button shape="circle" disabled={!command} icon={<BulbOutlined />}
                            onClick={() => {
                                const { view, state } = editor
                                const { from, to } = view.state.selection
                                const text = state.doc.textBetween(from, to, '')
                                onEdit(text, command)
                            }}
                        />
                    </Space>
                </Space>
            </BubbleMenu>

            <FloatingMenu editor={editor}>
                <Space style={{
                    opacity: 0.5,
                    "zIndex": 1000,
                }}>
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
            </FloatingMenu>

            <EditorContent editor={editor} />
        </div>
    )
}
