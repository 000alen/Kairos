import React, { createContext, useMemo } from 'react'
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addSource, getIdeas, getNotebook, getSourceSummary, joinJob, notebookEdit, notebookGenerate, notebookRun, saveNotebook, startLiveSource as _startLiveSource, stopLiveSource as _stopLiveSource } from '../api';
import { Notebook as INotebook, INotebookContext } from '../typings';
import { Tiptap } from '../components/Tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit'
import { FloatButton, Layout } from 'antd';
import { AudioOutlined, MessageOutlined, SaveOutlined } from '@ant-design/icons';
import Placeholder from '@tiptap/extension-placeholder'

import "../styles/notebook.css"
import { ChatDrawer } from '../components/ChatDrawer';
import { SourcesDrawer } from '../components/SourcesDrawer';
import { LiveSourcesDrawer } from '../components/LiveSourcesDrawer';

const { Header, Content } = Layout;

export const NotebookContext = createContext<INotebookContext | null>(null);

export const Notebook = () => {
  const { id } = useParams();

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({
      placeholder: 'Start typing...',
    })],
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none mx-auto',
      },
    },
  })

  const [ready, setReady] = useState<boolean>(false);
  const [notebook, setNotebook] = useState<INotebook | null>(null);
  const [command, setCommand] = useState<string>("");

  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [sourcesDrawerOpen, setSourcesDrawerOpen] = useState(false);
  const [liveSourcesDrawerOpen, setLiveSourcesDrawerOpen] = useState(false);

  const initialize = useCallback(async () => {
    const notebook = await getNotebook(id!);

    if (notebook.content) editor?.chain().setContent(notebook.content).run();

    setNotebook(notebook);
    setReady(true);
  }, [id, setNotebook, setReady, editor])

  useEffect(() => { initialize() }, [initialize])


  useEffect(() => {
    const sse = new EventSource('http://127.0.0.1:5000/events/test');

    sse.addEventListener("ping", (event) => {
      console.log(event.data)
    })

    return () => {
      sse.close();
    }
  }, [])

  const startLiveSource = useCallback(async (origin: string) => {
    const response = await _startLiveSource(id!, "sound", origin);
    console.log(response);
  }, [id])

  const stopLiveSource = useCallback(async (origin: string) => {
    const response = await _stopLiveSource(id!, origin);
    console.log(response);
  }, [id])

  const run = useCallback(async () => {
    const response = await joinJob(await notebookRun(id!, notebook!.content, command), () => { });
    console.log(response);
  }, [id, command, notebook])

  const generate = useCallback(async () => {
    const response = await joinJob(await notebookGenerate(id!, notebook!.content, command), () => { });
    console.log(response);
  }, [id, command, notebook])

  const edit = useCallback(async () => {
    const response = await joinJob(await notebookEdit(id!, notebook!.content, command), () => { });
    console.log(response);
  }, [id, command, notebook])

  const ideas = useCallback(async () => {
    const response = await joinJob(await getIdeas(id!, notebook!.content), () => { });
    console.log(response);
  }, [id, notebook])

  const onAdd = useCallback(async (type: string, origin: string) => {
    const response = await joinJob(await addSource(id!, type, origin), () => { });
    return response;
  }, [id])

  const addPdf = useCallback(async (origin: string) => {
    const response = await onAdd("pdf", origin);
    console.log(response);
  }, [onAdd])

  const addYoutube = useCallback(async (origin: string) => {
    const response = await onAdd("youtube", origin);
    console.log(response);
  }, [onAdd])

  const addWeb = useCallback(async (origin: string) => {
    const response = await onAdd("web", origin);
    console.log(response);
  }, [onAdd])

  const sourceSummary = useCallback(async (sourceId: string) => {
    const lastK = command ? parseInt(command) : undefined;
    const response = await joinJob(await getSourceSummary(id!, sourceId, lastK), () => { });
    console.log(response);
  }, [id, command])

  const liveSourceSummary = useCallback(async (sourceId: string) => {
    const lastK = command ? parseInt(command) : undefined;
    const response = await joinJob(await getSourceSummary(id!, sourceId, lastK), () => { });
    console.log(response);
  }, [id, command])

  const save = useCallback(async () => {
    const content = editor!.getJSON();
    await joinJob(await saveNotebook(id!, content), () => { });
  }, [id, editor]);


  const onChangeCommand = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
    setCommand(e.target.value)
    , [setCommand])


  const context = useMemo(() => ({
    id: id!,
    notebook: notebook!,
    startLiveSource,
    stopLiveSource,
    run,
    generate,
    edit,
    ideas,
    addPdf,
    addYoutube,
    addWeb,
    sourceSummary,
    liveSourceSummary,
    save,
  }), [
    id,
    notebook,
    startLiveSource,
    stopLiveSource,
    run,
    generate,
    edit,
    ideas,
    addPdf,
    addYoutube,
    addWeb,
    sourceSummary,
    liveSourceSummary,
    save,
  ])

  return (
    ready ?
      <NotebookContext.Provider value={context}>
        <Layout
          className='h-full'
        >
          <Header className="header" style={{ position: 'sticky', top: 0, zIndex: 1, width: '100%' }}>
            <div className="logo" />
          </Header>

          <Layout style={{ position: "relative", padding: '0 24px 24px' }}>
            <Content
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
                overflow: 'auto',
              }}
            >
              <Tiptap editor={editor!} />
            </Content>

            <FloatButton.Group shape="square" style={{ left: 24 }}>
              <FloatButton icon={<AudioOutlined />} onClick={() => setLiveSourcesDrawerOpen(true)} />
              <FloatButton onClick={() => setSourcesDrawerOpen(true)} />
              <FloatButton icon={<MessageOutlined />} onClick={() => setChatDrawerOpen(true)} />
              <FloatButton icon={<SaveOutlined />} onClick={save} />
            </FloatButton.Group>
          </Layout>
        </Layout>

        <ChatDrawer open={chatDrawerOpen} setOpen={setChatDrawerOpen} />

        <SourcesDrawer open={sourcesDrawerOpen} setOpen={setSourcesDrawerOpen} />

        <LiveSourcesDrawer open={liveSourcesDrawerOpen} setOpen={setLiveSourcesDrawerOpen} />
      </NotebookContext.Provider>
      : null

    // <input type="text" value={command} onChange={onChangeCommand} placeholder='Command' />
    // <button onClick={onRun}>Run</button>
    // <button onClick={onGenerate}>Generate</button>
    // <button onClick={onEdit}>Edit</button>
    // <button onClick={onIdeas}>Ideas</button>
  )
}
