import React, { createContext, useMemo } from 'react'
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addSource, getIdeas, getNotebook, getSourceSummary, joinJob, notebookEdit, notebookGenerate, notebookRun, saveNotebook, startLiveSource as _startLiveSource, stopLiveSource as _stopLiveSource, renameNotebook, notebookChat } from '../api';
import { Notebook as INotebook, INotebookContext } from '../typings';
import { Tiptap } from '../components/Tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit'
import { FloatButton, Layout, Tooltip, Typography } from 'antd';
import { AudioOutlined, MessageOutlined, SaveOutlined } from '@ant-design/icons';
import Placeholder from '@tiptap/extension-placeholder'

import { ChatDrawer } from '../components/ChatDrawer';
import { SourcesDrawer } from '../components/SourcesDrawer';
import { LiveSourcesDrawer } from '../components/LiveSourcesDrawer';

const { Title } = Typography;
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

  const [_name, _setName] = useState<string>('');

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

  const rename = useCallback(async (name: string) => {
    console.log(name);
    const response = await renameNotebook(id!, name);
    // console.log(response);
  }, [id])

  const _rename = useCallback(async () => {
    await rename(_name);
  }, [_name, rename])

  const startLiveSource = useCallback(async (origin: string) => {
    const response = await _startLiveSource(id!, "sound", origin);
    console.log(response);
  }, [id])

  const stopLiveSource = useCallback(async (origin: string) => {
    const response = await _stopLiveSource(id!, origin);
    console.log(response);
  }, [id])

  const run = useCallback(async (prompt: string) => {
    const response = await joinJob(await notebookRun(id!, editor!.getText(), prompt), () => { });
    const selection = editor!.view.state.selection;
    editor!.chain().focus().insertContentAt({
      from: selection.from,
      to: selection.to
    }, response).run();
  }, [id, notebook, editor])

  const generate = useCallback(async (prompt: string) => {
    const response = await joinJob(await notebookGenerate(id!, editor!.getText(), prompt), () => { });
    editor!.chain().focus().insertContent(response).run();
  }, [id, notebook, editor])

  const edit = useCallback(async (text: string, prompt: string) => {
    const response = await joinJob(await notebookEdit(id!, editor!.getText(), text, prompt), () => { });
    const selection = editor!.view.state.selection;
    editor!.chain().focus().insertContentAt({
      from: selection.from,
      to: selection.to
    }, response).run();
  }, [id, notebook, editor])

  const chat = useCallback(async (prompt: string) => {
    const response = await joinJob(await notebookChat(id!, prompt), () => { });
    console.log(response);
    return response;
  }, [id])

  const ideas = useCallback(async () => {
    const responses: string[] = await joinJob(await getIdeas(id!, editor!.getText()), () => { });
    console.log(responses);
    responses.forEach((response) => {
      editor!.chain().focus().insertContent(`${response}\n`).run();
    });
  }, [id, notebook, editor])

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
    const response = await joinJob(await getSourceSummary(id!, sourceId), () => { });
    console.log(response);
    editor!.chain().focus().insertContent(response).run();
  }, [id, editor])

  const liveSourceSummary = useCallback(async (sourceId: string) => {
    const response = await joinJob(await getSourceSummary(id!, sourceId), () => { });
    console.log(response);
    editor!.chain().focus().insertContent(response).run();
  }, [id, editor])

  const save = useCallback(async () => {
    const content = editor!.getJSON();
    await joinJob(await saveNotebook(id!, content), () => { });
  }, [id, editor]);

  const context = useMemo(() => ({
    id: id!,
    notebook: notebook!,
    rename,
    startLiveSource,
    stopLiveSource,
    run,
    generate,
    edit,
    chat,
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
    rename,
    startLiveSource,
    stopLiveSource,
    run,
    generate,
    edit,
    chat,
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
          <Header className="header" style={{ position: 'sticky', display: "flex", top: 0, zIndex: 1, width: '100%', alignItems: "center" }}>
            <Title editable={{
              onChange: _setName,
              onEnd: _rename,
              tooltip: 'Click to rename',
            }} level={3} style={{ color: 'white', margin: 0 }}>{notebook!.name}</Title>
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

              <Tooltip placement='right' title="Live sources">
                <FloatButton icon={<AudioOutlined />} onClick={() => setLiveSourcesDrawerOpen(true)} />
              </Tooltip>

              <Tooltip placement='right' title="Sources">
                <FloatButton onClick={() => setSourcesDrawerOpen(true)} />
              </Tooltip>

              <Tooltip placement='right' title="Chat">
                <FloatButton icon={<MessageOutlined />} onClick={() => setChatDrawerOpen(true)} />
              </Tooltip>

              <Tooltip placement='right' title="Save">
                <FloatButton icon={<SaveOutlined />} onClick={save} />
              </Tooltip>
            </FloatButton.Group>
          </Layout>
        </Layout>

        <ChatDrawer open={chatDrawerOpen} setOpen={setChatDrawerOpen} />

        <SourcesDrawer open={sourcesDrawerOpen} setOpen={setSourcesDrawerOpen} />

        <LiveSourcesDrawer open={liveSourcesDrawerOpen} setOpen={setLiveSourcesDrawerOpen} />
      </NotebookContext.Provider>
      : null
  )
}
