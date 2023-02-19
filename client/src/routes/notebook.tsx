import type React from 'react'
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addSource, getIdeas, getNotebook, getSourceSummary, joinJob, notebookEdit, notebookGenerate, notebookRun, startLiveSource, stopLiveSource } from '../api';
import type { Notebook as INotebook } from '../typings';
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export interface NotebookProps { }

// @ts-ignore
const MenuBar = ({ editor }) => {
    if (!editor) {
        return null
    }

    return (
        <>
            <button
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
            </button>
            <button
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
            </button>
            <button
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
            </button>
            <button
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
            </button>
            <button onClick={() => editor.chain().focus().unsetAllMarks().run()}>
                clear marks
            </button>
            <button onClick={() => editor.chain().focus().clearNodes().run()}>
                clear nodes
            </button>
            <button
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={editor.isActive('paragraph') ? 'is-active' : ''}
            >
                paragraph
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
            >
                h1
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
            >
                h2
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
            >
                h3
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                className={editor.isActive('heading', { level: 4 }) ? 'is-active' : ''}
            >
                h4
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
                className={editor.isActive('heading', { level: 5 }) ? 'is-active' : ''}
            >
                h5
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
                className={editor.isActive('heading', { level: 6 }) ? 'is-active' : ''}
            >
                h6
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'is-active' : ''}
            >
                bullet list
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'is-active' : ''}
            >
                ordered list
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={editor.isActive('codeBlock') ? 'is-active' : ''}
            >
                code block
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? 'is-active' : ''}
            >
                blockquote
            </button>
            <button onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                horizontal rule
            </button>
            <button onClick={() => editor.chain().focus().setHardBreak().run()}>
                hard break
            </button>
            <button
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
            </button>
            <button
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
            </button>
        </>
    )
}

const Tiptap = () => {
    const editor = useEditor({
        extensions: [
            StarterKit,
        ],
        content: `
      <h2>
        Hi there,
      </h2>
      <p>
        this is a <em>basic</em> example of <strong>tiptap</strong>. Sure, there are all kind of basic text styles you’d probably expect from a text editor. But wait until you see the lists:
      </p>
      <ul>
        <li>
          That’s a bullet list with one …
        </li>
        <li>
          … or two list items.
        </li>
      </ul>
      <p>
        Isn’t that great? And all of that is editable. But wait, there’s more. Let’s try a code block:
      </p>
      <pre><code class="language-css">body {
  display: none;
}</code></pre>
      <p>
        I know, I know, this is impressive. It’s only the tip of the iceberg though. Give it a try and click a little bit around. Don’t forget to check the other examples too.
      </p>
      <blockquote>
        Wow, that’s amazing. Good work, boy! 👏
        <br />
        — Mom
      </blockquote>
    `,
    })

    return (
        <div>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    )
}

export const Notebook: React.FC<NotebookProps> = () => {
    const { id } = useParams();

    const [ready, setReady] = useState<boolean>(false);
    const [notebook, setNotebook] = useState<INotebook | null>(null);
    const [command, setCommand] = useState<string>("");

    const onChangeCommand = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
        setCommand(e.target.value)
        , [setCommand])

    const initialize = useCallback(async () => {
        const notebook = await getNotebook(id!);
        setNotebook(notebook);
        setReady(true);
    }, [setNotebook, setReady])

    useEffect(() => { initialize() }, [])

    const onStartLiveSource = useCallback(async () => {
        const response = await startLiveSource(id!, "sound", command);
        console.log(response);
    }, [id, command])

    const onStopLiveSource = useCallback(async () => {
        const response = await stopLiveSource(id!, command);
        console.log(response);
    }, [id, command])

    const onRun = useCallback(async () => {
        const response = await joinJob(await notebookRun(id!, notebook!.content, command), () => { });
        console.log(response);
    }, [id, command, notebook])

    const onGenerate = useCallback(async () => {
        const response = await joinJob(await notebookGenerate(id!, notebook!.content, command), () => { });
        console.log(response);
    }, [id, command, notebook])

    const onEdit = useCallback(async () => {
        const response = await joinJob(await notebookEdit(id!, notebook!.content, command), () => { });
        console.log(response);
    }, [id, command, notebook])

    const onIdeas = useCallback(async () => {
        const response = await joinJob(await getIdeas(id!, notebook!.content), () => { });
        console.log(response);
    }, [id, notebook])

    const onAdd = useCallback(async (type: string, origin: string) => {
        const response = await joinJob(await addSource(id!, type, origin), () => { });
        return response;
    }, [id, command])

    const onAddPdf = useCallback(async () => {
        const response = await onAdd("pdf", command);
        console.log(response);
    }, [id, command])

    const onAddYoutube = useCallback(async () => {
        const response = await onAdd("youtube", command);
        console.log(response);
    }, [id, command])

    const onAddWeb = useCallback(async () => {
        const response = await onAdd("web", command);
        console.log(response);
    }, [id, command])

    const onSourceSummary = useCallback(async (sourceId: string) => {
        const lastK = command ? parseInt(command) : undefined;
        const response = await joinJob(await getSourceSummary(id!, sourceId, lastK), () => { });
        console.log(response);
    }, [id, command])

    const onLiveSourceSummary = useCallback(async (sourceId: string) => {
        const lastK = command ? parseInt(command) : undefined;
        const response = await joinJob(await getSourceSummary(id!, sourceId, lastK), () => { });
        console.log(response);
    }, [id, command])

    return (
        ready ?
            <main>
                <h1>{notebook!.name}</h1>

                <div>
                    <h2>Sources</h2>
                    <ul>
                        {notebook!.sources.map((source) => (
                            <li key={source.origin}>
                                <button onClick={() => onSourceSummary(source.id)}>Summary</button>
                                {source.type}: {source.origin}
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h2>Live sources</h2>
                    <ul>
                        {notebook!.live_sources.map((source) => (
                            <li key={source.origin}>
                                <button onClick={() => onLiveSourceSummary(source.id)}>Summary</button>
                                {source.type}: {source.origin}
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <Tiptap />
                </div>

                <div>
                    <h2>Commands</h2>
                    <input type="text" value={command} onChange={onChangeCommand} placeholder='Command' />

                    <div>
                        <button onClick={onRun}>Run</button>
                        <button onClick={onGenerate}>Generate</button>
                        <button onClick={onEdit}>Edit</button>
                        <button onClick={onIdeas}>Ideas</button>
                        <button onClick={onAddPdf}>Add PDF</button>
                        <button onClick={onAddYoutube}>Add Youtube</button>
                        <button onClick={onAddWeb}>Add Web</button>
                        <button onClick={onStartLiveSource}>Start live source</button>
                        <button onClick={onStopLiveSource}>Stop live source</button>
                    </div>
                </div>
            </main> : null
    )
}
